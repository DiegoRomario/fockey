/**
 * YouTube Watch Page Content Script Module
 * Implements minimalist mode for YouTube video watch pages
 * Hides engagement buttons, comments, recommendations while preserving video player and controls
 */

import { WatchPageSettings, GlobalNavigationSettings } from '../../shared/types/settings';
import { injectCSS, removeCSS, waitForElement, debounce } from './utils/dom-helpers';
import { HoverPreviewBlocker } from './utils/hover-preview-blocker';

/**
 * YouTube element selectors for watch page
 * Organized by category for maintainability
 */
export const WATCH_PAGE_SELECTORS = {
  // ========================================
  // PRESERVED ELEMENTS (never hidden)
  // ========================================
  VIDEO_PLAYER: '#movie_player',
  PLAYER_CONTROLS: '.ytp-chrome-controls',
  VIDEO_TITLE: '#title h1.ytd-watch-metadata',
  VIDEO_DESCRIPTION: '#description.ytd-watch-metadata, ytd-text-inline-expander#description',
  DESCRIPTION_EXPAND_BUTTON: '#expand',
  SEARCH_BAR: '#search, #search-form',
  MASTHEAD: '#masthead',

  // ========================================
  // ENGAGEMENT ACTION BUTTONS (hidden by default, individually toggleable)
  // ========================================
  LIKE_BUTTON:
    '#segmented-like-button, ytd-segmented-like-dislike-button-renderer button[aria-label*="like"], ytd-segmented-like-dislike-button-renderer, ytd-toggle-button-renderer#like-button, button[aria-label*="like this video"]',
  DISLIKE_BUTTON:
    '#segmented-dislike-button, ytd-segmented-like-dislike-button-renderer button[aria-label*="dislike"], button[aria-label*="Dislike this video"]',
  SHARE_BUTTON:
    '#top-level-buttons-computed ytd-button-renderer:has(button[aria-label*="Share"]), ytd-button-renderer:has(button[aria-label*="Share"]), button[aria-label*="Share"]',
  SAVE_BUTTON:
    '#top-level-buttons-computed ytd-button-renderer:has(button[aria-label*="Save"]), ytd-download-and-save-button-renderer, ytd-button-renderer:has(button[aria-label*="Save to playlist"]), button[aria-label*="Save"]',
  // Conditional: appears only when user is logged in
  DOWNLOAD_BUTTON: 'ytd-download-button-renderer, button[aria-label*="Download"]',
  CLIP_BUTTON:
    '#top-level-buttons-computed ytd-button-renderer:has(button[aria-label*="Clip"]), ytd-button-renderer:has(button[aria-label*="Clip"]), button[aria-label*="Clip"]',
  // Conditional: appears only when user is logged in
  THANKS_BUTTON:
    '#sponsor-button, ytd-button-renderer:has(button[aria-label*="Thanks"]), ytd-button-renderer:has(a[aria-label*="Thanks"]), button[aria-label*="Thanks"]',
  // May appear inline or in overflow menu
  REPORT_BUTTON: 'ytd-menu-renderer button[aria-label*="Report"], button[aria-label*="Report"]',
  // New YouTube AI assistant button
  ASK_BUTTON:
    '#top-level-buttons-computed ytd-button-renderer:has(button[aria-label*="Ask"]), ytd-button-renderer:has(button[aria-label*="Ask"]), button[aria-label*="Ask"]',

  // ========================================
  // CHANNEL-RELATED BUTTONS (hidden by default, individually toggleable)
  // ========================================
  SUBSCRIBE_BUTTON:
    '#subscribe-button, ytd-subscribe-button-renderer, ytd-button-renderer#subscribe-button',
  // Conditional: appears only when subscribed to channel
  NOTIFICATIONS_BUTTON:
    'ytd-subscription-notification-toggle-button-renderer, #notification-preference-button',
  // Conditional: appears when channel offers memberships and user is not a member
  JOIN_BUTTON:
    'ytd-button-renderer[is-join-action], ytd-sponsor-button-renderer, ytd-button-renderer:has(a[href*="/sponsor"])',
  // Conditional: appears only when user has active channel membership
  SEE_PERKS_BUTTON: 'ytd-button-renderer:has(button[aria-label*="See perks"])',

  // ========================================
  // CHANNEL INFO SECTION (hidden by default, toggleable as one unit)
  // ========================================
  CHANNEL_AVATAR: '#owner #avatar img, ytd-video-owner-renderer #avatar img',
  CHANNEL_NAME: '#owner ytd-channel-name, ytd-video-owner-renderer ytd-channel-name',

  // ========================================
  // THREE-DOTS OVERFLOW MENU (hidden by default, toggleable)
  // ========================================
  OVERFLOW_MENU:
    'ytd-menu-renderer.ytd-watch-metadata #button, ytd-menu-renderer.ytd-watch-metadata button[aria-label*="More"]',

  // ========================================
  // SOCIAL & DISCOVERY ELEMENTS (hidden by default, individually toggleable)
  // ========================================
  COMMENTS: '#comments, ytd-comments#comments',
  LIVE_CHAT: '#chat-container, ytd-live-chat-frame',
  RELATED_VIDEOS: '#related, ytd-watch-next-secondary-results-renderer, #secondary',
  PLAYLISTS: 'ytd-playlist-panel-renderer',

  // ========================================
  // END-OF-VIDEO ELEMENTS (ALWAYS hidden, non-configurable)
  // ========================================
  END_SCREEN: '.ytp-endscreen-content, .ytp-ce-element',

  // ========================================
  // NAVIGATION CHROME (to maintain consistency with home/search pages)
  // ========================================
  YOUTUBE_LOGO: '#logo, ytd-topbar-logo-renderer',
  HAMBURGER_MENU: '#guide-button',
  LEFT_SIDEBAR: '#guide-inner-content, ytd-guide-renderer, ytd-mini-guide-renderer',
  PROFILE_AVATAR: '#avatar-btn',
  NOTIFICATIONS_TOPBAR: 'ytd-notification-topbar-button-renderer',
  UPLOAD_BUTTON:
    'ytd-topbar-menu-button-renderer[aria-label*="Create"], ytd-topbar-menu-button-renderer:has(> button[aria-label*="Create"])',

  // Skip navigation button (hide and remove from tab order)
  SKIP_NAVIGATION: 'button[aria-label="Skip navigation"]',
} as const;

