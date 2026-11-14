import { useCallback, useEffect, useRef, useState } from 'react';
import type { SupportedLanguage, VoiceError } from '../types';
import { useVoiceState } from './useVoiceState';

export function cleanTextForSpeech(markdownText: string): string {
  return markdownText
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[#>*\-\s]+/gm, '')
    .replace(/[*_~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function selectBestVoice(
  voices: SpeechSynthesisVoice[],
  targetLang: SupportedLanguage
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const normalizedTarget = targetLang.toLowerCase();
  const langPrefix = normalizedTarget.split('-')[0];

  // 1. Exact BCP-47 language match (prefer local or Google/natural voices)
  const exactMatches = voices.filter(
    (v) => v.lang.toLowerCase().replace('_', '-') === normalizedTarget
  );
  if (exactMatches.length > 0) {
    const preferred = exactMatches.find((v) =>
      /natural|google|neural|premium/i.test(v.name)
    );
    return preferred || exactMatches[0];
  }

  // 2. Language prefix match (e.g. 'hi', 'kn', 'en')
  const prefixMatches = voices.filter((v) =>
    v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix)
  );
  if (prefixMatches.length > 0) {
    const preferred = prefixMatches.find((v) =>
      /natural|google|neural|premium/i.test(v.name)
    );
    return preferred || prefixMatches[0];
  }

  return null;
}

export interface UseSpeechSynthesisReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  activeMessageId: string | null;
  lastSpokenText: string;
  lastSpokenLang: SupportedLanguage;
  availableVoices: SpeechSynthesisVoice[];
  error: VoiceError | null;
  speak: (text: string, lang?: SupportedLanguage, messageId?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  replay: () => void;
}

export function useSpeechSynthesis(
  defaultLanguage: SupportedLanguage = 'en-US'
): UseSpeechSynthesisReturn {
  const { transitionTo, setVoiceErrorState } = useVoiceState();

  const [isSupported] = useState<boolean>(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [lastSpokenText, setLastSpokenText] = useState<string>('');
  const [lastSpokenLang, setLastSpokenLang] =
    useState<SupportedLanguage>(defaultLanguage);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [error, setError] = useState<VoiceError | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!isSupported || typeof window === 'undefined') return;

    const loadVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          setAvailableVoices(voices);
        }
      } catch {
        // ignore voice listing errors
      }
    };

    loadVoices();
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore cleanup error
      }
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported || typeof window === 'undefined') return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore cancel error
    }
    utteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
    setActiveMessageId(null);
    transitionTo('idle');
  }, [isSupported, transitionTo]);

  const speak = useCallback(
    (
      rawText: string,
      lang: SupportedLanguage = defaultLanguage,
      messageId?: string
    ) => {
      if (!isSupported || typeof window === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') {
        const errObj: VoiceError = {
          code: 'SYNTHESIS_UNAVAILABLE',
          message: 'Speech synthesis is unavailable in this browser.',
        };
        setError(errObj);
        setVoiceErrorState(errObj.code, errObj.message);
        return;
      }

      const cleaned = cleanTextForSpeech(rawText);
      if (!cleaned) return;

      setError(null);

      // Always cancel any existing playback before starting new playback
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }

      try {
        const utterance = new SpeechSynthesisUtterance(cleaned);
        utterance.lang = lang;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const voices =
          availableVoices.length > 0
            ? availableVoices
            : window.speechSynthesis.getVoices();
        const chosenVoice = selectBestVoice(voices, lang);
        if (chosenVoice) {
          utterance.voice = chosenVoice;
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
          setActiveMessageId(messageId ?? null);
          setLastSpokenText(cleaned);
          setLastSpokenLang(lang);
          transitionTo('speaking');
        };

        utterance.onpause = () => {
          setIsPaused(true);
          transitionTo('paused');
        };

        utterance.onresume = () => {
          setIsPaused(false);
          transitionTo('speaking');
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          setActiveMessageId(null);
          utteranceRef.current = null;
          transitionTo('idle');
        };

        utterance.onerror = (event) => {
          // 'canceled' and 'interrupted' are expected when stopping/switching playback
          if (event.error === 'canceled' || event.error === 'interrupted') {
            setIsSpeaking(false);
            setIsPaused(false);
            setActiveMessageId(null);
            return;
          }

          const errObj: VoiceError = {
            code: 'SYNTHESIS_UNAVAILABLE',
            message: 'Unable to play spoken audio for this response.',
          };
          setError(errObj);
          setIsSpeaking(false);
          setIsPaused(false);
          setActiveMessageId(null);
          setVoiceErrorState(errObj.code, errObj.message);
        };

        utteranceRef.current = utterance;
        setLastSpokenText(cleaned);
        setLastSpokenLang(lang);
        setActiveMessageId(messageId ?? null);
        window.speechSynthesis.speak(utterance);
      } catch {
        const errObj: VoiceError = {
          code: 'SYNTHESIS_UNAVAILABLE',
          message: 'Speech playback could not be started.',
        };
        setError(errObj);
        setVoiceErrorState(errObj.code, errObj.message);
      }
    },
    [availableVoices, defaultLanguage, isSupported, setVoiceErrorState, transitionTo]
  );

  const pause = useCallback(() => {
    if (!isSupported || typeof window === 'undefined' || !isSpeaking) return;
    try {
      window.speechSynthesis.pause();
      setIsPaused(true);
      transitionTo('paused');
    } catch {
      // ignore
    }
  }, [isSupported, isSpeaking, transitionTo]);

  const resume = useCallback(() => {
    if (!isSupported || typeof window === 'undefined' || !isPaused) return;
    try {
      window.speechSynthesis.resume();
      setIsPaused(false);
      transitionTo('speaking');
    } catch {
      // ignore
    }
  }, [isSupported, isPaused, transitionTo]);

  const replay = useCallback(() => {
    if (!lastSpokenText) return;
    speak(lastSpokenText, lastSpokenLang, activeMessageId ?? undefined);
  }, [activeMessageId, lastSpokenLang, lastSpokenText, speak]);

  return {
    isSupported,
    isSpeaking,
    isPaused,
    activeMessageId,
    lastSpokenText,
    lastSpokenLang,
    availableVoices,
    error,
    speak,
    pause,
    resume,
    stop,
    replay,
  };
}
