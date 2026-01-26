/**
 * Quick Block Session Utilities
 * Provides functions for managing Quick Block temporary focus sessions
 * Quick Block sessions are stored in chrome.storage.local (device-specific)
 */

import {
  QuickBlockSession,
  DEFAULT_QUICK_BLOCK_SESSION,
  normalizeContentKeywords,
} from '../types/settings';
import { matchesDomain } from './domain-utils';

// Storage key for Quick Block session (local storage only, not synced)
const QUICK_BLOCK_SESSION_KEY = 'fockey_quick_block_session';

// ==================== HELPER FUNCTIONS ====================

/**
 * Checks if a URL contains any of the provided keywords (case-insensitive)
 *
 * @param url - URL to check
 * @param keywords - Array of keywords to search for
 * @returns The matched keyword if found, null otherwise
 */
function matchesUrlKeyword(url: string, keywords: string[]): string | null {
  const lowerUrl = url.toLowerCase();
  for (const keyword of keywords) {
    if (lowerUrl.includes(keyword.toLowerCase())) {
      return keyword;
    }
  }
  return null;
}

/**
 * Checks if page content contains any of the provided keywords (case-insensitive)
 *
 * @param keywords - Array of content keywords to search for
 * @param document - Document to search within
 * @returns The matched keyword if found, null otherwise
 */
function matchesContentKeyword(
  keywords: (string | { keyword: string; blockEntireSite?: boolean })[],
  document: Document
): string | null {
  // Normalize keywords in case they're in old ContentKeywordRule[] format
  const normalizedKeywords = normalizeContentKeywords(keywords);

  // Extract visible text content from the page
  const textContent = (document.body?.textContent || '').toLowerCase();

  for (const keyword of normalizedKeywords) {
    if (textContent.includes(keyword.toLowerCase())) {
      return keyword;
    }
  }

  return null;
}

// ==================== STORAGE OPERATIONS ====================

/**
 * Gets the current Quick Block session from local storage
 *
 * @returns Current Quick Block session
 */
export async function getQuickBlockSession(): Promise<QuickBlockSession> {
  try {
    const result = await chrome.storage.local.get(QUICK_BLOCK_SESSION_KEY);
    const session = result[QUICK_BLOCK_SESSION_KEY] as QuickBlockSession | undefined;

    if (!session) {
      return { ...DEFAULT_QUICK_BLOCK_SESSION };
    }

    // Validate and normalize session structure
    // Handle backwards compatibility: convert old ContentKeywordRule[] to string[]
    const rawContentKeywords = Array.isArray(session.contentKeywords)
      ? session.contentKeywords
      : [];
    const normalizedContentKeywords = normalizeContentKeywords(rawContentKeywords);

    return {
      isActive: session.isActive ?? false,
      startTime: session.startTime ?? null,
      endTime: session.endTime ?? null,
      blockedDomains: Array.isArray(session.blockedDomains) ? session.blockedDomains : [],
      urlKeywords: Array.isArray(session.urlKeywords) ? session.urlKeywords : [],
      contentKeywords: normalizedContentKeywords,
    };
  } catch (error) {
    console.error('[Quick Block] Error loading session:', error);
    return { ...DEFAULT_QUICK_BLOCK_SESSION };
  }
}

/**
 * Saves the Quick Block session to local storage
 *
 * @param session - Quick Block session to save
 */
export async function setQuickBlockSession(session: QuickBlockSession): Promise<void> {
  try {
    await chrome.storage.local.set({
      [QUICK_BLOCK_SESSION_KEY]: session,
    });
  } catch (error) {
    console.error('[Quick Block] Error saving session:', error);
    throw error;
  }
}

/**
 * Clears the Quick Block session (resets to default)
 */
export async function clearQuickBlockSession(): Promise<void> {
  await setQuickBlockSession({ ...DEFAULT_QUICK_BLOCK_SESSION });
}

/**
 * Updates just the blocking items (domains, URL keywords, content keywords) without
 * affecting the active session state. This allows users to configure items for later
 * use or add new items during an active session.
 *
 * IMPORTANT: This saves to BOTH settings (for export) AND session (for runtime use)
 *
 * @param blockedDomains - Domains to block
 * @param urlKeywords - URL keywords to block
 * @param contentKeywords - Content keywords to block
 * @returns The updated Quick Block session
 */
