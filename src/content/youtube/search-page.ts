/**
 * YouTube Search Page Content Script Module
 * Implements minimalist mode for YouTube search results page
 * Hides navigation chrome, Shorts, community posts while preserving search functionality
 */

import {
  SearchPageSettings,
  GlobalNavigationSettings,
  BlockedChannel,
} from '../../shared/types/settings';
import { injectCSS, removeCSS, waitForElement, debounce } from './utils/dom-helpers';
import { HoverPreviewBlocker } from './utils/hover-preview-blocker';
import { ChannelBlocker } from './utils/channel-blocker';

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
  SHORTS:
    'ytd-reel-shelf-renderer, ytd-short-renderer, ytd-rich-shelf-renderer[is-shorts], ytd-grid-video-renderer[is-shorts], ytd-rich-item-renderer[is-shorts], ytd-reel-item-renderer, grid-shelf-view-model, ytm-shorts-lockup-view-model-v2, ytm-shorts-lockup-view-model, ytd-video-renderer:has(a[href*="/shorts/"])',
  COMMUNITY_POSTS: 'ytd-backstage-post-thread-renderer, ytd-post-renderer',
  MIXES: 'ytd-radio-renderer, yt-lockup-view-model:not(:has(ytd-video-renderer))',
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

  // Sidebar items (always hidden)
  SIDEBAR_SHORTS:
    'ytd-guide-renderer a[href="/shorts/"], ytd-mini-guide-renderer a[href="/shorts/"]',
  SIDEBAR_SUBSCRIPTIONS:
    'ytd-guide-renderer a[href="/feed/subscriptions"], ytd-mini-guide-renderer a[href="/feed/subscriptions"]',

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
 * HoverPreviewBlocker instance for managing hover preview behavior
 */
let hoverPreviewBlocker: HoverPreviewBlocker | null = null;

/**
 * ChannelBlocker instance for filtering blocked channels
 */
let channelBlocker: ChannelBlocker | null = null;

/**
 * Current settings state
 * Stores the latest settings to ensure mutation observer uses up-to-date values
 */
let currentPageSettings: SearchPageSettings | null = null;
let currentGlobalNavigation: GlobalNavigationSettings | null = null;
let currentBlockedChannels: BlockedChannel[] = [];

/**
 * Generates CSS rules based on search page and global navigation settings
 * Returns CSS string with display: none rules for hidden elements
 *
 * @param pageSettings - Search page specific settings object
 * @param globalNavigation - Global navigation settings object
 * @returns CSS string with rules for hiding/showing elements
 */
