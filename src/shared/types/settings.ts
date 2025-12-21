/**
 * Settings interface for the Fockey Chrome Extension
 * Defines the complete schema for all YouTube module features
 */

/**
 * Global Navigation Elements settings (applies to all YouTube pages)
 * Controls visibility of persistent header and sidebar navigation elements
 * that appear consistently across Home, Search, Watch, and Creator Profile pages
 */
export interface GlobalNavigationSettings {
  /** Show YouTube logo in header */
  showLogo: boolean;
  /** Show left sidebar (includes hamburger menu - unified component) */
  showSidebar: boolean;
  /** Show profile avatar in header */
  showProfile: boolean;
  /** Show notifications bell in header */
  showNotifications: boolean;
  /** Enable hover previews on video thumbnails */
  enableHoverPreviews: boolean;
}

/**
 * Settings for YouTube Home Page
 * Controls visibility of UI elements on youtube.com home page
 * Note: Global navigation elements are controlled via GlobalNavigationSettings
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface HomePageSettings {
  // Empty for now - future expansion point for home-specific features
  // Global navigation elements moved to GlobalNavigationSettings
}

/**
 * Settings for YouTube Search Page
 * Controls visibility of UI elements in search results
 * Note: Global navigation elements are controlled via GlobalNavigationSettings
 */
export interface SearchPageSettings {
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
  /** Show/hide More Actions buttons (Save, Download, Clip, Thanks, Report, Ask AI, Overflow Menu) */
  showMoreActions: boolean;
  /** Show/hide Subscription Actions buttons (Subscribe, Join, Notifications, See Perks) */
  showSubscriptionActions: boolean;
  /** Show/hide Comments section */
  showComments: boolean;
  /** Show/hide Related videos sidebar */
  showRelated: boolean;
  /** Show/hide Playlists sidebar */
  showPlaylists: boolean;
  /** Show/hide Recommended Video cards (Info Cards and teasers during playback) */
  showRecommendedVideo: boolean;
}

/**
 * Settings for YouTube Creator Profile Page
 * Controls visibility of UI elements on channel/creator profile pages
 * Note: Global navigation elements are controlled via GlobalNavigationSettings
 * Channel action buttons (Subscribe, Join, Notifications, See Perks) are always visible on creator profiles
 */
export interface CreatorProfilePageSettings {
  // Tab visibility controls
  /** Show/hide Shorts tab */
  showShortsTab: boolean;
  /** Show/hide Community/Posts tab */
  showCommunityTab: boolean;

  // Content filtering controls (Home tab only)
  /** Show/hide Community posts in Home tab */
  showCommunityInHome: boolean;
  /** Show/hide Shorts in Home tab */
  showShortsInHome: boolean;
}

/**
 * Settings for the YouTube module
 * Top-level settings for YouTube-specific features
 */
export interface YouTubeModuleSettings {
  /** Enable/disable the YouTube module entirely */
  enabled: boolean;
  /** Global navigation elements settings (applies to all YouTube pages) */
  globalNavigation: GlobalNavigationSettings;
  /** Home page settings */
  homePage: HomePageSettings;
  /** Search page settings */
  searchPage: SearchPageSettings;
  /** Watch page settings */
  watchPage: WatchPageSettings;
  /** Creator profile page settings */
  creatorProfilePage: CreatorProfilePageSettings;
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
 * - All global navigation elements hidden by default
 * - All UI elements hidden by default on Home page
 * - Only long-form videos shown on Search page
 * - Only video player and essential controls on Watch page
 */
export const DEFAULT_SETTINGS: Readonly<ExtensionSettings> = {
  version: '1.0.0',
  youtube: {
    enabled: true,
    globalNavigation: {
      showLogo: false,
      showSidebar: false, // Unified: controls both sidebar and hamburger menu
      showProfile: false,
      showNotifications: false,
      enableHoverPreviews: false, // Disabled by default (minimalist principle)
    },
    homePage: {
      // Empty for now - future expansion point
    },
    searchPage: {
      // Content (hidden by default - minimalist principle)
      showShorts: false,
      showCommunityPosts: false,
      showMixes: false,
      showSponsored: false,
      // Visual adjustments
      blurThumbnails: false,
    },
    watchPage: {
      showLikeDislike: true, // Visible by default - basic engagement metric
      showShare: false,
      showMoreActions: false, // Unified toggle for Save, Download, Clip, Thanks, Report, Ask AI, Overflow Menu
      showSubscriptionActions: false, // Unified toggle for Subscribe, Join, Notifications, See Perks
      showComments: false,
      showRelated: false,
      showPlaylists: false,
      showRecommendedVideo: false, // Info Cards and teasers during playback
    },
    creatorProfilePage: {
      // Tab visibility (hidden by default - minimalist principle)
      showShortsTab: false,
      showCommunityTab: false,
      // Content filtering in Home tab (hidden by default - minimalist principle)
      showCommunityInHome: false,
      showShortsInHome: false,
    },
  },
} as const;
