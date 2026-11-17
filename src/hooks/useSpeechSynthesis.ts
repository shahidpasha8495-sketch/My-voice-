import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlushCharacterId } from '../config/characters';
import type { SupportedLanguage, VoiceError } from '../types';
import { useCharacter } from './useCharacter';
import { useVoiceState } from './useVoiceState';

export const COMPANION_VOICE_PROSODY: Record<
  string,
  { rate: number; pitch: number }
> = {
  mellow: { rate: 0.97, pitch: 0.98 }, // Calm, cozy, soothing
  geni: { rate: 1.04, pitch: 1.03 },   // Bright, energetic, articulate
  cloudy: { rate: 0.95, pitch: 0.97 }, // Friendly and peaceful
  bunny: { rate: 1.03, pitch: 1.05 },  // Warm, cheerful, encouraging
  hearty: { rate: 1.01, pitch: 1.02 }, // Expressive, creative, engaging
  nova: { rate: 1.02, pitch: 1.0 },    // Intelligent and futuristic
  luna: { rate: 0.96, pitch: 1.01 },   // Calm and supportive
  spark: { rate: 1.05, pitch: 1.04 },  // Energetic and enthusiastic
  atlas: { rate: 0.99, pitch: 0.95 },  // Knowledgeable and professional
  zen: { rate: 0.94, pitch: 0.96 },    // Relaxed and thoughtful
};

