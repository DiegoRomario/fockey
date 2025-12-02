/**
 * YouTube Home Page Content Script Module
 * Implements minimalist mode for youtube.com home page
 * Hides feed, sidebar, and navigation elements while preserving search bar
 */

import { HomePageSettings } from '../../shared/types/settings';
import { injectCSS, removeCSS, waitForElement, debounce } from './utils/dom-helpers';

/**
 * YouTube element selectors for home page
 * Uses data-* attributes where possible with CSS selector fallbacks
 */
export const HOME_PAGE_SELECTORS = {
  // Main content areas
  FEED_CONTAINER: '#contents.ytd-rich-grid-renderer',
  SHORTS_SHELF: 'ytd-rich-shelf-renderer[is-shorts]',

  // Navigation elements
  LEFT_SIDEBAR: '#guide-inner-content',
  MINI_GUIDE: 'ytd-mini-guide-renderer',
  GUIDE_RENDERER: 'ytd-guide-renderer',
  YOUTUBE_LOGO: '#logo',
  HAMBURGER_MENU: '#guide-button',
  PROFILE_AVATAR: '#avatar-btn',
  NOTIFICATIONS: 'ytd-notification-topbar-button-renderer',
  UPLOAD_BUTTON: 'ytd-topbar-menu-button-renderer[aria-label*="Create"], ytd-topbar-menu-button-renderer:has(> button[aria-label*="Create"])',
  TOPBAR_BUTTONS: '#buttons ytd-button-renderer',

  // Search bar and header
  SEARCH_BAR: '#search',
  SEARCH_FORM: '#search-form',
  MASTHEAD: '#masthead',
  MASTHEAD_CONTAINER: '#masthead-container',

  // Home page filters / chips row (must NOT appear on home)
  // Scoped to home browse container so search page filters remain intact
  HOME_FILTERS_BAR:
    'ytd-browse[page-subtype="home"] ytd-feed-filter-chip-bar-renderer, ytd-browse[page-subtype="home"] #chips',
} as const;

/**
 * Style tag ID for home page CSS injection
 */
const STYLE_TAG_ID = 'fockey-home-styles';

/**
 * MutationObserver instance for detecting dynamic content
 */
let mutationObserver: MutationObserver | null = null;

/**
 * Navigation listener cleanup function
 */
let navigationCleanup: (() => void) | null = null;

/**
 * Current settings state
 */
let currentSettings: HomePageSettings | null = null;

/**
 * Generates CSS rules based on home page settings
 * Returns CSS string with display: none rules for hidden elements
 *
 * @param settings - Home page settings object
 * @returns CSS string with rules for hiding/showing elements
 */
function generateHomePageCSS(settings: HomePageSettings): string {
  const rules: string[] = [];

  // Always hide feed, shorts, and filters (core minimalist mode)
  rules.push(`
    /* Hide feed content */
    ${HOME_PAGE_SELECTORS.FEED_CONTAINER} {
      display: none !important;
    }

    /* Hide Shorts shelf */
    ${HOME_PAGE_SELECTORS.SHORTS_SHELF} {
      display: none !important;
    }

    /* Hide filters/chips bar under the search bar on home page */
    ${HOME_PAGE_SELECTORS.HOME_FILTERS_BAR} {
      display: none !important;
    }
  `);

  // Conditionally hide navigation elements based on settings
  if (!settings.showLogo) {
    rules.push(`
      ${HOME_PAGE_SELECTORS.YOUTUBE_LOGO} {
        display: none !important;
      }
    `);
  }

  if (!settings.showHamburger) {
    rules.push(`
      ${HOME_PAGE_SELECTORS.HAMBURGER_MENU} {
        display: none !important;
      }
    `);
  }

  if (!settings.showSidebar) {
    rules.push(`
      ${HOME_PAGE_SELECTORS.LEFT_SIDEBAR} {
        display: none !important;
      }

      /* Hide mini guide sidebar */
      ${HOME_PAGE_SELECTORS.MINI_GUIDE} {
        display: none !important;
      }

      /* Hide full guide sidebar */
      ${HOME_PAGE_SELECTORS.GUIDE_RENDERER} {
        display: none !important;
      }

      /* Adjust page content to fill space */
      ytd-page-manager {
        margin-left: 0 !important;
      }
    `);
  }

  if (!settings.showProfile) {
    rules.push(`
      ${HOME_PAGE_SELECTORS.PROFILE_AVATAR} {
        display: none !important;
      }
    `);
  }

  if (!settings.showNotifications) {
    rules.push(`
      ${HOME_PAGE_SELECTORS.NOTIFICATIONS} {
        display: none !important;
      }
    `);
  }

  // Always hide upload button and other topbar buttons
  rules.push(`
    ${HOME_PAGE_SELECTORS.UPLOAD_BUTTON} {
      display: none !important;
    }

    /* Hide topbar buttons (settings, sign in, etc.) */
    ${HOME_PAGE_SELECTORS.TOPBAR_BUTTONS} {
      display: none !important;
    }

    /* Also hide topbar menu buttons */
    ytd-topbar-menu-button-renderer {
      display: none !important;
    }
  `);

  // Center search bar when elements are hidden
  rules.push(`
    /* Center search bar in header */
    ${HOME_PAGE_SELECTORS.MASTHEAD_CONTAINER} {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
    }

    ${HOME_PAGE_SELECTORS.SEARCH_FORM} {
      margin: 0 auto !important;
    }

    /* Smooth transitions for settings changes */
    ${HOME_PAGE_SELECTORS.MASTHEAD} * {
      transition: opacity 0.2s ease, transform 0.2s ease !important;
    }
  `);

  return rules.join('\n');
}

