/**
 * YouTube Creator Profile Page Content Script Module
 * Implements minimalist mode for YouTube channel/creator profile pages
 * Hides navigation chrome, Shorts/Community tabs, action buttons while preserving channel info
 */

import { CreatorProfilePageSettings, GlobalNavigationSettings } from '../../shared/types/settings';
import { injectCSS, removeCSS, debounce } from './utils/dom-helpers';

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
  UPLOAD_BUTTON:
    'ytd-topbar-menu-button-renderer[aria-label*="Create"], button[aria-label*="Create"]',

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

  // Hide Shorts tab unless explicitly enabled
  if (!pageSettings.showShortsTab) {
    rules.push(`
      /* Hide Shorts tab */
      ${CREATOR_PROFILE_SELECTORS.SHORTS_TAB} {
        display: none !important;
      }
    `);
  }

  // Hide Community/Posts tab unless explicitly enabled
  if (!pageSettings.showCommunityTab) {
    rules.push(`
      /* Hide Community/Posts tab */
      ${CREATOR_PROFILE_SELECTORS.COMMUNITY_TAB} {
        display: none !important;
      }
    `);
  }

  // Hide Community posts in Home tab unless explicitly enabled
  if (!pageSettings.showCommunityInHome) {
    rules.push(`
      /* Hide Community posts and Posts section in Home tab */
      ${CREATOR_PROFILE_SELECTORS.COMMUNITY_POSTS},
      ${CREATOR_PROFILE_SELECTORS.COMMUNITY_POSTS_SECTION} {
        display: none !important;
      }
    `);
  }

  // Hide Shorts in Home tab unless explicitly enabled
  if (!pageSettings.showShortsInHome) {
    rules.push(`
      /* Hide Shorts in Home tab */
      ${CREATOR_PROFILE_SELECTORS.SHORTS_CONTENT} {
        display: none !important;
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
  `);

  // Global Navigation Settings (apply to all pages)
  if (!globalNavigation.showLogo) {
    rules.push(`
      /* Hide YouTube logo */
      ${CREATOR_PROFILE_SELECTORS.YOUTUBE_LOGO} {
        display: none !important;
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
  }

  if (!globalNavigation.showProfile) {
    rules.push(`
      /* Hide profile avatar */
      ${CREATOR_PROFILE_SELECTORS.PROFILE_AVATAR} {
        display: none !important;
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

  return rules.join('\n');
}

/**
 * Filters creator profile content based on settings
 * Applies dynamic hiding to content that can't be controlled via CSS alone
 * Also restores previously hidden content when settings are enabled
 *
 * @param pageSettings - Creator profile page settings
 */
function filterCreatorProfileContent(pageSettings: CreatorProfilePageSettings): void {
  // First, restore all previously filtered content
  const filteredElements = document.querySelectorAll<HTMLElement>('[data-fockey-filtered]');
  filteredElements.forEach((element) => {
    element.style.display = '';
    element.removeAttribute('data-fockey-filtered');
  });

  // Filter Community posts in Home tab if setting is disabled
  if (!pageSettings.showCommunityInHome) {
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

  // Filter Shorts in Home tab if setting is disabled
  if (!pageSettings.showShortsInHome) {
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
 * @param pageSettings - Creator profile page settings
 * @returns MutationObserver instance for cleanup
 */
function setupCreatorProfileObserver(pageSettings: CreatorProfilePageSettings): MutationObserver {
  // Debounced content filtering to prevent excessive calls
  const debouncedFilter = debounce(() => {
    filterCreatorProfileContent(pageSettings);
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
  globalNavigation: GlobalNavigationSettings
): Promise<void> {
  console.log('[Fockey] Initializing Creator Profile page module', {
    pageSettings,
    globalNavigation,
  });

  // Generate and inject CSS
  const css = generateCreatorProfileCSS(pageSettings, globalNavigation);
  injectCSS(css, STYLE_TAG_ID);

  // Apply initial content filtering
  filterCreatorProfileContent(pageSettings);

  // Set up mutation observer for dynamic content
  mutationObserver = setupCreatorProfileObserver(pageSettings);

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
  globalNavigation: GlobalNavigationSettings
): void {
  console.log('[Fockey] Applying updated Creator Profile settings', {
    pageSettings,
    globalNavigation,
  });

  // Regenerate and inject CSS with updated settings
  const css = generateCreatorProfileCSS(pageSettings, globalNavigation);
  injectCSS(css, STYLE_TAG_ID);

  // Re-apply content filtering
  filterCreatorProfileContent(pageSettings);

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

  // Disconnect mutation observer
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }

  // Restore filtered content
  const filteredElements = document.querySelectorAll<HTMLElement>('[data-fockey-filtered]');
  filteredElements.forEach((element) => {
    element.style.display = '';
    element.removeAttribute('data-fockey-filtered');
  });

  console.log('[Fockey] Creator Profile page module cleaned up');
}
