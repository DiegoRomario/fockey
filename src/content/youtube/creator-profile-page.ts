/**
 * YouTube Creator Profile Page Content Script Module
 * Implements minimalist mode for YouTube channel/creator profile pages
 * Hides navigation chrome, Shorts/Community tabs, action buttons while preserving channel info
 */

import {
  CreatorProfilePageSettings,
  GlobalNavigationSettings,
  SearchPageSettings,
} from '../../shared/types/settings';
import { injectCSS, removeCSS, debounce } from './utils/dom-helpers';
import { HoverPreviewBlocker } from './utils/hover-preview-blocker';
import { SearchSuggestionsBlocker } from './utils/search-suggestions-blocker';

/**
 * YouTube element selectors for creator profile pages
 * Targets channel header, tabs, content, and navigation elements
 */
export const CREATOR_PROFILE_SELECTORS = {
  // Channel header elements (keep visible)
  CHANNEL_HEADER: 'ytd-c4-tabbed-header-renderer, ytd-page-header-renderer',
  CHANNEL_BANNER: '#channel-header-container',
  CHANNEL_AVATAR: 'img#avatar, yt-img-shadow#avatar',
  CHANNEL_NAME: '#channel-name, #text-container yt-formatted-string',
  CHANNEL_METADATA: '#subscriber-count, #videos-count',

  // Content tabs
  TAB_CONTAINER: 'tp-yt-paper-tabs, #tabsContainer',
  SHORTS_TAB:
    'tp-yt-paper-tab[tab-title="Shorts"], yt-tab-shape[tab-title="Shorts"], a[title="Shorts"]',
  COMMUNITY_TAB:
    'tp-yt-paper-tab[tab-title="Community"], tp-yt-paper-tab[tab-title="Posts"], yt-tab-shape[tab-title="Community"], yt-tab-shape[tab-title="Posts"], a[title="Community"], a[title="Posts"]',

  // Content within tabs (for filtering)
  SHORTS_CONTENT:
    'ytd-reel-shelf-renderer, ytd-short-renderer, ytd-grid-video-renderer[is-shorts], ytd-rich-item-renderer[is-shorts], ytd-reel-item-renderer',
  COMMUNITY_POSTS: 'ytd-backstage-post-thread-renderer, ytd-post-renderer',
  COMMUNITY_POSTS_SECTION:
    'ytd-item-section-renderer:has(ytd-backstage-post-thread-renderer), ytd-item-section-renderer:has(ytd-post-renderer)',
  SHORTS_IN_PLAYLISTS: 'ytd-reel-shelf-renderer',

  // Promotional and distraction elements
  PROMOTIONAL_BANNERS: 'ytd-banner-promo-renderer, ytd-statement-banner-renderer',
  FEATURED_CONTENT: 'ytd-shelf-renderer[modern-typography]',

  // Navigation chrome elements (controlled by global navigation settings)
  YOUTUBE_LOGO: '#logo, ytd-topbar-logo-renderer',
  HAMBURGER_MENU: '#guide-button, button[aria-label*="Guide"]',
  LEFT_SIDEBAR: '#guide-inner-content, ytd-guide-renderer, ytd-mini-guide-renderer, #guide',
  PROFILE_AVATAR: '#avatar-btn, button#avatar-btn',
  NOTIFICATIONS_BELL: 'ytd-notification-topbar-button-renderer',
  // Upload/Create button - Icon-based selector (video camera icon is universal)
  UPLOAD_BUTTON:
    'ytd-topbar-menu-button-renderer:has(yt-icon[icon="video_call"]), ytd-topbar-menu-button-renderer:has(button > yt-icon > svg > path[d*="M17 10.5V7c0-.55-.45-1-1-1H4c-.55"])',

  // Sidebar items (always hidden)
  SIDEBAR_SHORTS:
    'ytd-guide-renderer a[href="/shorts/"], ytd-mini-guide-renderer a[href="/shorts/"]',
  SIDEBAR_SUBSCRIPTIONS:
    'ytd-guide-renderer a[href="/feed/subscriptions"], ytd-mini-guide-renderer a[href="/feed/subscriptions"]',

  // Skip navigation button (hide and remove from tab order)
  SKIP_NAVIGATION: 'button[aria-label="Skip navigation"]',
} as const;

