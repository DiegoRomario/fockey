/**
 * Early Content URL Blocker
 * Runs at document_start to immediately block Shorts and Posts URLs before page renders
 * This prevents any flickering or brief video playback before blocking
 * Also handles SPA navigation by monitoring URL changes
 */

(function () {
  // Only run on YouTube
  if (!window.location.hostname.includes('youtube.com')) {
    return;
  }

  /**
   * Check and block if current URL is a Shorts or Posts URL
   */
  function checkAndBlockContent(): void {
    const path = window.location.pathname;
    const isShortUrl = path.startsWith('/shorts/');
    const isPostUrl = path.startsWith('/post/');

    if (!isShortUrl && !isPostUrl) {
      return;
    }

    const blockType = isShortUrl ? 'shorts' : 'posts';
    const settingKey = isShortUrl ? 'enableShortsUrls' : 'enablePostsUrls';

    // Get settings from chrome.storage.local (synchronous check with callback)
    // Use local storage for instant access (settings are synced there as fallback)
    chrome.storage.local.get('fockey_settings', (result) => {
      const settings = result.fockey_settings as Record<string, unknown> | undefined;

      // Default behavior: block content URLs (minimalist principle)
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
        settingKey in settings.youtube.globalNavigation
      ) {
        const globalNav = settings.youtube.globalNavigation as Record<string, unknown>;
        if (globalNav[settingKey] === true) {
          shouldBlock = false;
        }
      }

      if (shouldBlock) {
        // Immediately redirect to blocked page before any content renders
        const params = new URLSearchParams({
          blockType: blockType,
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
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/shorts/') || currentPath.startsWith('/post/')) {
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
          settingKey in settings.youtube.globalNavigation
        ) {
          const globalNav = settings.youtube.globalNavigation as Record<string, unknown>;
          if (globalNav[settingKey] === true) {
            shouldBlock = false;
          }
        }

        if (shouldBlock) {
          const params = new URLSearchParams({
            blockType: blockType,
            blockedUrl: window.location.href,
          });

          const blockedPageUrl = chrome.runtime.getURL(`blocked/index.html?${params.toString()}`);
          window.location.replace(blockedPageUrl);
        }
      }
    });
  }

  // Initial check on page load
  checkAndBlockContent();

  // Monitor for SPA navigation (YouTube's custom navigation event)
  window.addEventListener('yt-navigate-start', () => {
    // Small delay to let URL update
    setTimeout(checkAndBlockContent, 0);
  });

  // Also monitor History API changes (backup detection)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    setTimeout(checkAndBlockContent, 0);
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    setTimeout(checkAndBlockContent, 0);
  };

  // Monitor popstate (back/forward navigation)
  window.addEventListener('popstate', () => {
    setTimeout(checkAndBlockContent, 0);
  });
})();
