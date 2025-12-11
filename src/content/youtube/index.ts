/**
 * YouTube Content Script Orchestrator
 * Main entry point for YouTube page manipulation
 * Detects page type and loads appropriate sub-modules with lazy loading
 */

import { getSettings, watchSettings } from '../../shared/storage/settings-manager';
import type { ExtensionSettings } from '../../shared/types/settings';
import {
  PageType,
  type ModuleInterface,
  type ModuleSettings,
  type OrchestratorState,
} from './types';

/**
 * Orchestrator state
 * Tracks current module, page type, settings, and service worker connection
 */
const state: OrchestratorState = {
  currentModule: null,
  currentPageType: null,
  currentSettings: null,
  serviceWorkerPort: null,
};

/**
 * Flag to prevent duplicate navigation handling
 */
let isHandlingNavigation = false;

/**
 * Determines the current page type based on URL pathname
 * Analyzes window.location to identify YouTube page type
 *
 * @returns The detected page type enum value
 */
function detectYouTubePage(): PageType {
  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);

  // Home page detection
  if (
    path === '/' ||
    path === '/feed/explore' ||
    path === '/feed/trending' ||
    path === '/feed/subscriptions'
  ) {
    return PageType.HOME;
  }

  // Search results page detection
  if (path.startsWith('/results')) {
    return PageType.SEARCH;
  }

  // Watch page detection
  if (path.startsWith('/watch') || searchParams.has('v')) {
    return PageType.WATCH;
  }

  // All other pages (channels, playlists, shorts, etc.)
  return PageType.OTHER;
}

/**
 * Lazy loads the appropriate module based on page type
 * Uses dynamic imports for code splitting
 *
 * @param pageType - The type of page to load a module for
 * @returns Promise resolving to the module instance
 * @throws Error if module fails to load
 */
async function loadModule(pageType: PageType): Promise<ModuleInterface | null> {
  try {
    switch (pageType) {
      case PageType.HOME: {
        const { homePageModule } = await import('./modules/home-page-module');
        return homePageModule;
      }
      case PageType.SEARCH: {
        const { searchPageModule } = await import('./modules/search-page-module');
        return searchPageModule;
      }
      case PageType.WATCH: {
        const { watchPageModule } = await import('./modules/watch-page-module');
        return watchPageModule;
      }
      case PageType.OTHER:
        // No module for other page types
        return null;
      default:
        console.warn(`[Fockey] Unknown page type: ${pageType}`);
        return null;
    }
  } catch (error) {
    console.error(`[Fockey] Failed to load module for ${pageType}:`, error);
    throw error;
  }
}

/**
 * Gets module settings from extension settings
 * Combines page-specific settings with global navigation settings
 *
 * @param pageType - The page type to get settings for
 * @param settings - Full extension settings object
 * @returns Module settings (page-specific + global navigation) or null if page type not supported
 */
function getPageSettings(pageType: PageType, settings: ExtensionSettings): ModuleSettings | null {
  let pageSettings;

  switch (pageType) {
    case PageType.HOME:
      pageSettings = settings.youtube.homePage;
      break;
    case PageType.SEARCH:
      pageSettings = settings.youtube.searchPage;
      break;
    case PageType.WATCH:
      pageSettings = settings.youtube.watchPage;
      break;
    default:
      return null;
  }

  // Combine page-specific settings with global navigation settings
  return {
    pageSettings,
    globalNavigation: settings.youtube.globalNavigation,
  };
}

/**
 * Handles page changes and module switching
 * Cleans up previous module and initializes new one
 *
 * @param settings - Current extension settings
 */
async function handlePageChange(settings: ExtensionSettings): Promise<void> {
  // Prevent duplicate handling
  if (isHandlingNavigation) {
    return;
  }

  try {
    isHandlingNavigation = true;

    const newPageType = detectYouTubePage();

    // Skip if page type hasn't changed
    if (newPageType === state.currentPageType) {
      return;
    }

    console.log(
      `[Fockey] Page change detected: ${state.currentPageType || 'none'} → ${newPageType}`
    );

    // Cleanup previous module
    if (state.currentModule) {
      try {
        state.currentModule.destroy();
      } catch (error) {
        console.error('[Fockey] Error during module cleanup:', error);
      }
      state.currentModule = null;
    }

    // Update current page type
    state.currentPageType = newPageType;

    // Check if YouTube module is enabled
    if (!settings.youtube.enabled) {
      console.log('[Fockey] YouTube module is disabled');
      return;
    }

    // Load and initialize new module
    if (newPageType !== PageType.OTHER) {
      try {
        const module = await loadModule(newPageType);
        if (module) {
          const pageSettings = getPageSettings(newPageType, settings);
          if (pageSettings) {
            await module.init(pageSettings);
            state.currentModule = module;
          }
        }
      } catch (error) {
        console.error(`[Fockey] Failed to initialize ${newPageType} module:`, error);
        // Don't break YouTube functionality on error
        state.currentModule = null;
      }
    }
  } finally {
    isHandlingNavigation = false;
  }
}

