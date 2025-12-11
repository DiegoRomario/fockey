/**
 * Settings Manager for Fockey Chrome Extension
 * Provides type-safe Chrome Storage API wrapper with sync support
 */

import { ExtensionSettings, DEFAULT_SETTINGS } from '../types/settings';
import { validateSettings } from './validation';
import { checkAndMigrate } from './migrations';

/**
 * Storage key used for persisting settings
 */
const SETTINGS_KEY = 'fockey_settings';

/**
 * Deep merge utility for combining partial settings with defaults
 */
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue as object, sourceValue as object) as T[Extract<
          keyof T,
          string
        >];
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}

/**
 * Retrieves settings from Chrome Storage with fallback to defaults
 * Attempts chrome.storage.sync first, falls back to chrome.storage.local on error
 *
 * @returns Promise resolving to current extension settings
 */
export async function getSettings(): Promise<ExtensionSettings> {
  try {
    // Try to get settings from sync storage first
    const syncResult = await chrome.storage.sync.get(SETTINGS_KEY);

    if (syncResult[SETTINGS_KEY]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storedSettings = syncResult[SETTINGS_KEY] as any;

      // Check if migration is needed BEFORE validation
      // This allows old settings to be migrated to new structure before validation
      let settingsToUse = storedSettings as ExtensionSettings;
      if (storedSettings?.version !== DEFAULT_SETTINGS.version) {
        console.log(
          `Settings version mismatch: stored=${storedSettings.version}, current=${DEFAULT_SETTINGS.version}`
        );
        try {
          settingsToUse = await checkAndMigrate(storedSettings);
          // Persist migrated settings
          await chrome.storage.sync.set({ [SETTINGS_KEY]: settingsToUse });
          console.log('Settings migrated successfully to version', settingsToUse.version);
        } catch (migrationError) {
          console.error('Migration failed:', migrationError);
          // If migration fails, fall back to defaults
          return { ...DEFAULT_SETTINGS };
        }
      }

      // Validate settings AFTER migration
      if (!validateSettings(settingsToUse)) {
        console.warn('Settings failed validation after migration, using defaults');
        return { ...DEFAULT_SETTINGS };
      }

      // Merge with defaults to handle partial settings or missing keys
      return deepMerge(DEFAULT_SETTINGS, settingsToUse as Partial<ExtensionSettings>);
    }

    // No settings found, return defaults
    return { ...DEFAULT_SETTINGS };
  } catch (syncError) {
    console.warn(
      'Failed to retrieve settings from chrome.storage.sync, trying local storage:',
      syncError
    );

    try {
      // Fallback to local storage
      const localResult = await chrome.storage.local.get(SETTINGS_KEY);

      if (localResult[SETTINGS_KEY]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const storedSettings = localResult[SETTINGS_KEY] as any;

        // Check if migration is needed BEFORE validation
        let settingsToUse = storedSettings as ExtensionSettings;
        if (storedSettings?.version !== DEFAULT_SETTINGS.version) {
          console.log(
            `Settings version mismatch in local: stored=${storedSettings.version}, current=${DEFAULT_SETTINGS.version}`
          );
          try {
            settingsToUse = await checkAndMigrate(storedSettings);
            // Persist migrated settings
            await chrome.storage.local.set({ [SETTINGS_KEY]: settingsToUse });
            console.log(
              'Settings migrated successfully in local storage to version',
              settingsToUse.version
            );
          } catch (migrationError) {
            console.error('Migration failed in local storage:', migrationError);
            // If migration fails, fall back to defaults
            return { ...DEFAULT_SETTINGS };
          }
        }

        // Validate settings AFTER migration
        if (!validateSettings(settingsToUse)) {
          console.warn(
            'Settings in local storage failed validation after migration, using defaults'
          );
          return { ...DEFAULT_SETTINGS };
        }

        return deepMerge(DEFAULT_SETTINGS, settingsToUse as Partial<ExtensionSettings>);
      }

      // No settings found in local storage either, return defaults
      return { ...DEFAULT_SETTINGS };
    } catch (localError) {
      console.error(
        'Failed to retrieve settings from chrome.storage.local, using defaults:',
        localError
      );
      return { ...DEFAULT_SETTINGS };
    }
  }
}

