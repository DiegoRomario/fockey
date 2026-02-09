/**
 * i18n React Context Provider
 */

import React, { createContext, useCallback, useEffect, useState } from 'react';
import type { I18nContextValue, Locale, TranslationParams } from './types';
import {
  getInitialLocale,
  getNestedValue,
  interpolate,
  loadTranslations,
  setLocalePreference,
} from './index';

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const [translations, setTranslations] = useState<unknown>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations for current locale
  const loadLocale = useCallback(async (newLocale: Locale) => {
    try {
      const newTranslations = await loadTranslations(newLocale);
      setTranslations(newTranslations);
      setLocale(newLocale);
    } catch (error) {
      console.error(`Error loading translations for ${newLocale}:`, error);
      // Fallback to English if loading fails
      if (newLocale !== 'en') {
        const fallbackTranslations = await loadTranslations('en');
        setTranslations(fallbackTranslations);
        setLocale('en');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize locale on mount
  useEffect(() => {
    (async () => {
      const initialLocale = await getInitialLocale();
      await loadLocale(initialLocale);
    })();
  }, [loadLocale]);

  // Translation function
  const t = useCallback(
    (key: string, params?: TranslationParams): string => {
      const value = getNestedValue(translations, key);
      return interpolate(value, params);
    },
    [translations]
  );

  // Change locale and persist preference
  const changeLocale = useCallback(
    async (newLocale: Locale) => {
      await loadLocale(newLocale);
      await setLocalePreference(newLocale);
    },
    [loadLocale]
  );

  const value: I18nContextValue = {
    locale,
    t,
    changeLocale,
  };

  // Show nothing while loading initial locale
  if (isLoading) {
    return null;
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export { I18nContext };
