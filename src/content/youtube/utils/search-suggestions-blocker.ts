/**
 * Blocks YouTube search suggestions (autocomplete dropdown)
 * Prevents algorithmic nudges and distractions when using the search bar
 */

const SUGGESTIONS_SELECTORS = {
  // Search suggestions container (appears below search input)
  // IMPORTANT: Scoped to search area to avoid conflicts with other menus (e.g., More Actions overflow menu)
  SUGGESTIONS_CONTAINER: [
    'ytd-search-suggestions-renderer',
    'ytd-searchbox-suggestions-renderer',
    '#search-suggestions-container',
    '.ytSearchboxComponentSuggestionsContainer', // YouTube's search suggestions container
    '.ytSearchboxComponentSuggestionsContainerScrollable', // YouTube's scrollable suggestions
    '#center [role="listbox"]', // ARIA listbox scoped to search center area
    '#search [role="listbox"]', // ARIA listbox scoped to search container
    '.sbdd_b', // Google search suggestions container
    '.sbsb_b', // Alternative search suggestions container
  ].join(', '),

  // Individual suggestion items
  // IMPORTANT: Scoped to search area to avoid conflicts with other menu items
  SUGGESTION_ITEMS: [
    'ytd-search-suggestion-renderer',
    '#center [role="option"]', // ARIA option scoped to search center area
    '#search [role="option"]', // ARIA option scoped to search container
    'li.sbct', // Suggestion list items
    '.sbqs_c', // Suggestion query
  ].join(', '),

  // Search input element
  SEARCH_INPUT: [
    'input#search',
    'input[name="search_query"]',
    'input.ytSearchboxComponentInput',
  ].join(', '),
};

/**
 * SearchSuggestionsBlocker
 * Manages search suggestions visibility based on user settings
 */
export class SearchSuggestionsBlocker {
  private enabled: boolean = true;
  private observer: MutationObserver | null = null;
  private cssInjected: boolean = false;

  constructor(enableSuggestions: boolean) {
    this.enabled = !enableSuggestions; // Inverted: true = suggestions disabled
  }

  /**
   * Initialize search suggestions blocking
   */
  public init(): void {
    if (this.enabled) {
      this.injectBlockingCSS();
      this.observeSuggestionsContainer();
    }
  }

  /**
   * Update blocking state based on settings
   */
  public updateSettings(enableSuggestions: boolean): void {
    const newBlockingState = !enableSuggestions;

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
   * Inject CSS to hide search suggestions dropdown
   */
  private injectBlockingCSS(): void {
    try {
      if (this.cssInjected) return;

      const style = document.createElement('style');
      style.id = 'fockey-search-suggestions-blocker';
      style.textContent = `
      /* Hide search suggestions container */
      ${SUGGESTIONS_SELECTORS.SUGGESTIONS_CONTAINER} {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }

      /* Hide individual suggestion items */
      ${SUGGESTIONS_SELECTORS.SUGGESTION_ITEMS} {
        display: none !important;
        visibility: hidden !important;
      }

      /* Prevent suggestion dropdown from affecting layout */
      .sbdd_c,
      .sbsb_c {
        display: none !important;
      }
    `;

      document.head.appendChild(style);
      this.cssInjected = true;
    } catch (error) {
      console.error('[Fockey] Failed to inject search suggestions CSS:', error);
    }
  }

  /**
   * Observe and remove suggestions containers as they appear
   */
  private observeSuggestionsContainer(): void {
    // Immediately remove any existing suggestions
    this.removeSuggestions();

    // Observe and remove suggestions as they're injected
    this.observer = new MutationObserver((mutations) => {
      if (!this.enabled) return;

      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // Check if the node itself is a suggestions container
            if (
              node.matches?.(SUGGESTIONS_SELECTORS.SUGGESTIONS_CONTAINER) ||
              node.matches?.(SUGGESTIONS_SELECTORS.SUGGESTION_ITEMS)
            ) {
              node.style.display = 'none';
              node.style.visibility = 'hidden';
              node.style.pointerEvents = 'none';
            }

            // Check children for suggestions containers
            const containers = node.querySelectorAll?.(SUGGESTIONS_SELECTORS.SUGGESTIONS_CONTAINER);
            containers?.forEach((container) => {
              if (container instanceof HTMLElement) {
                container.style.display = 'none';
                container.style.visibility = 'hidden';
                container.style.pointerEvents = 'none';
              }
            });

            const items = node.querySelectorAll?.(SUGGESTIONS_SELECTORS.SUGGESTION_ITEMS);
            items?.forEach((item) => {
              if (item instanceof HTMLElement) {
                item.style.display = 'none';
                item.style.visibility = 'hidden';
              }
            });
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
   * Remove existing search suggestions
   */
  private removeSuggestions(): void {
    try {
      const containers = document.querySelectorAll(SUGGESTIONS_SELECTORS.SUGGESTIONS_CONTAINER);
      containers.forEach((container) => {
        if (container instanceof HTMLElement) {
          container.style.display = 'none';
          container.style.visibility = 'hidden';
          container.style.pointerEvents = 'none';
        }
      });

      const items = document.querySelectorAll(SUGGESTIONS_SELECTORS.SUGGESTION_ITEMS);
      items.forEach((item) => {
        if (item instanceof HTMLElement) {
          item.style.display = 'none';
          item.style.visibility = 'hidden';
        }
      });
    } catch (error) {
      console.error('[Fockey] Failed to remove search suggestions:', error);
    }
  }

  /**
   * Cleanup when suggestions are re-enabled
   */
  public cleanup(): void {
    // Remove CSS
    const style = document.getElementById('fockey-search-suggestions-blocker');
    style?.remove();
    this.cssInjected = false;

    // Disconnect observer
    this.observer?.disconnect();
    this.observer = null;

    // Restore suggestions visibility
    try {
      const containers = document.querySelectorAll(SUGGESTIONS_SELECTORS.SUGGESTIONS_CONTAINER);
      containers.forEach((container) => {
        if (container instanceof HTMLElement) {
          container.style.removeProperty('display');
          container.style.removeProperty('visibility');
          container.style.removeProperty('pointer-events');
        }
      });

      const items = document.querySelectorAll(SUGGESTIONS_SELECTORS.SUGGESTION_ITEMS);
      items.forEach((item) => {
        if (item instanceof HTMLElement) {
          item.style.removeProperty('display');
          item.style.removeProperty('visibility');
        }
      });
    } catch (error) {
      console.error('[Fockey] Failed to restore search suggestions:', error);
    }
  }
}
