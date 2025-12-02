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
  // Example migration from v1.0.0 to v1.1.0
  // {
  //   version: '1.1.0',
  //   description: 'Add new feature X settings',
  //   up: (settings) => {
  //     return {
  //       ...settings,
  //       youtube: {
  //         ...settings.youtube,
  //         homePage: {
  //           ...settings.youtube.homePage,
  //           showNewFeature: false, // New property with default value
  //         },
  //       },
  //     };
  //   },
  // },
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
    console.warn(`Settings version ${fromVersion} is newer than current ${toVersion}, no migration performed`);
    return settings;
  }

  console.log(`Migrating settings from ${fromVersion} to ${toVersion}`);

  // Find migrations that need to run
  const migrationsToRun = MIGRATIONS.filter((migration) => {
    const migrationVersion = migration.version;
    return compareVersions(fromVersion, migrationVersion) < 0 && compareVersions(migrationVersion, toVersion) <= 0;
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
