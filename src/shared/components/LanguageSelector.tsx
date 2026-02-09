/**
 * Language Selector Component
 * Allows users to switch between English, Portuguese, and Spanish
 */

import React from 'react';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/shared/i18n/hooks';
import { useT } from '@/shared/i18n/hooks';
import { Locale } from '@/shared/i18n/types';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full';
}

/**
 * Maps locale codes to their native language names
 */
const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
  es: 'Español',
};

/**
 * Language selector component with two display variants
 * - compact: Small dropdown with icon (for Popup header)
 * - full: Full-width dropdown (for Options page)
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'full' }) => {
  const { locale, changeLocale } = useTranslation();
  const t = useT();

  const handleChange = async (value: string) => {
    await changeLocale(value as Locale);
  };

  if (variant === 'compact') {
    return (
      <Select value={locale} onValueChange={handleChange}>
        <SelectTrigger
          className="w-8 h-8 border-none bg-transparent hover:bg-accent focus:ring-0 focus:ring-offset-0 p-2 rounded-full [&>svg:last-child]:hidden"
          aria-label="Select language"
          title={t('popup.languageTooltip')}
        >
          <Globe className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{LANGUAGE_NAMES.en}</SelectItem>
          <SelectItem value="pt">{LANGUAGE_NAMES.pt}</SelectItem>
          <SelectItem value="es">{LANGUAGE_NAMES.es}</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  // Full variant
  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="w-full" aria-label="Select language">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{LANGUAGE_NAMES.en}</SelectItem>
        <SelectItem value="pt">{LANGUAGE_NAMES.pt}</SelectItem>
        <SelectItem value="es">{LANGUAGE_NAMES.es}</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