/**
 * Sets up YouTube SPA navigation listeners
 * Monitors URL changes without full page reload
 *
 * @param settings - Current extension settings
 */
function setupNavigationListeners(settings: ExtensionSettings): void {
  console.log('[Fockey] Setting up YouTube navigation listeners', settings);
  // YouTube's custom SPA navigation event (primary detection method)
  window.addEventListener('yt-navigate-finish', () => {
    if (state.currentSettings) {
      handlePageChange(state.currentSettings);
    }
  });

  // History API monitoring (fallback detection)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    if (state.currentSettings) {
      // Small delay to ensure DOM is updated
      setTimeout(() => handlePageChange(state.currentSettings!), 50);
    }
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    if (state.currentSettings) {
      setTimeout(() => handlePageChange(state.currentSettings!), 50);
    }
  };

  // Browser back/forward buttons
  window.addEventListener('popstate', () => {
    if (state.currentSettings) {
      handlePageChange(state.currentSettings);
    }
  });
}

/**
 * Sets up service worker connection with reconnection logic
 * Enables communication with background script and handles restarts
 */
function setupServiceWorkerConnection(): void {
  try {
    // Establish connection to service worker
    state.serviceWorkerPort = chrome.runtime.connect({ name: 'youtube-content-script' });

    // Handle disconnection
    state.serviceWorkerPort.onDisconnect.addListener(() => {
      state.serviceWorkerPort = null;

      // Attempt reconnection with exponential backoff
      let reconnectAttempts = 0;
      const maxAttempts = 5;

      const attemptReconnection = () => {
        if (reconnectAttempts >= maxAttempts) {
          console.error('[Fockey] Service worker reconnection failed after max attempts');
          return;
        }

        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000);

        setTimeout(() => {
          try {
            setupServiceWorkerConnection();
            // Only log if reconnection took more than 1 attempt (indicates an issue)
            if (reconnectAttempts > 1) {
              console.log(
                `[Fockey] Service worker reconnected after ${reconnectAttempts} attempts`
              );
            }
          } catch (error) {
            console.error('[Fockey] Service worker reconnection failed:', error);
            attemptReconnection();
          }
        }, delay);
      };

      attemptReconnection();
    });

    // Listen for messages from service worker
    state.serviceWorkerPort.onMessage.addListener((message) => {
      if (message.type === 'PING') {
        state.serviceWorkerPort?.postMessage({ type: 'PONG' });
      }
    });
  } catch (error) {
    console.error('[Fockey] Failed to connect to service worker:', error);
  }
}

/**
 * Initializes the orchestrator
 * Main entry point called on DOM ready
 */
async function initialize(): Promise<void> {
  try {
    console.log('[Fockey] Initializing YouTube orchestrator...');

    // Load initial settings
    const settings = await getSettings();
    state.currentSettings = settings;

    // Initialize current page
    await handlePageChange(settings);

    // Set up navigation listeners
    setupNavigationListeners(settings);

    // Set up service worker connection
    setupServiceWorkerConnection();

    // Watch for settings changes (hot reload)
    watchSettings((updatedSettings) => {
      state.currentSettings = updatedSettings;

      // If YouTube module is disabled, cleanup and exit
      if (!updatedSettings.youtube.enabled) {
        if (state.currentModule) {
          state.currentModule.destroy();
          state.currentModule = null;
        }
        state.currentPageType = null;
        return;
      }

      // If module was previously disabled and is now enabled, re-initialize
      if (!state.currentModule && updatedSettings.youtube.enabled) {
        console.log('[Fockey] YouTube module re-enabled, re-initializing...');
        handlePageChange(updatedSettings);
        return;
      }

      // Update current module with new settings
      if (state.currentModule && state.currentPageType) {
        const pageSettings = getPageSettings(state.currentPageType, updatedSettings);
        if (pageSettings) {
          try {
            state.currentModule.updateSettings(pageSettings);
          } catch (error) {
            console.error('[Fockey] Error updating module settings:', error);
            // Fall back to full re-initialization
            handlePageChange(updatedSettings);
          }
        }
      }
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (state.currentModule) {
        state.currentModule.destroy();
      }
      if (state.serviceWorkerPort) {
        state.serviceWorkerPort.disconnect();
      }
    });

    console.log('[Fockey] YouTube orchestrator initialized successfully');
  } catch (error) {
    console.error('[Fockey] Failed to initialize YouTube orchestrator:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOM already loaded
  initialize();
}

// Global error boundary
window.addEventListener('error', (event) => {
  if (event.error && event.error.message && event.error.message.includes('Fockey')) {
    console.error('[Fockey] Uncaught error in module:', event.error);
    event.preventDefault(); // Prevent breaking YouTube
  }
});