export async function updateQuickBlockItems(
  blockedDomains: string[],
  urlKeywords: string[],
  contentKeywords: string[]
): Promise<QuickBlockSession> {
  // Import settings functions dynamically to avoid circular dependency
  const { getSettings, updateSettings } = await import('../storage/settings-manager');

  // Update settings (for export)
  const settings = await getSettings();
  await updateSettings({
    general: {
      ...settings.general,
      quickBlock: {
        blockedDomains,
        urlKeywords,
        contentKeywords,
      },
    },
  });

  // Update session (for runtime use)
  const session = await getQuickBlockSession();
  const updatedSession: QuickBlockSession = {
    ...session,
    blockedDomains,
    urlKeywords,
    contentKeywords,
  };

  await setQuickBlockSession(updatedSession);
  return updatedSession;
}

// ==================== SESSION MANAGEMENT ====================

/**
 * Loads Quick Block configuration from settings
 * Used to sync session with saved configuration
 *
 * @returns Quick Block configuration from settings
 */
export async function loadQuickBlockConfigFromSettings(): Promise<{
  blockedDomains: string[];
  urlKeywords: string[];
  contentKeywords: string[];
}> {
  const { getSettings } = await import('../storage/settings-manager');
  const settings = await getSettings();

  return {
    blockedDomains: settings.general.quickBlock.blockedDomains,
    urlKeywords: settings.general.quickBlock.urlKeywords,
    contentKeywords: settings.general.quickBlock.contentKeywords,
  };
}

/**
 * Starts a Quick Block session with specified duration and blocking rules
 * If no blocking rules are provided, loads them from settings
 *
 * @param durationMs - Duration in milliseconds, or null for indefinite blocking
 * @param blockedDomains - Domains to block (optional, loads from settings if not provided)
 * @param urlKeywords - URL keywords to block (optional, loads from settings if not provided)
 * @param contentKeywords - Content keywords to block (optional, loads from settings if not provided)
 * @returns The started Quick Block session
 */
export async function startQuickBlockSession(
  durationMs: number | null,
  blockedDomains?: string[],
  urlKeywords?: string[],
  contentKeywords?: string[]
): Promise<QuickBlockSession> {
  // Load from settings if not provided
  const config = await loadQuickBlockConfigFromSettings();

  const now = Date.now();
  const session: QuickBlockSession = {
    isActive: true,
    startTime: now,
    endTime: durationMs !== null ? now + durationMs : null,
    blockedDomains: blockedDomains ?? config.blockedDomains,
    urlKeywords: urlKeywords ?? config.urlKeywords,
    contentKeywords: contentKeywords ?? config.contentKeywords,
  };

  await setQuickBlockSession(session);

  // Schedule automatic end of session (only if endTime is defined)
  if (session.endTime) {
    chrome.alarms.create('quick_block_end', {
      when: session.endTime,
    });
  }

  return session;
}

/**
 * Extends the current Quick Block session by adding more time
 *
 * @param additionalMs - Additional time in milliseconds
 * @returns Updated Quick Block session
 */
export async function extendQuickBlockSession(additionalMs: number): Promise<QuickBlockSession> {
  const session = await getQuickBlockSession();

  if (!session.isActive) {
    throw new Error('Cannot extend inactive Quick Block session');
  }

  // Add time to end
  const newEndTime = (session.endTime || Date.now()) + additionalMs;

  const updatedSession: QuickBlockSession = {
    ...session,
    endTime: newEndTime,
  };

  await setQuickBlockSession(updatedSession);

  // Update alarm
  chrome.alarms.clear('quick_block_end');
  if (newEndTime) {
    chrome.alarms.create('quick_block_end', {
      when: newEndTime,
    });
  }

  return updatedSession;
}

/**
 * Ends the current Quick Block session
 * Can only be called when session has expired or manually ended (not blocked by Lock Mode)
 * IMPORTANT: This preserves the blocked items (domains/keywords) so they can be reused
 * in future sessions. Only the active state and timing information are cleared.
 */
export async function endQuickBlockSession(): Promise<void> {
  // Get current session to preserve blocked items
  const session = await getQuickBlockSession();

  // Clear only the active state and timing, preserve blocked items for reuse
  const updatedSession: QuickBlockSession = {
    isActive: false,
    startTime: null,
    endTime: null,
    blockedDomains: session.blockedDomains, // Preserve for reuse
    urlKeywords: session.urlKeywords, // Preserve for reuse
    contentKeywords: session.contentKeywords, // Preserve for reuse
  };

  await setQuickBlockSession(updatedSession);

  // Clear alarm
  chrome.alarms.clear('quick_block_end');
}

