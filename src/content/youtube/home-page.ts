/**
 * YouTube Home Page Content Script Module
 * Implements minimalist mode for youtube.com home page
 * Hides feed, sidebar, and navigation elements while preserving search bar
 */

import { HomePageSettings, GlobalNavigationSettings } from '../../shared/types/settings';
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
  UPLOAD_BUTTON:
    'ytd-topbar-menu-button-renderer[aria-label*="Create"], ytd-topbar-menu-button-renderer:has(> button[aria-label*="Create"])',
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

  // Skip navigation button (hide and remove from tab order)
  SKIP_NAVIGATION: 'button[aria-label="Skip navigation"]',
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
 * Current settings state
 * Reserved for future use when implementing real-time settings updates
 */
// let currentSettings: HomePageSettings | null = null;

/**
 * Generates CSS rules based on home page and global navigation settings
 * Returns CSS string with display: none rules for hidden elements
 *
 * @param pageSettings - Home page specific settings object (empty for now)
 * @param globalNavigation - Global navigation settings object
 * @returns CSS string with rules for hiding/showing elements
 */
function generateHomePageCSS(
  pageSettings: HomePageSettings,
  globalNavigation: GlobalNavigationSettings
): string {
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

  // Conditionally hide global navigation elements based on global settings
  if (!globalNavigation.showLogo) {
    rules.push(`
      ${HOME_PAGE_SELECTORS.YOUTUBE_LOGO} {
        display: none !important;
      }
    `);
  }

  if (!globalNavigation.showSidebar) {
    // Unified: hide both hamburger menu and sidebar with single setting
    rules.push(`
      ${HOME_PAGE_SELECTORS.HAMBURGER_MENU} {
        display: none !important;
      }

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

  if (!globalNavigation.showProfile) {
    rules.push(`
      ${HOME_PAGE_SELECTORS.PROFILE_AVATAR} {
        display: none !important;
      }
    `);
  }

  if (!globalNavigation.showNotifications) {
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

    /* Hide topbar menu buttons except profile and notifications (conditionally controlled) */
    ytd-topbar-menu-button-renderer:not(:has(${HOME_PAGE_SELECTORS.PROFILE_AVATAR})):not(:has(${HOME_PAGE_SELECTORS.NOTIFICATIONS})) {
      display: none !important;
    }

    /* Hide skip navigation button and remove from tab order */
    ${HOME_PAGE_SELECTORS.SKIP_NAVIGATION} {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
      position: absolute !important;
      left: -9999px !important;
    }
  `);

  // Center search bar when elements are hidden
  rules.push(`
    /* Center search bar in header with balanced flex layout */
    ${HOME_PAGE_SELECTORS.MASTHEAD_CONTAINER} {
      display: flex !important;
      align-items: center !important;
    }

    /* Force start and end sections to take equal space for true centering */
    #start.ytd-masthead,
    #end.ytd-masthead {
      flex: 1 1 0 !important;
      min-width: 0 !important;
    }

    /* Center section maintains proper search box width */
    #center.ytd-masthead {
      flex: 0 0 auto !important;
      max-width: 732px !important;
      width: 100% !important;
    }

    /* Align content within start and end sections */
    #start.ytd-masthead {
      display: flex !important;
      justify-content: flex-start !important;
      align-items: center !important;
    }

    #end.ytd-masthead {
      display: flex !important;
      justify-content: flex-end !important;
      align-items: center !important;
    }

    ${HOME_PAGE_SELECTORS.SEARCH_FORM} {
      margin: 0 auto !important;
      width: 100% !important;
      max-width: 640px !important;
    }

    /* Reset asymmetric margins on search box components */
    .ytSearchboxComponentHost {
      margin: 0 !important;
    }

    .ytSearchboxComponentInputBox {
      margin-left: 0 !important;
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
 * @param pageSettings - Home page specific settings object
 * @param globalNavigation - Global navigation settings object
 */
export function applyHomePageSettings(
  pageSettings: HomePageSettings,
  globalNavigation: GlobalNavigationSettings
): void {
  // currentSettings = settings; // Reserved for future real-time updates
  const css = generateHomePageCSS(pageSettings, globalNavigation);
  injectCSS(css, STYLE_TAG_ID);
}

/**
 * Removes all home page CSS modifications
 * Used when leaving home page or disabling extension
 */
export function removeHomePageStyles(): void {
  removeCSS(STYLE_TAG_ID);
  // currentSettings = null; // Reserved for future real-time updates
}

/**
 * Sets up MutationObserver to detect dynamic YouTube content loading
 * Re-applies CSS when new elements are added (e.g., infinite scroll)
 *
 * @param pageSettings - Home page specific settings object
 * @param globalNavigation - Global navigation settings object
 */
function setupMutationObserver(
  pageSettings: HomePageSettings,
  globalNavigation: GlobalNavigationSettings
): void {
  // Disconnect existing observer if any
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  // Create debounced re-apply function
  const debouncedReapply = debounce(() => {
    applyHomePageSettings(pageSettings, globalNavigation);
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
 * Initializes the home page content script
 * Main entry point for home page module
 *
 * @param pageSettings - Home page specific settings object
 * @param globalNavigation - Global navigation settings object
 */
export async function initHomePageModule(
  pageSettings: HomePageSettings,
  globalNavigation: GlobalNavigationSettings
): Promise<void> {
  try {
    // Wait for essential elements to load
    await waitForElement(HOME_PAGE_SELECTORS.MASTHEAD, 5000);

    // Apply initial settings
    applyHomePageSettings(pageSettings, globalNavigation);

    // Set up mutation observer for dynamic content
    setupMutationObserver(pageSettings, globalNavigation);

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

  console.log('[Fockey] Home page module cleaned up');
}
