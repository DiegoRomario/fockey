/**
 * i18n main exports and storage utilities
 */

import type { Locale } from './types';

const STORAGE_KEY = 'fockey_language_preference';

interface LanguagePreference {
  locale: Locale;
}

/**
 * Get initial locale from storage or browser
 */
export async function getInitialLocale(): Promise<Locale> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const stored = result[STORAGE_KEY] as LanguagePreference | undefined;

    if (stored?.locale) {
      return stored.locale;
    }

    // Auto-detect from browser locale
    const browserLocale = navigator.language.toLowerCase();

    if (browserLocale.startsWith('pt')) {
      return 'pt';
    } else if (browserLocale.startsWith('es')) {
      return 'es';
    }

    return 'en'; // Default fallback
  } catch (error) {
    console.error('Error getting initial locale:', error);
    return 'en';
  }
}

/**
 * Save locale preference to storage
 */
export async function setLocalePreference(locale: Locale): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEY]: { locale },
    });
  } catch (error) {
    console.error('Error setting locale preference:', error);
  }
}

// Re-export types and utilities
export * from './types';
export * from './utils';
export { I18nProvider } from './context';
export { useTranslation, useT } from './hooks';
