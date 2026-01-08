/**
 * General Blocker Content Script
 * Checks if the current page should be blocked based on active blocking schedules
 * Runs on all pages (not limited to YouTube)
 */

import { getSchedules } from '../shared/storage/settings-manager';
import { shouldBlockPage, formatTimePeriod, BlockReason } from '../shared/utils/schedule-utils';

// Track the last checked URL to avoid duplicate checks
let lastCheckedUrl: string | null = null;
let isBlocking = false; // Prevent multiple simultaneous blocks

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

    // Get all schedules
    const schedules = await getSchedules();

    if (schedules.length === 0) {
      // No schedules configured, nothing to block
      return;
    }

    // Check if page should be blocked (domain and URL keyword check only at this stage)
    const blockReason = shouldBlockPage(currentUrl, schedules);

    if (blockReason) {
      // Mark as blocking to prevent re-entry
      isBlocking = true;

      // Page should be blocked - redirect to blocked page IMMEDIATELY
      // Use replace() instead of assignment to prevent back button issues
      redirectToBlockedPage(blockReason, currentUrl);
    } else {
      // No immediate block - schedule content keyword check after page load
      scheduleContentKeywordCheck(currentUrl, schedules);
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
function scheduleContentKeywordCheck(
  url: string,
  schedules: import('../shared/types/settings').BlockingSchedule[]
): void {
  // Wait for page to fully load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkContentKeywords(url, schedules);
    });
  } else {
    // Document already loaded
    checkContentKeywords(url, schedules);
  }
}

/**
 * Checks if page content contains any blocked keywords
 */
function checkContentKeywords(
  url: string,
  schedules: import('../shared/types/settings').BlockingSchedule[]
): void {
  try {
    // Re-check with content keyword matching enabled
    const blockReason = shouldBlockPage(url, schedules, document);

    if (blockReason && blockReason.matchType === 'content_keyword') {
      // Content keyword matched - block the page
      redirectToBlockedPage(blockReason, url);
    }
  } catch (error) {
    console.error('[Fockey General Blocker] Error checking content keywords:', error);
  }
}

/**
 * Redirects to the blocked page with appropriate query parameters
 * CRITICAL: Uses aggressive blocking to prevent any page load/redirect
 */
function redirectToBlockedPage(blockReason: BlockReason, blockedUrl: string): void {
  const { schedule, matchType, matchedValue } = blockReason;

  // IMMEDIATELY stop any ongoing page load/redirect
  // This prevents server redirects from overriding our block
  try {
    window.stop(); // Stop document loading
  } catch {
    // window.stop() might not be available in all contexts
  }

  // Format time window for display
  let timeWindow = '';
  if (schedule.timePeriods.length > 0) {
    if (schedule.timePeriods.length === 1) {
      timeWindow = formatTimePeriod(schedule.timePeriods[0]);
    } else {
      timeWindow = `${schedule.timePeriods.length} time periods`;
    }
  }

  // Build blocked page URL with query parameters
  const params = new URLSearchParams({
    blockType: 'schedule',
    scheduleName: schedule.name,
    matchType: matchType,
    matchedValue: matchedValue,
    blockedUrl: blockedUrl,
  });

  if (timeWindow) {
    params.set('timeWindow', timeWindow);
  }

  // Redirect to blocked page using replace() to prevent back button issues
  const blockedPageUrl = chrome.runtime.getURL(`blocked/index.html?${params.toString()}`);
  window.location.replace(blockedPageUrl);
}

// ==================== INITIALIZATION ====================

/**
 * Immediately check and block synchronously (as much as possible)
 * This runs BEFORE any other initialization to catch blocks early
 */
(async function immediateCheck() {
  // Don't run on the blocked page itself
  if (window.location.href.includes('blocked/index.html')) {
    return;
  }

  try {
    // Get schedules immediately (this is the only async part we can't avoid)
    const schedules = await getSchedules();

    if (schedules.length === 0) {
      return;
    }

    const currentUrl = window.location.href;
    const blockReason = shouldBlockPage(currentUrl, schedules);

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
