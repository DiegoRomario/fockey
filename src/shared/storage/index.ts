/**
 * Storage module exports
 * Provides type-safe settings management API
 */

export {
  getSettings,
  updateSettings,
  resetToDefaults,
  watchSettings,
  addBlockedChannel,
  removeBlockedChannel,
  getLockModeStatus,
  activateLockMode,
  extendLockMode,
  unlockLockMode,
  isLockModeActive,
  getRemainingLockTime,
  getYouTubePauseStatus,
  isYouTubeModulePaused,
  pauseYouTubeModule,
  resumeYouTubeModule,
  getRemainingPauseTime,
  getSchedules,
  exportAllSettings,
  importAllSettings,
} from './settings-manager';
export { validateSettings, validateLockModeState } from './validation';
