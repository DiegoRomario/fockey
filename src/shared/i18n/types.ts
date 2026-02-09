/**
 * i18n TypeScript type definitions
 */

export type Locale = 'en' | 'pt' | 'es';

export interface TranslationParams {
  [key: string]: string | number;
}

export interface I18nContextValue {
  locale: Locale;
  t: (key: string, params?: TranslationParams) => string;
  changeLocale: (locale: Locale) => Promise<void>;
}

/**
 * Deep key extraction for autocomplete support
 * This type will be updated after translation files are created
 */
export type TranslationKey = string;
