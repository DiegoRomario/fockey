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
    // Match Shorts URLs: /shorts, /shorts/VIDEO_ID, or /@channel/shorts
    const isShortUrl =
      path === '/shorts' || path.startsWith('/shorts/') || path.endsWith('/shorts');
    // Match Posts URLs: /post/POST_ID or /@channel/posts
    const isPostUrl = path.startsWith('/post/') || path.endsWith('/posts');

    if (!isShortUrl && !isPostUrl) {
      return;
    }

    const blockType = isShortUrl ? 'shorts' : 'posts';
    const settingKey = isShortUrl ? 'enableShorts' : 'enablePosts';

    // Try sync storage first (primary storage), then fallback to local if sync fails
    chrome.storage.sync.get('fockey_settings', (syncResult) => {
      // If sync storage has settings, use them
      if (syncResult.fockey_settings) {
        const settings = syncResult.fockey_settings as Record<string, unknown>;
        evaluateAndBlock(settings, blockType, settingKey);
      } else {
        // Fallback to local storage if sync storage is empty
        chrome.storage.local.get('fockey_settings', (localResult) => {
          const settings = localResult.fockey_settings as Record<string, unknown> | undefined;
          evaluateAndBlock(settings, blockType, settingKey);
        });
      }
    });
  }

  /**
   * Evaluates settings and blocks content if necessary
   */
  function evaluateAndBlock(
    settings: Record<string, unknown> | undefined,
    blockType: string,
    settingKey: string
  ): void {
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
