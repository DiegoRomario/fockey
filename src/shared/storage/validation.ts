/**
 * Settings validation utilities for Fockey Chrome Extension
 * Ensures data integrity and prevents corrupted settings
 */

import {
  ExtensionSettings,
  HomePageSettings,
  SearchPageSettings,
  WatchPageSettings,
  YouTubeModuleSettings,
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
 * Validates HomePageSettings structure
 */
function validateHomePageSettings(settings: unknown): settings is HomePageSettings {
  return validateBooleanObject(settings, [
    'showLogo',
    'showHamburger',
    'showSidebar',
    'showProfile',
    'showNotifications',
  ]);
}

/**
 * Validates SearchPageSettings structure
 */
function validateSearchPageSettings(settings: unknown): settings is SearchPageSettings {
  return validateBooleanObject(settings, ['showShorts', 'showCommunityPosts', 'blurThumbnails']);
}

/**
 * Validates WatchPageSettings structure
 */
function validateWatchPageSettings(settings: unknown): settings is WatchPageSettings {
  return validateBooleanObject(settings, [
    'showLikeDislike',
    'showShare',
    'showSave',
    'showDownload',
    'showClip',
    'showSubscribe',
    'showJoin',
    'showComments',
    'showLiveChat',
    'showRelated',
    'showPlaylists',
    'showEndScreen',
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
