/**
 * YouTube Search Page Content Script Module
 * Implements minimalist mode for YouTube search results page
 * Hides navigation chrome, Shorts, community posts while preserving search functionality
 */

import { SearchPageSettings } from '../../shared/types/settings';
import { injectCSS, removeCSS, waitForElement, debounce } from './utils/dom-helpers';

/**
 * YouTube element selectors for search results page
 * Uses data-* attributes where possible with CSS selector fallbacks
 */
export const SEARCH_PAGE_SELECTORS = {
  // Search results content
  RESULTS_CONTAINER: '#contents.ytd-section-list-renderer',
  ITEM_SECTION: 'ytd-item-section-renderer',
  VIDEO_RENDERER: 'ytd-video-renderer',

  // Content types to filter
  SHORTS: 'ytd-reel-shelf-renderer, ytd-short-renderer, grid-shelf-view-model',
  COMMUNITY_POSTS: 'ytd-backstage-post-thread-renderer, ytd-post-renderer',
  MIXES: 'ytd-radio-renderer',
  SPONSORED_CONTENT: 'ytd-ad-slot-renderer',
  ALGORITHMIC_SUGGESTIONS:
    'ytd-shelf-renderer[modern-typography], ytd-horizontal-card-list-renderer',
  PROMOTIONAL_BANNERS: 'ytd-banner-promo-renderer, ytd-statement-banner-renderer',

  // Filters button (must remain visible)
  FILTER_BUTTON: '#filter-button',
  SEARCH_SUB_MENU: 'ytd-search-sub-menu-renderer',

  // Filter chips (hide by default, except the Filters button)
  FILTER_CHIPS: 'iron-selector#chips',

  // Navigation chrome elements (hide by default)
  YOUTUBE_LOGO: '#logo, ytd-topbar-logo-renderer',
  HAMBURGER_MENU: '#guide-button',
  LEFT_SIDEBAR: '#guide-inner-content, ytd-guide-renderer, ytd-mini-guide-renderer',
  PROFILE_AVATAR: '#avatar-btn',
  NOTIFICATIONS: 'ytd-notification-topbar-button-renderer',
  UPLOAD_BUTTON:
    'ytd-topbar-menu-button-renderer[aria-label*="Create"], ytd-topbar-menu-button-renderer:has(> button[aria-label*="Create"])',
  TOPBAR_BUTTONS: '#buttons ytd-button-renderer',

  // Search bar and header (must remain visible)
  SEARCH_BAR: '#search',
  SEARCH_FORM: '#search-form',
  MASTHEAD: '#masthead',
  MASTHEAD_CONTAINER: '#masthead-container',

  // Skip navigation button (hide and remove from tab order)
  SKIP_NAVIGATION: 'button[aria-label="Skip navigation"]',
} as const;

/**
 * Style tag ID for search page CSS injection
 */
const STYLE_TAG_ID = 'fockey-search-styles';

/**
 * MutationObserver instance for detecting dynamic content
 */
let mutationObserver: MutationObserver | null = null;

/**
 * Generates CSS rules based on search page settings
 * Returns CSS string with display: none rules for hidden elements
 *
 * @param settings - Search page settings object
 * @returns CSS string with rules for hiding/showing elements
 */
