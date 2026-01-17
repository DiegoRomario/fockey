/**
 * Theme Toggle Component
 * Simple toggle between light and dark modes
 */

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Theme,
  getThemePreference,
  setThemePreference,
  toggleTheme,
  applyTheme,
  listenForThemeChanges,
} from '@/shared/utils/theme-utils';

interface ThemeToggleProps {
  /** Variant style - icon for popup (discrete button), segmented for settings */
  variant?: 'icon' | 'segmented';
}

/**
 * Theme toggle component - switches between light and dark
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon' }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Load initial theme
    getThemePreference().then(setTheme);

    // Listen for theme changes from other contexts
    listenForThemeChanges((newTheme) => {
      setTheme(newTheme);
      applyTheme(newTheme);
    });
  }, []);

  const handleToggle = async () => {
    const newTheme = toggleTheme(theme);
    setTheme(newTheme);
    await setThemePreference(newTheme);
    applyTheme(newTheme);
  };

  if (variant === 'icon') {
    const Icon = theme === 'dark' ? Sun : Moon;
    return (
      <button
        onClick={handleToggle}
        className="rounded-full p-2 hover:bg-accent transition-colors"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <Icon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-1">
        <button
          onClick={() => {
            if (theme !== 'light') handleToggle();
          }}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200',
            'hover:bg-accent/50 hover:text-accent-foreground',
            theme === 'light' && 'bg-card text-foreground shadow-sm border border-border/40'
          )}
          aria-label="Light mode"
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
        </button>
        <button
          onClick={() => {
            if (theme !== 'dark') handleToggle();
          }}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200',
            'hover:bg-accent/50 hover:text-accent-foreground',
            theme === 'dark' && 'bg-card text-foreground shadow-sm border border-border/40'
          )}
          aria-label="Dark mode"
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
        </button>
      </div>
      <p className="text-xs text-muted-foreground text-center">Using {theme} mode</p>
    </div>
  );
};