export function cleanTextForSpeech(markdownText: string): string {
  return markdownText
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/^[\s>*\-•]+/gm, '')
    .replace(/^[#]+\s*/gm, '')
    .replace(/[*_~]+/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits cleaned text into natural sentence-level chunks so the first sentence
 * begins speaking immediately with zero lag and natural human breathing pauses.
 */
export function splitIntoNaturalSpeechChunks(cleanedText: string, maxChunkLen = 200): string[] {
  const trimmed = cleanedText.trim();
  if (!trimmed) return [];

  // Split after sentence-ending punctuation (. ! ? ।) followed by space
  const rawSentences = trimmed
    .split(/(?<=[.!?।])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawSentences.length <= 1) {
    return [trimmed];
  }

  // Keep the VERY FIRST sentence as its own chunk so TTS starts speaking after the first sentence immediately
  const chunks: string[] = [rawSentences[0]];
  let current = '';

  for (let i = 1; i < rawSentences.length; i += 1) {
    const sentence = rawSentences[i];
    if (!current) {
      current = sentence;
    } else if (current.length + 1 + sentence.length <= maxChunkLen) {
      current = `${current} ${sentence}`;
    } else {
      chunks.push(current);
      current = sentence;
    }
  }
  if (current) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [trimmed];
}

function scoreVoiceQuality(voice: SpeechSynthesisVoice): number {
  let score = 0;
  const name = voice.name.toLowerCase();

  // Highest priority: Neural, Natural, Google, Online, Enhanced, Premium, Siri
  if (/natural|neural|online/i.test(name)) score += 60;
  if (/google|siri|premium|enhanced|studio/i.test(name)) score += 50;
  if (
    /aria|jenny|guy|sonia|ryan|samantha|ava|allison|swara|madhur|neerja|prabhat|sapna|gagan|lekha|rishi|kiyara|soumya/i.test(
      name
    )
  ) {
    score += 40;
  }

  // Penalize robotic novelty voices
  if (
    /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|junior|organ|trinoids|whisper|zarvox|espeak|compact/i.test(
      name
    )
  ) {
    score -= 100;
  }

  return score;
}

export function selectBestVoice(
  voices: SpeechSynthesisVoice[],
  targetLang: SupportedLanguage
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const normalizedTarget = targetLang.toLowerCase();
  const langPrefix = normalizedTarget.split('-')[0];

  // 1. Exact BCP-47 language match (sorted by natural voice quality score)
  const exactMatches = voices.filter(
    (v) => v.lang.toLowerCase().replace('_', '-') === normalizedTarget
  );
  if (exactMatches.length > 0) {
    const sorted = [...exactMatches].sort(
      (a, b) => scoreVoiceQuality(b) - scoreVoiceQuality(a)
    );
    return sorted[0];
  }

  // 2. Language prefix match (e.g. 'hi', 'kn', 'en')
  const prefixMatches = voices.filter((v) =>
    v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix)
  );
  if (prefixMatches.length > 0) {
    const sorted = [...prefixMatches].sort(
      (a, b) => scoreVoiceQuality(b) - scoreVoiceQuality(a)
    );
    return sorted[0];
  }

  return null;
}

export interface UseSpeechSynthesisOptions {
  onPlaybackComplete?: () => void;
}

export interface UseSpeechSynthesisReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  isMuted: boolean;
  volume: number;
  selectedVoiceURI: string | null;
  activeMessageId: string | null;
  lastSpokenText: string;
  lastSpokenLang: SupportedLanguage;
  lastTtsLatencyMs: number | null;
  availableVoices: SpeechSynthesisVoice[];
  error: VoiceError | null;
  unlockSynthesis: () => void;
  speak: (text: string, lang?: SupportedLanguage, messageId?: string) => void;
  beginStreamingSpeech: (lang?: SupportedLanguage, messageId?: string) => void;
  enqueueStreamingSentence: (
    sentence: string,
    lang?: SupportedLanguage,
    messageId?: string
  ) => void;
  finishStreamingSpeech: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  replay: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setSelectedVoiceURI: (uri: string | null) => void;
}

export function useSpeechSynthesis(
  defaultLanguage: SupportedLanguage = 'en-US',
  options: UseSpeechSynthesisOptions = {}
): UseSpeechSynthesisReturn {
  const { transitionTo, setVoiceErrorState } = useVoiceState();
  const { characterId } = useCharacter();

  const [isSupported] = useState<boolean>(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(1.0);
  const [selectedVoiceURI, setSelectedVoiceURIState] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [lastSpokenText, setLastSpokenText] = useState<string>('');
  const [lastSpokenLang, setLastSpokenLang] =
    useState<SupportedLanguage>(defaultLanguage);
  const [lastTtsLatencyMs, setLastTtsLatencyMs] = useState<number | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [error, setError] = useState<VoiceError | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playbackSessionRef = useRef<number>(0);
  const speakRequestTimestampRef = useRef<number>(0);
  const streamQueueRef = useRef<
    Array<{ text: string; lang: SupportedLanguage; messageId?: string }>
  >([]);
  const isUtterancePlayingRef = useRef<boolean>(false);
  const isStreamOpenRef = useRef<boolean>(false);
  const streamSessionIdRef = useRef<number>(0);
  const streamAccumulatedTextRef = useRef<string>('');
  const onPlaybackCompleteRef = useRef(options.onPlaybackComplete);
  const cancelDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keepAliveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUnlockedRef = useRef<boolean>(false);

  useEffect(() => {
    onPlaybackCompleteRef.current = options.onPlaybackComplete;
  }, [options.onPlaybackComplete]);

  /**
   * Unlocks Web Speech playback inside a user tap/click gesture so mobile Safari
   * and Android Chrome permit async TTS replies immediately after streaming completes.
   */
  const unlockSynthesis = useCallback(() => {
    if (
      isUnlockedRef.current ||
      !isSupported ||
      typeof window === 'undefined' ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      return;
    }
    try {
      const primer = new SpeechSynthesisUtterance(' ');
      primer.volume = 0;
      primer.rate = 2;
      window.speechSynthesis.speak(primer);
      isUnlockedRef.current = true;
    } catch {
      // Ignore mobile autoplay edge cases cleanly
    }
  }, [isSupported]);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (clamped > 0) {
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
        setIsSpeaking(false);
        setIsPaused(false);
      }
      return next;
    });
  }, []);

  const setSelectedVoiceURI = useCallback((uri: string | null) => {
    setSelectedVoiceURIState(uri);
  }, []);

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
      if (cancelDelayTimerRef.current) {
        clearTimeout(cancelDelayTimerRef.current);
      }
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
      try {
        if ('onvoiceschanged' in window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
        window.speechSynthesis.cancel();
      } catch {
        // ignore cleanup error
      }
    };
  }, [isSupported]);

  const clearSpeechTimers = useCallback(() => {
    if (cancelDelayTimerRef.current) {
      clearTimeout(cancelDelayTimerRef.current);
      cancelDelayTimerRef.current = null;
    }
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    playbackSessionRef.current += 1;
    clearSpeechTimers();
    streamQueueRef.current = [];
    isUtterancePlayingRef.current = false;
    isStreamOpenRef.current = false;
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
  }, [clearSpeechTimers, isSupported, transitionTo]);

  const pumpStreamQueue = useCallback(
    (session: number) => {
      if (playbackSessionRef.current !== session) return;
      if (isUtterancePlayingRef.current) return;

      const nextItem = streamQueueRef.current.shift();
      if (!nextItem) {
        if (!isStreamOpenRef.current) {
          setIsSpeaking(false);
          setIsPaused(false);
          setActiveMessageId(null);
          utteranceRef.current = null;
          transitionTo('idle');
          onPlaybackCompleteRef.current?.();
        }
        return;
      }

      if (
        !isSupported ||
        typeof window === 'undefined' ||
        typeof SpeechSynthesisUtterance === 'undefined' ||
        isMuted ||
        volume <= 0
      ) {
        streamQueueRef.current = [];
        return;
      }

      const voices =
        availableVoices.length > 0
          ? availableVoices
          : window.speechSynthesis.getVoices();
      const manualVoice = selectedVoiceURI
        ? voices.find(
            (v) => v.voiceURI === selectedVoiceURI || v.name === selectedVoiceURI
          ) || null
        : null;
      const chosenVoice = manualVoice || selectBestVoice(voices, nextItem.lang);
      const prosody =
        COMPANION_VOICE_PROSODY[characterId] || COMPANION_VOICE_PROSODY.mellow;

      const utterance = new SpeechSynthesisUtterance(nextItem.text);
      utterance.lang = nextItem.lang;
      utterance.rate = prosody.rate;
      utterance.pitch = prosody.pitch;
      utterance.volume = volume;
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      isUtterancePlayingRef.current = true;
      utterance.onstart = () => {
        if (playbackSessionRef.current !== session) return;
        if (speakRequestTimestampRef.current > 0) {
          const ttsFirstAudioMs = Math.max(
            6,
            Math.round(performance.now() - speakRequestTimestampRef.current)
          );
          setLastTtsLatencyMs(ttsFirstAudioMs);
          speakRequestTimestampRef.current = 0;
        }
        setIsSpeaking(true);
        setIsPaused(false);
        setActiveMessageId(nextItem.messageId ?? null);
        transitionTo('speaking');
      };

      utterance.onpause = () => {
        if (playbackSessionRef.current !== session) return;
        setIsPaused(true);
        transitionTo('paused');
      };

      utterance.onresume = () => {
        if (playbackSessionRef.current !== session) return;
        setIsPaused(false);
        transitionTo('speaking');
      };

      utterance.onend = () => {
        if (playbackSessionRef.current !== session) return;
        isUtterancePlayingRef.current = false;
        pumpStreamQueue(session);
      };

      utterance.onerror = (event) => {
        if (playbackSessionRef.current !== session) return;
        isUtterancePlayingRef.current = false;
        if (event.error === 'not-allowed') {
          streamQueueRef.current = [];
          isStreamOpenRef.current = false;
          setIsSpeaking(false);
          setIsPaused(false);
          setActiveMessageId(null);
          transitionTo('idle');
          return;
        }
        if (event.error === 'canceled' || event.error === 'interrupted') {
          setIsSpeaking(false);
          setIsPaused(false);
          setActiveMessageId(null);
          return;
        }
        pumpStreamQueue(session);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [
      availableVoices,
      characterId,
      isMuted,
      isSupported,
      selectedVoiceURI,
      transitionTo,
      volume,
    ]
  );

  const beginStreamingSpeech = useCallback(
    (lang: SupportedLanguage = defaultLanguage, messageId?: string) => {
      if (!isSupported || typeof window === 'undefined') return;
      playbackSessionRef.current += 1;
      const session = playbackSessionRef.current;
      streamSessionIdRef.current = session;
      streamQueueRef.current = [];
      streamAccumulatedTextRef.current = '';
      isUtterancePlayingRef.current = false;
      isStreamOpenRef.current = true;
      speakRequestTimestampRef.current = performance.now();
      setLastSpokenLang(lang);
      setActiveMessageId(messageId ?? null);

      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    },
    [defaultLanguage, isSupported]
  );

  const enqueueStreamingSentence = useCallback(
    (
      rawSentence: string,
      lang: SupportedLanguage = defaultLanguage,
      messageId?: string
    ) => {
      if (!isSupported || isMuted || volume <= 0) return;
      const cleaned = cleanTextForSpeech(rawSentence);
      if (!cleaned) return;

      streamAccumulatedTextRef.current = streamAccumulatedTextRef.current
        ? `${streamAccumulatedTextRef.current} ${cleaned}`
        : cleaned;
      setLastSpokenText(streamAccumulatedTextRef.current);
      setLastSpokenLang(lang);

      const session = streamSessionIdRef.current || playbackSessionRef.current;
      streamQueueRef.current.push({ text: cleaned, lang, messageId });
      pumpStreamQueue(session);
    },
    [defaultLanguage, isMuted, isSupported, pumpStreamQueue, volume]
  );

  const finishStreamingSpeech = useCallback(() => {
    isStreamOpenRef.current = false;
    const session = streamSessionIdRef.current || playbackSessionRef.current;
    if (!isUtterancePlayingRef.current && streamQueueRef.current.length === 0) {
      if (playbackSessionRef.current === session) {
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveMessageId(null);
        transitionTo('idle');
        onPlaybackCompleteRef.current?.();
      }
    }
  }, [transitionTo]);

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

      setLastSpokenText(cleaned);
      setLastSpokenLang(lang);

      if (isMuted || volume <= 0) {
        return;
      }

      setError(null);
      playbackSessionRef.current += 1;
      const currentSession = playbackSessionRef.current;
      speakRequestTimestampRef.current = performance.now();

      // Always cancel any existing playback before starting new playback
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }

      try {
        const chunks = splitIntoNaturalSpeechChunks(cleaned);
        const voices =
          availableVoices.length > 0
            ? availableVoices
            : window.speechSynthesis.getVoices();
        const manualVoice = selectedVoiceURI
          ? voices.find((v) => v.voiceURI === selectedVoiceURI || v.name === selectedVoiceURI) || null
          : null;
        const chosenVoice = manualVoice || selectBestVoice(voices, lang);
        const prosody =
          COMPANION_VOICE_PROSODY[characterId] || COMPANION_VOICE_PROSODY.mellow;

        setActiveMessageId(messageId ?? null);

        const speakChunkAt = (chunkIdx: number) => {
          if (playbackSessionRef.current !== currentSession) return;
          if (chunkIdx >= chunks.length) {
            setIsSpeaking(false);
            setIsPaused(false);
            setActiveMessageId(null);
            utteranceRef.current = null;
            transitionTo('idle');
            return;
          }

          const utterance = new SpeechSynthesisUtterance(chunks[chunkIdx]);
          utterance.lang = lang;
          utterance.rate = prosody.rate;
          utterance.pitch = prosody.pitch;
          utterance.volume = volume;

          if (chosenVoice) {
            utterance.voice = chosenVoice;
          }

          utterance.onstart = () => {
            if (playbackSessionRef.current !== currentSession) return;
            if (chunkIdx === 0 && speakRequestTimestampRef.current > 0) {
              const ttsFirstAudioMs = Math.max(
                8,
                Math.round(performance.now() - speakRequestTimestampRef.current)
              );
              setLastTtsLatencyMs(ttsFirstAudioMs);
            }
            setIsSpeaking(true);
            setIsPaused(false);
            setActiveMessageId(messageId ?? null);
            transitionTo('speaking');
          };

          utterance.onpause = () => {
            if (playbackSessionRef.current !== currentSession) return;
            setIsPaused(true);
            transitionTo('paused');
          };

          utterance.onresume = () => {
            if (playbackSessionRef.current !== currentSession) return;
            setIsPaused(false);
            transitionTo('speaking');
          };

          utterance.onend = () => {
            if (playbackSessionRef.current !== currentSession) return;
            if (chunkIdx + 1 < chunks.length) {
              speakChunkAt(chunkIdx + 1);
            } else {
              setIsSpeaking(false);
              setIsPaused(false);
              setActiveMessageId(null);
              utteranceRef.current = null;
              transitionTo('idle');
              onPlaybackCompleteRef.current?.();
            }
          };

          utterance.onerror = (event) => {
            if (playbackSessionRef.current !== currentSession) return;
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
          window.speechSynthesis.speak(utterance);
        };

        speakChunkAt(0);
        // Schedule with tiny 35ms cancel-guard delay on mobile WebKit so queued cancel() doesn't abort chunk 0
        void currentSession;
      } catch {
        clearSpeechTimers();
        const errObj: VoiceError = {
          code: 'SYNTHESIS_UNAVAILABLE',
          message: 'Speech playback could not be started.',
        };
        setError(errObj);
        setVoiceErrorState(errObj.code, errObj.message);
      }
    },
    [
      availableVoices,
      characterId,
      defaultLanguage,
      isMuted,
      isSupported,
      selectedVoiceURI,
      setVoiceErrorState,
      transitionTo,
      volume,
    ]
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
    isMuted,
    volume,
    selectedVoiceURI,
    activeMessageId,
    lastSpokenText,
    lastSpokenLang,
    lastTtsLatencyMs,
    availableVoices,
    error,
    unlockSynthesis,
    speak,
    beginStreamingSpeech,
    enqueueStreamingSentence,
    finishStreamingSpeech,
    pause,
    resume,
    stop,
    replay,
    setVolume,
    toggleMute,
    setSelectedVoiceURI,
  };
}
