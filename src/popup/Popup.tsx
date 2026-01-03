import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Lock } from 'lucide-react';
import {
  getSettings,
  updateSettings,
  addBlockedChannel,
  removeBlockedChannel,
  getLockModeStatus,
} from '@/shared/storage/settings-manager';
import { ExtensionSettings, BlockedChannel, LockModeState } from '@/shared/types/settings';
import {
  formatCountdown,
  calculateRemainingTime,
  formatExpirationTime,
} from '@/shared/utils/lock-mode-utils';
import LoadingState from './components/LoadingState';
import SettingsTabs from './components/SettingsTabs';

/**
 * Extension popup component
 * Provides quick access to most common settings with optimistic UI updates
 */
const Popup: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('global');
  const [currentChannel, setCurrentChannel] = useState<{
    id: string;
    handle: string;
    name: string;
  } | null>(null);
  const [isCurrentChannelBlocked, setIsCurrentChannelBlocked] = useState(false);
  const [isBlockingChannel, setIsBlockingChannel] = useState(false);
  const [lockState, setLockState] = useState<LockModeState | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Debounce timer ref for batching rapid toggle changes
  const debounceTimerRef = useRef<number | null>(null);
  // Pending updates that will be written to storage
  const pendingUpdatesRef = useRef<Partial<ExtensionSettings>>({});

  /**
   * Load settings from Chrome Storage on mount
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const loadedSettings = await getSettings();
        setSettings(loadedSettings);
        setError(null);
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Failed to load settings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    // Listen for storage changes from other extension components
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'sync' || areaName === 'local') {
        // Reload settings when they change externally
        loadSettings();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      // Flush any pending updates before unmounting
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Immediately apply any pending updates
      if (Object.keys(pendingUpdatesRef.current).length > 0) {
        updateSettings(pendingUpdatesRef.current).catch((err) => {
          console.error('Failed to flush pending settings on unmount:', err);
        });
      }
    };
  }, []);

  /**
   * Detect current channel when popup opens
   */
  useEffect(() => {
    const detectChannel = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Only proceed if we're actually on a YouTube page (not a chrome-extension:// page)
        if (
          !tab?.id ||
          !tab.url ||
          !(
            tab.url.startsWith('https://www.youtube.com') ||
            tab.url.startsWith('http://www.youtube.com')
          )
        ) {
          return;
        }

        // Inject inline function that doesn't rely on imports
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Inline channel detection logic (no external dependencies)
            const currentUrl = window.location.href;

            // Extract channel ID from URL
            const extractChannelId = (url: string): string | null => {
              try {
                const urlObj = new URL(url);
                const handleMatch = urlObj.pathname.match(/^\/@([^/?]+)/);
                if (handleMatch) return handleMatch[1];
                const cMatch = urlObj.pathname.match(/^\/c\/([^/?]+)/);
                if (cMatch) return cMatch[1];
                const userMatch = urlObj.pathname.match(/^\/user\/([^/?]+)/);
                if (userMatch) return userMatch[1];
                const channelMatch = urlObj.pathname.match(/^\/channel\/([^/?]+)/);
                if (channelMatch) return channelMatch[1];
                return null;
              } catch {
                return null;
              }
            };

            // Method 1: Channel page detection
            if (
              currentUrl.includes('/@') ||
              currentUrl.includes('/channel/') ||
              currentUrl.includes('/c/') ||
              currentUrl.includes('/user/')
            ) {
              const channelId = extractChannelId(currentUrl);
              if (channelId) {
                const channelName =
                  document.querySelector('ytd-channel-name #text')?.textContent?.trim() ||
                  document.querySelector('#channel-name')?.textContent?.trim() ||
                  document.querySelector('#text.ytd-channel-name')?.textContent?.trim() ||
                  document
                    .querySelector('yt-formatted-string.ytd-channel-name')
                    ?.textContent?.trim() ||
                  document.title.split(' - ')[0] ||
                  channelId;

                return { id: channelId, handle: channelId, name: channelName };
              }
            }

            // Method 2: Watch page detection
            if (currentUrl.includes('/watch')) {
              const selectors = [
                'ytd-video-owner-renderer a.yt-simple-endpoint[href*="/@"]',
                'ytd-video-owner-renderer a[href*="/channel/"]',
                'ytd-channel-name a',
                '#upload-info a[href*="/@"]',
                '#owner a[href*="/@"]',
              ];

              for (const selector of selectors) {
                const link = document.querySelector(selector) as HTMLAnchorElement;
                if (link && link.href) {
                  const channelId = extractChannelId(link.href);
                  if (channelId) {
                    const channelName =
                      link.textContent?.trim() ||
                      document.querySelector('ytd-channel-name #text')?.textContent?.trim() ||
                      document
                        .querySelector('#upload-info #channel-name #text')
                        ?.textContent?.trim() ||
                      channelId;

                    return { id: channelId, handle: channelId, name: channelName };
                  }
                }
              }
            }

            return null;
          },
        });

        const channelInfo = results[0]?.result;

        if (channelInfo && settings) {
          setCurrentChannel(channelInfo);

          // Check if channel is blocked
          const blocked = settings.blockedChannels.some(
            (c) =>
              c.id === channelInfo.id ||
              c.handle === channelInfo.handle ||
              c.id.toLowerCase() === channelInfo.id.toLowerCase() ||
              c.handle.toLowerCase() === channelInfo.handle.toLowerCase()
          );
          setIsCurrentChannelBlocked(blocked);
        }
      } catch (error) {
        console.error('Failed to detect current channel:', error);
      }
    };

    if (settings) {
      detectChannel();
    }
  }, [settings]);

  /**
   * Load lock state on mount and listen for changes
   */
  useEffect(() => {
    // Load initial lock state
    getLockModeStatus()
      .then((loadedLockState) => {
        setLockState(loadedLockState);
      })
      .catch((error) => {
        console.error('Failed to load lock state:', error);
      });

    // Listen for lock status changes from service worker
    const handleMessage = (message: { type: string; lockState?: LockModeState }) => {
      if (message.type === 'LOCK_STATUS_CHANGED' && message.lockState) {
        setLockState(message.lockState);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  /**
   * Update remaining time every second when locked
   */
  useEffect(() => {
    if (!lockState?.isLocked || !lockState.lockEndTime) {
      setRemainingTime(0);
      return;
    }

    // Initial calculation
    const updateRemainingTime = () => {
      const remaining = calculateRemainingTime(lockState.lockEndTime!);
      setRemainingTime(remaining);
    };

    updateRemainingTime();

    // Update every second
    const interval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [lockState?.isLocked, lockState?.lockEndTime]);

  /**
   * Handle block/unblock channel
   */
  const handleBlockChannel = useCallback(async () => {
    if (!currentChannel || !settings) return;

    setIsBlockingChannel(true);
    try {
      if (isCurrentChannelBlocked) {
        // Unblock channel
        await removeBlockedChannel(currentChannel.id);
        setIsCurrentChannelBlocked(false);

        // Reload settings to reflect changes
        const updatedSettings = await getSettings();
        setSettings(updatedSettings);
      } else {
        // Block channel
        const blockedChannel: BlockedChannel = {
          id: currentChannel.id,
          handle: currentChannel.handle,
          name: currentChannel.name,
          blockedAt: Date.now(),
        };

        await addBlockedChannel(blockedChannel);
        setIsCurrentChannelBlocked(true);

        // Reload current tab to apply block
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await chrome.tabs.reload(tab.id);
        }

        // Reload settings to reflect changes
        const updatedSettings = await getSettings();
        setSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Failed to block/unblock channel:', error);
      setError('Failed to update channel block status.');
    } finally {
      setIsBlockingChannel(false);
    }
  }, [currentChannel, settings, isCurrentChannelBlocked]);

  /**
   * Debounced update to Chrome Storage
   * Batches rapid changes to prevent excessive writes
   */
  const debouncedUpdate = useCallback((updates: Partial<ExtensionSettings>) => {
    // Merge new updates with pending updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates,
    };

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer (100ms debounce for responsive UI)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Capture updates before clearing
        const updates = { ...pendingUpdatesRef.current };
        await updateSettings(updates);

        // Clear pending updates after successful write
        pendingUpdatesRef.current = {};

        // Note: Chrome Storage change will automatically trigger watchSettings in content scripts
        // No need to manually broadcast via messages
      } catch (err) {
        console.error('Failed to update settings:', err);
        setError('Failed to save settings. Please try again.');
      }
    }, 100);
  }, []);

  /**
   * Handle settings change with optimistic UI update
   */
  const handleSettingsChange = useCallback(
    (updates: Partial<ExtensionSettings>) => {
      if (!settings) return;

      // Optimistic UI update (instant feedback)
      setSettings((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...updates,
          youtube: {
            ...prev.youtube,
            ...(updates.youtube || {}),
            globalNavigation: {
              ...prev.youtube.globalNavigation,
              ...(updates.youtube?.globalNavigation || {}),
            },
            homePage: {
              ...prev.youtube.homePage,
              ...(updates.youtube?.homePage || {}),
            },
            searchPage: {
              ...prev.youtube.searchPage,
              ...(updates.youtube?.searchPage || {}),
            },
            watchPage: {
              ...prev.youtube.watchPage,
              ...(updates.youtube?.watchPage || {}),
            },
            creatorProfilePage: {},
          },
        };
      });

      // Debounced write to Chrome Storage
      debouncedUpdate(updates);
    },
    [settings, debouncedUpdate]
  );

  /**
   * Handle master YouTube module toggle
   */
  const handleModuleToggle = useCallback(
    (enabled: boolean) => {
      handleSettingsChange({
        youtube: {
          ...settings!.youtube,
          enabled,
        },
      });
    },
    [settings, handleSettingsChange]
  );

  /**
   * Handle global navigation setting toggles
   */
  const handleGlobalNavigationToggle = useCallback(
    (key: string, value: boolean) => {
      if (!settings) return;
      handleSettingsChange({
        youtube: {
          ...settings.youtube,
          globalNavigation: {
            ...settings.youtube.globalNavigation,
            [key]: value,
          },
        },
      });
    },
    [settings, handleSettingsChange]
  );

  /**
   * Handle individual page setting toggles
   */
  const handleSearchPageToggle = useCallback(
    (key: string, value: boolean) => {
      if (!settings) return;
      handleSettingsChange({
        youtube: {
          ...settings.youtube,
          searchPage: {
            ...settings.youtube.searchPage,
            [key]: value,
          },
        },
      });
    },
    [settings, handleSettingsChange]
  );

  const handleWatchPageToggle = useCallback(
    (key: string, value: boolean) => {
      if (!settings) return;
      handleSettingsChange({
        youtube: {
          ...settings.youtube,
          watchPage: {
            ...settings.youtube.watchPage,
            [key]: value,
          },
        },
      });
    },
    [settings, handleSettingsChange]
  );

  /**
   * Open full settings page
   */
  const handleOpenSettings = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-96">
        <LoadingState />
      </div>
    );
  }

  // Show error state
  if (error || !settings) {
    return (
      <div className="w-96 p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error || 'Failed to load settings'}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-4 w-full"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-96">
        <Card>
          {/* Header with Integrated Master Toggle */}
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Fockey</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Extension</span>
                <Switch
                  checked={settings.youtube.enabled}
                  onCheckedChange={handleModuleToggle}
                  className="data-[state=checked]:bg-primary"
                  disabled={lockState?.isLocked}
                />
              </div>
            </div>

            {/* Lock Mode Status Indicator */}
            {lockState?.isLocked && lockState.lockEndTime && (
              <div className="mt-3 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-600/20">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Settings Locked
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      {formatCountdown(remainingTime)} remaining
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      Until {formatExpirationTime(lockState.lockEndTime)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* Tabbed Settings Interface - All 32 Settings */}
            <SettingsTabs
              settings={settings}
              disabled={!settings.youtube.enabled || lockState?.isLocked === true}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onGlobalNavigationToggle={handleGlobalNavigationToggle}
              onSearchPageToggle={handleSearchPageToggle}
              onWatchPageToggle={handleWatchPageToggle}
            />

            {/* Channel Blocking Section */}
            {currentChannel && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Current Channel</div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{currentChannel.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          @{currentChannel.handle}
                        </div>
                      </div>
                      <Button
                        onClick={handleBlockChannel}
                        disabled={
                          isBlockingChannel ||
                          (isCurrentChannelBlocked && lockState?.isLocked === true)
                        }
                        variant={isCurrentChannelBlocked ? 'outline' : 'destructive'}
                        size="sm"
                        className="shrink-0"
                      >
                        {isBlockingChannel
                          ? 'Processing...'
                          : isCurrentChannelBlocked
                            ? lockState?.isLocked
                              ? 'Locked'
                              : 'Unblock'
                            : 'Block Channel'}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator className="my-4" />

            {/* Open Settings Button */}
            <Button
              onClick={handleOpenSettings}
              variant="outline"
              className="w-full text-sm h-9 border-primary/20 hover:bg-primary/5 hover:border-primary/40"
            >
              Open Settings
            </Button>

            {/* Footer with Version */}
            <div className="text-center pt-1">
              <p className="text-[10px] text-muted-foreground">
                v{chrome.runtime.getManifest().version}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default Popup;
