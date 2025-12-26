/**
 * Content Type Detection Utilities
 * Helper functions to identify different YouTube content types in search results
 */

/**
 * Checks if an element is a Short video content
 * Shorts are displayed in special shelf renderers or as individual short renderers
 *
 * @param element - DOM element to check
 * @returns True if element is Short content, false otherwise
 */
export function isShortContent(element: Element | null | undefined): boolean {
  if (!element) return false;

  return element.matches(
    'ytd-reel-shelf-renderer, ytd-short-renderer, ytd-rich-shelf-renderer[is-shorts], ytd-grid-video-renderer[is-shorts], ytd-rich-item-renderer[is-shorts], ytd-reel-item-renderer, grid-shelf-view-model, ytm-shorts-lockup-view-model-v2, ytm-shorts-lockup-view-model, ytd-video-renderer:has(a[href*="/shorts/"])'
  );
}

/**
 * Checks if an element is a Community post
 * Community posts appear in search results with backstage post renderers
 *
 * @param element - DOM element to check
 * @returns True if element is a community post, false otherwise
 */
export function isCommunityPost(element: Element | null | undefined): boolean {
  if (!element) return false;

  return element.matches('ytd-backstage-post-thread-renderer, ytd-post-renderer');
}

/**
 * Checks if an element is a long-form video
 * Long-form videos are the primary search result type we want to preserve
 *
 * @param element - DOM element to check
 * @returns True if element is a long-form video, false otherwise
 */
export function isLongFormVideo(element: Element | null | undefined): boolean {
  if (!element) return false;

  return element.matches('ytd-video-renderer');
}

/**
 * Checks if an element is a Mix or auto-generated playlist
 * Mixes are algorithmic playlists that can be distracting
 *
 * @param element - DOM element to check
 * @returns True if element is a mix/playlist, false otherwise
 */
export function isMixPlaylist(element: Element | null | undefined): boolean {
  if (!element) return false;

  return element.matches('ytd-radio-renderer, yt-lockup-view-model:not(:has(ytd-video-renderer))');
}

/**
 * Checks if an element is sponsored/advertisement content
 * Sponsored content uses ad slot renderers
 *
 * @param element - DOM element to check
 * @returns True if element is sponsored content, false otherwise
 */
export function isSponsoredContent(element: Element | null | undefined): boolean {
  if (!element) return false;

  return element.matches('ytd-ad-slot-renderer');
}
