/**
 * Search Page Module Wrapper
 * Implements ModuleInterface for the search page
 * Wraps existing search page functionality with standardized lifecycle
 */

import type { ModuleInterface, PageSettings } from '../types';
import type { SearchPageSettings } from '../../../shared/types/settings';
import {
  initSearchPageModule,
  cleanupSearchPageModule,
  applySearchPageSettings,
} from '../search-page';

/**
 * Search page module instance implementing ModuleInterface
 */
class SearchPageModule implements ModuleInterface {
  private settings: SearchPageSettings | null = null;
  private isInitialized = false;

  /**
   * Initializes the search page module
   */
  async init(settings: PageSettings): Promise<void> {
    this.settings = settings as SearchPageSettings;
    this.isInitialized = true;
    await initSearchPageModule(this.settings);
  }

  /**
   * Updates settings without full re-initialization
   * Enables hot reload when settings change
   */
  updateSettings(settings: PageSettings): void {
    this.settings = settings as SearchPageSettings;
    if (this.isInitialized) {
      // Re-apply settings using existing functionality
      applySearchPageSettings(this.settings);
    }
  }

  /**
   * Cleans up all resources
   */
  destroy(): void {
    cleanupSearchPageModule();
    this.settings = null;
    this.isInitialized = false;
  }
}

/**
 * Singleton instance export
 * Orchestrator will import and use this instance
 */
export const searchPageModule = new SearchPageModule();
