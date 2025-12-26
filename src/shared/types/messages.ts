/**
 * Message types for communication between extension components
 * Used by service worker, popup, options page, and content scripts
 */

import { ExtensionSettings, LockModeState } from './settings';

/**
 * Message type identifiers for chrome.runtime.sendMessage
 */
export type MessageType =
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'RESET_SETTINGS'
  | 'RELOAD_CONTENT_SCRIPT'
  | 'SETTINGS_UPDATED'
  | 'NAVIGATE_TO_HOME'
  | 'ACTIVATE_LOCK_MODE'
  | 'EXTEND_LOCK_MODE'
  | 'GET_LOCK_STATE'
  | 'LOCK_STATUS_CHANGED';

/**
 * Base message structure
 */
export interface BaseMessage {
  type: MessageType;
}

/**
 * Request to get current settings
 */
export interface GetSettingsMessage extends BaseMessage {
  type: 'GET_SETTINGS';
}

/**
 * Request to update settings
 */
export interface UpdateSettingsMessage extends BaseMessage {
  type: 'UPDATE_SETTINGS';
  partial: Partial<ExtensionSettings>;
}

/**
 * Request to reset settings to defaults
 */
export interface ResetSettingsMessage extends BaseMessage {
  type: 'RESET_SETTINGS';
}

/**
 * Request to reload content script on a specific tab
 */
export interface ReloadContentScriptMessage extends BaseMessage {
  type: 'RELOAD_CONTENT_SCRIPT';
  tabId?: number; // If not provided, reload all YouTube tabs
}

/**
 * Broadcast message when settings are updated
 * Sent from service worker to all content scripts
 */
export interface SettingsUpdatedMessage extends BaseMessage {
  type: 'SETTINGS_UPDATED';
  settings: ExtensionSettings;
}

/**
 * Request to navigate to YouTube home page
 * Sent from blocked page to service worker
 */
export interface NavigateToHomeMessage extends BaseMessage {
  type: 'NAVIGATE_TO_HOME';
}

/**
 * Request to activate lock mode
 * Sent from options page to service worker
 */
export interface ActivateLockModeMessage extends BaseMessage {
  type: 'ACTIVATE_LOCK_MODE';
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Request to extend active lock mode
 * Sent from options page to service worker
 * Only allows adding time, not shortening
 */
export interface ExtendLockModeMessage extends BaseMessage {
  type: 'EXTEND_LOCK_MODE';
  /** Additional duration to add in milliseconds */
  additionalMs: number;
}

/**
 * Request to get current lock mode state
 * Sent from popup/options to service worker
 */
export interface GetLockStateMessage extends BaseMessage {
  type: 'GET_LOCK_STATE';
}

/**
 * Broadcast message when lock status changes
 * Sent from service worker to popup and options page
 */
export interface LockStatusChangedMessage extends BaseMessage {
  type: 'LOCK_STATUS_CHANGED';
  lockState: LockModeState;
}

/**
 * Union type of all possible messages
 */
export type Message =
  | GetSettingsMessage
  | UpdateSettingsMessage
  | ResetSettingsMessage
  | ReloadContentScriptMessage
  | SettingsUpdatedMessage
  | NavigateToHomeMessage
  | ActivateLockModeMessage
  | ExtendLockModeMessage
  | GetLockStateMessage
  | LockStatusChangedMessage;

/**
 * Response structure for messages
 */
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Response for GET_SETTINGS
 */
export interface GetSettingsResponse extends MessageResponse<ExtensionSettings> {
  data: ExtensionSettings;
}

/**
 * Response for UPDATE_SETTINGS
 */
export interface UpdateSettingsResponse extends MessageResponse {
  success: boolean;
}

/**
 * Response for RESET_SETTINGS
 */
export interface ResetSettingsResponse extends MessageResponse<ExtensionSettings> {
  data: ExtensionSettings;
}

/**
 * Response for ACTIVATE_LOCK_MODE
 */
export interface ActivateLockModeResponse extends MessageResponse {
  success: boolean;
}

/**
 * Response for EXTEND_LOCK_MODE
 */
export interface ExtendLockModeResponse extends MessageResponse {
  success: boolean;
}

/**
 * Response for GET_LOCK_STATE
 */
export interface GetLockStateResponse extends MessageResponse<LockModeState> {
  data: LockModeState;
}