/**
 * Checks if Quick Block session is currently active and valid
 * Automatically ends session if expired
 *
 * @returns True if session is active and not expired
 */
export async function isQuickBlockActive(): Promise<boolean> {
  const session = await getQuickBlockSession();

  if (!session.isActive) {
    return false;
  }

  // Check if session has expired
  if (session.endTime && Date.now() >= session.endTime) {
    // Session expired - automatically end it
    await endQuickBlockSession();
    return false;
  }

  return true;
}

/**
 * Gets remaining time in current Quick Block session
 *
 * @returns Remaining milliseconds, or 0 if not active
 */
export async function getQuickBlockRemainingTime(): Promise<number> {
  const session = await getQuickBlockSession();

  if (!session.isActive || !session.endTime) {
    return 0;
  }

  const remaining = session.endTime - Date.now();
  return Math.max(0, remaining);
}

// ==================== BLOCK CHECKING ====================

/**
 * Block reason returned when a page should be blocked by Quick Block
 */
export interface QuickBlockReason {
  /** Type of match that triggered the block */
  matchType: 'quick_domain' | 'quick_url_keyword' | 'quick_content_keyword';
  /** Specific matched value (domain name or keyword) */
  matchedValue: string;
  /** End time of Quick Block session */
  endTime: number;
}

/**
 * Checks if a URL should be blocked by active Quick Block session
 * Returns block reason if blocked, null otherwise
 *
 * @param url - URL to check
 * @param document - Optional document for content keyword matching
 * @returns Block reason if blocked, null otherwise
 */
export async function shouldBlockByQuickBlock(
  url: string,
  document?: Document
): Promise<QuickBlockReason | null> {
  // Check if Quick Block is active
  const isActive = await isQuickBlockActive();

  if (!isActive) {
    return null;
  }

  const session = await getQuickBlockSession();

  // Check domain blocking
  if (session.blockedDomains.length > 0) {
    for (const domain of session.blockedDomains) {
      if (matchesDomain(url, domain)) {
        return {
          matchType: 'quick_domain',
          matchedValue: domain,
          endTime: session.endTime || Date.now(),
        };
      }
    }
  }

  // Check URL keywords
  if (session.urlKeywords.length > 0) {
    const matchedKeyword = matchesUrlKeyword(url, session.urlKeywords);
    if (matchedKeyword) {
      return {
        matchType: 'quick_url_keyword',
        matchedValue: matchedKeyword,
        endTime: session.endTime || Date.now(),
      };
    }
  }

  // Check content keywords (only if document is provided)
  if (document && session.contentKeywords.length > 0) {
    const matchedKeyword = matchesContentKeyword(session.contentKeywords, document);
    if (matchedKeyword) {
      return {
        matchType: 'quick_content_keyword',
        matchedValue: matchedKeyword,
        endTime: session.endTime || Date.now(),
      };
    }
  }

  return null;
}

// ==================== TIME FORMATTING ====================

/**
 * Formats milliseconds as a human-readable duration
 * Examples:
 *   formatDuration(90000) → "1m 30s"
 *   formatDuration(3600000) → "1h 0m"
 *   formatDuration(86400000) → "1d 0h"
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }

  return `${seconds}s`;
}

/**
 * Parses duration presets to milliseconds
 *
 * @param preset - Preset name ('25min', '1hr', '24hrs', or custom number + unit)
 * @returns Duration in milliseconds
 */
export function parseDurationPreset(preset: string): number {
  switch (preset) {
    case '25min':
      return 25 * 60 * 1000;
    case '1hr':
      return 60 * 60 * 1000;
    case '24hrs':
      return 24 * 60 * 60 * 1000;
    default: {
      // Try to parse custom format (e.g., "30min", "2hr", "3hrs")
      const match = preset.match(/^(\d+)(min|hr|hrs)$/);
      if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2];

        if (unit === 'min') {
          return value * 60 * 1000;
        } else if (unit === 'hr' || unit === 'hrs') {
          return value * 60 * 60 * 1000;
        }
      }
      throw new Error(`Invalid duration preset: ${preset}`);
    }
  }
}
