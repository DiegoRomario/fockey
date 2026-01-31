/**
 * Settings interface for the Fockey Chrome Extension
 * Defines the complete schema for all YouTube module features and general blocking schedules
 */

// ==================== GENERAL MODULE ====================

// ==================== CONTENT KEYWORDS ====================

/**
 * Legacy Content Keyword Rule interface (for backwards compatibility)
 * @deprecated Use string[] for contentKeywords instead
 */
interface LegacyContentKeywordRule {
  keyword: string;
  blockEntireSite?: boolean;
}

/**
 * Helper function to normalize content keywords
 * Converts old ContentKeywordRule[] format to string[] for backwards compatibility
 */
export function normalizeContentKeywords(
  keywords: (string | LegacyContentKeywordRule)[]
): string[] {
  return keywords.map((k) => {
    if (typeof k === 'string') {
      return k;
    }
    return k.keyword;
  });
}

// ==================== QUICK BLOCK (TEMPORARY FOCUS SESSIONS) ====================

/**
 * Quick Block Configuration
 * User-configured items to block during Quick Block sessions
 * This configuration is persistent and should be exported/imported across devices
 */
export interface QuickBlockConfig {
  /** Domains to block during Quick Block sessions */
  blockedDomains: string[];
  /** URL keywords to block during Quick Block sessions */
  urlKeywords: string[];
  /**
   * Content keywords to block during Quick Block sessions
   * Elements containing these keywords will be blurred/hidden
   */
  contentKeywords: string[];
}

/**
 * Default Quick Block configuration
 * Used when initializing Quick Block for the first time
 */
export const DEFAULT_QUICK_BLOCK_CONFIG: Readonly<QuickBlockConfig> = {
  blockedDomains: [],
  urlKeywords: [],
  contentKeywords: [],
} as const;

/**
 * Quick Block Session State
 * Temporary session state for active Quick Block sessions
 * Stored in local storage (device-specific, like Lock Mode)
 * This is NOT exported/imported - it's device-specific and temporary
 */
export interface QuickBlockSession {
  /** Whether Quick Block is currently active */
  isActive: boolean;
  /** Unix timestamp (ms) when session started */
  startTime: number | null;
  /** Unix timestamp (ms) when session should end */
  endTime: number | null;
  /** Domains to block during this session */
  blockedDomains: string[];
  /** URL keywords to block during this session */
  urlKeywords: string[];
  /**
   * Content keywords to block during this session
   * Elements containing these keywords will be blurred/hidden
   */
  contentKeywords: string[];
}

/**
 * Default Quick Block session state
 * Used when initializing Quick Block for the first time
 */
export const DEFAULT_QUICK_BLOCK_SESSION: Readonly<QuickBlockSession> = {
  isActive: false,
  startTime: null,
  endTime: null,
  blockedDomains: [],
  urlKeywords: [],
  contentKeywords: [],
} as const;

// ==================== SCHEDULE TEMPLATES ====================

/**
 * Schedule Template
 * Predefined templates for creating new schedules with common configurations
 * These are NOT active schedules - they are presets that populate the schedule creation form
 */
export interface ScheduleTemplate {
  /** Unique identifier for the template */
  id: string;
  /** Template name (e.g., "24/7 Focus", "Work Hours") */
  name: string;
  /** Icon identifier (e.g., "⏰", "💼") */
  icon: string;
  /** Pre-selected days (0-6, where 0 = Sunday) */
  days: number[];
  /** Pre-configured time periods */
  timePeriods: { startTime: string; endTime: string }[];
}

/**
 * Built-in schedule templates
 * These templates are hardcoded and available to all users
 */
export const SCHEDULE_TEMPLATES: readonly ScheduleTemplate[] = [
  {
    id: 'template-24-7',
    name: '24/7',
    icon: '⏰',
    days: [0, 1, 2, 3, 4, 5, 6], // Every day
    timePeriods: [{ startTime: '00:00', endTime: '23:59' }],
  },
  {
    id: 'template-work',
    name: 'Work',
    icon: '💼',
    days: [1, 2, 3, 4, 5], // Monday - Friday
    timePeriods: [{ startTime: '08:00', endTime: '18:00' }],
  },
  {
    id: 'template-digital-detox',
    name: 'Digital Detox',
    icon: '🧘',
    days: [0, 6], // Saturday and Sunday (weekend)
    timePeriods: [{ startTime: '00:00', endTime: '23:59' }],
  },
] as const;

// ==================== SCHEDULES ====================

/**
 * Time period within a schedule
 * Represents a time range when blocking should be active
 */
