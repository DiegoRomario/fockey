/**
 * General Blocker Content Script
 * Checks if the current page should be blocked based on active blocking schedules
 * Runs on all pages (not limited to YouTube)
 */

import { getSchedules } from '../shared/storage/settings-manager';
import { shouldBlockPage, formatTimePeriod, BlockReason } from '../shared/utils/schedule-utils';
import { shouldBlockByQuickBlock, QuickBlockReason } from '../shared/utils/quick-block-utils';

// Track the last checked URL to avoid duplicate checks
let lastCheckedUrl: string | null = null;
let isBlocking = false; // Prevent multiple simultaneous blocks

/**
 * Unified block reason type (quick or schedule)
 */
type UnifiedBlockReason =
  | { type: 'quick'; reason: QuickBlockReason }
  | { type: 'schedule'; reason: BlockReason };

/**
 * Checks all blocking rules in priority order:
 * 1. Quick Block session (temporary focus mode - highest priority)
 * 2. Schedule-based blocking (time-based rules)
 *
 * @param url - URL to check
 * @param document - Optional document for content keyword checking
 * @returns Unified block reason if blocked, null otherwise
 */
async function checkAllBlockingRules(
  url: string,
  document?: Document
): Promise<UnifiedBlockReason | null> {
  // PRIORITY 1: Check Quick Block session (temporary focus mode)
  const quickBlockReason = await shouldBlockByQuickBlock(url, document);

  if (quickBlockReason) {
    return { type: 'quick', reason: quickBlockReason };
  }

  // PRIORITY 2: Check schedules (time-based blocking)
  const schedules = await getSchedules();

  if (schedules.length > 0) {
    const scheduleBlockReason = shouldBlockPage(url, schedules, document);

    if (scheduleBlockReason) {
      return { type: 'schedule', reason: scheduleBlockReason };
    }
  }

  return null;
}

/**
 * Checks if the current page should be blocked and redirects if necessary
 * CRITICAL: This function runs synchronously at document_start to block BEFORE redirects
 * @param forceRecheck - Force recheck even if URL hasn't changed (for schedule updates)
 */
async function checkAndBlockPage(forceRecheck = false): Promise<void> {
  try {
    // Prevent re-entry if already blocking
    if (isBlocking) {
      return;
    }

    const currentUrl = window.location.href;

    // Skip if we already checked this exact URL (unless forced)
    if (!forceRecheck && currentUrl === lastCheckedUrl) {
      return;
    }

    lastCheckedUrl = currentUrl;

    // Check all blocking rules (permanent, quick, and schedules)
    // Note: Content keywords will be checked after page load
    const blockReason = await checkAllBlockingRules(currentUrl);

    if (blockReason) {
      // Mark as blocking to prevent re-entry
      isBlocking = true;

      // Page should be blocked - redirect to blocked page IMMEDIATELY
      redirectToBlockedPage(blockReason, currentUrl);
    } else {
      // No immediate block - schedule content keyword check after page load
      scheduleContentKeywordCheck(currentUrl);
    }
  } catch (error) {
    console.error('[Fockey General Blocker] Error checking page blocking:', error);
    isBlocking = false; // Reset on error
  }
}

/**
 * Schedules a content keyword check after the page has loaded
 * This allows the DOM to fully render before checking page content
 */
function scheduleContentKeywordCheck(url: string): void {
  // Wait for page to fully load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkContentKeywords(url);
    });
  } else {
    // Document already loaded
    checkContentKeywords(url);
  }
}

/**
 * Checks if page content contains any blocked keywords
 * Checks all blocking rules (quick, schedules) with document
 */
async function checkContentKeywords(url: string): Promise<void> {
  try {
    // Re-check all blocking rules with content keyword matching enabled
    const blockReason = await checkAllBlockingRules(url, document);

    if (blockReason) {
      // Check if it's a content keyword match
      const isContentKeyword =
        (blockReason.type === 'quick' &&
          blockReason.reason.matchType === 'quick_content_keyword') ||
        (blockReason.type === 'schedule' && blockReason.reason.matchType === 'content_keyword');

      if (isContentKeyword) {
        // Content keyword matched - block the page
        redirectToBlockedPage(blockReason, url);
      }
    }
  } catch (error) {
    console.error('[Fockey General Blocker] Error checking content keywords:', error);
  }
}

