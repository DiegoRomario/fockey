/* eslint-env browser */
/* global chrome */
/**
 * Blocked Page Script
 * Handles display of blocked channel, shorts, posts, and schedule-based blocking information
 */

// Parse query parameters from URL
const params = new URLSearchParams(window.location.search);
const blockType = params.get('blockType') || 'channel'; // 'channel', 'shorts', 'posts', 'schedule', 'permanent', or 'quick'
const channelName = params.get('channelName') || 'Unknown Channel';
const blockedUrl = params.get('blockedUrl') || '';

// Common parameters for all general blocking types
const matchType = params.get('matchType') || ''; // 'domain', 'url_keyword', 'content_keyword', etc.
const matchedValue = params.get('matchedValue') || '';

// Schedule-specific parameters
const scheduleName = params.get('scheduleName') || 'Unknown Schedule';
const timeWindow = params.get('timeWindow') || '';

// Quick Block-specific parameters
const quickBlockEndTime = params.get('quickBlockEndTime') || '';

// Update DOM with block information
const blockMessageElement = document.getElementById('blockMessage');
const channelNameElement = document.getElementById('channelName');
const blockedUrlElement = document.getElementById('blockedUrl');
const goBackButton = document.getElementById('goBackButton');

/**
 * Formats remaining time from timestamp
 */
function formatRemainingTime(endTimeMs) {
  const now = Date.now();
  const remaining = endTimeMs - now;

  if (remaining <= 0) {
    return 'expired';
  }

  const seconds = Math.floor(remaining / 1000);
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
 * Gets appropriate reason text based on match type
 */
function getReasonText(matchType, matchedValue) {
  // Handle match types for all blocking rules (permanent, quick, schedule)
  if (matchType === 'domain' || matchType === 'permanent_domain' || matchType === 'quick_domain') {
    return `This domain (<strong>${matchedValue}</strong>) is blocked`;
  } else if (
    matchType === 'url_keyword' ||
    matchType === 'permanent_url_keyword' ||
    matchType === 'quick_url_keyword'
  ) {
    return `This URL contains the blocked keyword: <strong>${matchedValue}</strong>`;
  } else if (
    matchType === 'content_keyword' ||
    matchType === 'permanent_content_keyword' ||
    matchType === 'quick_content_keyword'
  ) {
    return `This page contains the blocked keyword: <strong>${matchedValue}</strong>`;
  } else {
    return 'This page is blocked';
  }
}

// Update message based on block type
if (blockType === 'quick') {
  // Quick Block session
  const reasonText = getReasonText(matchType, matchedValue);

  // Calculate and display remaining time
  const endTime = parseInt(quickBlockEndTime, 10);
  const remainingTime = formatRemainingTime(endTime);

  if (blockMessageElement) {
    blockMessageElement.innerHTML = `
      ${reasonText} by <strong>Quick Block</strong>.
      <br><small style="opacity: 0.8;" id="quickBlockTimer">Session ends in ${remainingTime}</small>
    `;

    // Update timer every second
    const timerElement = document.getElementById('quickBlockTimer');
    if (timerElement && remainingTime !== 'expired') {
      setInterval(() => {
        const remaining = formatRemainingTime(endTime);
        if (remaining === 'expired') {
          timerElement.textContent = 'Session expired';
        } else {
          timerElement.textContent = `Session ends in ${remaining}`;
        }
      }, 1000);
    }
  }
} else if (blockType === 'schedule') {
  // Schedule-based blocking
  const reasonText = getReasonText(matchType, matchedValue);

  if (blockMessageElement) {
    blockMessageElement.innerHTML = `
      ${reasonText} by schedule <strong>${scheduleName}</strong>.
      ${timeWindow ? `<br><small style="opacity: 0.8;">Active: ${timeWindow}</small>` : ''}
    `;
  }
} else if (blockType === 'shorts') {
  if (blockMessageElement) {
    blockMessageElement.innerHTML = 'YouTube Shorts are blocked.';
  }
} else if (blockType === 'posts') {
  if (blockMessageElement) {
    blockMessageElement.innerHTML = 'YouTube Posts are blocked.';
  }
} else {
  // Channel block (default behavior)
  if (channelNameElement) {
    channelNameElement.textContent = channelName;
  }
}

if (blockedUrlElement) {
  blockedUrlElement.textContent = blockedUrl;
}

// Handle "Go Back" button click
if (goBackButton) {
  goBackButton.addEventListener('click', () => {
    // Send message to background service worker to navigate back or to home
    if (blockType === 'schedule' || blockType === 'permanent' || blockType === 'quick') {
      // For general blocking (schedules, permanent, quick), just go back in history
      window.history.back();
    } else {
      // For YouTube-specific blocks (channel, shorts, posts), navigate to YouTube home
      chrome.runtime.sendMessage({
        type: 'NAVIGATE_TO_HOME',
      });
    }
  });
}