/**
 * Applies home page settings by injecting CSS
 * Main function that controls element visibility based on user preferences
 *
 * @param settings - Home page settings object
 */
export function applyHomePageSettings(settings: HomePageSettings): void {
  currentSettings = settings;
  const css = generateHomePageCSS(settings);
  injectCSS(css, STYLE_TAG_ID);
}

/**
 * Removes all home page CSS modifications
 * Used when leaving home page or disabling extension
 */
export function removeHomePageStyles(): void {
  removeCSS(STYLE_TAG_ID);
  currentSettings = null;
}

/**
 * Sets up MutationObserver to detect dynamic YouTube content loading
 * Re-applies CSS when new elements are added (e.g., infinite scroll)
 *
 * @param settings - Home page settings object
 */
function setupMutationObserver(settings: HomePageSettings): void {
  // Disconnect existing observer if any
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  // Create debounced re-apply function
  const debouncedReapply = debounce(() => {
    applyHomePageSettings(settings);
  }, 200);

  // Create observer
  mutationObserver = new MutationObserver((mutations) => {
    // Check if any added nodes match our target selectors
    let shouldReapply = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof Element) {
            // Check if added node is one of our target elements
            if (
              node.matches(HOME_PAGE_SELECTORS.FEED_CONTAINER) ||
              node.matches(HOME_PAGE_SELECTORS.SHORTS_SHELF) ||
              node.matches(HOME_PAGE_SELECTORS.MINI_GUIDE) ||
              node.matches(HOME_PAGE_SELECTORS.GUIDE_RENDERER) ||
              node.querySelector(HOME_PAGE_SELECTORS.FEED_CONTAINER) ||
              node.querySelector(HOME_PAGE_SELECTORS.SHORTS_SHELF) ||
              node.querySelector(HOME_PAGE_SELECTORS.MINI_GUIDE) ||
              node.querySelector(HOME_PAGE_SELECTORS.GUIDE_RENDERER)
            ) {
              shouldReapply = true;
              break;
            }
          }
        }
        if (shouldReapply) break;
      }
    }

    if (shouldReapply) {
      debouncedReapply();
    }
  });

  // Start observing
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Checks if current URL is YouTube home page
 *
 * @returns True if on home page, false otherwise
 */
function isHomePage(): boolean {
  const path = window.location.pathname;
  return path === '/' || path === '/feed/explore' || path === '/feed/trending';
}

/**
 * Sets up YouTube SPA navigation detection
 * Re-applies settings when user navigates back to home page
 *
 * @param settings - Home page settings object
 */
function setupNavigationListener(settings: HomePageSettings): void {
  // Clean up existing listener if any
  if (navigationCleanup) {
    navigationCleanup();
    navigationCleanup = null;
  }

  // Store original pushState and replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  // Handler for navigation events
  const handleNavigation = () => {
    if (isHomePage()) {
      // Re-apply settings on home page
      applyHomePageSettings(settings);
      setupMutationObserver(settings);
    } else {
      // Clean up when leaving home page
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
    }
  };

  // Wrap history.pushState
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    handleNavigation();
  };

  // Wrap history.replaceState
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    handleNavigation();
  };

  // Listen for YouTube's custom navigation event
  window.addEventListener('yt-navigate-finish', handleNavigation);

  // Listen for popstate (back/forward buttons)
  window.addEventListener('popstate', handleNavigation);

  // Cleanup function
  navigationCleanup = () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener('yt-navigate-finish', handleNavigation);
    window.removeEventListener('popstate', handleNavigation);
  };
}

/**
 * Initializes the home page content script
 * Main entry point for home page module
 *
 * @param settings - Home page settings object
 */
export async function initHomePageModule(settings: HomePageSettings): Promise<void> {
  // Only run on home page
  if (!isHomePage()) {
    return;
  }

  try {
    // Wait for essential elements to load
    await waitForElement(HOME_PAGE_SELECTORS.MASTHEAD, 5000);

    // Apply initial settings
    applyHomePageSettings(settings);

    // Set up mutation observer for dynamic content
    setupMutationObserver(settings);

    // Set up navigation detection
    setupNavigationListener(settings);

    console.log('[Fockey] Home page module initialized');
  } catch (error) {
    console.error('[Fockey] Failed to initialize home page module:', error);
  }
}

/**
 * Cleans up the home page module
 * Removes all styles, observers, and listeners
 */
export function cleanupHomePageModule(): void {
  // Remove styles
  removeHomePageStyles();

  // Disconnect mutation observer
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }

  // Clean up navigation listener
  if (navigationCleanup) {
    navigationCleanup();
    navigationCleanup = null;
  }

  console.log('[Fockey] Home page module cleaned up');
}