/**
 * Style tag ID for creator profile page CSS injection
 */
const STYLE_TAG_ID = 'fockey-creator-profile-styles';

/**
 * MutationObserver instance for detecting dynamic content
 */
let mutationObserver: MutationObserver | null = null;

/**
 * HoverPreviewBlocker instance for managing hover preview behavior
 */
let hoverPreviewBlocker: HoverPreviewBlocker | null = null;

/**
 * SearchSuggestionsBlocker instance for managing search suggestions visibility
 */
let searchSuggestionsBlocker: SearchSuggestionsBlocker | null = null;

/**
 * Current settings state
 * Stores the latest settings to ensure mutation observer uses up-to-date values
 */
let currentGlobalNavigation: GlobalNavigationSettings | null = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let currentSearchPageSettings: SearchPageSettings | null = null;

/**
 * Generates CSS rules based on creator profile page and global navigation settings
 * Returns CSS string with display: none rules for hidden elements
 *
 * @param pageSettings - Creator profile page specific settings object
 * @param globalNavigation - Global navigation settings object
 * @returns CSS string with rules for hiding/showing elements
 */
function generateCreatorProfileCSS(
  pageSettings: CreatorProfilePageSettings,
  globalNavigation: GlobalNavigationSettings
): string {
  const rules: string[] = [];

  // Hide/show Shorts tab based on global settings
  if (!globalNavigation.enableShorts) {
    rules.push(`
      /* Hide Shorts tab */
      ${CREATOR_PROFILE_SELECTORS.SHORTS_TAB} {
        display: none !important;
      }
    `);
  } else {
    // Explicitly show Shorts tab when enabled (overrides critical CSS)
    // Must match ALL selectors from critical.css
    rules.push(`
      ytd-browse[page-subtype='channels'] tp-yt-paper-tab[title='Shorts'],
      ytd-browse[page-subtype='channels'] ytd-tab-renderer[tab-title='Shorts'],
      tp-yt-paper-tab[title='Shorts'],
      ytd-tab-renderer[tab-title='Shorts'] {
        display: flex !important;
      }
    `);
  }

  // Hide/show Community/Posts tab based on global settings
  if (!globalNavigation.enablePosts) {
    rules.push(`
      /* Hide Community/Posts tab */
      ${CREATOR_PROFILE_SELECTORS.COMMUNITY_TAB} {
        display: none !important;
      }
    `);
  } else {
    // Explicitly show Community/Posts tab when enabled (overrides critical CSS)
    // Must match ALL selectors from critical.css
    rules.push(`
      ytd-browse[page-subtype='channels'] tp-yt-paper-tab[title='Community'],
      ytd-browse[page-subtype='channels'] tp-yt-paper-tab[title='Posts'],
      ytd-browse[page-subtype='channels'] ytd-tab-renderer[tab-title='Community'],
      ytd-browse[page-subtype='channels'] ytd-tab-renderer[tab-title='Posts'],
      tp-yt-paper-tab[title='Community'],
      tp-yt-paper-tab[title='Posts'],
      ytd-tab-renderer[tab-title='Community'],
      ytd-tab-renderer[tab-title='Posts'] {
        display: flex !important;
      }
    `);
  }

  // Hide/show Community posts based on global settings
  if (!globalNavigation.enablePosts) {
    rules.push(`
      /* Hide Community posts */
      ${CREATOR_PROFILE_SELECTORS.COMMUNITY_POSTS},
      ${CREATOR_PROFILE_SELECTORS.COMMUNITY_POSTS_SECTION} {
        display: none !important;
      }
    `);
  } else {
    // Explicitly show Community posts when enabled (overrides critical CSS)
    // Must match ALL selectors from critical.css
    // Use 'revert' to restore YouTube's native display value (preserves grid/flex layout)
    rules.push(`
      ytd-browse[page-subtype='channels'] ytd-tab-renderer[page-type='ProfileChannelTab'] ytd-post-renderer,
      ytd-browse[page-subtype='channels'] ytd-tab-renderer[page-type='ProfileChannelTab'] ytd-backstage-post-renderer,
      ytd-browse[page-subtype='channels'] ytd-rich-item-renderer:has(ytd-post-renderer),
      ytd-browse[page-subtype='channels'] ytd-rich-item-renderer:has(ytd-backstage-post-renderer) {
        display: revert !important;
      }
    `);
  }

  // Hide/show Shorts content based on global settings
  if (!globalNavigation.enableShorts) {
    rules.push(`
      /* Hide Shorts content */
      ${CREATOR_PROFILE_SELECTORS.SHORTS_CONTENT} {
        display: none !important;
      }
    `);
  } else {
    // Explicitly show Shorts when enabled (overrides critical CSS)
    // Must match ALL selectors from critical.css
    rules.push(`
      ytd-browse[page-subtype='channels'] ytd-reel-shelf-renderer,
      ytd-browse[page-subtype='channels'] ytd-rich-shelf-renderer[is-shorts] {
        display: block !important;
      }
    `);
  }

  // Always hide promotional banners and featured content
  rules.push(`
    /* Always hide promotional elements */
    ${CREATOR_PROFILE_SELECTORS.PROMOTIONAL_BANNERS},
    ${CREATOR_PROFILE_SELECTORS.FEATURED_CONTENT} {
      display: none !important;
    }

    /* ALWAYS hide Shorts and Subscriptions in sidebar (non-configurable) */
    ${CREATOR_PROFILE_SELECTORS.SIDEBAR_SHORTS},
    ${CREATOR_PROFILE_SELECTORS.SIDEBAR_SUBSCRIPTIONS} {
      display: none !important;
      pointer-events: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
    }
  `);

  // Global Navigation Settings (apply to all pages)
  // Note: Critical CSS hides these by default, so we need explicit show rules when enabled
  if (!globalNavigation.showLogo) {
    rules.push(`
      /* Hide YouTube logo */
      ${CREATOR_PROFILE_SELECTORS.YOUTUBE_LOGO} {
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
    rules.push(`
      /* Hide sidebar and hamburger menu (unified component) */
      ${CREATOR_PROFILE_SELECTORS.HAMBURGER_MENU},
      ${CREATOR_PROFILE_SELECTORS.LEFT_SIDEBAR} {
        display: none !important;
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
      /* Hide profile avatar */
      ${CREATOR_PROFILE_SELECTORS.PROFILE_AVATAR} {
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
      /* Hide notifications bell */
      ${CREATOR_PROFILE_SELECTORS.NOTIFICATIONS_BELL} {
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

  // Always hide upload button (not part of configurable settings)
  rules.push(`
    /* Always hide upload/create button */
    ${CREATOR_PROFILE_SELECTORS.UPLOAD_BUTTON} {
      display: none !important;
    }
  `);

  // Always hide skip navigation button
  rules.push(`
    /* Always hide skip navigation button */
    ${CREATOR_PROFILE_SELECTORS.SKIP_NAVIGATION} {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  `);

  // Search box centering
  rules.push(`
    /* Center search bar in header with balanced flex layout */
    #masthead-container.ytd-masthead {
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

    /* Search form sizing */
    #search-form {
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
  `);

  // Apply thumbnail blur if enabled globally
  if (globalNavigation.blurThumbnails) {
    rules.push(`
      /* Blur video thumbnails on creator profile pages */
      /* Target thumbnail containers specifically, exclude channel avatars */
      ytd-browse[page-subtype='channels'] ytd-rich-item-renderer ytd-thumbnail img,
      ytd-browse[page-subtype='channels'] ytd-rich-item-renderer ytd-thumbnail yt-image,
      ytd-browse[page-subtype='channels'] ytd-rich-item-renderer #thumbnail img,
      ytd-browse[page-subtype='channels'] ytd-rich-item-renderer a#thumbnail img,
      ytd-browse[page-subtype='channels'] ytd-grid-video-renderer ytd-thumbnail img,
      ytd-browse[page-subtype='channels'] ytd-grid-video-renderer ytd-thumbnail yt-image,
      ytd-browse[page-subtype='channels'] ytd-grid-video-renderer #thumbnail img,
      ytd-browse[page-subtype='channels'] ytd-grid-video-renderer a#thumbnail img,
      ytd-browse[page-subtype='channels'] ytd-video-renderer ytd-thumbnail img,
      ytd-browse[page-subtype='channels'] ytd-video-renderer ytd-thumbnail yt-image,
      ytd-browse[page-subtype='channels'] ytd-video-renderer yt-image img,
      ytd-browse[page-subtype='channels'] ytd-video-renderer #thumbnail img,
      ytd-browse[page-subtype='channels'] ytd-video-renderer a#thumbnail img,
      ytd-browse[page-subtype='channels'] ytd-video-renderer img.ytCoreImageHost,
      ytd-browse[page-subtype='channels'] ytd-playlist-renderer ytd-thumbnail img,
      ytd-browse[page-subtype='channels'] ytd-playlist-renderer ytd-thumbnail yt-image,
      ytd-browse[page-subtype='channels'] ytd-playlist-renderer #thumbnail img,
      ytd-browse[page-subtype='channels'] ytd-playlist-renderer a#thumbnail img,
      ytd-browse[page-subtype='channels'] ytd-grid-playlist-renderer ytd-thumbnail img,
      ytd-browse[page-subtype='channels'] ytd-grid-playlist-renderer ytd-thumbnail yt-image,
      ytd-browse[page-subtype='channels'] ytd-grid-playlist-renderer #thumbnail img,
      ytd-browse[page-subtype='channels'] ytd-grid-playlist-renderer a#thumbnail img,
      ytd-browse[page-subtype='channels'] yt-collection-thumbnail-view-model img,
      ytd-browse[page-subtype='channels'] yt-collection-thumbnail-view-model img.ytCoreImageHost,
      ytd-browse[page-subtype='channels'] yt-thumbnail-view-model img,
      ytd-browse[page-subtype='channels'] yt-thumbnail-view-model img.ytCoreImageHost,
      ytd-browse[page-subtype='channels'] yt-lockup-view-model img.ytCoreImageHost {
        filter: blur(10px) !important;
      }

      /* Explicitly exclude channel avatars from blur */
      ytd-browse[page-subtype='channels'] #avatar img,
      ytd-browse[page-subtype='channels'] yt-img-shadow#avatar img,
      ytd-browse[page-subtype='channels'] ytd-channel-name img {
        filter: none !important;
      }
    `);
  }

  return rules.join('\n');
}

/**
 * Filters creator profile content based on global settings
 * Applies dynamic hiding to content that can't be controlled via CSS alone
 * Also restores previously hidden content when settings are enabled
 *
 * @param globalNavigation - Global navigation settings
 */
function filterCreatorProfileContent(globalNavigation: GlobalNavigationSettings): void {
  // First, restore all previously filtered content
  const filteredElements = document.querySelectorAll<HTMLElement>('[data-fockey-filtered]');
  filteredElements.forEach((element) => {
    element.style.display = '';
    element.removeAttribute('data-fockey-filtered');
  });

  // Filter Community posts if Posts are disabled globally
  if (!globalNavigation.enablePosts) {
    // Hide individual community posts
    const communityPosts = document.querySelectorAll<HTMLElement>(
      CREATOR_PROFILE_SELECTORS.COMMUNITY_POSTS
    );
    communityPosts.forEach((element) => {
      element.style.display = 'none';
      element.setAttribute('data-fockey-filtered', 'true');
    });

    // Hide the entire Posts section container (including the "Posts" header)
    const postsSections = document.querySelectorAll<HTMLElement>(
      CREATOR_PROFILE_SELECTORS.COMMUNITY_POSTS_SECTION
    );
    postsSections.forEach((element) => {
      element.style.display = 'none';
      element.setAttribute('data-fockey-filtered', 'true');
    });
  }

  // Filter Shorts if disabled globally
  if (!globalNavigation.enableShorts) {
    const shortsElements = document.querySelectorAll<HTMLElement>(
      CREATOR_PROFILE_SELECTORS.SHORTS_CONTENT
    );
    shortsElements.forEach((element) => {
      element.style.display = 'none';
      element.setAttribute('data-fockey-filtered', 'true');
    });
  }
}

/**
 * Sets up MutationObserver to detect dynamically loaded content
 * Monitors for new content added to the page and applies filtering
 *
 * Note: This function is called once during initialization and uses the current
 * settings stored in module-level variables to ensure settings updates are reflected
 *
 * @returns MutationObserver instance for cleanup
 */
function setupCreatorProfileObserver(): MutationObserver {
  // Debounced content filtering to prevent excessive calls
  const debouncedFilter = debounce(() => {
    // Use current settings from module-level variables, not captured parameters
    if (currentGlobalNavigation) {
      filterCreatorProfileContent(currentGlobalNavigation);
    }
  }, 100);

  const observer = new MutationObserver((mutations) => {
    // Check if any mutations added new nodes
    const hasNewNodes = mutations.some(
      (mutation) => mutation.addedNodes.length > 0 || mutation.type === 'childList'
    );

    if (hasNewNodes) {
      debouncedFilter();
    }
  });

  // Observe the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}

/**
 * Initializes the creator profile page module
 * Injects CSS, applies content filtering, and sets up observer
 *
 * @param pageSettings - Creator profile page settings
 * @param globalNavigation - Global navigation settings
 */
export async function initCreatorProfileModule(
  pageSettings: CreatorProfilePageSettings,
  globalNavigation: GlobalNavigationSettings,
  searchPageSettings: SearchPageSettings
): Promise<void> {
  console.log('[Fockey] Initializing Creator Profile page module', {
    pageSettings,
    globalNavigation,
    searchPageSettings,
  });

  // Store current settings for mutation observer to use
  currentGlobalNavigation = globalNavigation;
  currentSearchPageSettings = searchPageSettings;

  // Generate and inject CSS
  const css = generateCreatorProfileCSS(pageSettings, globalNavigation);
  injectCSS(css, STYLE_TAG_ID);

  // Apply initial content filtering
  filterCreatorProfileContent(globalNavigation);

  // Set up mutation observer for dynamic content (uses stored settings)
  mutationObserver = setupCreatorProfileObserver();

  // Initialize hover preview blocker
  hoverPreviewBlocker = new HoverPreviewBlocker(globalNavigation.enableHoverPreviews);
  hoverPreviewBlocker.init();

  // Initialize search suggestions blocker
  searchSuggestionsBlocker = new SearchSuggestionsBlocker(
    searchPageSettings.enableSearchSuggestions
  );
  searchSuggestionsBlocker.init();

  console.log('[Fockey] Creator Profile page module initialized');
}

/**
 * Applies updated settings to the creator profile page without full re-initialization
 * Enables hot-reload when settings change
 *
 * @param pageSettings - Updated creator profile page settings
 * @param globalNavigation - Updated global navigation settings
 */
export function applyCreatorProfileSettings(
  pageSettings: CreatorProfilePageSettings,
  globalNavigation: GlobalNavigationSettings,
  searchPageSettings: SearchPageSettings
): void {
  console.log('[Fockey] Applying updated Creator Profile settings', {
    pageSettings,
    globalNavigation,
    searchPageSettings,
  });

  // Store current settings for mutation observer to use
  currentGlobalNavigation = globalNavigation;
  currentSearchPageSettings = searchPageSettings;

  // Regenerate and inject CSS with updated settings
  const css = generateCreatorProfileCSS(pageSettings, globalNavigation);
  injectCSS(css, STYLE_TAG_ID);

  // Re-apply content filtering
  filterCreatorProfileContent(globalNavigation);

  // Update hover preview blocker settings
  hoverPreviewBlocker?.updateSettings(globalNavigation.enableHoverPreviews);

  // Update search suggestions blocker settings
  searchSuggestionsBlocker?.updateSettings(searchPageSettings.enableSearchSuggestions);

  console.log('[Fockey] Creator Profile settings applied');
}

/**
 * Cleans up the creator profile page module
 * Removes injected styles, disconnects observers, and restores filtered content
 */
export function cleanupCreatorProfileModule(): void {
  console.log('[Fockey] Cleaning up Creator Profile page module');

  // Remove injected CSS
  removeCSS(STYLE_TAG_ID);

  // Clear current settings
  currentGlobalNavigation = null;
  currentSearchPageSettings = null;

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

  // Cleanup search suggestions blocker
  if (searchSuggestionsBlocker) {
    searchSuggestionsBlocker.cleanup();
    searchSuggestionsBlocker = null;
  }

  // Restore filtered content
  const filteredElements = document.querySelectorAll<HTMLElement>('[data-fockey-filtered]');
  filteredElements.forEach((element) => {
    element.style.display = '';
    element.removeAttribute('data-fockey-filtered');
  });

  console.log('[Fockey] Creator Profile page module cleaned up');
}