export interface TimePeriod {
  /** Start time in HH:MM format (24-hour, e.g., "09:00") */
  startTime: string;
  /** End time in HH:MM format (24-hour, e.g., "17:00") */
  endTime: string;
}

/**
 * Blocking Schedule
 * Defines when and what to block based on time-based rules
 */
export interface BlockingSchedule {
  /** Unique identifier for the schedule */
  id: string;
  /** User-friendly name (e.g., "Focus Work") */
  name: string;
  /** Optional icon identifier (e.g., "🎯", "🔒", etc.) */
  icon?: string;
  /** Whether this schedule is currently enabled */
  enabled: boolean;
  /**
   * Selected days of the week (0-6, where 0 = Sunday)
   * Examples: [1, 2, 3, 4, 5] for weekdays, [0, 6] for weekend
   */
  days: number[];
  /**
   * Active time periods when blocking is enforced
   * Schedule is active when current time falls within ANY period
   */
  timePeriods: TimePeriod[];
  /**
   * Domains and subdomains to block
   * Examples: ["globo.com", "example.com"]
   * Note: Blocking "globo.com" automatically blocks all subdomains (e.g., "ge.globo.com")
   */
  blockedDomains: string[];
  /**
   * URL keywords to match
   * Page is blocked if URL contains ANY of these keywords (case-insensitive)
   * Examples: ["trending", "viral", "news"]
   */
  urlKeywords: string[];
  /**
   * Content keywords to match
   * Elements containing ANY of these keywords will be blurred/hidden (case-insensitive)
   * Examples: ["breaking news", "celebrity", "gossip"]
   */
  contentKeywords: string[];
  /** Timestamp when schedule was created */
  createdAt: number;
  /** Timestamp when schedule was last modified */
  updatedAt: number;
}

// ==================== YOUTUBE MODULE ====================

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
  /**
   * Enable YouTube Shorts globally
   * When false (default), all Shorts content is blocked including:
   * - Direct Shorts URLs (/shorts/...)
   * - Shorts in search results
   * - Shorts tabs on creator profiles
   * - Shorts in creator profile home tabs
   */
  enableShorts: boolean;
  /**
   * Enable YouTube Posts globally
   * When false (default), all Posts content is blocked including:
   * - Direct Posts URLs (/post/...)
   * - Community Posts in search results
   * - Posts tabs on creator profiles
   * - Posts in creator profile home tabs
   */
  enablePosts: boolean;
  /**
   * Enable search suggestions (autocomplete dropdown)
   * When false (default), the search suggestions dropdown is hidden to reduce distractions
   * When true, YouTube's native search suggestions appear when typing in the search box
   */
  enableSearchSuggestions: boolean;
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
 * Note: Global navigation elements and Shorts/Posts visibility are controlled via GlobalNavigationSettings
 */
