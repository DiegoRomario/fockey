/**
 * Migration system for Fockey Chrome Extension settings
 * Handles schema version changes without data loss
 */

import { ExtensionSettings, DEFAULT_SETTINGS } from '../types/settings';

/**
 * Migration function signature
 * Takes settings from one version and transforms them to the next
 */
export interface Migration {
  /** Target version this migration upgrades to */
  version: string;
  /** Description of what this migration does */
  description: string;
  /** Migration function that transforms settings */
  up: (settings: ExtensionSettings) => ExtensionSettings;
}

/**
 * Registry of all migrations in chronological order
 * New migrations should be added to the end of this array
 */
export const MIGRATIONS: Migration[] = [
  {
    version: '1.1.0',
    description: 'Unify global navigation elements across all YouTube pages',
    up: (settings) => {
      // Migration needs to access old v1.0.0 structure which differs from current types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const oldSettings = settings as any;

      // Extract global navigation settings from old structure using OR logic (most permissive)
      // If ANY page had a navigation element shown, enable it globally
      const globalNavigation = {
        showLogo:
          oldSettings.youtube?.homePage?.showLogo ||
          oldSettings.youtube?.searchPage?.showLogo ||
          false,
        showSidebar:
          oldSettings.youtube?.homePage?.showSidebar ||
          oldSettings.youtube?.homePage?.showHamburger ||
          oldSettings.youtube?.searchPage?.showSidebar ||
          oldSettings.youtube?.searchPage?.showHamburger ||
          false,
        showProfile:
          oldSettings.youtube?.homePage?.showProfile ||
          oldSettings.youtube?.searchPage?.showProfile ||
          false,
        showNotifications:
          oldSettings.youtube?.homePage?.showNotifications ||
          oldSettings.youtube?.searchPage?.showNotifications ||
          false,
        enableHoverPreviews: oldSettings.youtube?.globalNavigation?.enableHoverPreviews ?? false,
      };

      // Remove global navigation fields from page-specific settings
      const homePage = {}; // Empty after extraction

      const searchPage = {
        showShorts: oldSettings.youtube?.searchPage?.showShorts ?? false,
        showCommunityPosts: oldSettings.youtube?.searchPage?.showCommunityPosts ?? false,
        showMixes: oldSettings.youtube?.searchPage?.showMixes ?? false,
        showSponsored: oldSettings.youtube?.searchPage?.showSponsored ?? false,
        blurThumbnails: oldSettings.youtube?.searchPage?.blurThumbnails ?? false,
      };

      return {
        version: '1.1.0',
        youtube: {
          enabled: oldSettings.youtube?.enabled ?? true,
          globalNavigation,
          homePage,
          searchPage,
          watchPage: oldSettings.youtube?.watchPage || DEFAULT_SETTINGS.youtube.watchPage,
          creatorProfilePage:
            oldSettings.youtube?.creatorProfilePage || DEFAULT_SETTINGS.youtube.creatorProfilePage,
        },
      };
    },
  },
];

/**
 * Compares two semver version strings
 *
 * @param v1 - First version string
 * @param v2 - Second version string
 * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }

  return 0;
}

/**
 * Runs all necessary migrations to bring settings up to current version
 *
 * @param settings - Current settings to migrate
 * @param fromVersion - Version of the settings
 * @param toVersion - Target version (usually DEFAULT_SETTINGS.version)
 * @returns Migrated settings at target version
 */
export async function runMigrations(
  settings: ExtensionSettings,
  fromVersion: string,
  toVersion: string
): Promise<ExtensionSettings> {
  // If versions match, no migration needed
  if (fromVersion === toVersion) {
    console.log('Settings already at current version, no migration needed');
    return settings;
  }

  // If target version is older, no migration needed (downgrade not supported)
  if (compareVersions(fromVersion, toVersion) > 0) {
    console.warn(
      `Settings version ${fromVersion} is newer than current ${toVersion}, no migration performed`
    );
    return settings;
  }

  console.log(`Migrating settings from ${fromVersion} to ${toVersion}`);

  // Find migrations that need to run
  const migrationsToRun = MIGRATIONS.filter((migration) => {
    const migrationVersion = migration.version;
    return (
      compareVersions(fromVersion, migrationVersion) < 0 &&
      compareVersions(migrationVersion, toVersion) <= 0
    );
  });

  if (migrationsToRun.length === 0) {
    console.log('No migrations found for version range, updating version only');
    return {
      ...settings,
      version: toVersion,
    };
  }

  // Run migrations in order
  let migratedSettings = { ...settings };

  for (const migration of migrationsToRun) {
    try {
      console.log(`Running migration to ${migration.version}: ${migration.description}`);
      migratedSettings = migration.up(migratedSettings);
      migratedSettings.version = migration.version;
    } catch (error) {
      console.error(`Migration to ${migration.version} failed:`, error);
      // On migration failure, return original settings
      throw new Error(`Migration to ${migration.version} failed: ${error}`);
    }
  }

  // Update to final target version
  migratedSettings.version = toVersion;

  console.log(`Successfully migrated settings to ${toVersion}`);
  return migratedSettings;
}

/**
 * Checks if settings need migration and runs migrations if necessary
 *
 * @param settings - Settings to check and potentially migrate
 * @returns Settings migrated to current version
 */
export async function checkAndMigrate(settings: ExtensionSettings): Promise<ExtensionSettings> {
  const currentVersion = settings.version;
  const targetVersion = DEFAULT_SETTINGS.version;

  if (currentVersion === targetVersion) {
    return settings;
  }

  return runMigrations(settings, currentVersion, targetVersion);
}
