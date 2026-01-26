/**
 * Settings Manager for Fockey Chrome Extension
 * Provides type-safe Chrome Storage API wrapper with sync support
 */

import {
  ExtensionSettings,
  DEFAULT_SETTINGS,
  BlockedChannel,
  LockModeState,
  DEFAULT_LOCK_STATE,
  normalizeContentKeywords,
  ExportData,
  YouTubeModuleSettings,
} from '../types/settings';
import { validateSettings } from './validation';
import { getThemePreference, setThemePreference } from '../utils/theme-utils';

/**
 * Storage key used for persisting settings
 */
const SETTINGS_KEY = 'fockey_settings';

/**
 * Storage key used for persisting lock mode state
 * IMPORTANT: Uses chrome.storage.local (device-specific), NOT chrome.storage.sync
 */
const LOCK_STATE_KEY = 'fockey_lock_state';

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
      const storedSettings = syncResult[SETTINGS_KEY] as ExtensionSettings;

      // Validate settings
      if (!validateSettings(storedSettings)) {
        console.warn('Settings failed validation, using defaults');
        return { ...DEFAULT_SETTINGS };
      }

      // Merge with defaults to handle partial settings or missing keys
      return deepMerge(DEFAULT_SETTINGS, storedSettings as Partial<ExtensionSettings>);
    }

    // No settings found, return defaults
    return { ...DEFAULT_SETTINGS };
  } catch (syncError) {
    // Suppress "Extension context invalidated" errors (expected during extension reload)
    const error = syncError as { message?: string };
    if (!error.message?.includes('Extension context invalidated')) {
      console.warn(
        'Failed to retrieve settings from chrome.storage.sync, trying local storage:',
        syncError
      );
    }

    try {
      // Fallback to local storage
      const localResult = await chrome.storage.local.get(SETTINGS_KEY);

      if (localResult[SETTINGS_KEY]) {
        const storedSettings = localResult[SETTINGS_KEY] as ExtensionSettings;

        // Validate settings
        if (!validateSettings(storedSettings)) {
          console.warn('Settings in local storage failed validation, using defaults');
          return { ...DEFAULT_SETTINGS };
        }

        return deepMerge(DEFAULT_SETTINGS, storedSettings as Partial<ExtensionSettings>);
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
 * @throws Error if lock mode is active
 */
export async function updateSettings(partial: Partial<ExtensionSettings>): Promise<void> {
  // CRITICAL: Lock mode enforcement
  // Reject ALL settings changes when lock mode is active
  if (await isLockModeActive()) {
    const remaining = await getRemainingLockTime();
    const minutesRemaining = Math.ceil(remaining / 60000);
    throw new Error(
      `Settings are locked for ${minutesRemaining} more minute${minutesRemaining !== 1 ? 's' : ''}. Changes cannot be made until lock expires.`
    );
  }

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
 * @throws Error if lock mode is active
 */
export async function resetToDefaults(): Promise<ExtensionSettings> {
  // CRITICAL: Lock mode enforcement
  // Prevent resetting settings when lock mode is active
  if (await isLockModeActive()) {
    const remaining = await getRemainingLockTime();
    const minutesRemaining = Math.ceil(remaining / 60000);
    throw new Error(
      `Settings are locked for ${minutesRemaining} more minute${minutesRemaining !== 1 ? 's' : ''}. Cannot reset until lock expires.`
    );
  }

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

/**
 * Adds a channel to the blocked channels list
 * Prevents duplicates by checking if channel ID or handle already exists
 *
 * @param channel - Blocked channel to add
 * @returns Promise that resolves when channel is added
 */
export async function addBlockedChannel(channel: BlockedChannel): Promise<void> {
  const settings = await getSettings();

  // Check if channel already exists (by ID or handle)
  const exists = settings.youtube.blockedChannels.some(
    (c) =>
      c.id === channel.id ||
      c.handle === channel.handle ||
      c.id.toLowerCase() === channel.id.toLowerCase() ||
      c.handle.toLowerCase() === channel.handle.toLowerCase()
  );

  if (exists) {
    console.warn('Channel already blocked:', channel.name);
    return;
  }

  // Add channel to blocked list
  const updatedSettings = {
    ...settings,
    youtube: {
      ...settings.youtube,
      blockedChannels: [...settings.youtube.blockedChannels, channel],
    },
  };

  // Save to storage
  try {
    await chrome.storage.sync.set({ [SETTINGS_KEY]: updatedSettings });
  } catch (syncError) {
    console.warn('Failed to save to sync storage, trying local:', syncError);
    await chrome.storage.local.set({ [SETTINGS_KEY]: updatedSettings });
  }
}

/**
 * Removes a channel from the blocked channels list
 * Matches by channel ID or handle (case-insensitive)
 *
 * @param channelId - Channel ID or handle to remove
 * @returns Promise that resolves when channel is removed
 * @throws Error if lock mode is active
 */
export async function removeBlockedChannel(channelId: string): Promise<void> {
  // CRITICAL: Lock mode enforcement
  // Prevent unblocking channels when lock mode is active
  // Users can still ADD blocks during lock mode, but cannot REMOVE them
  if (await isLockModeActive()) {
    const remaining = await getRemainingLockTime();
    const minutesRemaining = Math.ceil(remaining / 60000);
    throw new Error(
      `Cannot unblock channels while Lock Mode is active (${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} remaining). You can still block additional channels.`
    );
  }

  const settings = await getSettings();

  // Filter out the channel by ID or handle (case-insensitive)
  const updatedSettings = {
    ...settings,
    youtube: {
      ...settings.youtube,
      blockedChannels: settings.youtube.blockedChannels.filter(
        (c) =>
          c.id !== channelId &&
          c.handle !== channelId &&
          c.id.toLowerCase() !== channelId.toLowerCase() &&
          c.handle.toLowerCase() !== channelId.toLowerCase()
      ),
    },
  };

  // Save to storage
  try {
    await chrome.storage.sync.set({ [SETTINGS_KEY]: updatedSettings });
  } catch (syncError) {
    console.warn('Failed to save to sync storage, trying local:', syncError);
    await chrome.storage.local.set({ [SETTINGS_KEY]: updatedSettings });
  }
}

/**
 * Retrieves the list of blocked channels
 *
 * @returns Promise resolving to array of blocked channels
 */
export async function getBlockedChannels(): Promise<BlockedChannel[]> {
  const settings = await getSettings();
  return settings.youtube.blockedChannels;
}

/**
 * Checks if a channel is blocked
 * Matches by channel ID or handle (case-insensitive)
 *
 * @param channelId - Channel ID or handle to check
 * @returns Promise resolving to true if channel is blocked
 */
export async function isChannelBlocked(channelId: string): Promise<boolean> {
  const channels = await getBlockedChannels();
  return channels.some(
    (c) =>
      c.id === channelId ||
      c.handle === channelId ||
      c.id.toLowerCase() === channelId.toLowerCase() ||
      c.handle.toLowerCase() === channelId.toLowerCase()
  );
}

// ==================== LOCK MODE FUNCTIONS ====================

/**
 * Retrieves current lock mode state from chrome.storage.local
 * Returns DEFAULT_LOCK_STATE if no lock state exists
 *
 * @returns Promise resolving to current lock mode state
 */
export async function getLockModeStatus(): Promise<LockModeState> {
  try {
    const result = await chrome.storage.local.get(LOCK_STATE_KEY);

    if (result[LOCK_STATE_KEY]) {
      const lockState = result[LOCK_STATE_KEY] as LockModeState;

      // Validate lock hasn't expired (defense against stale state)
      if (lockState.isLocked && lockState.lockEndTime) {
        const now = Date.now();
        if (now >= lockState.lockEndTime) {
          // Lock expired but state wasn't cleaned up - auto-unlock
          await unlockLockMode();
          return { ...DEFAULT_LOCK_STATE };
        }
      }

      return lockState;
    }

    return { ...DEFAULT_LOCK_STATE };
  } catch (error) {
    console.error('Failed to retrieve lock mode status:', error);
    return { ...DEFAULT_LOCK_STATE };
  }
}

/**
 * CRITICAL: Centralized lock mode guard function
 * Checks if lock mode is currently active and enforces lock restrictions
 *
 * This function is the single source of truth for lock enforcement.
 * ALL settings mutation functions MUST call this before allowing changes.
 *
 * @returns Promise resolving to true if lock mode is active
 */
export async function isLockModeActive(): Promise<boolean> {
  const lockState = await getLockModeStatus();

  if (!lockState.isLocked) {
    return false;
  }

  // Defense: Verify lock hasn't expired (handles stale state and clock changes)
  if (lockState.lockEndTime) {
    const now = Date.now();
    if (now >= lockState.lockEndTime) {
      // Lock expired - clean up stale state
      await unlockLockMode();
      return false;
    }
  }

  return true;
}

/**
 * Calculates remaining time until lock expires
 *
 * @returns Promise resolving to milliseconds remaining (0 if not locked or expired)
 */
export async function getRemainingLockTime(): Promise<number> {
  const lockState = await getLockModeStatus();

  if (!lockState.isLocked || !lockState.lockEndTime) {
    return 0;
  }

  const now = Date.now();
  const remaining = lockState.lockEndTime - now;

  return remaining > 0 ? remaining : 0;
}

/**
 * Activates lock mode for a specified duration
 * Creates lock state in chrome.storage.local and triggers alarm creation in service worker
 *
 * @param durationMs - Lock duration in milliseconds
 * @returns Promise that resolves when lock is activated
 * @throws Error if lock is already active or duration is invalid
 */
export async function activateLockMode(durationMs: number): Promise<void> {
  // Validate duration
  if (durationMs <= 0) {
    throw new Error('Lock duration must be greater than 0');
  }

  // Check if lock is already active
  const currentLock = await getLockModeStatus();
  if (currentLock.isLocked) {
    throw new Error('Lock mode is already active. Use extendLockMode() to extend the lock.');
  }

  const now = Date.now();
  const lockState: LockModeState = {
    isLocked: true,
    lockEndTime: now + durationMs,
    lockStartedAt: now,
    originalDuration: durationMs,
  };

  try {
    await chrome.storage.local.set({ [LOCK_STATE_KEY]: lockState });
    console.info(
      `Lock mode activated for ${durationMs}ms until ${new Date(lockState.lockEndTime!).toLocaleString()}`
    );
  } catch (error) {
    console.error('Failed to activate lock mode:', error);
    throw new Error('Failed to activate lock mode: storage operation failed');
  }
}

/**
 * Extends active lock mode by adding additional time
 * Validates that the new expiration time is in the future
 *
 * @param additionalMs - Additional time to add in milliseconds
 * @returns Promise that resolves when lock is extended
 * @throws Error if lock is not active, or new time is not greater than current expiration
 */
export async function extendLockMode(additionalMs: number): Promise<void> {
  // Validate additional time
  if (additionalMs <= 0) {
    throw new Error('Extension duration must be greater than 0');
  }

  const currentLock = await getLockModeStatus();

  // Lock must be active to extend
  if (!currentLock.isLocked || !currentLock.lockEndTime) {
    throw new Error('Lock mode is not active. Use activateLockMode() to activate lock.');
  }

  const newEndTime = currentLock.lockEndTime + additionalMs;
  const now = Date.now();

  // Validate new end time is in the future
  if (newEndTime <= now) {
    throw new Error('Extension would result in a lock that has already expired');
  }

  const updatedLockState: LockModeState = {
    ...currentLock,
    lockEndTime: newEndTime,
    // originalDuration remains unchanged - tracks the initial lock duration
  };

  try {
    await chrome.storage.local.set({ [LOCK_STATE_KEY]: updatedLockState });
    console.info(
      `Lock mode extended by ${additionalMs}ms until ${new Date(newEndTime).toLocaleString()}`
    );
  } catch (error) {
    console.error('Failed to extend lock mode:', error);
    throw new Error('Failed to extend lock mode: storage operation failed');
  }
}

/**
 * Unlocks lock mode (internal function)
 * Called by Chrome alarm when lock expires or by validation when stale state detected
 *
 * IMPORTANT: This function should only be called by:
 * - Service worker alarm listener when lock expires
 * - isLockModeActive() when detecting expired/stale lock state
 * - Service worker startup validation
 *
 * @returns Promise that resolves when lock is cleared
 */
export async function unlockLockMode(): Promise<void> {
  try {
    await chrome.storage.local.remove(LOCK_STATE_KEY);
    console.info('Lock mode deactivated');
  } catch (error) {
    console.error('Failed to unlock lock mode:', error);
    throw new Error('Failed to unlock lock mode: storage operation failed');
  }
}

// ==================== YOUTUBE MODULE PAUSE FUNCTIONS ====================

/**
 * Storage key used for persisting YouTube pause state
 * IMPORTANT: Uses chrome.storage.local (device-specific), NOT chrome.storage.sync
 */
const YOUTUBE_PAUSE_STATE_KEY = 'fockey_youtube_pause_state';

/**
 * Retrieves current YouTube pause state from chrome.storage.local
 * Returns DEFAULT_YOUTUBE_PAUSE_STATE if no pause state exists
 *
 * @returns Promise resolving to current YouTube pause state
 */
export async function getYouTubePauseStatus(): Promise<
  import('../types/settings').YouTubePauseState
> {
  try {
    const result = await chrome.storage.local.get(YOUTUBE_PAUSE_STATE_KEY);

    if (result[YOUTUBE_PAUSE_STATE_KEY]) {
      const pauseState = result[
        YOUTUBE_PAUSE_STATE_KEY
      ] as import('../types/settings').YouTubePauseState;

      // Validate pause hasn't expired (defense against stale state)
      if (pauseState.isPaused && pauseState.pauseEndTime) {
        const now = Date.now();
        if (now >= pauseState.pauseEndTime) {
          // Pause expired but state wasn't cleaned up - auto-resume
          await resumeYouTubeModule();
          return { ...(await import('../types/settings')).DEFAULT_YOUTUBE_PAUSE_STATE };
        }
      }

      return pauseState;
    }

    return { ...(await import('../types/settings')).DEFAULT_YOUTUBE_PAUSE_STATE };
  } catch (error) {
    console.error('Failed to retrieve YouTube pause status:', error);
    return { ...(await import('../types/settings')).DEFAULT_YOUTUBE_PAUSE_STATE };
  }
}

/**
 * Checks if YouTube module is currently paused
 *
 * @returns Promise resolving to true if YouTube module is paused
 */
export async function isYouTubeModulePaused(): Promise<boolean> {
  const pauseState = await getYouTubePauseStatus();

  if (!pauseState.isPaused) {
    return false;
  }

  // Defense: Verify pause hasn't expired (handles stale state and clock changes)
  if (pauseState.pauseEndTime) {
    const now = Date.now();
    if (now >= pauseState.pauseEndTime) {
      // Pause expired - clean up stale state
      await resumeYouTubeModule();
      return false;
    }
  }

  return true;
}

/**
 * Pauses YouTube module for a specified duration
 * Creates pause state in chrome.storage.local and triggers alarm creation in service worker
 *
 * @param durationMs - Pause duration in milliseconds (null for indefinite pause)
 * @returns Promise that resolves when pause is activated
 * @throws Error if pause is already active or duration is invalid
 * @throws Error if Lock Mode is active
 */
export async function pauseYouTubeModule(durationMs: number | null): Promise<void> {
  // CRITICAL: Lock mode enforcement
  // Prevent pausing when lock mode is active
  if (await isLockModeActive()) {
    const remaining = await getRemainingLockTime();
    const minutesRemaining = Math.ceil(remaining / 60000);
    throw new Error(
      `Cannot pause YouTube module while Lock Mode is active (${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} remaining).`
    );
  }

  // Validate duration (null is valid for indefinite pause)
  if (durationMs !== null && durationMs <= 0) {
    throw new Error('Pause duration must be greater than 0 or null for indefinite pause');
  }

  // Check if pause is already active
  const currentPause = await getYouTubePauseStatus();
  if (currentPause.isPaused) {
    throw new Error('YouTube module is already paused. Resume first before pausing again.');
  }

  const now = Date.now();
  const pauseState: import('../types/settings').YouTubePauseState = {
    isPaused: true,
    pauseEndTime: durationMs !== null ? now + durationMs : null,
    pauseStartedAt: now,
  };

  try {
    await chrome.storage.local.set({ [YOUTUBE_PAUSE_STATE_KEY]: pauseState });
    const endTimeStr = pauseState.pauseEndTime
      ? new Date(pauseState.pauseEndTime).toLocaleString()
      : 'indefinitely';
    console.info(`YouTube module paused until ${endTimeStr}`);
  } catch (error) {
    console.error('Failed to pause YouTube module:', error);
    throw new Error('Failed to pause YouTube module: storage operation failed');
  }
}

/**
 * Resumes YouTube module (ends pause)
 * Called manually by user or automatically when pause expires
 *
 * @returns Promise that resolves when pause is cleared
 * @throws Error if Lock Mode is active
 */
export async function resumeYouTubeModule(): Promise<void> {
  // CRITICAL: Lock mode enforcement
  // Prevent resuming when lock mode is active (manual resume only)
  // Automatic resume (from alarm) bypasses this check
  const currentPause = await getYouTubePauseStatus();
  if (currentPause.isPaused && currentPause.pauseEndTime === null) {
    // Indefinite pause - check lock mode for manual resume
    if (await isLockModeActive()) {
      const remaining = await getRemainingLockTime();
      const minutesRemaining = Math.ceil(remaining / 60000);
      throw new Error(
        `Cannot resume YouTube module while Lock Mode is active (${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} remaining).`
      );
    }
  }

  try {
    await chrome.storage.local.remove(YOUTUBE_PAUSE_STATE_KEY);
    console.info('YouTube module resumed');
  } catch (error) {
    console.error('Failed to resume YouTube module:', error);
    throw new Error('Failed to resume YouTube module: storage operation failed');
  }
}

/**
 * Calculates remaining time until pause expires
 *
 * @returns Promise resolving to milliseconds remaining (0 if not paused, null if indefinite)
 */
export async function getRemainingPauseTime(): Promise<number | null> {
  const pauseState = await getYouTubePauseStatus();

  if (!pauseState.isPaused) {
    return 0;
  }

  // Indefinite pause
  if (pauseState.pauseEndTime === null) {
    return null;
  }

  const now = Date.now();
  const remaining = pauseState.pauseEndTime - now;

  return remaining > 0 ? remaining : 0;
}

// ==================== SCHEDULE MANAGEMENT FUNCTIONS ====================

/**
 * Retrieves all blocking schedules
 * Handles backwards compatibility for old string[] contentKeywords format
 *
 * @returns Promise resolving to array of blocking schedules
 */
export async function getSchedules(): Promise<import('../types/settings').BlockingSchedule[]> {
  const settings = await getSettings();
  const schedules = settings.general.schedules || [];

  // Normalize contentKeywords for backwards compatibility
  // Convert old string[] format to ContentKeywordRule[] format
  return schedules.map((schedule) => ({
    ...schedule,
    contentKeywords: normalizeContentKeywords(schedule.contentKeywords || []),
  }));
}

/**
 * Adds a new blocking schedule
 * Validates schedule before adding to prevent duplicates and invalid data
 *
 * @param schedule - Blocking schedule to add
 * @returns Promise that resolves when schedule is added
 * @throws Error if schedule is invalid or ID already exists
 */
export async function addSchedule(
  schedule: import('../types/settings').BlockingSchedule
): Promise<void> {
  const settings = await getSettings();

  // Check if schedule ID already exists
  const exists = settings.general.schedules.some((s) => s.id === schedule.id);

  if (exists) {
    throw new Error(`Schedule with ID ${schedule.id} already exists`);
  }

  // Add schedule to list
  const updatedSettings = {
    ...settings,
    general: {
      ...settings.general,
      schedules: [...settings.general.schedules, schedule],
    },
  };

  // Save to storage
  try {
    await chrome.storage.sync.set({ [SETTINGS_KEY]: updatedSettings });
  } catch (syncError) {
    console.warn('Failed to save to sync storage, trying local:', syncError);
    await chrome.storage.local.set({ [SETTINGS_KEY]: updatedSettings });
  }
}

/**
 * Updates an existing blocking schedule
 * Merges partial update with existing schedule data
 *
 * @param scheduleId - ID of schedule to update
 * @param updates - Partial schedule with fields to update
 * @returns Promise that resolves when schedule is updated
 * @throws Error if schedule not found
 * @throws Error if lock mode is active
 */
export async function updateSchedule(
  scheduleId: string,
  updates: Partial<import('../types/settings').BlockingSchedule>
): Promise<void> {
  // CRITICAL: Lock mode enforcement
  // Prevent updating schedules when lock mode is active
  if (await isLockModeActive()) {
    const remaining = await getRemainingLockTime();
    const minutesRemaining = Math.ceil(remaining / 60000);
    throw new Error(
      `Cannot update schedules while Lock Mode is active (${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} remaining).`
    );
  }

  const settings = await getSettings();

  // Find schedule index
  const scheduleIndex = settings.general.schedules.findIndex((s) => s.id === scheduleId);

  if (scheduleIndex === -1) {
    throw new Error(`Schedule with ID ${scheduleId} not found`);
  }

  // Merge updates with existing schedule
  const updatedSchedule = {
    ...settings.general.schedules[scheduleIndex],
    ...updates,
    updatedAt: Date.now(),
  };

  // Update schedule in array
  const updatedSchedules = [...settings.general.schedules];
  updatedSchedules[scheduleIndex] = updatedSchedule;

  const updatedSettings = {
    ...settings,
    general: {
      ...settings.general,
      schedules: updatedSchedules,
    },
  };

  // Save to storage
  try {
    await chrome.storage.sync.set({ [SETTINGS_KEY]: updatedSettings });
  } catch (syncError) {
    console.warn('Failed to save to sync storage, trying local:', syncError);
    await chrome.storage.local.set({ [SETTINGS_KEY]: updatedSettings });
  }
}

/**
 * Deletes a blocking schedule
 *
 * @param scheduleId - ID of schedule to delete
 * @returns Promise that resolves when schedule is deleted
 * @throws Error if schedule not found
 * @throws Error if lock mode is active
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  // CRITICAL: Lock mode enforcement
  // Prevent deleting schedules when lock mode is active
  if (await isLockModeActive()) {
    const remaining = await getRemainingLockTime();
    const minutesRemaining = Math.ceil(remaining / 60000);
    throw new Error(
      `Cannot delete schedules while Lock Mode is active (${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} remaining).`
    );
  }

  const settings = await getSettings();

  // Check if schedule exists
  const exists = settings.general.schedules.some((s) => s.id === scheduleId);

  if (!exists) {
    throw new Error(`Schedule with ID ${scheduleId} not found`);
  }

  // Filter out the schedule
  const updatedSettings = {
    ...settings,
    general: {
      ...settings.general,
      schedules: settings.general.schedules.filter((s) => s.id !== scheduleId),
    },
  };

  // Save to storage
  try {
    await chrome.storage.sync.set({ [SETTINGS_KEY]: updatedSettings });
  } catch (syncError) {
    console.warn('Failed to save to sync storage, trying local:', syncError);
    await chrome.storage.local.set({ [SETTINGS_KEY]: updatedSettings });
  }
}

/**
 * Checks if a schedule exists
 *
 * @param scheduleId - Schedule ID to check
 * @returns Promise resolving to true if schedule exists
 */
export async function scheduleExists(scheduleId: string): Promise<boolean> {
  const schedules = await getSchedules();
  return schedules.some((s) => s.id === scheduleId);
}

/**
 * Gets a single schedule by ID
 *
 * @param scheduleId - Schedule ID to retrieve
 * @returns Promise resolving to schedule or null if not found
 */
export async function getSchedule(
  scheduleId: string
): Promise<import('../types/settings').BlockingSchedule | null> {
  const schedules = await getSchedules();
  return schedules.find((s) => s.id === scheduleId) || null;
}

// ==================== IMPORT/EXPORT FUNCTIONS ====================

/**
 * Exports all user settings and preferences
 * Creates a complete export package including settings, theme, and metadata
 *
 * Export Structure:
 * {
 *   version: "1.0.0",
 *   settings: {
 *     youtube: {
 *       enabled: boolean,
 *       globalNavigation: GlobalNavigationSettings,
 *       searchPage: SearchPageSettings,
 *       watchPage: WatchPageSettings,
 *       blockedChannels: BlockedChannel[]
 *       // homePage and creatorProfilePage are excluded (empty/deprecated)
 *     },
 *     general: {
 *       schedules: BlockingSchedule[],
 *       quickBlock: QuickBlockConfig
 *     }
 *   },
 *   theme: "light" | "dark",
 *   exportedAt: number
 * }
 *
 * Includes:
 * - YouTube module settings (enabled, global, search, watch)
 * - Blocked YouTube channels
 * - General module (schedules and Quick Block config)
 * - Theme preference
 *
 * Excludes (empty, deprecated, or device-specific):
 * - homePage settings (deprecated, always empty)
 * - creatorProfilePage settings (deprecated, always empty)
 * - Lock Mode state (device-specific commitment)
 * - YouTube Pause state (device-specific)
 * - Quick Block session state (temporary)
 *
 * @returns Promise resolving to complete export data
 */
export async function exportAllSettings(): Promise<ExportData> {
  const settings = await getSettings();
  const theme = await getThemePreference();

  // Remove empty/deprecated fields from YouTube module
  const {
    homePage: _homePage, // eslint-disable-line @typescript-eslint/no-unused-vars
    creatorProfilePage: _creatorProfilePage, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...youtubeSettings
  } = settings.youtube;

  return {
    version: '1.0.0',
    settings: {
      ...settings,
      // Cast to full type - missing fields (homePage, creatorProfilePage) will be added back on import via deepMerge
      youtube: youtubeSettings as YouTubeModuleSettings,
    },
    theme,
    exportedAt: Date.now(),
  };
}

/**
 * Imports all user settings and preferences from export data
 * Validates data before importing and merges with defaults
 *
 * Handles backward compatibility:
 * - Missing homePage/creatorProfilePage fields are added from defaults
 * - Old export formats are validated and upgraded
 *
 * @param exportData - Export data to import
 * @returns Promise that resolves when import is complete
 * @throws Error if export data is invalid or import fails
 * @throws Error if lock mode is active
 */
export async function importAllSettings(exportData: unknown): Promise<void> {
  // CRITICAL: Lock mode enforcement
  // Prevent importing settings when lock mode is active
  if (await isLockModeActive()) {
    const remaining = await getRemainingLockTime();
    const minutesRemaining = Math.ceil(remaining / 60000);
    throw new Error(
      `Cannot import settings while Lock Mode is active (${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} remaining).`
    );
  }

  // Validate export data structure
  if (!exportData || typeof exportData !== 'object') {
    throw new Error('Invalid export data: not an object');
  }

  const data = exportData as Record<string, unknown>;

  // Validate version
  if (typeof data.version !== 'string') {
    throw new Error('Invalid export data: missing or invalid version');
  }

  // Validate settings
  if (!validateSettings(data.settings)) {
    throw new Error('Invalid export data: settings validation failed');
  }

  // Validate theme (optional field)
  if (data.theme !== undefined && data.theme !== 'light' && data.theme !== 'dark') {
    throw new Error('Invalid export data: theme must be "light" or "dark"');
  }

  // Validate exportedAt (optional field)
  if (data.exportedAt !== undefined && typeof data.exportedAt !== 'number') {
    throw new Error('Invalid export data: exportedAt must be a number');
  }

  // Type is now safe after validation
  const validatedData = data as unknown as ExportData;

  // Merge imported settings with defaults to ensure all required fields exist
  // This handles backward compatibility when importing from older exports that may be missing fields
  const mergedSettings = deepMerge(
    DEFAULT_SETTINGS,
    validatedData.settings as Partial<ExtensionSettings>
  );

  // Import settings
  try {
    // Save merged settings (includes defaults for any missing fields)
    await chrome.storage.sync.set({ [SETTINGS_KEY]: mergedSettings });
  } catch (syncError) {
    console.warn('Failed to import to sync storage, trying local:', syncError);
    try {
      await chrome.storage.local.set({ [SETTINGS_KEY]: mergedSettings });
    } catch (localError) {
      console.error('Failed to import to local storage:', localError);
      throw new Error('Failed to import settings: both sync and local storage failed');
    }
  }

  // Import theme preference
  if (validatedData.theme) {
    await setThemePreference(validatedData.theme);
  }

  // CRITICAL: Sync Quick Block config to session
  // Quick Block uses local storage session for runtime, so we need to update it
  // with the imported config from settings
  try {
    const { getQuickBlockSession, setQuickBlockSession } =
      await import('../utils/quick-block-utils');
    const currentSession = await getQuickBlockSession();

    // Update session with imported config while preserving session state (isActive, times)
    await setQuickBlockSession({
      ...currentSession,
      blockedDomains: mergedSettings.general.quickBlock.blockedDomains,
      urlKeywords: mergedSettings.general.quickBlock.urlKeywords,
      contentKeywords: mergedSettings.general.quickBlock.contentKeywords,
    });

    console.info('Quick Block config synced to session from imported settings');
  } catch (error) {
    console.warn('Failed to sync Quick Block config to session:', error);
    // Don't throw - settings were imported successfully, just Quick Block session sync failed
  }

  console.info(
    'Settings imported successfully from export created at:',
    new Date(validatedData.exportedAt)
  );
}
