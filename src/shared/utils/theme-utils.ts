/**
 * Theme utilities for managing light/dark mode preferences
 */

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'fockey_theme_preference';

/**
 * Get the current theme preference from storage
 */
export async function getThemePreference(): Promise<Theme> {
  try {
    const result = await chrome.storage.local.get(THEME_STORAGE_KEY);
    return (result[THEME_STORAGE_KEY] as Theme) || 'light';
  } catch (error) {
    console.error('Failed to get theme preference:', error);
    return 'light';
  }
}

/**
 * Set the theme preference in storage
 */
export async function setThemePreference(theme: Theme): Promise<void> {
  try {
    await chrome.storage.local.set({ [THEME_STORAGE_KEY]: theme });
  } catch (error) {
    console.error('Failed to set theme preference:', error);
  }
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(currentTheme: Theme): Theme {
  return currentTheme === 'light' ? 'dark' : 'light';
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: 'light' | 'dark'): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Initialize theme on page load
 */
export async function initializeTheme(): Promise<void> {
  const theme = await getThemePreference();
  applyTheme(theme);
}

/**
 * Listen for theme changes from storage
 */
export function listenForThemeChanges(callback: (theme: Theme) => void): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[THEME_STORAGE_KEY]) {
      callback(changes[THEME_STORAGE_KEY].newValue as Theme);
    }
  });
}
