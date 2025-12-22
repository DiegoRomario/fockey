/**
 * Channel Utilities
 * Helper functions for extracting, parsing, and validating YouTube channel information
 */

import { BlockedChannel } from '../types/settings';

/**
 * Extract channel ID or handle from various YouTube URL formats
 * Supports:
 * - @handle format: youtube.com/@MrBeast
 * - /c/ format: youtube.com/c/ChannelName
 * - /user/ format: youtube.com/user/Username
 * - /channel/ format: youtube.com/channel/UCxxxxxxxxxx
 * - Video URLs: youtube.com/watch?v=xxx (requires DOM parsing on page)
 *
 * @param url - YouTube URL to parse
 * @returns Channel ID or handle, or null if not found
 */
export function extractChannelId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Handle @handle format (e.g., youtube.com/@MrBeast)
    const handleMatch = urlObj.pathname.match(/^\/@([^/?]+)/);
    if (handleMatch) {
      return handleMatch[1]; // Return without @
    }

    // Handle /c/ format (e.g., youtube.com/c/ChannelName)
    const cMatch = urlObj.pathname.match(/^\/c\/([^/?]+)/);
    if (cMatch) {
      return cMatch[1];
    }

    // Handle /user/ format (e.g., youtube.com/user/Username)
    const userMatch = urlObj.pathname.match(/^\/user\/([^/?]+)/);
    if (userMatch) {
      return userMatch[1];
    }

    // Handle /channel/ format (e.g., youtube.com/channel/UCxxxxxxxxxx)
    const channelMatch = urlObj.pathname.match(/^\/channel\/([^/?]+)/);
    if (channelMatch) {
      return channelMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract channel information from current page DOM
 * Works on:
 * - Video watch pages (/watch)
 * - Channel pages (/@handle, /c/, /user/, /channel/)
 *
 * @returns Channel info object or null if not found
 */
export function getCurrentChannelInfo(): { id: string; handle: string; name: string } | null {
  try {
    const currentUrl = window.location.href;

    // Method 1: Check if we're on a channel page (URL-based detection)
    if (
      currentUrl.includes('/@') ||
      currentUrl.includes('/channel/') ||
      currentUrl.includes('/c/') ||
      currentUrl.includes('/user/')
    ) {
      const channelId = extractChannelId(currentUrl);
      if (channelId) {
        // Try multiple selectors for channel name on channel pages
        const channelName =
          document.querySelector('ytd-channel-name #text')?.textContent?.trim() ||
          document.querySelector('#channel-name')?.textContent?.trim() ||
          document.querySelector('#text.ytd-channel-name')?.textContent?.trim() ||
          document.querySelector('yt-formatted-string.ytd-channel-name')?.textContent?.trim() ||
          document.title.split(' - ')[0] ||
          channelId;

        return {
          id: channelId,
          handle: channelId,
          name: channelName,
        };
      }
    }

    // Method 2: Watch page - extract from video owner section
    if (currentUrl.includes('/watch')) {
      // Try multiple selectors for the channel link in the video owner section
      const channelLinkSelectors = [
        'ytd-video-owner-renderer a.yt-simple-endpoint[href*="/@"]',
        'ytd-video-owner-renderer a[href*="/channel/"]',
        'ytd-channel-name a',
        '#upload-info a[href*="/@"]',
        '#owner a[href*="/@"]',
        'ytd-video-owner-renderer yt-formatted-string a',
      ];

      for (const selector of channelLinkSelectors) {
        const channelLink = document.querySelector(selector) as HTMLAnchorElement;
        if (channelLink && channelLink.href) {
          const channelId = extractChannelId(channelLink.href);
          if (channelId) {
            // Try to get channel name from various locations
            const channelName =
              channelLink.textContent?.trim() ||
              document.querySelector('ytd-channel-name #text')?.textContent?.trim() ||
              document.querySelector('#upload-info #channel-name #text')?.textContent?.trim() ||
              document.querySelector('#owner #channel-name #text')?.textContent?.trim() ||
              channelId;

            return {
              id: channelId,
              handle: channelId,
              name: channelName,
            };
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('[Fockey] Error extracting channel info:', error);
    return null;
  }
}

/**
 * Check if a URL belongs to a blocked channel
 * Compares URL against blocked channel IDs and handles
 *
 * @param url - URL to check
 * @param blockedChannels - Array of blocked channels
 * @returns Blocked channel object if URL is blocked, null otherwise
 */
export function isBlockedChannelUrl(
  url: string,
  blockedChannels: BlockedChannel[]
): BlockedChannel | null {
  const channelId = extractChannelId(url);

  if (!channelId) {
    return null;
  }

  // Check if channel ID or handle matches any blocked channel
  return (
    blockedChannels.find(
      (channel) =>
        channel.id === channelId ||
        channel.handle === channelId ||
        channel.id.toLowerCase() === channelId.toLowerCase() ||
        channel.handle.toLowerCase() === channelId.toLowerCase()
    ) || null
  );
}

/**
 * Normalize channel input (handle, URL, or name) to canonical format
 * Extracts channel information from various input formats
 *
 * @param input - Channel handle, URL, or name
 * @returns Normalized channel info
 */
export function normalizeChannelInput(input: string): {
  id?: string;
  handle?: string;
  name: string;
} {
  const trimmedInput = input.trim();

  // Check if input is a URL
  if (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) {
    const channelId = extractChannelId(trimmedInput);
    if (channelId) {
      return {
        id: channelId,
        handle: channelId,
        name: channelId, // Use ID as name if we can't determine actual name
      };
    }
  }

  // Check if input is a handle (starts with @)
  if (trimmedInput.startsWith('@')) {
    const handle = trimmedInput.substring(1); // Remove @
    return {
      id: handle,
      handle: handle,
      name: handle,
    };
  }

  // Treat as plain text name/handle
  return {
    id: trimmedInput,
    handle: trimmedInput,
    name: trimmedInput,
  };
}

/**
 * Check if a video element belongs to a blocked channel
 * Used for filtering content in feeds and search results
 *
 * @param videoElement - Video renderer element from YouTube
 * @param blockedChannels - Array of blocked channels
 * @returns True if video is from a blocked channel
 */
export function isVideoFromBlockedChannel(
  videoElement: Element,
  blockedChannels: BlockedChannel[]
): boolean {
  try {
    // Try to find channel link in the video element
    const channelLink = videoElement.querySelector(
      'a[href*="/@"], a[href*="/channel/"], a[href*="/c/"], a[href*="/user/"]'
    ) as HTMLAnchorElement;

    if (channelLink && channelLink.href) {
      const channelId = extractChannelId(channelLink.href);
      if (channelId) {
        return blockedChannels.some(
          (channel) =>
            channel.id === channelId ||
            channel.handle === channelId ||
            channel.id.toLowerCase() === channelId.toLowerCase() ||
            channel.handle.toLowerCase() === channelId.toLowerCase()
        );
      }
    }

    return false;
  } catch {
    return false;
  }
}
