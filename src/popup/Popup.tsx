import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Lock, Settings } from 'lucide-react';
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
import QuickBlockHero from './components/QuickBlockHero';
import YouTubeModuleSection from './components/YouTubeModuleSection';
import SchedulesSection from './components/SchedulesSection';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { initializeTheme } from '@/shared/utils/theme-utils';

/**
 * Extension popup component
 * Provides quick access to most common settings with optimistic UI updates
 */
const Popup: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  // Track if we're currently writing to storage to avoid reloading on self-triggered changes
  const isWritingToStorageRef = useRef<boolean>(false);
  // Refs for popup scroll position preservation
  const popupScrollRef = useRef<HTMLDivElement>(null);
  const popupScrollPositionRef = useRef<number>(0);

  /**
   * Initialize theme on mount
   */
  useEffect(() => {
    initializeTheme();
  }, []);

  /**
   * Preserve popup scroll position across re-renders
   * Uses useLayoutEffect to restore scroll before paint
   */
  useLayoutEffect(() => {
    const container = popupScrollRef.current;
    if (container) {
      container.scrollTop = popupScrollPositionRef.current;
    }
  });

  /**
   * Track popup scroll position
   */
  const handlePopupScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    popupScrollPositionRef.current = e.currentTarget.scrollTop;
  }, []);

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
      // Ignore changes if we're currently writing (self-triggered changes)
      // This prevents redundant reloads since we already applied changes optimistically
      if (isWritingToStorageRef.current) {
        return;
      }

      if (areaName === 'sync' || areaName === 'local') {
        // Only reload for external changes (from Options page, content scripts, etc.)
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
        // Mark that we're writing to storage to ignore the subsequent storage change event
        isWritingToStorageRef.current = true;

        // Capture updates before clearing
        const updates = { ...pendingUpdatesRef.current };
        await updateSettings(updates);

        // Clear pending updates after successful write
        pendingUpdatesRef.current = {};

        // Use a small delay before clearing the flag to ensure the storage change event is caught
        setTimeout(() => {
          isWritingToStorageRef.current = false;
        }, 50);

        // Note: Chrome Storage change will automatically trigger watchSettings in content scripts
        // No need to manually broadcast via messages
      } catch (err) {
        console.error('Failed to update settings:', err);
        setError('Failed to save settings. Please try again.');
        // Clear the flag even on error
        isWritingToStorageRef.current = false;
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
   * Open full settings page with optional tab parameter
   */
  const handleOpenSettings = useCallback((tab?: string, section?: string) => {
    const baseUrl = chrome.runtime.getURL('src/options/index.html');
    let url = baseUrl;

    if (tab) {
      url += `?tab=${encodeURIComponent(tab)}`;
      if (section) {
        url += `&section=${encodeURIComponent(section)}`;
      }
    }

    chrome.tabs.create({ url });
  }, []);

  /**
   * Open settings to Quick Block section
   */
  const handleOpenQuickBlockSettings = useCallback(() => {
    handleOpenSettings('general', 'quick-block');
  }, [handleOpenSettings]);

  /**
   * Open settings to Schedules section
   */
  const handleOpenSchedulesSettings = useCallback((scheduleId?: string | 'create') => {
    const baseUrl = chrome.runtime.getURL('src/options/index.html');
    let url = `${baseUrl}?tab=general&section=schedules`;

    if (scheduleId === 'create') {
      url += '&action=create';
    } else if (scheduleId) {
      url += `&scheduleId=${encodeURIComponent(scheduleId)}`;
    }

    chrome.tabs.create({ url });
  }, []);

  /**
   * Open settings to YouTube module
   */
  const handleOpenYouTubeSettings = useCallback(() => {
    handleOpenSettings('youtube');
  }, [handleOpenSettings]);

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
   * Handle search page setting toggles
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

  /**
   * Handle watch page setting toggles
   */
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
          {/* Header with Theme Toggle and Settings Icon */}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">FOCKEY</CardTitle>
              <div className="flex items-center gap-1">
                <ThemeToggle variant="icon" />
                <button
                  onClick={() => handleOpenSettings()}
                  className="rounded-full p-2 hover:bg-accent transition-colors"
                  aria-label="Open Settings"
                >
                  <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent
            ref={popupScrollRef}
            onScroll={handlePopupScroll}
            className="space-y-4 pt-0 max-h-[500px] overflow-y-auto"
          >
            {/* Quick Block Hero Section */}
            <QuickBlockHero lockState={lockState} onOpenSettings={handleOpenQuickBlockSettings} />

            <Separator />

            {/* Schedules Section */}
            <SchedulesSection
              onOpenSchedulesSettings={handleOpenSchedulesSettings}
              disabled={lockState?.isLocked}
            />

            <Separator />

            {/* YouTube Module Section */}
            <YouTubeModuleSection
              settings={settings}
              onGlobalNavigationToggle={handleGlobalNavigationToggle}
              onSearchPageToggle={handleSearchPageToggle}
              onWatchPageToggle={handleWatchPageToggle}
              onModuleToggle={handleModuleToggle}
              onOpenSettings={handleOpenYouTubeSettings}
              disabled={lockState?.isLocked}
            />

            {/* Lock Mode Status Indicator */}
            {lockState?.isLocked && lockState.lockEndTime && (
              <>
                <Separator />
                <button
                  onClick={() => handleOpenSettings('lockMode')}
                  className="w-full p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-600/20 hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-colors text-left"
                >
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Settings locked for {formatCountdown(remainingTime)}
                      </div>
                      <div className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                        Unlocks at {formatExpirationTime(lockState.lockEndTime)}
                      </div>
                    </div>
                  </div>
                </button>
              </>
            )}

            {/* Channel Blocking Section */}
            {currentChannel && (
              <>
                <Separator />
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

            {/* Version Footer */}
            <div className="text-center pt-2">
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
