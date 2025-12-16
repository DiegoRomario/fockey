/**
 * Prevents YouTube hover autoplay previews on video thumbnails
 * Works by blocking inline player injection and removing hover event listeners
 */

const PREVIEW_SELECTORS = {
  // Video card containers across different page types
  VIDEO_CARDS: [
    'ytd-rich-item-renderer', // Home page grid items
    'ytd-video-renderer', // Search results
    'ytd-compact-video-renderer', // Watch page sidebar
    'ytd-grid-video-renderer', // Creator profile grids
    'ytd-playlist-video-renderer', // Playlist videos
  ].join(', '),

  // Inline player that gets injected on hover
  INLINE_PLAYER: 'ytd-video-preview-renderer',

  // Thumbnail element that triggers preview
  THUMBNAIL: '#thumbnail.ytd-thumbnail',
};

export class HoverPreviewBlocker {
  private enabled: boolean = true;
  private observer: MutationObserver | null = null;
  private cssInjected: boolean = false;
  private blockedCards: WeakMap<Element, (e: Event) => void> = new WeakMap();

  constructor(enablePreviews: boolean) {
    this.enabled = !enablePreviews; // Inverted: true = previews disabled
  }

  /**
   * Initialize hover preview blocking
   */
  public init(): void {
    if (this.enabled) {
      this.injectPreventionCSS();
      this.blockInlinePlayerInjection();
    }
  }

  /**
   * Update blocking state based on settings
   */
  public updateSettings(enablePreviews: boolean): void {
    const newBlockingState = !enablePreviews;

    if (this.enabled !== newBlockingState) {
      this.enabled = newBlockingState;

      if (this.enabled) {
        this.init();
      } else {
        this.cleanup();
      }
    }
  }

  /**
   * Inject CSS to prevent preview animations and inline player display
   */
  private injectPreventionCSS(): void {
    try {
      if (this.cssInjected) return;

      const style = document.createElement('style');
      style.id = 'fockey-hover-preview-blocker';
      style.textContent = `
      /* Prevent inline preview player from rendering */
      ytd-video-preview-renderer,
      ytd-video-preview {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      /* Disable hover animations on thumbnails */
      ${PREVIEW_SELECTORS.THUMBNAIL}:hover {
        transform: none !important;
        transition: none !important;
      }

      /* Prevent rich grid items from expanding on hover */
      ytd-rich-item-renderer:hover {
        transform: none !important;
      }
    `;

      document.head.appendChild(style);
      this.cssInjected = true;
    } catch (error) {
      console.error('[Fockey] Failed to inject hover preview CSS:', error);
    }
  }

  /**
   * Block inline player elements from being injected into DOM
   */
  private blockInlinePlayerInjection(): void {
    // Immediately remove any existing inline players
    this.removeInlinePlayers();

    // Observe and remove inline players as they're injected
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches?.(PREVIEW_SELECTORS.INLINE_PLAYER)) {
              node.remove();
            }
            // Check children for inline players
            const players = node.querySelectorAll?.(PREVIEW_SELECTORS.INLINE_PLAYER);
            players?.forEach((player) => player.remove());
          }
        });
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Remove existing inline preview players
   */
  private removeInlinePlayers(): void {
    const players = document.querySelectorAll(PREVIEW_SELECTORS.INLINE_PLAYER);
    players.forEach((player) => player.remove());
  }

  /**
   * Cleanup when previews are re-enabled
   */
  public cleanup(): void {
    // Remove CSS
    const style = document.getElementById('fockey-hover-preview-blocker');
    style?.remove();
    this.cssInjected = false;

    // Disconnect observer
    this.observer?.disconnect();
    this.observer = null;

    // Clear the WeakMap (garbage collection will handle the rest)
    this.blockedCards = new WeakMap();
  }
}
