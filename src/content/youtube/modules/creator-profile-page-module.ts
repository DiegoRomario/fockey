/**
 * Creator Profile Page Module Wrapper
 * Implements ModuleInterface for the creator profile page
 * Wraps existing creator profile page functionality with standardized lifecycle
 */

import type { ModuleInterface, ModuleSettings } from '../types';
import type {
  CreatorProfilePageSettings,
  GlobalNavigationSettings,
} from '../../../shared/types/settings';
import {
  initCreatorProfileModule,
  cleanupCreatorProfileModule,
  applyCreatorProfileSettings,
} from '../creator-profile-page';

/**
 * Creator profile page module instance implementing ModuleInterface
 */
class CreatorProfilePageModule implements ModuleInterface {
  private pageSettings: CreatorProfilePageSettings | null = null;
  private globalNavigation: GlobalNavigationSettings | null = null;
  private isInitialized = false;

  /**
   * Initializes the creator profile page module
   */
  async init(settings: ModuleSettings): Promise<void> {
    this.pageSettings = settings.pageSettings as CreatorProfilePageSettings;
    this.globalNavigation = settings.globalNavigation;
    this.isInitialized = true;
    await initCreatorProfileModule(this.pageSettings, this.globalNavigation);
  }

  /**
   * Updates settings without full re-initialization
   * Enables hot reload when settings change
   */
  updateSettings(settings: ModuleSettings): void {
    this.pageSettings = settings.pageSettings as CreatorProfilePageSettings;
    this.globalNavigation = settings.globalNavigation;
    if (this.isInitialized && this.globalNavigation) {
      // Re-apply settings using existing functionality
      applyCreatorProfileSettings(this.pageSettings, this.globalNavigation);
    }
  }

  /**
   * Cleans up all resources
   */
  destroy(): void {
    cleanupCreatorProfileModule();
    this.pageSettings = null;
    this.globalNavigation = null;
    this.isInitialized = false;
  }
}

/**
 * Singleton instance export
 * Orchestrator will import and use this instance
 */
export const creatorProfilePageModule = new CreatorProfilePageModule();
