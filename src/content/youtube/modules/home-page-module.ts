/**
 * Home Page Module Wrapper
 * Implements ModuleInterface for the home page
 * Wraps existing home page functionality with standardized lifecycle
 */

import type { ModuleInterface, ModuleSettings } from '../types';
import type {
  HomePageSettings,
  GlobalNavigationSettings,
  SearchPageSettings,
} from '../../../shared/types/settings';
import { initHomePageModule, cleanupHomePageModule, applyHomePageSettings } from '../home-page';

/**
 * Home page module instance implementing ModuleInterface
 */
class HomePageModule implements ModuleInterface {
  private pageSettings: HomePageSettings | null = null;
  private globalNavigation: GlobalNavigationSettings | null = null;
  private searchPageSettings: SearchPageSettings | null = null;
  private isInitialized = false;

  /**
   * Initializes the home page module
   */
  async init(settings: ModuleSettings): Promise<void> {
    this.pageSettings = settings.pageSettings as HomePageSettings;
    this.globalNavigation = settings.globalNavigation;
    this.searchPageSettings = settings.searchPageSettings;
    this.isInitialized = true;
    await initHomePageModule(this.pageSettings, this.globalNavigation, this.searchPageSettings);
  }

  /**
   * Updates settings without full re-initialization
   * Enables hot reload when settings change
   */
  updateSettings(settings: ModuleSettings): void {
    this.pageSettings = settings.pageSettings as HomePageSettings;
    this.globalNavigation = settings.globalNavigation;
    this.searchPageSettings = settings.searchPageSettings;
    if (this.isInitialized && this.globalNavigation) {
      // Re-apply settings using existing functionality
      applyHomePageSettings(this.pageSettings, this.globalNavigation, this.searchPageSettings);
    }
  }

  /**
   * Cleans up all resources
   */
  destroy(): void {
    cleanupHomePageModule();
    this.pageSettings = null;
    this.globalNavigation = null;
    this.searchPageSettings = null;
    this.isInitialized = false;
  }
}

/**
 * Singleton instance export
 * Orchestrator will import and use this instance
 */
export const homePageModule = new HomePageModule();
