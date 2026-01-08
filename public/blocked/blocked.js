/* eslint-env browser */
/* global chrome */
/**
 * Blocked Page Script
 * Handles display of blocked channel, shorts, posts, and schedule-based blocking information
 */

// Parse query parameters from URL
const params = new URLSearchParams(window.location.search);
const blockType = params.get('blockType') || 'channel'; // 'channel', 'shorts', 'posts', or 'schedule'
const channelName = params.get('channelName') || 'Unknown Channel';
const blockedUrl = params.get('blockedUrl') || '';

// Schedule-specific parameters
const scheduleName = params.get('scheduleName') || 'Unknown Schedule';
const matchType = params.get('matchType') || ''; // 'domain', 'url_keyword', 'content_keyword'
const matchedValue = params.get('matchedValue') || '';
const timeWindow = params.get('timeWindow') || '';

// Update DOM with block information
const blockMessageElement = document.getElementById('blockMessage');
const channelNameElement = document.getElementById('channelName');
const blockedUrlElement = document.getElementById('blockedUrl');
const goBackButton = document.getElementById('goBackButton');

// Update message based on block type
if (blockType === 'schedule') {
  // Schedule-based blocking
  let reasonText = '';

  if (matchType === 'domain') {
    reasonText = `This domain (<strong>${matchedValue}</strong>) is blocked`;
  } else if (matchType === 'url_keyword') {
    reasonText = `This URL contains the blocked keyword: <strong>${matchedValue}</strong>`;
  } else if (matchType === 'content_keyword') {
    reasonText = `This page contains the blocked keyword: <strong>${matchedValue}</strong>`;
  } else {
    reasonText = 'This page is blocked';
  }

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
    if (blockType === 'schedule') {
      // For schedule blocks, just go back in history
      window.history.back();
    } else {
      // For YouTube-specific blocks, navigate to YouTube home
      chrome.runtime.sendMessage({
        type: 'NAVIGATE_TO_HOME',
      });
    }
  });
}
