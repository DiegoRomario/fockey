/**
 * Channel Blocker Module
 * Handles blocking of YouTube channels across all surfaces
 */

import { BlockedChannel } from '../../../shared/types/settings';
import {
  isBlockedChannelUrl,
  isVideoFromBlockedChannel,
  getCurrentChannelInfo,
} from '../../../shared/utils/channel-utils';

/**
 * ChannelBlocker class
 * Manages channel blocking logic for content scripts
 */
export class ChannelBlocker {
  private blockedChannels: BlockedChannel[] = [];

  constructor(blockedChannels: BlockedChannel[]) {
    this.blockedChannels = blockedChannels;
  }

  /**
   * Check if current page should be blocked
   * Redirects to blocked.html if the current URL belongs to a blocked channel
   */
  public checkAndBlock(): void {
    const currentUrl = window.location.href;

    // Method 1: Check if URL directly points to a blocked channel (for channel pages)
    const blockedChannelFromUrl = isBlockedChannelUrl(currentUrl, this.blockedChannels);
    if (blockedChannelFromUrl) {
      this.redirectToBlockedPage(blockedChannelFromUrl, currentUrl);
      return;
    }

    // Method 2: For watch pages, extract channel from DOM
    if (currentUrl.includes('/watch')) {
      this.checkWatchPageWithRetry(currentUrl, 0);
    }
  }

  /**
   * Check watch page with retry mechanism for DOM loading
   * @param currentUrl - Current page URL
   * @param attemptCount - Current attempt number
   */
  private checkWatchPageWithRetry(currentUrl: string, attemptCount: number): void {
    const maxAttempts = 10; // Try for up to 1 second (10 attempts × 100ms)
    const retryDelay = 100; // 100ms between attempts

    const channelInfo = getCurrentChannelInfo();
    if (channelInfo) {
      // Check if this channel is blocked
      const blockedChannel = this.blockedChannels.find(
        (c) =>
          c.id === channelInfo.id ||
          c.handle === channelInfo.handle ||
          c.id.toLowerCase() === channelInfo.id.toLowerCase() ||
          c.handle.toLowerCase() === channelInfo.handle.toLowerCase()
      );

      if (blockedChannel) {
        this.redirectToBlockedPage(blockedChannel, currentUrl);
        return;
      }
    } else if (attemptCount < maxAttempts) {
      // DOM not ready yet, retry
      setTimeout(() => {
        this.checkWatchPageWithRetry(currentUrl, attemptCount + 1);
      }, retryDelay);
    }
  }

  /**
   * Redirect to blocked page with query parameters
   *
   * @param channel - Blocked channel info
   * @param blockedUrl - Original URL that was blocked
   */
  private redirectToBlockedPage(channel: BlockedChannel, blockedUrl: string): void {
    const params = new URLSearchParams({
      channelName: channel.name,
      blockedUrl: blockedUrl,
    });

    const blockedPageUrl = chrome.runtime.getURL(`blocked/index.html?${params.toString()}`);
    window.location.href = blockedPageUrl;
  }

  /**
   * Filter blocked channel content from DOM
   * Hides or removes videos from blocked channels in feeds and search results
   *
   * @param container - Container element to filter (e.g., feed, search results)
   */
  public filterContent(container: Element): void {
    // First, unhide all previously blocked content (in case channels were unblocked)
    const previouslyBlocked = container.querySelectorAll('[data-fockey-blocked="true"]');
    previouslyBlocked.forEach((element) => {
      (element as HTMLElement).style.display = '';
      element.removeAttribute('data-fockey-blocked');
    });

    // If no blocked channels, we're done (everything is now visible)
    if (this.blockedChannels.length === 0) {
      return;
    }

    // Video renderer selectors for different YouTube surfaces
    const videoSelectors = [
      'ytd-video-renderer', // Standard video item
      'ytd-grid-video-renderer', // Grid layout video
      'ytd-rich-item-renderer', // Home feed rich items
      'ytd-compact-video-renderer', // Compact video (sidebar)
      'ytd-playlist-video-renderer', // Playlist video
      'ytd-reel-item-renderer', // Shorts reel item
    ];

    // Find all video elements and hide those from blocked channels
    videoSelectors.forEach((selector) => {
      const videoElements = container.querySelectorAll(selector);

      videoElements.forEach((videoElement) => {
        if (isVideoFromBlockedChannel(videoElement, this.blockedChannels)) {
          // Hide the video element
          (videoElement as HTMLElement).style.display = 'none';

          // Also add a data attribute for debugging
          videoElement.setAttribute('data-fockey-blocked', 'true');
        }
      });
    });

    // Filter channel profile cards in search results
    const channelRenderers = container.querySelectorAll('ytd-channel-renderer');
    channelRenderers.forEach((channelElement) => {
      const channelLink = channelElement.querySelector(
        'a[href*="/@"], a[href*="/channel/"], a[href*="/c/"], a[href*="/user/"]'
      ) as HTMLAnchorElement;

      if (channelLink && channelLink.href) {
        const blockedChannel = isBlockedChannelUrl(channelLink.href, this.blockedChannels);
        if (blockedChannel) {
          (channelElement as HTMLElement).style.display = 'none';
          channelElement.setAttribute('data-fockey-blocked', 'true');
        }
      }
    });

    // Filter channel-specific content sections (e.g., "Latest from X", "Latest posts from X")
    const shelfRenderers = container.querySelectorAll('ytd-shelf-renderer');
    shelfRenderers.forEach((shelfElement) => {
      // Check if the shelf contains a link to a blocked channel
      const channelLink = shelfElement.querySelector(
        'a[href*="/@"], a[href*="/channel/"], a[href*="/c/"], a[href*="/user/"]'
      ) as HTMLAnchorElement;

      if (channelLink && channelLink.href) {
        const blockedChannel = isBlockedChannelUrl(channelLink.href, this.blockedChannels);
        if (blockedChannel) {
          (shelfElement as HTMLElement).style.display = 'none';
          shelfElement.setAttribute('data-fockey-blocked', 'true');
        }
      }
    });
  }

  /**
   * Update the blocked channels list
   * Called when settings change to keep the blocker in sync
   *
   * @param channels - Updated list of blocked channels
   */
  public updateBlockedChannels(channels: BlockedChannel[]): void {
    this.blockedChannels = channels;

    // Re-check if current page should now be blocked
    this.checkAndBlock();

    // Re-filter content on the page
    this.filterContent(document.body);
  }

  /**
   * Get count of currently blocked channels
   *
   * @returns Number of blocked channels
   */
  public getBlockedChannelCount(): number {
    return this.blockedChannels.length;
  }

  /**
   * Check if a specific channel is blocked
   *
   * @param channelId - Channel ID or handle to check
   * @returns True if channel is blocked
   */
  public isChannelBlocked(channelId: string): boolean {
    return this.blockedChannels.some(
      (c) =>
        c.id === channelId ||
        c.handle === channelId ||
        c.id.toLowerCase() === channelId.toLowerCase() ||
        c.handle.toLowerCase() === channelId.toLowerCase()
    );
  }
}
