/**
 * YouTube Critical CSS Injector
 *
 * Runs at document_start to prevent FOUC (Flash of Unstyled Content).
 * Only injects critical.css if YouTube module is NOT paused.
 *
 * When paused: No CSS injection → YouTube remains 100% original
 * When active: Injects CSS immediately → Minimalist mode applied
 */

const YOUTUBE_PAUSE_STATE_KEY = 'fockey_youtube_pause_state';

/**
 * Inject critical CSS into the page
 */
async function injectCriticalCSS(): Promise<void> {
  try {
    // Fetch the critical CSS file
    const cssUrl = chrome.runtime.getURL('src/content/critical.css');
    const response = await fetch(cssUrl);
    const cssText = await response.text();

    // Create and inject style element
    const styleElement = document.createElement('style');
    styleElement.id = 'fockey-critical-css';
    styleElement.textContent = cssText;

    // Inject as early as possible
    (document.head || document.documentElement).appendChild(styleElement);

    console.log('[Fockey] Critical CSS injected');
  } catch (error) {
    console.error('[Fockey] Failed to inject critical CSS:', error);
  }
}

/**
 * Check pause state and conditionally inject CSS
 */
async function initialize(): Promise<void> {
  try {
    // Check if YouTube module is paused
    const result = await chrome.storage.local.get(YOUTUBE_PAUSE_STATE_KEY);
    const pauseState = result[YOUTUBE_PAUSE_STATE_KEY] as { isPaused?: boolean } | undefined;

    if (pauseState?.isPaused) {
      console.log('[Fockey] YouTube module is PAUSED - skipping CSS injection');
      return; // Don't inject CSS, YouTube stays 100% original
    }

    // Not paused - inject critical CSS immediately
    await injectCriticalCSS();
  } catch (error) {
    console.error('[Fockey] Error during CSS injection initialization:', error);
    // On error, inject CSS anyway to avoid breaking the extension
    await injectCriticalCSS();
  }
}

// Run immediately
initialize();
