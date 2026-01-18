/**
 * General Blocker Content Script
 * Checks if the current page should be blocked based on active blocking schedules
 * Runs on all pages (not limited to YouTube)
 */

import { getSchedules } from '../shared/storage/settings-manager';
import {
  shouldBlockPage,
  formatTimePeriod,
  BlockReason,
  getActiveSchedules,
} from '../shared/utils/schedule-utils';
import {
  shouldBlockByQuickBlock,
  QuickBlockReason,
  getQuickBlockSession,
  isQuickBlockActive,
} from '../shared/utils/quick-block-utils';

// Track the last checked URL to avoid duplicate checks
let lastCheckedUrl: string | null = null;
let isBlocking = false; // Prevent multiple simultaneous blocks

// CSS class name for blocked elements
const BLOCKED_ELEMENT_CLASS = 'fockey-blocked-element';
const BLOCKED_OVERLAY_CLASS = 'fockey-blocked-overlay';
const STYLES_INJECTED_ATTR = 'data-fockey-styles-injected';

// Track which keywords are being used for element-level blocking
let elementBlockingKeywords: string[] = [];

// ==================== ELEMENT-LEVEL BLOCKING ====================

/**
 * Injects CSS styles for element-level blocking into the page
 */
function injectBlockingStyles(): void {
  // Only inject once
  if (document.documentElement.hasAttribute(STYLES_INJECTED_ATTR)) {
    return;
  }

  const style = document.createElement('style');
  style.textContent = `
    .${BLOCKED_ELEMENT_CLASS} {
      position: relative !important;
      filter: blur(8px) !important;
      pointer-events: none !important;
      user-select: none !important;
      opacity: 0.6 !important;
      transition: filter 0.3s ease, opacity 0.3s ease !important;
    }

    .${BLOCKED_ELEMENT_CLASS}::before {
      content: '' !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0, 0, 0, 0.1) !important;
      z-index: 1000 !important;
      pointer-events: none !important;
    }

    .${BLOCKED_OVERLAY_CLASS} {
      position: absolute !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      background: rgba(0, 0, 0, 0.8) !important;
      color: white !important;
      padding: 8px 16px !important;
      border-radius: 4px !important;
      font-size: 12px !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      z-index: 1001 !important;
      pointer-events: none !important;
      white-space: nowrap !important;
    }
  `;
  document.head.appendChild(style);
  document.documentElement.setAttribute(STYLES_INJECTED_ATTR, 'true');
}

// ==================== ELEMENT DETECTION ====================

/**
 * Tags that are inline elements - too small to be good containers
 */
const INLINE_TAGS = new Set([
  'SPAN',
  'A',
  'STRONG',
  'EM',
  'B',
  'I',
  'U',
  'MARK',
  'SMALL',
  'SUB',
  'SUP',
  'LABEL',
  'TIME',
  'CODE',
]);

/**
 * Structural tags where we should stop walking up - these are page-level containers
 */
const STOP_TAGS = new Set([
  'MAIN',
  'HEADER',
  'FOOTER',
  'NAV',
  'BODY',
  'HTML',
  'SECTION',
  'ARTICLE',
]);

/**
 * Media element tags
 */
const MEDIA_TAGS = new Set(['IMG', 'VIDEO', 'AUDIO', 'PICTURE', 'IFRAME']);

/**
 * Attributes to check for keywords in media elements
 */
const MEDIA_ATTRIBUTES = ['src', 'srcset', 'href', 'alt', 'title', 'aria-label', 'data-src'];

/**
 * Finds all media elements in the document that contain a keyword in their metadata
 *
 * @param keyword - The keyword to search for (case-insensitive)
 * @param doc - Document to search in
 * @returns Array of media elements with keyword in metadata
 */
function findMediaElementsWithKeyword(keyword: string, doc: Document): Element[] {
  const lowerKeyword = keyword.toLowerCase();
  const matchingElements: Element[] = [];

  // Search all media elements
  for (const tag of MEDIA_TAGS) {
    const elements = doc.querySelectorAll(tag);
    for (const element of elements) {
      for (const attr of MEDIA_ATTRIBUTES) {
        const value = element.getAttribute(attr);
        if (value && value.toLowerCase().includes(lowerKeyword)) {
          matchingElements.push(element);
          break;
        }
      }
    }
  }

  return matchingElements;
}

/**
 * Finds DOM elements that contain a specific keyword in their text content
 * Returns the first reasonable parent element for each text match
 *
 * @param keyword - The keyword to search for
 * @param doc - Document to search in
 * @returns Array of elements containing the keyword
 */
function findTextElementsContainingKeyword(keyword: string, doc: Document): Element[] {
  const lowerKeyword = keyword.toLowerCase();
  const matchingElements: Set<Element> = new Set();

  // Find text nodes containing the keyword using TreeWalker
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const text = node.textContent?.toLowerCase() || '';
      if (text.includes(lowerKeyword)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_REJECT;
    },
  });

  let textNode: Node | null;
  while ((textNode = walker.nextNode()) !== null) {
    const container = findImmediateContainer(textNode);
    if (container) {
      matchingElements.add(container);
    }
  }

  return Array.from(matchingElements);
}