/**
 * Style tag ID for watch page CSS injection
 */
const STYLE_TAG_ID = 'fockey-watch-styles';

/**
 * MutationObserver instance for detecting dynamic content
 */
let mutationObserver: MutationObserver | null = null;

/**
 * HoverPreviewBlocker instance for managing hover preview behavior
 */
let hoverPreviewBlocker: HoverPreviewBlocker | null = null;

/**
 * Current video ID to detect video navigation
 */
let currentVideoId: string | null = null;

/**
 * Generates CSS rules based on watch page settings
 * Returns CSS string with display: none rules for hidden elements
 *
 * @param settings - Watch page settings object
 * @returns CSS string with rules for hiding/showing elements
 */
function generateWatchPageCSS(settings: WatchPageSettings): string {
  const rules: string[] = [];

  // ========================================
  // CRITICAL: ALWAYS hide end-screen elements (non-configurable)
  // ========================================
  rules.push(`
    /* ALWAYS hide end-screen elements (non-configurable) */
    ${WATCH_PAGE_SELECTORS.END_SCREEN} {
      display: none !important;
      pointer-events: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
    }
  `);

  // ========================================
  // Engagement action buttons (individually toggleable)
  // ========================================
  if (!settings.showLikeDislike) {
    rules.push(`
      /* Hide Like/Dislike buttons */
      ${WATCH_PAGE_SELECTORS.LIKE_BUTTON},
      ${WATCH_PAGE_SELECTORS.DISLIKE_BUTTON} {
        display: none !important;
      }

      /* Also hide the segmented button container */
      ytd-segmented-like-dislike-button-renderer {
        display: none !important;
      }
    `);
  }

  if (!settings.showShare) {
    rules.push(`
      /* Hide Share button */
      ${WATCH_PAGE_SELECTORS.SHARE_BUTTON} {
        display: none !important;
      }

      /* Also target via attribute selector */
      ytd-button-renderer[is-icon-button]:has(button[aria-label*="Share"]) {
        display: none !important;
      }
    `);
  }

  if (!settings.showSave) {
    rules.push(`
      /* Hide Save button */
      ${WATCH_PAGE_SELECTORS.SAVE_BUTTON} {
        display: none !important;
      }

      /* Also target via attribute selector */
      ytd-button-renderer[is-icon-button]:has(button[aria-label*="Save"]) {
        display: none !important;
      }
    `);
  }

  if (!settings.showDownload) {
    rules.push(`
      ${WATCH_PAGE_SELECTORS.DOWNLOAD_BUTTON} {
        display: none !important;
      }
    `);
  }

  if (!settings.showClip) {
    rules.push(`
      ${WATCH_PAGE_SELECTORS.CLIP_BUTTON} {
        display: none !important;
      }
    `);
  }

  if (!settings.showThanks) {
    rules.push(`
      ${WATCH_PAGE_SELECTORS.THANKS_BUTTON} {
        display: none !important;
      }
    `);
  }

  if (!settings.showReport) {
    rules.push(`
      ${WATCH_PAGE_SELECTORS.REPORT_BUTTON} {
        display: none !important;
      }
    `);
  }

  if (!settings.showAskButton) {
    rules.push(`
      /* Hide Ask (AI assistant) button */
      ${WATCH_PAGE_SELECTORS.ASK_BUTTON} {
        display: none !important;
      }

      /* Also target via attribute selector */
      ytd-button-renderer[is-icon-button]:has(button[aria-label*="Ask"]) {
        display: none !important;
      }
    `);
  }

  // ========================================
  // Channel-related buttons (individually toggleable)
  // ========================================
  if (!settings.showSubscribe) {
    rules.push(`
      ${WATCH_PAGE_SELECTORS.SUBSCRIBE_BUTTON} {
        display: none !important;
      }
    `);
  }

  if (!settings.showNotifications) {
    rules.push(`
      ${WATCH_PAGE_SELECTORS.NOTIFICATIONS_BUTTON} {
        display: none !important;
      }
    `);
  }

  if (!settings.showJoin) {
    rules.push(`
      ${WATCH_PAGE_SELECTORS.JOIN_BUTTON} {
        display: none !important;
      }
    `);
  }

  if (!settings.showSeePerks) {
    rules.push(`
      ${WATCH_PAGE_SELECTORS.SEE_PERKS_BUTTON} {
        display: none !important;
      }
    `);
  }

  // ========================================
  // Channel info section (avatar + channel name as one unit)
  // ========================================
  if (!settings.showChannelInfo) {
    rules.push(`
      ${WATCH_PAGE_SELECTORS.CHANNEL_AVATAR},
      ${WATCH_PAGE_SELECTORS.CHANNEL_NAME} {
        display: none !important;
      }
    `);
  }

  // ========================================
  // Three-dots overflow menu
  // ========================================
  if (!settings.showOverflowMenu) {
    rules.push(`
      ${WATCH_PAGE_SELECTORS.OVERFLOW_MENU} {
        display: none !important;
      }
    `);
  }

  // ========================================
  // Social & discovery elements
  // ========================================
  if (!settings.showComments) {
    rules.push(`
      ${WATCH_PAGE_SELECTORS.COMMENTS} {
        display: none !important;
      }
    `);
  }

  if (!settings.showLiveChat) {
    rules.push(`
      ${WATCH_PAGE_SELECTORS.LIVE_CHAT} {
        display: none !important;
      }
    `);
  }

  if (!settings.showRelated) {
    rules.push(`
      ${WATCH_PAGE_SELECTORS.RELATED_VIDEOS} {
        display: none !important;
      }
    `);
  }

  if (!settings.showPlaylists) {
    rules.push(`
      ${WATCH_PAGE_SELECTORS.PLAYLISTS} {
        display: none !important;
      }
    `);
  }

  // ========================================
  // CRITICAL: ALWAYS hide navigation chrome (matching Home/Search page behavior)
  // These are ALWAYS hidden by default to maintain minimalist consistency
  // ========================================
  rules.push(`
    /* ALWAYS hide YouTube logo */
    ${WATCH_PAGE_SELECTORS.YOUTUBE_LOGO} {
      display: none !important;
    }

    /* ALWAYS hide hamburger menu */
    ${WATCH_PAGE_SELECTORS.HAMBURGER_MENU} {
      display: none !important;
    }

    /* ALWAYS hide left sidebar */
    ${WATCH_PAGE_SELECTORS.LEFT_SIDEBAR} {
      display: none !important;
    }

    /* Adjust page content to fill space when sidebar is hidden */
    ytd-page-manager {
      margin-left: 0 !important;
    }

    /* ALWAYS hide profile avatar */
    ${WATCH_PAGE_SELECTORS.PROFILE_AVATAR} {
      display: none !important;
    }

    /* ALWAYS hide notifications button in topbar */
    ${WATCH_PAGE_SELECTORS.NOTIFICATIONS_TOPBAR} {
      display: none !important;
    }

    /* ALWAYS hide upload/create button */
    ${WATCH_PAGE_SELECTORS.UPLOAD_BUTTON} {
      display: none !important;
    }

    /* Hide topbar buttons (settings, sign in, etc.) */
    #buttons ytd-button-renderer {
      display: none !important;
    }

    /* Also hide topbar menu buttons */
    ytd-topbar-menu-button-renderer {
      display: none !important;
    }

    /* Hide skip navigation button and remove from tab order */
    ${WATCH_PAGE_SELECTORS.SKIP_NAVIGATION} {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
      position: absolute !important;
      left: -9999px !important;
    }
  `);

  // ========================================
  // Search box centering
  // ========================================
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

  // ========================================
  // Smooth transitions for settings changes
  // ========================================
  rules.push(`
    /* Smooth transitions for settings changes */
    ytd-watch-metadata * {
      transition: opacity 0.2s ease, transform 0.2s ease !important;
    }
  `);

  return rules.join('\n');
}

