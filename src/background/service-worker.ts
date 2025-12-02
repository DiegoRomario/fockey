// Service Worker for Fockey Chrome Extension

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Fockey extension installed:', details.reason);

  // Initialize default settings
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      minimalistMode: true,
      homePageSettings: {
        showLogo: false,
        showSidebar: false,
        showProfile: false,
        showNotifications: false,
      },
      searchPageSettings: {
        showShorts: false,
        showPosts: false,
        blurThumbnails: false,
      },
      watchPageSettings: {
        showEngagement: false,
        showComments: false,
        showRecommendations: false,
        showSubscribe: false,
      },
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  sendResponse({ received: true });
  return true;
});
