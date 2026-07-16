import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'greenmeknes-theme';

export type ThemeMode = 'dark' | 'light' | 'auto';

/**
 * Get the effective theme (dark/light) from a mode.
 * For 'auto', uses Meknes day/night or system preference as fallback.
 */
function getEffectiveTheme(mode: ThemeMode, isDay?: boolean): 'dark' | 'light' {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  // auto: use weather API's isDay if available, else system preference
  if (typeof isDay === 'boolean') {
    return isDay ? 'light' : 'dark';
  }
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return 'dark';
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'auto';
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored && (stored === 'dark' || stored === 'light' || stored === 'auto')) return stored;
    return 'auto';
  });

  const [isDay, setIsDay] = useState<boolean | undefined>(undefined);

  // Listen for weather day/night updates from the weather hook
  useEffect(() => {
    const handleWeatherUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ isDay: boolean }>;
      if (customEvent.detail?.isDay !== undefined) {
        setIsDay(customEvent.detail.isDay);
      }
    };
    window.addEventListener('weather-daynight', handleWeatherUpdate);
    return () => window.removeEventListener('weather-daynight', handleWeatherUpdate);
  }, []);

  const effectiveTheme = getEffectiveTheme(mode, isDay);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [effectiveTheme]);

  // Save mode preference (not the effective theme)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const cycle = useCallback(() => {
    setMode((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'auto';
      return 'dark';
    });
  }, []);

  const setDark = useCallback(() => setMode('dark'), []);
  const setLight = useCallback(() => setMode('light'), []);
  const setAuto = useCallback(() => setMode('auto'), []);

  return {
    mode,
    effectiveTheme,
    isLight: effectiveTheme === 'light',
    isAuto: mode === 'auto',
    cycle,
    setDark,
    setLight,
    setAuto,
  };
}
