import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getSettings, updateSettings } from '@/shared/storage/settings-manager';
import { ExtensionSettings } from '@/shared/types/settings';
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
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* Tabbed Settings Interface - All 33+ Settings */}
            <SettingsTabs
              settings={settings}
              disabled={!settings.youtube.enabled}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onGlobalNavigationToggle={handleGlobalNavigationToggle}
              onSearchPageToggle={handleSearchPageToggle}
              onWatchPageToggle={handleWatchPageToggle}
              onCreatorProfilePageToggle={handleCreatorProfilePageToggle}
            />

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
