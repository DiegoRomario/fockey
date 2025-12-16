/**
 * Watch Page Module Wrapper
 * Implements ModuleInterface for the watch page
 * Wraps existing watch page functionality with standardized lifecycle
 */

import type { ModuleInterface, ModuleSettings } from '../types';
import type { WatchPageSettings, GlobalNavigationSettings } from '../../../shared/types/settings';
import { initWatchPageModule, cleanupWatchPageModule, applyWatchPageSettings } from '../watch-page';

/**
 * Watch page module instance implementing ModuleInterface
 */
class WatchPageModule implements ModuleInterface {
  private settings: WatchPageSettings | null = null;
  private globalNavigation: GlobalNavigationSettings | null = null;
  private isInitialized = false;

  /**
   * Initializes the watch page module
   */
  async init(settings: ModuleSettings): Promise<void> {
    this.settings = settings.pageSettings as WatchPageSettings;
    this.globalNavigation = settings.globalNavigation;
    this.isInitialized = true;
    await initWatchPageModule(this.settings, this.globalNavigation);
  }

  /**
   * Updates settings without full re-initialization
   * Enables hot reload when settings change
   */
  updateSettings(settings: ModuleSettings): void {
    this.settings = settings.pageSettings as WatchPageSettings;
    this.globalNavigation = settings.globalNavigation;
    if (this.isInitialized) {
      // Re-apply settings using existing functionality
      applyWatchPageSettings(this.settings, this.globalNavigation);
    }
  }

  /**
   * Cleans up all resources
   */
  destroy(): void {
    cleanupWatchPageModule();
    this.settings = null;
    this.globalNavigation = null;
    this.isInitialized = false;
  }
}

/**
 * Singleton instance export
 * Orchestrator will import and use this instance
 */
export const watchPageModule = new WatchPageModule();