/**
 * Redirects to the blocked page with appropriate query parameters
 * CRITICAL: Uses aggressive blocking to prevent any page load/redirect
 * Handles quick and schedule-based blocks
 */
function redirectToBlockedPage(blockReason: UnifiedBlockReason, blockedUrl: string): void {
  // IMMEDIATELY stop any ongoing page load/redirect
  // This prevents server redirects from overriding our block
  try {
    window.stop(); // Stop document loading
  } catch {
    // window.stop() might not be available in all contexts
  }

  // Build query parameters based on block type
  const params = new URLSearchParams({
    blockedUrl: blockedUrl,
  });

  if (blockReason.type === 'quick') {
    // Quick Block session
    const { matchType, matchedValue, endTime } = blockReason.reason;

    params.set('blockType', 'quick');
    params.set('matchType', matchType);
    params.set('matchedValue', matchedValue);
    params.set('quickBlockEndTime', endTime.toString());
  } else {
    // Schedule-based block
    const { schedule, matchType, matchedValue } = blockReason.reason;

    // Format time window for display
    let timeWindow = '';
    if (schedule.timePeriods.length > 0) {
      if (schedule.timePeriods.length === 1) {
        timeWindow = formatTimePeriod(schedule.timePeriods[0]);
      } else {
        timeWindow = `${schedule.timePeriods.length} time periods`;
      }
    }

    params.set('blockType', 'schedule');
    params.set('scheduleName', schedule.name);
    params.set('matchType', matchType);
    params.set('matchedValue', matchedValue);

    if (timeWindow) {
      params.set('timeWindow', timeWindow);
    }
  }

  // Redirect to blocked page using replace() to prevent back button issues
  const blockedPageUrl = chrome.runtime.getURL(`blocked/index.html?${params.toString()}`);
  window.location.replace(blockedPageUrl);
}

// ==================== INITIALIZATION ====================

/**
 * Immediately check and block synchronously (as much as possible)
 * This runs BEFORE any other initialization to catch blocks early
 * Checks all blocking rules (quick, schedules)
 */
(async function immediateCheck() {
  // Don't run on the blocked page itself
  if (window.location.href.includes('blocked/index.html')) {
    return;
  }

  try {
    const currentUrl = window.location.href;

    // Check all blocking rules (quick and schedules)
    const blockReason = await checkAllBlockingRules(currentUrl);

    if (blockReason) {
      // CRITICAL: Block detected - stop everything immediately
      isBlocking = true;
      lastCheckedUrl = currentUrl;

      // Stop any ongoing page load
      try {
        window.stop();
      } catch {
        /* ignore */
      }

      // Immediately redirect
      redirectToBlockedPage(blockReason, currentUrl);
      return; // Exit early - page is blocked
    }
  } catch (error) {
    console.error('[Fockey General Blocker] Error in immediate check:', error);
  }
})();

/**
 * Initialize general blocker on page load
 * Only run if we're not already on the blocked page
 */
function init(): void {
  // Don't run on the blocked page itself
  if (window.location.href.includes('blocked/index.html')) {
    return;
  }

  // Secondary check after page loads (catches dynamic navigations)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Check for content keywords after page loads
      if (!isBlocking) {
        checkAndBlockPage();
      }
    });
  } else if (!isBlocking) {
    checkAndBlockPage();
  }
}

// Run initialization
init();

// Listen for URL changes in single-page applications
let lastUrl = window.location.href;

// Use MutationObserver to detect URL changes
const observer = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    checkAndBlockPage();
  }
});

// Observe changes to the document to detect navigation
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

// Also listen for popstate events (back/forward navigation)
window.addEventListener('popstate', () => {
  checkAndBlockPage();
});

// ==================== STORAGE SYNC ====================

/**
 * Listen for schedule changes in Chrome Storage
 * Automatically re-check blocking rules when schedules are updated
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  // Only process changes to settings in sync or local storage
  if (areaName === 'sync' || areaName === 'local') {
    if (changes.fockey_settings) {
      // Settings changed - force recheck of current page
      console.log('[Fockey General Blocker] Schedules updated, rechecking page...');
      lastCheckedUrl = null; // Reset to force recheck
      checkAndBlockPage(true);
    }
  }
});
