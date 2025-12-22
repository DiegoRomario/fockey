/* eslint-env browser */
/* global chrome */
/**
 * Blocked Page Script
 * Handles display of blocked channel information and navigation
 */

// Parse query parameters from URL
const params = new URLSearchParams(window.location.search);
const channelName = params.get('channelName') || 'Unknown Channel';
const blockedUrl = params.get('blockedUrl') || '';

// Update DOM with channel information
const channelNameElement = document.getElementById('channelName');
const blockedUrlElement = document.getElementById('blockedUrl');
const goBackButton = document.getElementById('goBackButton');

if (channelNameElement) {
  channelNameElement.textContent = channelName;
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
