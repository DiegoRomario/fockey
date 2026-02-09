/**
 * i18n React hooks
 */

import { useContext } from 'react';
import { I18nContext } from './context';
import type { I18nContextValue } from './types';

/**
 * Hook to access full i18n context
 * Returns { t, locale, changeLocale }
 */
export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }

  return context;
}

/**
 * Convenience hook that returns only the translation function
 * Returns the t function directly
 */
export function useT() {
  const { t } = useTranslation();
  return t;
}
