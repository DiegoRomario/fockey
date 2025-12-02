/**
 * Message types for communication between extension components
 * Used by service worker, popup, options page, and content scripts
 */

import { ExtensionSettings } from './settings';

/**
 * Message type identifiers for chrome.runtime.sendMessage
 */
export type MessageType =
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'RESET_SETTINGS'
  | 'RELOAD_CONTENT_SCRIPT'
  | 'SETTINGS_UPDATED';

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
 * Union type of all possible messages
 */
export type Message =
  | GetSettingsMessage
  | UpdateSettingsMessage
  | ResetSettingsMessage
  | ReloadContentScriptMessage
  | SettingsUpdatedMessage;

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
