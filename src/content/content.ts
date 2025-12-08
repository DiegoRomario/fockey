/**
 * Main Content Script for Fockey Chrome Extension
 * Initializes appropriate modules based on current YouTube page
 */

import { getSettings, watchSettings } from '../shared/storage/settings-manager';
import type { ExtensionSettings } from '../shared/types/settings';
import { initHomePageModule, cleanupHomePageModule } from './youtube/home-page';
import { initSearchPageModule, cleanupSearchPageModule } from './youtube/search-page';
import { initWatchPageModule, cleanupWatchPageModule } from './youtube/watch-page';

/**
 * Page types for YouTube navigation
 */
type PageType = 'home' | 'search' | 'watch' | 'other';

/**
 * Current page state tracker
 */
let currentPageType: PageType | null = null;
let currentSettings: ExtensionSettings | null = null;

/**
 * Determines the current page type based on URL pathname
 */
function getCurrentPageType(): PageType {
  const path = window.location.pathname;
  if (path === '/' || path === '/feed/explore' || path === '/feed/trending') {
    return 'home';
  }
  if (path.startsWith('/results')) {
    return 'search';
  }
  if (path.startsWith('/watch')) {
    return 'watch';
  }
  return 'other';
}

/**
 * Centralized page change handler
 * Manages cleanup and initialization of appropriate modules during navigation
 */
async function handlePageChange(settings: ExtensionSettings): Promise<void> {
  const newPageType = getCurrentPageType();

  // Skip if page type hasn't changed
  if (newPageType === currentPageType) {
    return;
  }

  console.log(`[Fockey] Page change detected: ${currentPageType} → ${newPageType}`);

  // Cleanup previous module
  if (currentPageType === 'home') {
    cleanupHomePageModule();
  } else if (currentPageType === 'search') {
    cleanupSearchPageModule();
  } else if (currentPageType === 'watch') {
    cleanupWatchPageModule();
  }

  // Update current page type
  currentPageType = newPageType;

  // Initialize new module
  if (!settings.youtube.enabled) {
    console.log('[Fockey] YouTube module is disabled');
    return;
  }

  if (newPageType === 'home') {
    await initHomePageModule(settings.youtube.homePage);
  } else if (newPageType === 'search') {
    await initSearchPageModule(settings.youtube.searchPage);
  } else if (newPageType === 'watch') {
    await initWatchPageModule(settings.youtube.watchPage);
  }
}

/**
 * Initializes the appropriate content script module based on current page
 */
async function initialize(): Promise<void> {
  try {
    // Get current settings
    const settings = await getSettings();
    currentSettings = settings;

    // Initialize current page
    await handlePageChange(settings);

    // Set up global navigation listeners
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // Wrap history.pushState
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      if (currentSettings) {
        handlePageChange(currentSettings);
      }
    };

    // Wrap history.replaceState
    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      if (currentSettings) {
        handlePageChange(currentSettings);
      }
    };

    // Listen for YouTube's custom navigation event
    window.addEventListener('yt-navigate-finish', () => {
      if (currentSettings) {
        handlePageChange(currentSettings);
      }
    });

    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', () => {
      if (currentSettings) {
        handlePageChange(currentSettings);
      }
    });

    // Watch for settings changes and update in real-time
    watchSettings((updatedSettings) => {
      currentSettings = updatedSettings;

      if (!updatedSettings.youtube.enabled) {
        cleanupHomePageModule();
        cleanupSearchPageModule();
        cleanupWatchPageModule();
        currentPageType = null;
        return;
      }

      // Re-initialize current module with updated settings
      handlePageChange(updatedSettings);
    });

    console.log('[Fockey] Content script initialized successfully');
  } catch (error) {
    console.error('[Fockey] Failed to initialize content script:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
