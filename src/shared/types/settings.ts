/**
 * Settings interface for the Fockey Chrome Extension
 * Defines the complete schema for all YouTube module features
 */

/**
 * Settings for YouTube Home Page
 * Controls visibility of UI elements on youtube.com home page
 */
export interface HomePageSettings {
  /** Show/hide YouTube logo */
  showLogo: boolean;
  /** Show/hide hamburger menu */
  showHamburger: boolean;
  /** Show/hide left sidebar (Home, Subscriptions, etc.) */
  showSidebar: boolean;
  /** Show/hide profile avatar */
  showProfile: boolean;
  /** Show/hide notifications button */
  showNotifications: boolean;
}

/**
 * Settings for YouTube Search Page
 * Controls visibility of UI elements in search results
 */
export interface SearchPageSettings {
  // Navigation chrome controls (matching HomePageSettings)
  /** Show/hide YouTube logo */
  showLogo: boolean;
  /** Show/hide hamburger menu */
  showHamburger: boolean;
  /** Show/hide left sidebar (Home, Subscriptions, etc.) */
  showSidebar: boolean;
  /** Show/hide profile avatar */
  showProfile: boolean;
  /** Show/hide notifications button */
  showNotifications: boolean;

  // Content controls
  /** Show/hide Shorts in search results */
  showShorts: boolean;
  /** Show/hide Community posts in search results */
  showCommunityPosts: boolean;
  /** Show/hide Mixes/Playlists in search results */
  showMixes: boolean;
  /** Show/hide Sponsored content in search results */
  showSponsored: boolean;

  // Visual adjustments
  /** Blur thumbnails instead of hiding them */
  blurThumbnails: boolean;
}

/**
 * Settings for YouTube Watch Page
 * Controls visibility of UI elements on video watch pages
 */
export interface WatchPageSettings {
  /** Show/hide Like and Dislike buttons */
  showLikeDislike: boolean;
  /** Show/hide Share button */
  showShare: boolean;
  /** Show/hide Save button */
  showSave: boolean;
  /** Show/hide Download button */
  showDownload: boolean;
  /** Show/hide Clip button */
  showClip: boolean;
  /** Show/hide Subscribe button */
  showSubscribe: boolean;
  /** Show/hide Join/Membership button */
  showJoin: boolean;
  /** Show/hide Comments section */
  showComments: boolean;
  /** Show/hide Live chat */
  showLiveChat: boolean;
  /** Show/hide Related videos sidebar */
  showRelated: boolean;
  /** Show/hide Playlists sidebar */
  showPlaylists: boolean;
  /** Show/hide Creator-recommended end-screen videos */
  showEndScreen: boolean;
}

/**
 * Settings for the YouTube module
 * Top-level settings for YouTube-specific features
 */
export interface YouTubeModuleSettings {
  /** Enable/disable the YouTube module entirely */
  enabled: boolean;
  /** Home page settings */
  homePage: HomePageSettings;
  /** Search page settings */
  searchPage: SearchPageSettings;
  /** Watch page settings */
  watchPage: WatchPageSettings;
}

/**
 * Root settings interface for the extension
 * Contains all extension-wide settings
 */
export interface ExtensionSettings {
  /** Settings schema version for migration support */
  version: string;
  /** YouTube module settings */
  youtube: YouTubeModuleSettings;
}

/**
 * Default settings for the extension
 * Implements the "Minimal by default" principle:
 * - All UI elements hidden by default on Home page
 * - Only long-form videos shown on Search page
 * - Only video player and essential controls on Watch page
 */
export const DEFAULT_SETTINGS: Readonly<ExtensionSettings> = {
  version: '1.0.0',
  youtube: {
    enabled: true,
    homePage: {
      showLogo: false,
      showHamburger: false,
      showSidebar: false,
      showProfile: false,
      showNotifications: false,
    },
    searchPage: {
      // Navigation chrome (hidden by default - minimalist principle)
      showLogo: false,
      showHamburger: false,
      showSidebar: false,
      showProfile: false,
      showNotifications: false,
      // Content (hidden by default - minimalist principle)
      showShorts: false,
      showCommunityPosts: false,
      showMixes: false,
      showSponsored: false,
      // Visual adjustments
      blurThumbnails: false,
    },
    watchPage: {
      showLikeDislike: false,
      showShare: false,
      showSave: false,
      showDownload: false,
      showClip: false,
      showSubscribe: false,
      showJoin: false,
      showComments: false,
      showLiveChat: false,
      showRelated: false,
      showPlaylists: false,
      showEndScreen: false,
    },
  },
} as const;
