import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getSettings, updateSettings } from '@/shared/storage/settings-manager';
import { ExtensionSettings } from '@/shared/types/settings';
import LoadingState from './components/LoadingState';
import ModuleToggle from './components/ModuleToggle';
import SettingsSection from './components/SettingsSection';

/**
 * Extension popup component
 * Provides quick access to most common settings with optimistic UI updates
 */
const Popup: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            creatorProfilePage: {
              ...prev.youtube.creatorProfilePage,
              ...(updates.youtube?.creatorProfilePage || {}),
            },
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

  const handleCreatorProfilePageToggle = useCallback(
    (key: string, value: boolean) => {
      if (!settings) return;
      handleSettingsChange({
        youtube: {
          ...settings.youtube,
          creatorProfilePage: {
            ...settings.youtube.creatorProfilePage,
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
      <div className="w-80">
        <LoadingState />
      </div>
    );
  }

  // Show error state
  if (error || !settings) {
    return (
      <div className="w-80 p-4">
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
    <div className="w-80">
      <Card>
        {/* Header */}
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Fockey</CardTitle>
          <CardDescription>Minimalist YouTube Experience</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Master YouTube Module Toggle */}
          <SettingsSection title="YouTube Module">
            <ModuleToggle
              id="youtube-enabled"
              label="Enable Extension"
              description="Turn the YouTube module on or off"
              checked={settings.youtube.enabled}
              onChange={handleModuleToggle}
            />
          </SettingsSection>

          <Separator />

          {/* Quick Access Toggles */}
          <div className="space-y-3">
            {/* Global Navigation Settings */}
            <SettingsSection title="Navigation (All Pages)">
              <ModuleToggle
                id="global-sidebar"
                label="Show Sidebar"
                checked={settings.youtube.globalNavigation.showSidebar}
                onChange={(checked) => handleGlobalNavigationToggle('showSidebar', checked)}
                disabled={!settings.youtube.enabled}
              />
              <ModuleToggle
                id="global-profile"
                label="Show Profile"
                checked={settings.youtube.globalNavigation.showProfile}
                onChange={(checked) => handleGlobalNavigationToggle('showProfile', checked)}
                disabled={!settings.youtube.enabled}
              />
            </SettingsSection>

            {/* Search Page Settings */}
            <SettingsSection title="Search Page">
              <ModuleToggle
                id="search-shorts"
                label="Show Shorts"
                checked={settings.youtube.searchPage.showShorts}
                onChange={(checked) => handleSearchPageToggle('showShorts', checked)}
                disabled={!settings.youtube.enabled}
              />
              <ModuleToggle
                id="search-blur"
                label="Blur Thumbnails"
                checked={settings.youtube.searchPage.blurThumbnails}
                onChange={(checked) => handleSearchPageToggle('blurThumbnails', checked)}
                disabled={!settings.youtube.enabled}
              />
            </SettingsSection>

            {/* Watch Page Settings */}
            <SettingsSection title="Watch Page">
              <ModuleToggle
                id="watch-comments"
                label="Show Comments"
                checked={settings.youtube.watchPage.showComments}
                onChange={(checked) => handleWatchPageToggle('showComments', checked)}
                disabled={!settings.youtube.enabled}
              />
              <ModuleToggle
                id="watch-related"
                label="Show Related Videos"
                checked={settings.youtube.watchPage.showRelated}
                onChange={(checked) => handleWatchPageToggle('showRelated', checked)}
                disabled={!settings.youtube.enabled}
              />
            </SettingsSection>

            {/* Creator Profile Page Settings */}
            <SettingsSection title="Creator Profile Page">
              <ModuleToggle
                id="creator-shorts-tab"
                label="Show Shorts Tab"
                checked={settings.youtube.creatorProfilePage.showShortsTab}
                onChange={(checked) => handleCreatorProfilePageToggle('showShortsTab', checked)}
                disabled={!settings.youtube.enabled}
              />
              <ModuleToggle
                id="creator-posts-tab"
                label="Show Posts Tab"
                checked={settings.youtube.creatorProfilePage.showCommunityTab}
                onChange={(checked) => handleCreatorProfilePageToggle('showCommunityTab', checked)}
                disabled={!settings.youtube.enabled}
              />
            </SettingsSection>
          </div>

          <Separator />

          {/* Open Settings Button */}
          <Button onClick={handleOpenSettings} variant="outline" className="w-full">
            Open Settings
          </Button>

          {/* Footer with Version */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">v{chrome.runtime.getManifest().version}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Popup;