/**
 * Applies watch page settings by injecting CSS
 * Main function that controls element visibility based on user preferences
 *
 * @param settings - Watch page settings object
 */
export function applyWatchPageSettings(
  settings: WatchPageSettings,
  globalNavigation?: GlobalNavigationSettings
): void {
  const css = generateWatchPageCSS(settings);
  injectCSS(css, STYLE_TAG_ID);

  // Update hover preview blocker settings if globalNavigation is provided
  if (globalNavigation) {
    hoverPreviewBlocker?.updateSettings(globalNavigation.enableHoverPreviews);
  }
}

/**
 * Removes all watch page CSS modifications
 * Used when leaving watch page or disabling extension
 */
export function removeWatchPageStyles(): void {
  removeCSS(STYLE_TAG_ID);
}

/**
 * Extracts video ID from current URL
 * @returns Video ID or null if not found
 */
function getVideoId(): string | null {
  const match = window.location.href.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

/**
 * Sets up MutationObserver to detect dynamic YouTube content loading
 * Re-applies CSS when new elements are added
 *
 * @param settings - Watch page settings object
 */
function setupMutationObserver(settings: WatchPageSettings): void {
  // Disconnect existing observer if any
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  // Create debounced re-apply function
  const debouncedReapply = debounce(() => {
    applyWatchPageSettings(settings);
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
              node.matches(WATCH_PAGE_SELECTORS.COMMENTS) ||
              node.matches(WATCH_PAGE_SELECTORS.RELATED_VIDEOS) ||
              node.matches(WATCH_PAGE_SELECTORS.LIVE_CHAT) ||
              node.matches(WATCH_PAGE_SELECTORS.END_SCREEN) ||
              node.querySelector(WATCH_PAGE_SELECTORS.COMMENTS) ||
              node.querySelector(WATCH_PAGE_SELECTORS.RELATED_VIDEOS) ||
              node.querySelector(WATCH_PAGE_SELECTORS.LIVE_CHAT) ||
              node.querySelector(WATCH_PAGE_SELECTORS.END_SCREEN)
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
 * Sets up video navigation detection for SPA transitions
 * Detects when user navigates to a different video without full page reload
 *
 * @param settings - Watch page settings object
 */
function setupVideoNavigationListener(settings: WatchPageSettings): void {
  // Listen for YouTube's SPA navigation event
  window.addEventListener('yt-navigate-finish', () => {
    const newVideoId = getVideoId();

    // If video ID changed, re-apply settings
    if (newVideoId && newVideoId !== currentVideoId) {
      currentVideoId = newVideoId;
      console.log(`[Fockey] Video changed to: ${newVideoId}`);

      // Re-apply settings for new video
      applyWatchPageSettings(settings);
    }
  });

  // Also listen for popstate (back/forward navigation)
  window.addEventListener('popstate', () => {
    const newVideoId = getVideoId();

    if (newVideoId && newVideoId !== currentVideoId) {
      currentVideoId = newVideoId;
      console.log(`[Fockey] Video changed (popstate) to: ${newVideoId}`);
      applyWatchPageSettings(settings);
    }
  });
}

/**
 * Initializes the watch page content script
 * Main entry point for watch page module
 *
 * @param settings - Watch page settings object
 */
export async function initWatchPageModule(
  settings: WatchPageSettings,
  globalNavigation?: GlobalNavigationSettings
): Promise<void> {
  try {
    // Wait for essential elements to load
    await waitForElement(WATCH_PAGE_SELECTORS.VIDEO_PLAYER, 5000);

    // Store current video ID
    currentVideoId = getVideoId();

    // Apply initial settings
    applyWatchPageSettings(settings);

    // Set up mutation observer for dynamic content
    setupMutationObserver(settings);

    // Set up video navigation detection
    setupVideoNavigationListener(settings);

    // Initialize hover preview blocker if globalNavigation is provided
    if (globalNavigation) {
      hoverPreviewBlocker = new HoverPreviewBlocker(globalNavigation.enableHoverPreviews);
      hoverPreviewBlocker.init();
    }

    console.log('[Fockey] Watch page module initialized');
  } catch (error) {
    console.error('[Fockey] Failed to initialize watch page module:', error);
  }
}

/**
 * Cleans up the watch page module
 * Removes all styles, observers, and listeners
 */
export function cleanupWatchPageModule(): void {
  // Remove styles
  removeWatchPageStyles();

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

  // Reset current video ID
  currentVideoId = null;

  console.log('[Fockey] Watch page module cleaned up');
}
