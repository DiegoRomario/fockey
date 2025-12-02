/**
 * Service Worker for Fockey Chrome Extension
 * Handles settings initialization and coordination
 */

import { getSettings, updateSettings, resetToDefaults } from '../shared/storage';
import { DEFAULT_SETTINGS } from '../shared/types/settings';

// Initialize settings on extension install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Fockey] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // Initialize with default settings on fresh install
    try {
      await chrome.storage.sync.set({ fockey_settings: DEFAULT_SETTINGS });
      console.log('[Fockey] Default settings initialized');
    } catch (error) {
      console.error('[Fockey] Failed to initialize settings:', error);
    }
  } else if (details.reason === 'update') {
    // Settings migration will be handled automatically by getSettings()
    console.log('[Fockey] Extension updated, settings migration will run if needed');
  }
});

// Handle messages from popup, options, and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Fockey] Message received:', message);

  // Handle settings-related messages
  if (message.type === 'GET_SETTINGS') {
    getSettings()
      .then((settings) => {
        sendResponse({ success: true, settings });
      })
      .catch((error) => {
        console.error('[Fockey] Failed to get settings:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (message.type === 'UPDATE_SETTINGS') {
    updateSettings(message.partial)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[Fockey] Failed to update settings:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (message.type === 'RESET_SETTINGS') {
    resetToDefaults()
      .then((settings) => {
        sendResponse({ success: true, settings });
      })
      .catch((error) => {
        console.error('[Fockey] Failed to reset settings:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  // Unknown message type
  sendResponse({ success: false, error: 'Unknown message type' });
  return false;
});
