/**
 * Early Shorts URL Blocker
 * Runs at document_start to immediately block Shorts URLs before page renders
 * This prevents any flickering or brief video playback before blocking
 * Also handles SPA navigation by monitoring URL changes
 */

(function () {
  // Only run on YouTube
  if (!window.location.hostname.includes('youtube.com')) {
    return;
  }

  /**
   * Check and block if current URL is a Shorts URL
   */
  function checkAndBlockShorts(): void {
    const isShortUrl = window.location.pathname.startsWith('/shorts/');

    if (!isShortUrl) {
      return;
    }

    // Get settings from chrome.storage.local (synchronous check with callback)
    // Use local storage for instant access (settings are synced there as fallback)
    chrome.storage.local.get('fockey_settings', (result) => {
      const settings = result.fockey_settings as Record<string, unknown> | undefined;

      // Default behavior: block Shorts URLs (minimalist principle)
      let shouldBlock = true;

      if (
        settings &&
        typeof settings === 'object' &&
        'youtube' in settings &&
        settings.youtube &&
        typeof settings.youtube === 'object' &&
        'globalNavigation' in settings.youtube &&
        settings.youtube.globalNavigation &&
        typeof settings.youtube.globalNavigation === 'object' &&
        'enableShortsUrls' in settings.youtube.globalNavigation &&
        settings.youtube.globalNavigation.enableShortsUrls === true
      ) {
        shouldBlock = false;
      }

      if (shouldBlock) {
        // Immediately redirect to blocked page before any content renders
        const params = new URLSearchParams({
          blockType: 'shorts',
          blockedUrl: window.location.href,
        });

        const blockedPageUrl = chrome.runtime.getURL(`blocked/index.html?${params.toString()}`);
        window.location.replace(blockedPageUrl);
      }
    });

    // Also try sync storage as backup (in case local isn't available yet)
    chrome.storage.sync.get('fockey_settings', (result) => {
      const settings = result.fockey_settings as Record<string, unknown> | undefined;

      // Only redirect if we haven't already been redirected
      if (window.location.pathname.startsWith('/shorts/')) {
        let shouldBlock = true;

        if (
          settings &&
          typeof settings === 'object' &&
          'youtube' in settings &&
          settings.youtube &&
          typeof settings.youtube === 'object' &&
          'globalNavigation' in settings.youtube &&
          settings.youtube.globalNavigation &&
          typeof settings.youtube.globalNavigation === 'object' &&
          'enableShortsUrls' in settings.youtube.globalNavigation &&
          settings.youtube.globalNavigation.enableShortsUrls === true
        ) {
          shouldBlock = false;
        }

        if (shouldBlock) {
          const params = new URLSearchParams({
            blockType: 'shorts',
            blockedUrl: window.location.href,
          });

          const blockedPageUrl = chrome.runtime.getURL(`blocked/index.html?${params.toString()}`);
          window.location.replace(blockedPageUrl);
        }
      }
    });
  }

  // Initial check on page load
  checkAndBlockShorts();

  // Monitor for SPA navigation (YouTube's custom navigation event)
  window.addEventListener('yt-navigate-start', () => {
    // Small delay to let URL update
    setTimeout(checkAndBlockShorts, 0);
  });

  // Also monitor History API changes (backup detection)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    setTimeout(checkAndBlockShorts, 0);
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    setTimeout(checkAndBlockShorts, 0);
  };

  // Monitor popstate (back/forward navigation)
  window.addEventListener('popstate', () => {
    setTimeout(checkAndBlockShorts, 0);
  });
})();
