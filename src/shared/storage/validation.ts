/**
 * Settings validation utilities for Fockey Chrome Extension
 * Ensures data integrity and prevents corrupted settings
 */

import {
  ExtensionSettings,
  GlobalNavigationSettings,
  HomePageSettings,
  SearchPageSettings,
  WatchPageSettings,
  CreatorProfilePageSettings,
  YouTubeModuleSettings,
  LockModeState,
} from '../types/settings';

/**
 * Validates that an object contains all required boolean properties
 *
 * @param obj - Object to validate
 * @param requiredKeys - Array of required property names
 * @returns True if all required keys exist and are booleans
 */
function validateBooleanObject(obj: unknown, requiredKeys: string[]): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const objectToCheck = obj as Record<string, unknown>;

  for (const key of requiredKeys) {
    if (typeof objectToCheck[key] !== 'boolean') {
      console.error(`Validation failed: property "${key}" is not a boolean`);
      return false;
    }
  }

  return true;
}

/**
 * Validates GlobalNavigationSettings structure
 */
function validateGlobalNavigationSettings(settings: unknown): settings is GlobalNavigationSettings {
  return validateBooleanObject(settings, [
    'showLogo',
    'showSidebar',
    'showProfile',
    'showNotifications',
    'enableHoverPreviews',
  ]);
}

/**
 * Validates HomePageSettings structure
 * Note: HomePageSettings is currently empty (reserved for future expansion)
 */
function validateHomePageSettings(settings: unknown): settings is HomePageSettings {
  // HomePageSettings is an empty interface - just validate it's an object
  if (!settings || typeof settings !== 'object') {
    return false;
  }
  return true;
}

/**
 * Validates SearchPageSettings structure
 */
function validateSearchPageSettings(settings: unknown): settings is SearchPageSettings {
  return validateBooleanObject(settings, [
    'showShorts',
    'showCommunityPosts',
    'showMixes',
    'blurThumbnails',
  ]);
}

/**
 * Validates WatchPageSettings structure
 */
function validateWatchPageSettings(settings: unknown): settings is WatchPageSettings {
  return validateBooleanObject(settings, [
    'showLikeDislike',
    'showShare',
    'showMoreActions',
    'showSubscriptionActions',
    'showComments',
    'showRelated',
    'showPlaylists',
    'showRecommendedVideo',
  ]);
}

/**
 * Validates CreatorProfilePageSettings structure
 */
function validateCreatorProfilePageSettings(
  settings: unknown
): settings is CreatorProfilePageSettings {
  return validateBooleanObject(settings, [
    'showShortsTab',
    'showCommunityTab',
    'showCommunityInHome',
    'showShortsInHome',
  ]);
}

/**
 * Validates YouTubeModuleSettings structure
 */
function validateYouTubeModuleSettings(settings: unknown): settings is YouTubeModuleSettings {
  if (!settings || typeof settings !== 'object') {
    console.error('Validation failed: YouTubeModuleSettings is not an object');
    return false;
  }

  const youtubeSettings = settings as Record<string, unknown>;

  // Validate enabled property
  if (typeof youtubeSettings.enabled !== 'boolean') {
    console.error('Validation failed: YouTubeModuleSettings.enabled is not a boolean');
    return false;
  }

  // Validate global navigation settings
  if (!validateGlobalNavigationSettings(youtubeSettings.globalNavigation)) {
    console.error('Validation failed: invalid globalNavigation settings');
    return false;
  }

  // Validate nested settings
  if (!validateHomePageSettings(youtubeSettings.homePage)) {
    console.error('Validation failed: invalid homePage settings');
    return false;
  }

  if (!validateSearchPageSettings(youtubeSettings.searchPage)) {
    console.error('Validation failed: invalid searchPage settings');
    return false;
  }

  if (!validateWatchPageSettings(youtubeSettings.watchPage)) {
    console.error('Validation failed: invalid watchPage settings');
    return false;
  }

  if (!validateCreatorProfilePageSettings(youtubeSettings.creatorProfilePage)) {
    console.error('Validation failed: invalid creatorProfilePage settings');
    return false;
  }

  return true;
}

/**
 * Validates version string is a valid semver format
 */
function validateVersion(version: unknown): version is string {
  if (typeof version !== 'string') {
    console.error('Validation failed: version is not a string');
    return false;
  }

  // Basic semver validation (major.minor.patch)
  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!semverRegex.test(version)) {
    console.error(`Validation failed: version "${version}" is not valid semver format`);
    return false;
  }

  return true;
}

/**
 * Type guard to validate ExtensionSettings structure
 * Checks all required properties and nested objects
 *
 * @param settings - Settings object to validate
 * @returns True if settings match ExtensionSettings interface
 */
export function validateSettings(settings: unknown): settings is ExtensionSettings {
  if (!settings || typeof settings !== 'object') {
    console.error('Validation failed: settings is not an object');
    return false;
  }

  const settingsToValidate = settings as Record<string, unknown>;

  // Validate version
  if (!validateVersion(settingsToValidate.version)) {
    return false;
  }

  // Validate YouTube module settings
  if (!validateYouTubeModuleSettings(settingsToValidate.youtube)) {
    return false;
  }

  return true;
}

/**
 * Type guard to validate LockModeState structure
 * Checks all required properties and consistency rules
 *
 * IMPORTANT: LockModeState is stored separately from ExtensionSettings
 * in chrome.storage.local (device-specific, not synced)
 *
 * @param lockState - Lock mode state object to validate
 * @returns True if lock state matches LockModeState interface
 */
export function validateLockModeState(lockState: unknown): lockState is LockModeState {
  if (!lockState || typeof lockState !== 'object') {
    console.error('Lock mode validation failed: lockState is not an object');
    return false;
  }

  const stateToValidate = lockState as Record<string, unknown>;

  // Validate isLocked is boolean
  if (typeof stateToValidate.isLocked !== 'boolean') {
    console.error('Lock mode validation failed: isLocked must be a boolean');
    return false;
  }

  // Validate timestamp fields (must be null or number)
  const timeFields = ['lockEndTime', 'lockStartedAt', 'originalDuration'];
  for (const field of timeFields) {
    const value = stateToValidate[field];
    if (value !== null && typeof value !== 'number') {
      console.error(`Lock mode validation failed: ${field} must be null or number`);
      return false;
    }
  }

  // Consistency check: if locked, all time fields must be numbers (not null)
  if (stateToValidate.isLocked === true) {
    if (
      typeof stateToValidate.lockEndTime !== 'number' ||
      typeof stateToValidate.lockStartedAt !== 'number' ||
      typeof stateToValidate.originalDuration !== 'number'
    ) {
      console.error(
        'Lock mode validation failed: when isLocked=true, all time fields must be numbers'
      );
      return false;
    }

    // Additional sanity check: lockEndTime should be greater than lockStartedAt
    if (
      typeof stateToValidate.lockEndTime === 'number' &&
      typeof stateToValidate.lockStartedAt === 'number' &&
      stateToValidate.lockEndTime <= stateToValidate.lockStartedAt
    ) {
      console.error('Lock mode validation failed: lockEndTime must be greater than lockStartedAt');
      return false;
    }
  }

  return true;
}
