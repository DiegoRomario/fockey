/**
 * Service Worker for Fockey Chrome Extension
 * Manifest V3 background script for lifecycle management and coordination
 */

import { getSettings, updateSettings, resetToDefaults, checkAndMigrate } from '../shared/storage';
import { DEFAULT_SETTINGS, ExtensionSettings } from '../shared/types/settings';
import type { Message, MessageResponse, GetSettingsResponse, UpdateSettingsResponse, ResetSettingsResponse } from '../shared/types/messages';

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
      // Extension update - run migration if needed
      const previousVersion = details.previousVersion || 'unknown';
      logger.info(`Extension updated from ${previousVersion} to ${EXTENSION_VERSION}`);

      // Subtask 5.9: Migration logic
      const currentSettings = await getSettings();
      const migratedSettings = await checkAndMigrate(currentSettings);

      // Save migrated settings if any changes were made
      if (migratedSettings.version !== currentSettings.version) {
        await chrome.storage.sync.set({ fockey_settings: migratedSettings });
        logger.info('Settings migrated successfully');
      }

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
 */
chrome.runtime.onStartup.addListener(async () => {
  logger.info('Extension startup');

  try {
    // Validate settings schema
    const settings = await getSettings();
    logger.info('Settings loaded and validated successfully');

    // Check if migration is needed
    if (settings.version !== EXTENSION_VERSION) {
      logger.warn('Settings version mismatch, running migration');
      const migratedSettings = await checkAndMigrate(settings);
      if (migratedSettings.version !== settings.version) {
        await chrome.storage.sync.set({ fockey_settings: migratedSettings });
        logger.info('Settings migrated on startup');
      }
    }
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
  handleMessage(message)
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
async function handleMessage(message: Message): Promise<MessageResponse> {
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
async function handleUpdateSettings(partial: Partial<ExtensionSettings>): Promise<UpdateSettingsResponse> {
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
      await Promise.all(tabs.map((tab) => tab.id ? chrome.tabs.reload(tab.id) : Promise.resolve()));
      logger.info(`Reloaded ${tabs.length} YouTube tab(s)`);
    }

    return { success: true };
  } catch (error) {
    logger.error('Failed to reload content script', error);
    throw error;
  }
}

/**
 * Service worker keep-alive strategy
 * Subtask 5.10: Keep-alive strategies with chrome.alarms
 */
const KEEP_ALIVE_INTERVAL = 25; // minutes (less than 30-minute service worker timeout)

chrome.alarms.create('keep-alive', {
  periodInMinutes: KEEP_ALIVE_INTERVAL,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keep-alive') {
    logger.info('Keep-alive alarm triggered');
    // Perform lightweight operation to keep service worker alive
    chrome.storage.sync.get('fockey_settings', () => {
      logger.info('Keep-alive check completed');
    });
  }
});

// Log initialization
logger.info('Service worker initialized successfully');