/**
 * Finds the immediate reasonable container for a text node
 * Walks up only until we find a non-inline element
 * Stops at structural/page-level elements to avoid blocking too much
 *
 * @param node - The text node
 * @returns The immediate container element to blur
 */
function findImmediateContainer(node: Node): Element | null {
  let current: Node | null = node.parentNode;
  let depth = 0;
  const MAX_DEPTH = 5; // Only walk up a few levels

  while (current && depth < MAX_DEPTH) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const element = current as Element;
      const tagName = element.tagName;

      // Stop at structural elements - don't block these
      if (STOP_TAGS.has(tagName)) {
        return null;
      }

      // Skip inline tags, keep walking up
      if (INLINE_TAGS.has(tagName)) {
        current = current.parentNode;
        depth++;
        continue;
      }

      // Found a reasonable block-level container
      return element;
    }

    current = current.parentNode;
    depth++;
  }

  return null;
}

/**
 * Finds all elements to block for a keyword:
 * 1. Text elements containing the keyword
 * 2. Media elements (images, videos) with keyword in their metadata
 *
 * @param keyword - The keyword to search for
 * @param doc - Document to search in
 * @returns Array of elements to block
 */
function findElementsContainingKeyword(keyword: string, doc: Document): Element[] {
  const allElements: Set<Element> = new Set();

  // 1. Find text elements
  const textElements = findTextElementsContainingKeyword(keyword, doc);
  for (const el of textElements) {
    allElements.add(el);
  }

  // 2. Find media elements with keyword in metadata (block images directly)
  const mediaElements = findMediaElementsWithKeyword(keyword, doc);
  for (const media of mediaElements) {
    allElements.add(media);
  }

  // Remove nested duplicates (if a parent is already blocked, don't block children)
  const result: Element[] = [];
  for (const element of allElements) {
    let isNested = false;
    for (const other of allElements) {
      if (other !== element && other.contains(element)) {
        isNested = true;
        break;
      }
    }
    if (!isNested) {
      result.push(element);
    }
  }

  return result;
}

/**
 * Applies blur effect to elements containing blocked keywords
 *
 * @param elements - Elements to blur
 * @param keyword - The keyword that triggered the block
 */
function applyElementBlocking(elements: Element[], keyword: string): void {
  injectBlockingStyles();

  for (const element of elements) {
    // Skip if already blocked
    if (element.classList.contains(BLOCKED_ELEMENT_CLASS)) {
      continue;
    }

    // Add blocking class
    element.classList.add(BLOCKED_ELEMENT_CLASS);

    // Ensure the element has position for overlay positioning
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.position === 'static') {
      (element as HTMLElement).style.position = 'relative';
    }

    // Store the keyword that blocked this element
    element.setAttribute('data-fockey-blocked-keyword', keyword);
  }
}

/**
 * Removes blocking effect from all blocked elements
 */
function removeAllElementBlocking(): void {
  const blockedElements = document.querySelectorAll(`.${BLOCKED_ELEMENT_CLASS}`);
  blockedElements.forEach((element) => {
    element.classList.remove(BLOCKED_ELEMENT_CLASS);
    element.removeAttribute('data-fockey-blocked-keyword');
  });

  // Remove overlays
  const overlays = document.querySelectorAll(`.${BLOCKED_OVERLAY_CLASS}`);
  overlays.forEach((overlay) => overlay.remove());

  elementBlockingKeywords = [];
}

/**
 * Applies element-level blocking for all configured content keywords
 * Only blocks elements, does not redirect
 *
 * @param keywords - Keywords to block at element level
 */
function applyElementLevelBlocking(keywords: string[]): void {
  if (keywords.length === 0) {
    return;
  }

  elementBlockingKeywords = keywords;

  for (const keyword of keywords) {
    const elements = findElementsContainingKeyword(keyword, document);
    if (elements.length > 0) {
      applyElementBlocking(elements, keyword);
      console.log(
        `[Fockey] Blocked ${elements.length} element(s) containing keyword: "${keyword}"`
      );
    }
  }
}

/**
 * Re-scans the page for content keywords and applies element blocking
 * Used by MutationObserver for dynamic content
 */
function rescanForElementBlocking(): void {
  if (elementBlockingKeywords.length === 0) {
    return;
  }

  for (const keyword of elementBlockingKeywords) {
    const elements = findElementsContainingKeyword(keyword, document);
    applyElementBlocking(elements, keyword);
  }
}

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
      scheduleContentKeywordCheck();
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
function scheduleContentKeywordCheck(): void {
  // Wait for page to fully load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkContentKeywords();
    });
  } else {
    // Document already loaded
    checkContentKeywords();
  }
}