function generateSearchPageCSS(settings: SearchPageSettings): string {
  const rules: string[] = [];

  // Conditionally hide or show Shorts based on settings
  if (!settings.showShorts) {
    rules.push(`
      /* Hide Shorts in search results */
      ${SEARCH_PAGE_SELECTORS.SHORTS} {
        display: none !important;
      }
    `);
  } else {
    // Explicitly ensure Shorts are visible when enabled
    rules.push(`
      /* Ensure Shorts are visible in search results */
      ${SEARCH_PAGE_SELECTORS.SHORTS} {
        display: block !important;
      }
    `);
  }

  // Conditionally hide or show Community posts based on settings
  if (!settings.showCommunityPosts) {
    rules.push(`
      /* Hide Community posts in search results */
      ${SEARCH_PAGE_SELECTORS.COMMUNITY_POSTS} {
        display: none !important;
      }
    `);
  } else {
    // Explicitly ensure Community posts are visible when enabled
    rules.push(`
      /* Ensure Community posts are visible in search results */
      ${SEARCH_PAGE_SELECTORS.COMMUNITY_POSTS} {
        display: block !important;
      }
    `);
  }

  // Always hide algorithmic suggestions and promotional banners
  rules.push(`
    /* Hide algorithmic suggestions */
    ${SEARCH_PAGE_SELECTORS.ALGORITHMIC_SUGGESTIONS} {
      display: none !important;
    }

    /* Hide promotional banners */
    ${SEARCH_PAGE_SELECTORS.PROMOTIONAL_BANNERS} {
      display: none !important;
    }

    /* Hide filter chips (All, Shorts, Videos, etc.), preserve Filters button */
    ${SEARCH_PAGE_SELECTORS.FILTER_CHIPS} {
      display: none !important;
    }
  `);

  // Conditionally hide navigation chrome based on settings (default: hidden)
  if (!settings.showLogo) {
    rules.push(`
      ${SEARCH_PAGE_SELECTORS.YOUTUBE_LOGO} {
        display: none !important;
      }
    `);
  }

  if (!settings.showHamburger) {
    rules.push(`
      ${SEARCH_PAGE_SELECTORS.HAMBURGER_MENU} {
        display: none !important;
      }
    `);
  }

  if (!settings.showSidebar) {
    rules.push(`
      ${SEARCH_PAGE_SELECTORS.LEFT_SIDEBAR} {
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
      ${SEARCH_PAGE_SELECTORS.PROFILE_AVATAR} {
        display: none !important;
      }
    `);
  }

  if (!settings.showNotifications) {
    rules.push(`
      ${SEARCH_PAGE_SELECTORS.NOTIFICATIONS} {
        display: none !important;
      }
    `);
  }

  // Conditionally hide content types based on settings
  if (!settings.showMixes) {
    rules.push(`
      ${SEARCH_PAGE_SELECTORS.MIXES} {
        display: none !important;
      }
    `);
  }

  if (!settings.showSponsored) {
    rules.push(`
      ${SEARCH_PAGE_SELECTORS.SPONSORED_CONTENT} {
        display: none !important;
      }
    `);
  }

  // Always hide upload button and other topbar buttons
  rules.push(`
    ${SEARCH_PAGE_SELECTORS.UPLOAD_BUTTON} {
      display: none !important;
    }

    /* Hide topbar buttons (settings, sign in, etc.) */
    ${SEARCH_PAGE_SELECTORS.TOPBAR_BUTTONS} {
      display: none !important;
    }

    /* Hide topbar menu buttons except profile and notifications (conditionally controlled) */
    ytd-topbar-menu-button-renderer:not(:has(${SEARCH_PAGE_SELECTORS.PROFILE_AVATAR})):not(:has(${SEARCH_PAGE_SELECTORS.NOTIFICATIONS})) {
      display: none !important;
    }

    /* Hide skip navigation button and remove from tab order */
    ${SEARCH_PAGE_SELECTORS.SKIP_NAVIGATION} {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
      position: absolute !important;
      left: -9999px !important;
    }
  `);

  // Apply thumbnail blur if enabled
  if (settings.blurThumbnails) {
    rules.push(`
      /* Blur video thumbnails including Shorts */
      ${SEARCH_PAGE_SELECTORS.VIDEO_RENDERER} img,
      ${SEARCH_PAGE_SELECTORS.VIDEO_RENDERER} yt-image,
      ${SEARCH_PAGE_SELECTORS.SHORTS} img,
      ${SEARCH_PAGE_SELECTORS.SHORTS} yt-image {
        filter: blur(10px) !important;
      }
    `);
  }

  // Center search bar when navigation chrome is hidden
  rules.push(`
    /* Center search bar in header */
    ${SEARCH_PAGE_SELECTORS.MASTHEAD_CONTAINER} {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
    }

    ${SEARCH_PAGE_SELECTORS.SEARCH_FORM} {
      margin: 0 auto !important;
    }

    /* Smooth transitions for settings changes */
    ${SEARCH_PAGE_SELECTORS.MASTHEAD} * {
      transition: opacity 0.2s ease, transform 0.2s ease !important;
    }
  `);

  return rules.join('\n');
}

/**
 * Applies search page settings by injecting CSS
 * Main function that controls element visibility based on user preferences
 *
 * @param settings - Search page settings object
 */
export function applySearchPageSettings(settings: SearchPageSettings): void {
  const css = generateSearchPageCSS(settings);
  injectCSS(css, STYLE_TAG_ID);
}

/**
 * Removes all search page CSS modifications
 * Used when leaving search page or disabling extension
 */
export function removeSearchPageStyles(): void {
  removeCSS(STYLE_TAG_ID);
}

/**
 * Sets up MutationObserver to detect dynamic YouTube content loading
 * Re-applies CSS when new elements are added (e.g., infinite scroll)
 *
 * @param settings - Search page settings object
 */
function setupMutationObserver(settings: SearchPageSettings): void {
  // Disconnect existing observer if any
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  // Create debounced re-apply function
  const debouncedReapply = debounce(() => {
    applySearchPageSettings(settings);
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
              node.matches(SEARCH_PAGE_SELECTORS.VIDEO_RENDERER) ||
              node.matches(SEARCH_PAGE_SELECTORS.SHORTS) ||
              node.matches(SEARCH_PAGE_SELECTORS.COMMUNITY_POSTS) ||
              node.matches(SEARCH_PAGE_SELECTORS.MIXES) ||
              node.matches(SEARCH_PAGE_SELECTORS.SPONSORED_CONTENT) ||
              node.matches(SEARCH_PAGE_SELECTORS.FILTER_CHIPS) ||
              node.querySelector(SEARCH_PAGE_SELECTORS.VIDEO_RENDERER) ||
              node.querySelector(SEARCH_PAGE_SELECTORS.SHORTS) ||
              node.querySelector(SEARCH_PAGE_SELECTORS.COMMUNITY_POSTS) ||
              node.querySelector(SEARCH_PAGE_SELECTORS.MIXES) ||
              node.querySelector(SEARCH_PAGE_SELECTORS.SPONSORED_CONTENT) ||
              node.querySelector(SEARCH_PAGE_SELECTORS.FILTER_CHIPS)
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
 * Initializes the search page content script
 * Main entry point for search page module
 * Works with both SPA navigation and direct URL navigation
 *
 * @param settings - Search page settings object
 */
export async function initSearchPageModule(settings: SearchPageSettings): Promise<void> {
  try {
    // Wait for essential elements to load
    await waitForElement(SEARCH_PAGE_SELECTORS.MASTHEAD, 5000);

    // Apply initial settings
    applySearchPageSettings(settings);

    // Set up mutation observer for dynamic content
    setupMutationObserver(settings);

    console.log('[Fockey] Search page module initialized');
  } catch (error) {
    console.error('[Fockey] Failed to initialize search page module:', error);
  }
}

/**
 * Cleans up the search page module
 * Removes all styles, observers, and listeners
 */
export function cleanupSearchPageModule(): void {
  // Remove styles
  removeSearchPageStyles();

  // Disconnect mutation observer
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }

  console.log('[Fockey] Search page module cleaned up');
}
