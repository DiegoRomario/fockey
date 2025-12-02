/**
 * Storage module exports
 * Provides type-safe settings management API
 */

export { getSettings, updateSettings, resetToDefaults, watchSettings } from './settings-manager';
export { validateSettings } from './validation';
export { checkAndMigrate, runMigrations, type Migration } from './migrations';
