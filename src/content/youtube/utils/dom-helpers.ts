/**
 * DOM Helper Utilities for YouTube Content Scripts
 * Reusable utilities for element waiting, CSS injection, and CSS removal
 */

/**
 * Waits for an element matching the selector to appear in the DOM
 * Uses MutationObserver to detect when element is added
 *
 * @param selector - CSS selector to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 5000ms)
 * @returns Promise that resolves with the element or rejects on timeout
 *
 * @example
 * const searchBar = await waitForElement('#search', 3000);
 */
export function waitForElement(selector: string, timeout: number = 5000): Promise<Element> {
  return new Promise((resolve, reject) => {
    // Check if element already exists
    const existingElement = document.querySelector(selector);
    if (existingElement) {
      resolve(existingElement);
      return;
    }

    // Set up timeout
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for element: ${selector}`));
    }, timeout);

    // Create MutationObserver to watch for element
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearTimeout(timeoutId);
        observer.disconnect();
        resolve(element);
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

/**
 * Injects CSS into the document head with a specific ID
 * If a style tag with the same ID exists, it updates the content
 * If not, it creates a new style tag
 *
 * @param css - CSS string to inject
 * @param id - Unique identifier for the style tag
 *
 * @example
 * injectCSS('.feed { display: none !important; }', 'fockey-home-styles');
 */
export function injectCSS(css: string, id: string): void {
  // Check if style tag already exists
  let styleTag = document.getElementById(id) as HTMLStyleElement | null;

  if (styleTag) {
    // Update existing style tag
    styleTag.textContent = css;
  } else {
    // Create new style tag
    styleTag = document.createElement('style');
    styleTag.id = id;
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
  }
}

/**
 * Removes a CSS style tag from the document head by ID
 *
 * @param id - ID of the style tag to remove
 *
 * @example
 * removeCSS('fockey-home-styles');
 */
export function removeCSS(id: string): void {
  const styleTag = document.getElementById(id);
  if (styleTag && styleTag.parentNode) {
    styleTag.parentNode.removeChild(styleTag);
  }
}

/**
 * Debounce utility function
 * Delays function execution until after a specified delay of inactivity
 *
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 *
 * @example
 * const debouncedResize = debounce(() => console.log('resized'), 200);
 * window.addEventListener('resize', debouncedResize);
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay) as unknown as number;
  };
}