export interface SearchPageSettings {
  // Content controls
  /** Show/hide Mixes/Playlists in search results */
  showMixes: boolean;

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
 * Note: Global navigation elements, Shorts, and Posts visibility are controlled via GlobalNavigationSettings
 * Channel action buttons (Subscribe, Join, Notifications, See Perks) are always visible on creator profiles
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CreatorProfilePageSettings {
  // Empty for now - Shorts and Posts are controlled globally via GlobalNavigationSettings
  // Future expansion point for creator profile-specific features
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
  /** List of blocked YouTube channels */
  blockedChannels: BlockedChannel[];
}

/**
 * Blocked YouTube Channel entry
 * Represents a channel that should be blocked across all YouTube surfaces
 */
export interface BlockedChannel {
  /** Unique channel ID (e.g., UCxxxxxxx) or handle */
  id: string;
  /** Channel handle without @ (e.g., "MrBeast") */
  handle: string;
  /** Display name of the channel */
  name: string;
  /** Timestamp when channel was blocked */
  blockedAt: number;
}

// ==================== GENERAL MODULE ====================

/**
 * Settings for the General blocking module
 * Controls time-based blocking schedules and Quick Block configuration
 */
export interface GeneralModuleSettings {
  /** List of time-based blocking schedules */
  schedules: BlockingSchedule[];
  /** Quick Block configuration (domains, keywords to block) */
  quickBlock: QuickBlockConfig;
}

/**
 * Lock Mode State
 * Stores the current lock mode status and timing information
 *
 * IMPORTANT: This is stored separately in chrome.storage.local (device-specific),
 * NOT in chrome.storage.sync like other settings. This prevents cross-device
 * sync race conditions and makes lock a device-specific commitment tool.
 *
 * Storage key: 'fockey_lock_state'
 */
export interface LockModeState {
  /** Whether lock mode is currently active */
  isLocked: boolean;
  /**
   * Unix timestamp (ms) when lock should expire
   * This is the single source of truth for lock enforcement
   */
  lockEndTime: number | null;
  /**
   * Unix timestamp (ms) when lock was activated
   * Used for UI display purposes only
   */
  lockStartedAt: number | null;
  /**
   * Original lock duration in milliseconds
   * Used to validate lock extensions (new duration must be longer)
   */
  originalDuration: number | null;
}

/**
 * Default lock mode state
 * Used when initializing lock mode for the first time
 */
export const DEFAULT_LOCK_STATE: Readonly<LockModeState> = {
  isLocked: false,
  lockEndTime: null,
  lockStartedAt: null,
  originalDuration: null,
} as const;

// ==================== YOUTUBE MODULE PAUSE STATE ====================

/**
 * YouTube Module Pause State
 * Stores the current pause status and timing information for the YouTube module
 *
 * IMPORTANT: This is stored separately in chrome.storage.local (device-specific),
 * NOT in chrome.storage.sync like other settings. Similar to Lock Mode,
 * this makes pause a device-specific tool.
 *
 * Storage key: 'fockey_youtube_pause_state'
 */
export interface YouTubePauseState {
  /** Whether YouTube module is currently paused */
  isPaused: boolean;
  /**
   * Unix timestamp (ms) when pause should expire
   * null means indefinite pause (manual resume only)
   */
  pauseEndTime: number | null;
  /**
   * Unix timestamp (ms) when pause was activated
   * Used for UI display purposes only
   */
  pauseStartedAt: number | null;
}

/**
 * Default YouTube pause state
 * Used when initializing YouTube pause for the first time
 */
export const DEFAULT_YOUTUBE_PAUSE_STATE: Readonly<YouTubePauseState> = {
  isPaused: false,
  pauseEndTime: null,
  pauseStartedAt: null,
} as const;

/**
 * Root settings interface for the extension
 * Contains all extension-wide settings including YouTube module and General blocking features
 */
export interface ExtensionSettings {
  /** Settings schema version for migration support */
  version: string;
  /** YouTube module settings (includes blocked channels) */
  youtube: YouTubeModuleSettings;
  /** General blocking module settings (includes schedules and Quick Block config) */
  general: GeneralModuleSettings;
}

/**
 * Export data format for complete extension state
 * Includes all user preferences that should transfer across devices
 *
 * Includes:
 * - YouTube module settings (global, search, watch pages)
 * - Blocked YouTube channels
 * - General module settings (schedules and Quick Block configuration)
 * - Theme preference
 *
 * Excludes (device-specific or temporary states):
 * - Lock Mode state (device-specific commitment)
 * - YouTube Pause state (device-specific)
 * - Quick Block session state (temporary, device-specific)
 * - HomePage settings (deprecated, empty)
 */
export interface ExportData {
  /** Settings schema version for migration support */
  version: string;
  /** Core extension settings */
  settings: ExtensionSettings;
  /** Theme preference (light/dark) */
  theme: 'light' | 'dark';
  /** Timestamp when export was created */
  exportedAt: number;
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
      enableShorts: false, // Disabled by default (all Shorts blocked globally)
      enablePosts: false, // Disabled by default (all Posts blocked globally)
      enableSearchSuggestions: false, // Disabled by default (no algorithmic nudges)
    },
    homePage: {
      // Empty for now - future expansion point
    },
    searchPage: {
      // Content (hidden by default - minimalist principle)
      showMixes: false,
      // Visual adjustments
      blurThumbnails: false,
    },
    watchPage: {
      showLikeDislike: false, // Visible by default - basic engagement metric
      showShare: false,
      showMoreActions: false, // Unified toggle for Save, Download, Clip, Thanks, Report, Ask AI, Overflow Menu
      showSubscriptionActions: false, // Unified toggle for Subscribe, Join, Notifications, See Perks
      showComments: false,
      showRelated: false,
      showPlaylists: false,
      showRecommendedVideo: false, // Info Cards and teasers during playback
    },
    creatorProfilePage: {
      // Empty for now - Shorts and Posts are controlled globally via GlobalNavigationSettings
      // Future expansion point for creator profile-specific features
    },
    blockedChannels: [],
  },
  general: {
    schedules: [],
    quickBlock: {
      blockedDomains: [],
      urlKeywords: [],
      contentKeywords: [],
    },
  },
} as const;