/**
 * Collects all content keywords from active schedules and Quick Block
 * All content keywords are element-level only (no full-site blocking)
 */
async function collectContentKeywords(): Promise<string[]> {
  const keywords: string[] = [];

  // Get Quick Block session keywords
  const quickBlockActive = await isQuickBlockActive();
  if (quickBlockActive) {
    const session = await getQuickBlockSession();
    keywords.push(...session.contentKeywords);
  }

  // Get Schedule keywords
  const schedules = await getSchedules();
  const activeSchedules = getActiveSchedules(schedules);
  for (const schedule of activeSchedules) {
    keywords.push(...schedule.contentKeywords);
  }

  // Remove duplicates
  return [...new Set(keywords)];
}

/**
 * Checks if page content contains any blocked keywords
 * Applies element-level blocking (blurs elements containing keywords)
 * Content keywords never redirect - they only block specific elements
 */
async function checkContentKeywords(): Promise<void> {
  try {
    // Collect all content keywords
    const keywords = await collectContentKeywords();

    // Apply element-level blocking for all content keywords
    if (keywords.length > 0) {
      applyElementLevelBlocking(keywords);
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

// Use MutationObserver to detect URL changes and dynamic content
let rescanDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const observer = new MutationObserver((mutations) => {
  const currentUrl = window.location.href;

  // Check for URL changes (SPA navigation)
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    // Clear element blocking on navigation
    removeAllElementBlocking();
    checkAndBlockPage();
    return;
  }

  // Check if there are element-level keywords to scan for
  if (elementBlockingKeywords.length > 0) {
    // Debounce the rescan to avoid excessive processing
    if (rescanDebounceTimer) {
      clearTimeout(rescanDebounceTimer);
    }

    // Only rescan if there were actual content additions
    const hasNewContent = mutations.some(
      (mutation) =>
        mutation.type === 'childList' &&
        mutation.addedNodes.length > 0 &&
        Array.from(mutation.addedNodes).some(
          (node) => node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE
        )
    );

    if (hasNewContent) {
      rescanDebounceTimer = setTimeout(() => {
        rescanForElementBlocking();
      }, 500); // Debounce for 500ms
    }
  }
});

// Observe changes to the document to detect navigation and dynamic content
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

// Also listen for popstate events (back/forward navigation)
window.addEventListener('popstate', () => {
  checkAndBlockPage();
});

// ==================== STORAGE SYNC ====================

// Storage keys to watch for changes
const QUICK_BLOCK_SESSION_KEY = 'fockey_quick_block_session';
const SETTINGS_KEY = 'fockey_settings';

/**
 * Reactively reapplies element-level blocking when rules change
 * This function is called when Quick Block or Schedule settings change
 */
async function reactiveRescanForBlocking(): Promise<void> {
  // Don't run on blocked page
  if (window.location.href.includes('blocked/index.html')) {
    return;
  }

  console.log('[Fockey General Blocker] Rules changed, reactively rescanning page...');

  // Clear existing element blocking
  removeAllElementBlocking();

  // Collect new content keywords and apply element-level blocking
  const keywords = await collectContentKeywords();
  if (keywords.length > 0) {
    applyElementLevelBlocking(keywords);
  }

  // Check if any domain/URL blocking rules now apply (not content keywords)
  const url = window.location.href;
  const blockReason = await checkAllBlockingRules(url);

  if (blockReason) {
    // Check for domain or URL keyword blocks (content keywords don't redirect)
    const isNonContentBlock =
      (blockReason.type === 'quick' && blockReason.reason.matchType !== 'quick_content_keyword') ||
      (blockReason.type === 'schedule' && blockReason.reason.matchType !== 'content_keyword');

    if (isNonContentBlock) {
      // Block the page for domain/URL keyword matches
      redirectToBlockedPage(blockReason, url);
    }
  }
}

/**
 * Listen for storage changes to reactively update blocking
 * Handles both Quick Block session changes and Schedule changes
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  // Don't process on blocked page
  if (window.location.href.includes('blocked/index.html')) {
    return;
  }

  // Track if we need to rescan
  let shouldRescan = false;

  // Check for Quick Block session changes (local storage)
  if (areaName === 'local' && changes[QUICK_BLOCK_SESSION_KEY]) {
    console.log('[Fockey General Blocker] Quick Block session changed');
    shouldRescan = true;
  }

  // Check for Settings/Schedules changes (sync storage)
  if (areaName === 'sync' && changes[SETTINGS_KEY]) {
    console.log('[Fockey General Blocker] Schedules updated');
    shouldRescan = true;
  }

  // Also check local storage for settings (fallback if sync is disabled)
  if (areaName === 'local' && changes[SETTINGS_KEY]) {
    console.log('[Fockey General Blocker] Settings updated (local)');
    shouldRescan = true;
  }

  if (shouldRescan) {
    // Reset last checked URL to allow re-checking
    lastCheckedUrl = null;

    // Reactively rescan the page
    reactiveRescanForBlocking();
  }
});
