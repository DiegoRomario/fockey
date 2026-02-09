/**
 * i18n utility functions
 */

import type { Locale, TranslationParams } from './types';

/**
 * Interpolate template strings with parameters
 * Replaces {{variable}} with values from params object
 *
 * @example
 * interpolate('Hello {{name}}!', { name: 'World' }) // 'Hello World!'
 */
export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Dynamically load translation file for a locale
 */
export async function loadTranslations(locale: Locale): Promise<unknown> {
  switch (locale) {
    case 'en':
      return (await import('./translations/en')).en;
    case 'pt':
      return (await import('./translations/pt')).pt;
    case 'es':
      return (await import('./translations/es')).es;
    default:
      return (await import('./translations/en')).en;
  }
}

/**
 * Format date according to locale
 */
export function formatDateForLocale(timestamp: number, locale: Locale): string {
  const date = new Date(timestamp);
  const localeMap: Record<Locale, string> = {
    en: 'en-US',
    pt: 'pt-BR',
    es: 'es-ES',
  };

  return date.toLocaleDateString(localeMap[locale], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get nested value from object using dot notation path
 *
 * @example
 * getNestedValue({ foo: { bar: 'baz' } }, 'foo.bar') // 'baz'
 */
export function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // Return path as fallback if not found
    }
  }

  return typeof current === 'string' ? current : path;
}
