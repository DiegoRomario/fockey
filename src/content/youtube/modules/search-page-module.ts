/**
 * Search Page Module Wrapper
 * Implements ModuleInterface for the search page
 * Wraps existing search page functionality with standardized lifecycle
 */

import type { ModuleInterface, ModuleSettings } from '../types';
import type { SearchPageSettings, GlobalNavigationSettings } from '../../../shared/types/settings';
import {
  initSearchPageModule,
  cleanupSearchPageModule,
  applySearchPageSettings,
} from '../search-page';

/**
 * Search page module instance implementing ModuleInterface
 */
class SearchPageModule implements ModuleInterface {
  private pageSettings: SearchPageSettings | null = null;
  private globalNavigation: GlobalNavigationSettings | null = null;
  private isInitialized = false;

  /**
   * Initializes the search page module
   */
  async init(settings: ModuleSettings): Promise<void> {
    this.pageSettings = settings.pageSettings as SearchPageSettings;
    this.globalNavigation = settings.globalNavigation;
    this.isInitialized = true;
    await initSearchPageModule(this.pageSettings, this.globalNavigation);
  }

  /**
   * Updates settings without full re-initialization
   * Enables hot reload when settings change
   */
  updateSettings(settings: ModuleSettings): void {
    this.pageSettings = settings.pageSettings as SearchPageSettings;
    this.globalNavigation = settings.globalNavigation;
    if (this.isInitialized && this.globalNavigation) {
      // Re-apply settings using existing functionality
      applySearchPageSettings(this.pageSettings, this.globalNavigation);
    }
  }

  /**
   * Cleans up all resources
   */
  destroy(): void {
    cleanupSearchPageModule();
    this.pageSettings = null;
    this.globalNavigation = null;
    this.isInitialized = false;
  }
}

/**
 * Singleton instance export
 * Orchestrator will import and use this instance
 */
export const searchPageModule = new SearchPageModule();
