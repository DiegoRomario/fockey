/**
 * Main Content Script for Fockey Chrome Extension
 * Initializes appropriate modules based on current YouTube page
 */

import { getSettings, watchSettings } from '../shared/storage/settings-manager';
import { initHomePageModule, cleanupHomePageModule } from './youtube/home-page';

/**
 * Initializes the appropriate content script module based on current page
 */
async function initialize(): Promise<void> {
  try {
    // Get current settings
    const settings = await getSettings();

    // Check if YouTube module is enabled
    if (!settings.youtube.enabled) {
      console.log('[Fockey] YouTube module is disabled');
      return;
    }

    // Determine which module to initialize based on URL
    const path = window.location.pathname;

    if (path === '/' || path === '/feed/explore' || path === '/feed/trending') {
      // Initialize home page module
      await initHomePageModule(settings.youtube.homePage);
    } else if (path.startsWith('/results')) {
      // Search page module (to be implemented)
      console.log('[Fockey] Search page detected - module not yet implemented');
    } else if (path.startsWith('/watch')) {
      // Watch page module (to be implemented)
      console.log('[Fockey] Watch page detected - module not yet implemented');
    }

    // Watch for settings changes and update in real-time
    watchSettings((updatedSettings) => {
      if (!updatedSettings.youtube.enabled) {
        cleanupHomePageModule();
        return;
      }

      // Re-initialize with updated settings
      const currentPath = window.location.pathname;
      if (currentPath === '/' || currentPath === '/feed/explore' || currentPath === '/feed/trending') {
        initHomePageModule(updatedSettings.youtube.homePage);
      }
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
