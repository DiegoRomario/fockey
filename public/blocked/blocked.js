/* eslint-env browser */
/* global chrome */
/**
 * Blocked Page Script
 * Handles display of blocked channel information and navigation
 */

// Parse query parameters from URL
const params = new URLSearchParams(window.location.search);
const blockType = params.get('blockType') || 'channel'; // 'channel' or 'shorts'
const channelName = params.get('channelName') || 'Unknown Channel';
const blockedUrl = params.get('blockedUrl') || '';

// Update DOM with block information
const blockMessageElement = document.getElementById('blockMessage');
const channelNameElement = document.getElementById('channelName');
const blockedUrlElement = document.getElementById('blockedUrl');
const goBackButton = document.getElementById('goBackButton');

// Update message based on block type
if (blockType === 'shorts') {
  if (blockMessageElement) {
    blockMessageElement.innerHTML = 'YouTube Shorts are blocked.';
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
    // Send message to background service worker to navigate to YouTube home
    chrome.runtime.sendMessage({
      type: 'NAVIGATE_TO_HOME',
    });
  });
}