/**
 * Debounced update queue to prevent rapid successive writes
 */
let updateTimeout: number | null = null;
const UPDATE_DEBOUNCE_MS = 300;

/**
 * Updates settings with partial changes
 * Merges partial update with existing settings and persists to Chrome Storage
 * Includes debouncing to prevent rapid successive writes and quota management
 *
 * @param partial - Partial settings object with changes to apply
 * @returns Promise that resolves when settings are updated
 * @throws Error if both sync and local storage fail
 */
export async function updateSettings(partial: Partial<ExtensionSettings>): Promise<void> {
  // Clear existing debounce timeout
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }

  // Debounce the update
  return new Promise((resolve, reject) => {
    updateTimeout = setTimeout(async () => {
      try {
        // Get current settings
        const currentSettings = await getSettings();

        // Deep merge partial update with current settings
        const updatedSettings = deepMerge(currentSettings, partial);

        // Try to save to sync storage first
        try {
          await chrome.storage.sync.set({ [SETTINGS_KEY]: updatedSettings });
          resolve();
        } catch (syncError: unknown) {
          // Check if error is quota exceeded
          const error = syncError as { message?: string };
          if (error.message?.includes('QUOTA_EXCEEDED')) {
            console.warn('Chrome sync storage quota exceeded, falling back to local storage');

            // Fallback to local storage
            try {
              await chrome.storage.local.set({ [SETTINGS_KEY]: updatedSettings });
              resolve();
            } catch (localError) {
              console.error('Failed to save settings to local storage:', localError);
              reject(new Error('Failed to save settings: both sync and local storage failed'));
            }
          } else {
            // Different error, still try local storage
            console.warn('Failed to save to sync storage, trying local:', syncError);
            try {
              await chrome.storage.local.set({ [SETTINGS_KEY]: updatedSettings });
              resolve();
            } catch (localError) {
              console.error('Failed to save settings to local storage:', localError);
              reject(new Error('Failed to save settings: both sync and local storage failed'));
            }
          }
        }
      } catch (error) {
        console.error('Failed to update settings:', error);
        reject(error);
      }
    }, UPDATE_DEBOUNCE_MS);
  });
}

/**
 * Resets all settings to default values
 * Clears stored settings and initializes with DEFAULT_SETTINGS
 *
 * @returns Promise resolving to the default settings after reset
 * @throws Error if both sync and local storage fail
 */
export async function resetToDefaults(): Promise<ExtensionSettings> {
  try {
    // Try to clear and reset sync storage first
    await chrome.storage.sync.remove(SETTINGS_KEY);
    await chrome.storage.sync.set({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
    return { ...DEFAULT_SETTINGS };
  } catch (syncError) {
    console.warn(
      'Failed to reset settings in chrome.storage.sync, trying local storage:',
      syncError
    );

    try {
      // Fallback to local storage
      await chrome.storage.local.remove(SETTINGS_KEY);
      await chrome.storage.local.set({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
      return { ...DEFAULT_SETTINGS };
    } catch (localError) {
      console.error('Failed to reset settings in chrome.storage.local:', localError);
      throw new Error('Failed to reset settings: both sync and local storage failed');
    }
  }
}

/**
 * Watches for settings changes and calls callback when settings are updated
 * Sets up chrome.storage.onChanged listeners for real-time updates
 *
 * @param callback - Function to call when settings change, receives updated settings
 * @returns Cleanup function that removes the listener
 */
export function watchSettings(callback: (settings: ExtensionSettings) => void): () => void {
  // Create listener for storage changes
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: 'sync' | 'local' | 'managed' | 'session'
  ) => {
    // Only process changes to our settings key in sync or local storage
    if ((areaName === 'sync' || areaName === 'local') && changes[SETTINGS_KEY]) {
      // Get the updated settings and call callback
      getSettings()
        .then((settings) => {
          callback(settings);
        })
        .catch((error) => {
          console.error('Failed to retrieve updated settings in watchSettings:', error);
        });
    }
  };

  // Register the listener
  chrome.storage.onChanged.addListener(listener);

  // Return cleanup function
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}
