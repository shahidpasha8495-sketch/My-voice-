import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  BACKGROUND_THEME_PRESETS,
  BG_THEME_STORAGE_KEY,
  THEME_CONFIGS,
  THEME_STORAGE_KEY,
  type BackgroundThemePreset,
  type ThemeMode,
  type ThemeTokens,
} from '../config/theme';
import type { BackgroundThemeId } from '../types';

export interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  tokens: ThemeTokens;
  backgroundTheme: BackgroundThemeId;
  backgroundPreset: BackgroundThemePreset;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setBackgroundTheme: (bgId: BackgroundThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialBgTheme(): BackgroundThemeId {
  if (typeof window === 'undefined') return 'aurora-galaxy';
  try {
    const savedBg = localStorage.getItem(BG_THEME_STORAGE_KEY);
    if (savedBg && savedBg in BACKGROUND_THEME_PRESETS) {
      return savedBg as BackgroundThemeId;
    }
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedMode === 'light') {
      return 'minimal-light';
    }
  } catch {
    // ignore storage errors
  }
  return 'aurora-galaxy';
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);
  const [backgroundTheme, setBackgroundThemeState] =
    useState<BackgroundThemeId>(getInitialBgTheme);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-bg-theme', backgroundTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      localStorage.setItem(BG_THEME_STORAGE_KEY, backgroundTheme);
    } catch {
      // ignore storage errors
    }
  }, [theme, backgroundTheme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    if (mode === 'light') {
      setBackgroundThemeState('minimal-light');
    } else {
      setBackgroundThemeState((prev) =>
        prev === 'minimal-light' ? 'aurora-galaxy' : prev
      );
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (next === 'light') {
        setBackgroundThemeState('minimal-light');
      } else {
        setBackgroundThemeState((currBg) =>
          currBg === 'minimal-light' ? 'aurora-galaxy' : currBg
        );
      }
      return next;
    });
  }, []);

  const setBackgroundTheme = useCallback((bgId: BackgroundThemeId) => {
    const preset =
      BACKGROUND_THEME_PRESETS[bgId] || BACKGROUND_THEME_PRESETS['aurora-galaxy'];
    setBackgroundThemeState(preset.id);
    setThemeState(preset.mode);
  }, []);

  const backgroundPreset =
    BACKGROUND_THEME_PRESETS[backgroundTheme] ||
    BACKGROUND_THEME_PRESETS['aurora-galaxy'];

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === 'dark',
      tokens: THEME_CONFIGS[theme],
      backgroundTheme,
      backgroundPreset,
      setTheme,
      toggleTheme,
      setBackgroundTheme,
    }),
    [theme, backgroundTheme, backgroundPreset, setTheme, toggleTheme, setBackgroundTheme]
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'dark',
      isDark: true,
      tokens: THEME_CONFIGS.dark,
      backgroundTheme: 'aurora-galaxy',
      backgroundPreset: BACKGROUND_THEME_PRESETS['aurora-galaxy'],
      setTheme: () => {},
      toggleTheme: () => {},
      setBackgroundTheme: () => {},
    };
  }
  return context;
}