function generateSearchPageCSS(
  pageSettings: SearchPageSettings,
  globalNavigation: GlobalNavigationSettings
): string {
  const rules: string[] = [];

  // Conditionally hide or show Shorts based on settings
  if (!pageSettings.showShorts) {
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
  if (!pageSettings.showCommunityPosts) {
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

    /* ALWAYS hide Shorts and Subscriptions in sidebar (non-configurable) */
    ${SEARCH_PAGE_SELECTORS.SIDEBAR_SHORTS},
    ${SEARCH_PAGE_SELECTORS.SIDEBAR_SUBSCRIPTIONS} {
      display: none !important;
      pointer-events: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
    }
  `);

  // Conditionally hide/show global navigation elements based on global settings
  // Note: Critical CSS hides these by default, so we need explicit show rules when enabled
  if (!globalNavigation.showLogo) {
    rules.push(`
      ${SEARCH_PAGE_SELECTORS.YOUTUBE_LOGO} {
        display: none !important;
      }
    `);
  } else {
    // Explicitly show logo when enabled (overrides critical CSS)
    // Must match ALL selectors from critical.css
    // IMPORTANT: ytd-topbar-logo-renderer needs proper flex layout for children (country code, etc.)
    // #logo must use display: flex (not block) to keep country code inline
    rules.push(`
      ytd-topbar-logo-renderer {
        display: flex !important;
        align-items: center !important;
        flex-direction: row !important;
      }

      ytd-topbar-logo-renderer > * {
        visibility: visible !important;
      }

      #logo {
        display: flex !important;
      }

      #logo-icon {
        display: block !important;
      }

      #country-code {
        display: inline !important;
        align-self: flex-start !important;
      }
    `);
  }

  if (!globalNavigation.showSidebar) {
    // Unified: hide both hamburger menu and sidebar with single setting
    rules.push(`
      ${SEARCH_PAGE_SELECTORS.HAMBURGER_MENU} {
        display: none !important;
      }

      ${SEARCH_PAGE_SELECTORS.LEFT_SIDEBAR} {
        display: none !important;
      }

      /* Adjust page content to fill space */
      ytd-page-manager {
        margin-left: 0 !important;
      }
    `);
  } else {
    // Explicitly show sidebar and hamburger when enabled (overrides critical CSS)
    // Must match ALL selectors from critical.css
    rules.push(`
      #guide-button,
      ytd-guide-button-renderer,
      button#guide-button {
        display: flex !important;
      }

      #guide,
      ytd-guide-renderer,
      #guide-wrapper,
      ytd-mini-guide-renderer,
      #mini-guide {
        display: block !important;
      }
    `);
  }

  if (!globalNavigation.showProfile) {
    rules.push(`
      ${SEARCH_PAGE_SELECTORS.PROFILE_AVATAR} {
        display: none !important;
      }
    `);
  } else {
    // Explicitly show profile avatar when enabled (overrides critical CSS)
    // Must match ALL selectors from critical.css
    rules.push(`
      #avatar-btn,
      ytd-topbar-menu-button-renderer button#avatar-btn,
      ytd-button-renderer#avatar-btn {
        display: flex !important;
      }
      /* Also show the parent container */
      ytd-topbar-menu-button-renderer:has(#avatar-btn) {
        display: flex !important;
      }
    `);
  }

  if (!globalNavigation.showNotifications) {
    rules.push(`
      ${SEARCH_PAGE_SELECTORS.NOTIFICATIONS} {
        display: none !important;
      }
    `);
  } else {
    // Explicitly show notifications when enabled (overrides critical CSS)
    // Must match ALL selectors from critical.css
    rules.push(`
      ytd-notification-topbar-button-renderer,
      #notification-button {
        display: flex !important;
      }
      /* Also show the parent container */
      ytd-topbar-menu-button-renderer:has(ytd-notification-topbar-button-renderer) {
        display: flex !important;
      }
    `);
  }

  // Conditionally hide/show content types based on page settings
  if (!pageSettings.showMixes) {
    rules.push(`
      ${SEARCH_PAGE_SELECTORS.MIXES} {
        display: none !important;
      }
    `);
  } else {
    // Explicitly show mixes when enabled
    rules.push(`
      ${SEARCH_PAGE_SELECTORS.MIXES} {
        display: block !important;
      }
    `);
  }

  if (!pageSettings.showSponsored) {
    rules.push(`
      ${SEARCH_PAGE_SELECTORS.SPONSORED_CONTENT} {
        display: none !important;
      }
    `);
  } else {
    // Explicitly show sponsored content when enabled
    rules.push(`
      ${SEARCH_PAGE_SELECTORS.SPONSORED_CONTENT} {
        display: block !important;
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
  if (pageSettings.blurThumbnails) {
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
    /* Center search bar in header with balanced flex layout */
    ${SEARCH_PAGE_SELECTORS.MASTHEAD_CONTAINER} {
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

    ${SEARCH_PAGE_SELECTORS.SEARCH_FORM} {
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
 * @param pageSettings - Search page specific settings object
 * @param globalNavigation - Global navigation settings object
 * @param blockedChannels - List of blocked YouTube channels
 */
export function applySearchPageSettings(
  pageSettings: SearchPageSettings,
  globalNavigation: GlobalNavigationSettings,
  blockedChannels: BlockedChannel[] = []
): void {
  // Store current settings for mutation observer to use
  currentPageSettings = pageSettings;
  currentGlobalNavigation = globalNavigation;
  currentBlockedChannels = blockedChannels;

  const css = generateSearchPageCSS(pageSettings, globalNavigation);
  injectCSS(css, STYLE_TAG_ID);

  // Update hover preview blocker settings
  hoverPreviewBlocker?.updateSettings(globalNavigation.enableHoverPreviews);

  // Update channel blocker and filter content
  if (channelBlocker) {
    channelBlocker.updateBlockedChannels(blockedChannels);
  }

  // Filter blocked channel content from search results
  const resultsContainer = document.querySelector(SEARCH_PAGE_SELECTORS.RESULTS_CONTAINER);
  if (resultsContainer && channelBlocker) {
    channelBlocker.filterContent(resultsContainer);
  }
}

/**
 * Removes all search page CSS modifications
 * Used when leaving search page or disabling extension
 */
export function removeSearchPageStyles(): void {
  removeCSS(STYLE_TAG_ID);
  currentPageSettings = null;
  currentGlobalNavigation = null;
  currentBlockedChannels = [];
}

/**
 * Sets up MutationObserver to detect dynamic YouTube content loading
 * Re-applies CSS when new elements are added (e.g., infinite scroll)
 *
 * Note: This function is called once during initialization and uses the current
 * settings stored in module-level variables to ensure settings updates are reflected
 */
function setupMutationObserver(): void {
  // Disconnect existing observer if any
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  // Create debounced re-apply function that uses current settings
  const debouncedReapply = debounce(() => {
    // Use current settings from module-level variables, not captured parameters
    if (currentPageSettings && currentGlobalNavigation) {
      applySearchPageSettings(currentPageSettings, currentGlobalNavigation, currentBlockedChannels);
    }
  }, 200);

  // Create debounced filter function for blocked channels
  const debouncedFilter = debounce(() => {
    if (channelBlocker) {
      const resultsContainer = document.querySelector(SEARCH_PAGE_SELECTORS.RESULTS_CONTAINER);
      if (resultsContainer) {
        channelBlocker.filterContent(resultsContainer);
      }
    }
  }, 100);

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
      // Also filter blocked channel content when new content is added
      debouncedFilter();
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
 * @param pageSettings - Search page specific settings object
 * @param globalNavigation - Global navigation settings object
 * @param blockedChannels - List of blocked YouTube channels
 */
export async function initSearchPageModule(
  pageSettings: SearchPageSettings,
  globalNavigation: GlobalNavigationSettings,
  blockedChannels: BlockedChannel[] = []
): Promise<void> {
  try {
    // Wait for essential elements to load
    await waitForElement(SEARCH_PAGE_SELECTORS.MASTHEAD, 5000);

    // Initialize channel blocker
    channelBlocker = new ChannelBlocker(blockedChannels);

    // Apply initial settings (this also stores them for the mutation observer)
    applySearchPageSettings(pageSettings, globalNavigation, blockedChannels);

    // Set up mutation observer for dynamic content (uses stored settings)
    setupMutationObserver();

    // Initialize hover preview blocker
    hoverPreviewBlocker = new HoverPreviewBlocker(globalNavigation.enableHoverPreviews);
    hoverPreviewBlocker.init();

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

  // Cleanup hover preview blocker
  if (hoverPreviewBlocker) {
    hoverPreviewBlocker.cleanup();
    hoverPreviewBlocker = null;
  }

  // Cleanup channel blocker
  channelBlocker = null;

  console.log('[Fockey] Search page module cleaned up');
}
