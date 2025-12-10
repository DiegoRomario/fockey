/**
 * Home Page Module Wrapper
 * Implements ModuleInterface for the home page
 * Wraps existing home page functionality with standardized lifecycle
 */

import type { ModuleInterface, PageSettings } from '../types';
import type { HomePageSettings } from '../../../shared/types/settings';
import { initHomePageModule, cleanupHomePageModule, applyHomePageSettings } from '../home-page';

/**
 * Home page module instance implementing ModuleInterface
 */
class HomePageModule implements ModuleInterface {
  private settings: HomePageSettings | null = null;
  private isInitialized = false;

  /**
   * Initializes the home page module
   */
  async init(settings: PageSettings): Promise<void> {
    this.settings = settings as HomePageSettings;
    this.isInitialized = true;
    await initHomePageModule(this.settings);
  }

  /**
   * Updates settings without full re-initialization
   * Enables hot reload when settings change
   */
  updateSettings(settings: PageSettings): void {
    this.settings = settings as HomePageSettings;
    if (this.isInitialized) {
      // Re-apply settings using existing functionality
      applyHomePageSettings(this.settings);
    }
  }

  /**
   * Cleans up all resources
   */
  destroy(): void {
    cleanupHomePageModule();
    this.settings = null;
    this.isInitialized = false;
  }
}

/**
 * Singleton instance export
 * Orchestrator will import and use this instance
 */
export const homePageModule = new HomePageModule();
