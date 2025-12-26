/**
 * Service Worker for Fockey Chrome Extension
 * Manifest V3 background script for lifecycle management and coordination
 */

import {
  getSettings,
  updateSettings,
  resetToDefaults,
  getLockModeStatus,
  activateLockMode,
  extendLockMode,
  unlockLockMode,
} from '../shared/storage';
import { DEFAULT_SETTINGS, ExtensionSettings, LockModeState } from '../shared/types/settings';
import type {
  Message,
  MessageResponse,
  GetSettingsResponse,
  UpdateSettingsResponse,
  ResetSettingsResponse,
  ActivateLockModeResponse,
  ExtendLockModeResponse,
  GetLockStateResponse,
} from '../shared/types/messages';

/**
 * Debug mode flag - set to true to enable detailed logging
 */
const DEBUG_MODE = true;

/**
 * Extension version from manifest
 */
const EXTENSION_VERSION = chrome.runtime.getManifest().version;

/**
 * Centralized logging utility
 */
const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (DEBUG_MODE) {
      console.log(`[Fockey v${EXTENSION_VERSION}]`, message, ...args);
    }
  },
  error: (message: string, error?: unknown) => {
    console.error(`[Fockey v${EXTENSION_VERSION}] ERROR:`, message, error);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[Fockey v${EXTENSION_VERSION}] WARNING:`, message, ...args);
  },
};

/**
 * Initialize settings on extension install
 * Subtask 5.2: onInstall handler with default settings initialization
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  logger.info('Extension lifecycle event:', details.reason);

  try {
    if (details.reason === 'install') {
      // Fresh install - initialize with default settings
      await chrome.storage.sync.set({ fockey_settings: DEFAULT_SETTINGS });
      logger.info('Default settings initialized on fresh install');

      // Log version for debugging
      logger.info('Extension version:', EXTENSION_VERSION);
    } else if (details.reason === 'update') {
      // Extension update
      const previousVersion = details.previousVersion || 'unknown';
      logger.info(`Extension updated from ${previousVersion} to ${EXTENSION_VERSION}`);

      // Cleanup deprecated storage keys if any
      await cleanupDeprecatedStorage();
    }
  } catch (error) {
    logger.error('Failed during onInstalled handler', error);
  }
});

/**
 * Validate settings on startup
 * Subtask 5.3: onStartup handler with schema validation
 *
 * CRITICAL: Also recreates lock mode alarm if lock is active
 * Chrome alarms DO NOT persist across browser restarts
 */
chrome.runtime.onStartup.addListener(async () => {
  logger.info('Extension startup');

  try {
    // Validate settings schema
    await getSettings();
    logger.info('Settings loaded and validated successfully');

    // CRITICAL: Recreate lock mode alarm if lock is active
    // Chrome alarms don't persist across browser restarts
    await recreateLockModeAlarmOnStartup();
  } catch (error) {
    logger.error('Failed during startup validation', error);
    // Attempt to reset to defaults as fallback
    try {
      await resetToDefaults();
      logger.info('Settings reset to defaults after validation failure');
    } catch (resetError) {
      logger.error('Failed to reset settings', resetError);
    }
  }
});

/**
 * Clean up deprecated storage keys from older versions
 * Subtask 5.9: Extension update migration logic
 */
async function cleanupDeprecatedStorage(): Promise<void> {
  try {
    // List of deprecated keys to remove (add as needed in future versions)
    const deprecatedKeys: string[] = [];

    if (deprecatedKeys.length > 0) {
      await chrome.storage.sync.remove(deprecatedKeys);
      logger.info('Cleaned up deprecated storage keys:', deprecatedKeys);
    }
  } catch (error) {
    logger.error('Failed to cleanup deprecated storage', error);
  }
}

// ==================== LOCK MODE ALARM MANAGEMENT ====================

/**
 * Lock mode alarm name constant
 */
const LOCK_MODE_ALARM_NAME = 'unlock-lock-mode';

/**
 * CRITICAL: Recreate lock mode alarm on service worker startup
 * Chrome alarms DO NOT persist across browser restarts
 *
 * This function:
 * 1. Checks if lock mode is currently active
 * 2. If active and alarm doesn't exist, recreates it
 * 3. If lock expired during shutdown, unlocks immediately
 */
async function recreateLockModeAlarmOnStartup(): Promise<void> {
  try {
    const lockState = await getLockModeStatus();

    if (!lockState.isLocked || !lockState.lockEndTime) {
      logger.info('No active lock mode on startup');
      return;
    }

    const now = Date.now();
    const timeRemaining = lockState.lockEndTime - now;

    if (timeRemaining > 0) {
      // Lock is still active - recreate alarm
      await chrome.alarms.create(LOCK_MODE_ALARM_NAME, {
        when: lockState.lockEndTime,
      });

      const minutesRemaining = Math.ceil(timeRemaining / 60000);
      logger.info(
        `Lock mode alarm recreated: ${minutesRemaining} minute(s) remaining until ${new Date(lockState.lockEndTime).toLocaleString()}`
      );

      // Broadcast lock status to popup/options
      await broadcastLockStatusChange(lockState);
    } else {
      // Lock expired during shutdown - unlock immediately
      logger.info('Lock mode expired during shutdown - unlocking now');
      await unlockLockMode();
      await broadcastLockStatusChange({
        isLocked: false,
        lockEndTime: null,
        lockStartedAt: null,
        originalDuration: null,
      });
    }
  } catch (error) {
    logger.error('Failed to recreate lock mode alarm on startup', error);
  }
}

/**
 * Create or update lock mode alarm
 * Called when lock is activated or extended
 */
async function createLockModeAlarm(lockEndTime: number): Promise<void> {
  try {
    // Clear existing alarm if it exists
    await chrome.alarms.clear(LOCK_MODE_ALARM_NAME);

    // Create new alarm with exact unlock time
    await chrome.alarms.create(LOCK_MODE_ALARM_NAME, {
      when: lockEndTime,
    });

    logger.info(`Lock mode alarm created for ${new Date(lockEndTime).toLocaleString()}`);
  } catch (error) {
    logger.error('Failed to create lock mode alarm', error);
    throw new Error('Failed to create lock mode alarm');
  }
}

/**
 * Broadcast lock status change to popup and options page
 * Called when lock is activated, extended, or expires
 */
async function broadcastLockStatusChange(lockState: LockModeState): Promise<void> {
  try {
    // Send message to all extension contexts (popup, options)
    await chrome.runtime
      .sendMessage({
        type: 'LOCK_STATUS_CHANGED',
        lockState,
      })
      .catch(() => {
        // No receivers, that's okay (popup/options might not be open)
        logger.info('Lock status broadcast sent (no receivers)');
      });

    logger.info('Lock status broadcast:', lockState.isLocked ? 'LOCKED' : 'UNLOCKED');
  } catch {
    // Sending message when no receivers throws an error, which is expected
    logger.info('Lock status change (no active listeners)');
  }
}

/**
 * Broadcast settings update to all active YouTube tabs
 * Subtasks 5.6 & 5.7: Settings broadcast system and tab messaging
 */
async function broadcastSettingsToYouTubeTabs(settings: ExtensionSettings): Promise<void> {
  try {
    // Query all YouTube tabs
    const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
    logger.info(`Broadcasting settings to ${tabs.length} YouTube tab(s)`);

    // Send settings update to each tab
    const promises = tabs.map(async (tab) => {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_UPDATED',
            settings,
          });
          logger.info(`Settings broadcast to tab ${tab.id}`);
        } catch (error) {
          // Tab might not have content script loaded yet, that's okay
          logger.warn(`Failed to broadcast to tab ${tab.id}`, error);
        }
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    logger.error('Failed to broadcast settings to YouTube tabs', error);
  }
}

/**
 * Message handler with routing
 * Subtask 5.5: chrome.runtime.onMessage listener with message routing
 */
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  logger.info('Message received:', message.type, 'from:', sender.tab?.id || 'popup/options');

  // Route message to appropriate handler
  handleMessage(message, sender)
    .then((response) => {
      sendResponse(response);
    })
    .catch((error) => {
      logger.error('Message handler error', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      } as MessageResponse);
    });

  // Keep message channel open for async response
  return true;
});

/**
 * Central message routing handler
 * Subtask 5.8: Centralized error handling and logging
 */
async function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender
): Promise<MessageResponse> {
  try {
    switch (message.type) {
      case 'GET_SETTINGS':
        return await handleGetSettings();

      case 'UPDATE_SETTINGS':
        return await handleUpdateSettings(message.partial);

      case 'RESET_SETTINGS':
        return await handleResetSettings();

      case 'RELOAD_CONTENT_SCRIPT':
        return await handleReloadContentScript(message.tabId);

      case 'NAVIGATE_TO_HOME':
        return await handleNavigateToHome(sender.tab?.id);

      // Lock mode message handlers
      case 'ACTIVATE_LOCK_MODE':
        return await handleActivateLockMode(message.durationMs);

      case 'EXTEND_LOCK_MODE':
        return await handleExtendLockMode(message.additionalMs);

      case 'GET_LOCK_STATE':
        return await handleGetLockState();

      default:
        throw new Error(`Unknown message type: ${(message as Message).type}`);
    }
  } catch (error) {
    logger.error('Error handling message', error);
    throw error;
  }
}

/**
 * Handle GET_SETTINGS message
 */
async function handleGetSettings(): Promise<GetSettingsResponse> {
  const settings = await getSettings();
  return {
    success: true,
    data: settings,
  };
}

/**
 * Handle UPDATE_SETTINGS message
 */
async function handleUpdateSettings(
  partial: Partial<ExtensionSettings>
): Promise<UpdateSettingsResponse> {
  await updateSettings(partial);

  // Broadcast updated settings to all YouTube tabs
  const newSettings = await getSettings();
  await broadcastSettingsToYouTubeTabs(newSettings);

  return {
    success: true,
  };
}

/**
 * Handle RESET_SETTINGS message
 */
async function handleResetSettings(): Promise<ResetSettingsResponse> {
  const settings = await resetToDefaults();

  // Broadcast reset settings to all YouTube tabs
  await broadcastSettingsToYouTubeTabs(settings);

  return {
    success: true,
    data: settings,
  };
}

/**
 * Handle RELOAD_CONTENT_SCRIPT message
 */
async function handleReloadContentScript(tabId?: number): Promise<MessageResponse> {
  try {
    if (tabId) {
      // Reload specific tab
      await chrome.tabs.reload(tabId);
      logger.info(`Reloaded tab ${tabId}`);
    } else {
      // Reload all YouTube tabs
      const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
      await Promise.all(
        tabs.map((tab) => (tab.id ? chrome.tabs.reload(tab.id) : Promise.resolve()))
      );
      logger.info(`Reloaded ${tabs.length} YouTube tab(s)`);
    }

    return { success: true };
  } catch (error) {
    logger.error('Failed to reload content script', error);
    throw error;
  }
}

/**
 * Handle NAVIGATE_TO_HOME message
 * Navigates the current tab to YouTube home page
 */
async function handleNavigateToHome(tabId?: number): Promise<MessageResponse> {
  try {
    if (tabId) {
      await chrome.tabs.update(tabId, { url: 'https://www.youtube.com' });
      logger.info(`Navigated tab ${tabId} to YouTube home`);
      return { success: true };
    } else {
      logger.error('No tab ID provided for navigation');
      throw new Error('Tab ID required for navigation');
    }
  } catch (error) {
    logger.error('Failed to navigate to home', error);
    throw error;
  }
}

/**
 * Handle ACTIVATE_LOCK_MODE message
 * Activates lock mode for specified duration and creates alarm
 */
async function handleActivateLockMode(durationMs: number): Promise<ActivateLockModeResponse> {
  try {
    // Activate lock mode in storage
    await activateLockMode(durationMs);

    // Get updated lock state
    const lockState = await getLockModeStatus();

    if (!lockState.lockEndTime) {
      throw new Error('Failed to activate lock mode: lockEndTime is null');
    }

    // Create alarm for automatic unlock
    await createLockModeAlarm(lockState.lockEndTime);

    // Broadcast lock status to popup/options
    await broadcastLockStatusChange(lockState);

    const minutesDuration = Math.ceil(durationMs / 60000);
    logger.info(`Lock mode activated for ${minutesDuration} minute(s)`);

    return {
      success: true,
    };
  } catch (error) {
    logger.error('Failed to activate lock mode', error);
    throw error;
  }
}

/**
 * Handle EXTEND_LOCK_MODE message
 * Extends active lock mode by adding additional time
 */
async function handleExtendLockMode(additionalMs: number): Promise<ExtendLockModeResponse> {
  try {
    // Extend lock mode in storage
    await extendLockMode(additionalMs);

    // Get updated lock state
    const lockState = await getLockModeStatus();

    if (!lockState.lockEndTime) {
      throw new Error('Failed to extend lock mode: lockEndTime is null');
    }

    // Update alarm with new unlock time
    await createLockModeAlarm(lockState.lockEndTime);

    // Broadcast lock status to popup/options
    await broadcastLockStatusChange(lockState);

    const additionalMinutes = Math.ceil(additionalMs / 60000);
    logger.info(`Lock mode extended by ${additionalMinutes} minute(s)`);

    return {
      success: true,
    };
  } catch (error) {
    logger.error('Failed to extend lock mode', error);
    throw error;
  }
}

/**
 * Handle GET_LOCK_STATE message
 * Returns current lock mode state
 */
async function handleGetLockState(): Promise<GetLockStateResponse> {
  try {
    const lockState = await getLockModeStatus();

    return {
      success: true,
      data: lockState,
    };
  } catch (error) {
    logger.error('Failed to get lock state', error);
    throw error;
  }
}

/**
 * Service worker keep-alive strategy
 * Subtask 5.10: Keep-alive strategies with chrome.alarms
 *
 * CRITICAL: Also validates lock expiration (defense against system clock changes)
 */
const KEEP_ALIVE_INTERVAL = 25; // minutes (less than 30-minute service worker timeout)

chrome.alarms.create('keep-alive', {
  periodInMinutes: KEEP_ALIVE_INTERVAL,
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'keep-alive') {
    logger.info('Keep-alive alarm triggered');

    // Perform lightweight operation to keep service worker alive
    chrome.storage.sync.get('fockey_settings', () => {
      logger.info('Keep-alive check completed');
    });

    // CRITICAL: Periodic lock expiration validation
    // Defense against system clock changes and missed alarms
    await validateLockExpiration();
  } else if (alarm.name === LOCK_MODE_ALARM_NAME) {
    // Lock mode unlock alarm fired
    logger.info('Lock mode unlock alarm triggered');
    await handleLockModeUnlock();
  }
});

/**
 * CRITICAL: Periodic validation of lock expiration
 * Defense mechanism against:
 * - System clock changes
 * - Missed alarm events
 * - Stale lock state
 *
 * Called every 25 minutes by keep-alive alarm
 */
async function validateLockExpiration(): Promise<void> {
  try {
    const lockState = await getLockModeStatus();

    if (lockState.isLocked && lockState.lockEndTime) {
      const now = Date.now();

      if (now >= lockState.lockEndTime) {
        // Lock has expired but alarm hasn't fired yet - manual unlock
        logger.warn('Lock expired but alarm missed - manual unlock triggered');
        await handleLockModeUnlock();
      } else {
        // Lock still valid
        const minutesRemaining = Math.ceil((lockState.lockEndTime - now) / 60000);
        logger.info(`Lock mode active: ${minutesRemaining} minute(s) remaining`);
      }
    }
  } catch (error) {
    logger.error('Failed to validate lock expiration', error);
  }
}

/**
 * Handle lock mode unlock when alarm fires
 * Silently unlocks (no notifications per user requirement)
 */
async function handleLockModeUnlock(): Promise<void> {
  try {
    logger.info('Unlocking Lock Mode');
    await unlockLockMode();

    // Broadcast unlock status to popup/options
    const unlockedState: LockModeState = {
      isLocked: false,
      lockEndTime: null,
      lockStartedAt: null,
      originalDuration: null,
    };
    await broadcastLockStatusChange(unlockedState);

    logger.info('Lock Mode unlocked successfully (silent unlock - no notification)');
  } catch (error) {
    logger.error('Failed to unlock Lock Mode', error);
  }
}

// Log initialization
logger.info('Service worker initialized successfully');
