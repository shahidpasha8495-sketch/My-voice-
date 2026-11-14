import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { LanguageMetadata, SupportedLanguage } from '../types';
import {
  LANGUAGE_CONFIGS,
  LANGUAGE_LIST,
  detectMessageLanguage,
  getLanguageMetadata,
} from '../utils/language';
import { isSupportedLanguage } from '../utils/validation';
import { useAuth } from './useAuth';

const STORAGE_KEY_LANGUAGE = 'myvoice.preferred_language';
const STORAGE_KEY_AUTO_DETECT = 'myvoice.auto_detect_language';

export interface LanguagePreferenceContextValue {
  language: SupportedLanguage;
  languageConfig: LanguageMetadata;
  availableLanguages: LanguageMetadata[];
  autoDetect: boolean;
  lastDetectedLanguage: SupportedLanguage | null;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  setAutoDetect: (enabled: boolean) => void;
  resolveEffectiveLanguage: (messageText: string) => SupportedLanguage;
}

const LanguagePreferenceContext = createContext<LanguagePreferenceContextValue | null>(null);

function loadStoredLanguage(): SupportedLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_LANGUAGE);
    if (stored && isSupportedLanguage(stored)) {
      return stored;
    }
  } catch {
    // ignore storage errors
  }
  return 'en-US';
}

function loadStoredAutoDetect(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_AUTO_DETECT);
    if (stored === 'false') return false;
  } catch {
    // ignore storage errors
  }
  return true;
}

export function LanguagePreferenceProvider({ children }: { children: ReactNode }) {
  const { profile, updateProfile } = useAuth();
  const [language, setLanguageState] = useState<SupportedLanguage>(loadStoredLanguage);
  const [autoDetect, setAutoDetectState] = useState<boolean>(loadStoredAutoDetect);
  const [lastDetectedLanguage, setLastDetectedLanguage] = useState<SupportedLanguage | null>(null);

  // Sync with user's saved profile preference when profile loads
  useEffect(() => {
    if (profile?.preferred_language && isSupportedLanguage(profile.preferred_language)) {
      setLanguageState(profile.preferred_language);
      try {
        localStorage.setItem(STORAGE_KEY_LANGUAGE, profile.preferred_language);
      } catch {
        // ignore storage errors
      }
    }
  }, [profile?.preferred_language]);

  const setLanguage = useCallback(
    async (nextLang: SupportedLanguage): Promise<void> => {
      if (!isSupportedLanguage(nextLang)) {
        return;
      }

      setLanguageState(nextLang);
      setLastDetectedLanguage(nextLang);
      try {
        localStorage.setItem(STORAGE_KEY_LANGUAGE, nextLang);
      } catch {
        // ignore storage errors
      }

      if (profile) {
        await updateProfile({ preferred_language: nextLang });
      }
    },
    [profile, updateProfile]
  );

  const setAutoDetect = useCallback((enabled: boolean) => {
    setAutoDetectState(enabled);
    try {
      localStorage.setItem(STORAGE_KEY_AUTO_DETECT, String(enabled));
    } catch {
      // ignore storage errors
    }
  }, []);

  const resolveEffectiveLanguage = useCallback(
    (messageText: string): SupportedLanguage => {
      if (!autoDetect) {
        setLastDetectedLanguage(language);
        return language;
      }

      const result = detectMessageLanguage(messageText, language);
      setLastDetectedLanguage(result.language);
      return result.language;
    },
    [autoDetect, language]
  );

  const value = useMemo<LanguagePreferenceContextValue>(
    () => ({
      language,
      languageConfig: LANGUAGE_CONFIGS[language] || getLanguageMetadata('en-US'),
      availableLanguages: LANGUAGE_LIST,
      autoDetect,
      lastDetectedLanguage,
      setLanguage,
      setAutoDetect,
      resolveEffectiveLanguage,
    }),
    [language, autoDetect, lastDetectedLanguage, setLanguage, setAutoDetect, resolveEffectiveLanguage]
  );

  return React.createElement(LanguagePreferenceContext.Provider, { value }, children);
}

export function useLanguagePreference(): LanguagePreferenceContextValue {
  const context = useContext(LanguagePreferenceContext);
  if (!context) {
    throw new Error('useLanguagePreference must be used within a LanguagePreferenceProvider.');
  }
  return context;
}
