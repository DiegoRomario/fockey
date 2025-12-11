/**
 * Type definitions for YouTube content script modules
 * Defines interfaces and enums for the module orchestration system
 */

import type {
  ExtensionSettings,
  GlobalNavigationSettings,
  HomePageSettings,
  SearchPageSettings,
  WatchPageSettings,
} from '../../shared/types/settings';

/**
 * Supported YouTube page types
 * Used by the orchestrator to determine which module to load
 */
export enum PageType {
  /** YouTube home/feed page (/) */
  HOME = 'home',
  /** Search results page (/results) */
  SEARCH = 'search',
  /** Video watch page (/watch) */
  WATCH = 'watch',
  /** Other YouTube pages (channel, playlist, etc.) */
  OTHER = 'other',
}

/**
 * Settings type for each page module
 * Maps PageType to its corresponding settings interface
 */
export type PageSettings = HomePageSettings | SearchPageSettings | WatchPageSettings;

/**
 * Complete module settings including both page-specific and global navigation
 * Passed to modules during initialization and updates
 */
export interface ModuleSettings {
  /** Page-specific settings */
  pageSettings: PageSettings;
  /** Global navigation settings (applies to all pages) */
  globalNavigation: GlobalNavigationSettings;
}

/**
 * Module interface that all page-specific modules must implement
 * Provides a consistent lifecycle API for initialization, updates, and cleanup
 */
export interface ModuleInterface {
  /**
   * Initializes the module with the given settings
   * Called when the user navigates to a page this module handles
   *
   * @param settings - Module settings including page-specific and global navigation settings
   * @returns Promise that resolves when initialization is complete
   * @throws Should handle errors gracefully and not break YouTube functionality
   */
  init(settings: ModuleSettings): Promise<void>;

  /**
   * Updates the module with new settings without full re-initialization
   * Called when settings change while the module is active
   * Enables hot-reload without page refresh
   *
   * @param settings - Updated module settings including page-specific and global navigation settings
   */
  updateSettings(settings: ModuleSettings): void;

  /**
   * Cleans up all resources used by the module
   * Called when navigating away from the page or when the module is disabled
   * Must remove all event listeners, observers, injected styles, etc.
   */
  destroy(): void;
}

/**
 * Module loader function type
 * Dynamically imports and returns a module instance
 */
export type ModuleLoader = () => Promise<ModuleInterface>;

/**
 * Module registry mapping page types to their loaders
 * Enables lazy loading of page-specific modules
 */
export interface ModuleRegistry {
  [PageType.HOME]: ModuleLoader;
  [PageType.SEARCH]: ModuleLoader;
  [PageType.WATCH]: ModuleLoader;
}

/**
 * Orchestrator state tracking
 */
export interface OrchestratorState {
  /** Currently loaded module instance */
  currentModule: ModuleInterface | null;
  /** Current page type */
  currentPageType: PageType | null;
  /** Current settings */
  currentSettings: ExtensionSettings | null;
  /** Service worker connection port for reconnection handling */
  serviceWorkerPort: chrome.runtime.Port | null;
}
