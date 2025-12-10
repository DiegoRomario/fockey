/**
 * Watch Page Module Wrapper
 * Implements ModuleInterface for the watch page
 * Wraps existing watch page functionality with standardized lifecycle
 */

import type { ModuleInterface, PageSettings } from '../types';
import type { WatchPageSettings } from '../../../shared/types/settings';
import { initWatchPageModule, cleanupWatchPageModule, applyWatchPageSettings } from '../watch-page';

/**
 * Watch page module instance implementing ModuleInterface
 */
class WatchPageModule implements ModuleInterface {
  private settings: WatchPageSettings | null = null;
  private isInitialized = false;

  /**
   * Initializes the watch page module
   */
  async init(settings: PageSettings): Promise<void> {
    this.settings = settings as WatchPageSettings;
    this.isInitialized = true;
    await initWatchPageModule(this.settings);
  }

  /**
   * Updates settings without full re-initialization
   * Enables hot reload when settings change
   */
  updateSettings(settings: PageSettings): void {
    this.settings = settings as WatchPageSettings;
    if (this.isInitialized) {
      // Re-apply settings using existing functionality
      applyWatchPageSettings(this.settings);
    }
  }

  /**
   * Cleans up all resources
   */
  destroy(): void {
    cleanupWatchPageModule();
    this.settings = null;
    this.isInitialized = false;
  }
}

/**
 * Singleton instance export
 * Orchestrator will import and use this instance
 */
export const watchPageModule = new WatchPageModule();
