import { useCallback, useEffect, useRef, useState } from 'react';
import type { SupportedLanguage, VoiceError, VoiceErrorCode } from '../types';
import { useVoiceState } from './useVoiceState';

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: BrowserSpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: BrowserSpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Checks whether the current browser context satisfies Web Speech / MediaDevices
 * HTTPS or localhost security requirements.
 */
export function isSecureMicrophoneContext(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.isSecureContext) return true;
  const host = window.location?.hostname || '';
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

export interface UseSpeechRecognitionOptions {
  language?: SupportedLanguage;
  /** Silence duration (ms) after speech before VAD auto-stops listening. Default: 1350ms */
  vadSilenceMs?: number;
  onTranscriptReady?: (
    transcript: string,
    language: SupportedLanguage,
    sttLatencyMs?: number
  ) => void;
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  isPushToTalk: boolean;
  transcript: string;
  interimTranscript: string;
  lastSttLatencyMs: number | null;
  error: VoiceError | null;
  startListening: (overrideLang?: SupportedLanguage) => Promise<void>;
  stopListening: () => void;
  startPushToTalk: (overrideLang?: SupportedLanguage) => Promise<void>;
  stopPushToTalk: () => void;
  cancelListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    language = 'en-US',
    vadSilenceMs = 1350,
    onTranscriptReady,
  } = options;
  const { transitionTo, setVoiceErrorState, setInteractionMode } = useVoiceState();

  const [isSupported, setIsSupported] = useState<boolean>(() =>
    Boolean(getSpeechRecognitionConstructor())
  );
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isPushToTalk, setIsPushToTalk] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [lastSttLatencyMs, setLastSttLatencyMs] = useState<number | null>(null);
  const [error, setError] = useState<VoiceError | null>(null);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const hasErroredRef = useRef<boolean>(false);
  const isPushToTalkRef = useRef<boolean>(false);
  const collectedFinalRef = useRef<string>('');
  const collectedInterimRef = useRef<string>('');
  const activeLangRef = useRef<SupportedLanguage>(language);
  const vadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSilenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSpeechActivityPerfRef = useRef<number>(0);
  const onTranscriptReadyRef = useRef(onTranscriptReady);

  useEffect(() => {
    onTranscriptReadyRef.current = onTranscriptReady;
  }, [onTranscriptReady]);

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognitionConstructor()));
  }, []);

  const clearTimers = useCallback(() => {
    if (vadTimerRef.current) {
      clearTimeout(vadTimerRef.current);
      vadTimerRef.current = null;
    }
    if (initialSilenceTimerRef.current) {
      clearTimeout(initialSilenceTimerRef.current);
      initialSilenceTimerRef.current = null;
    }
  }, []);

  const reportError = useCallback(
    (code: VoiceErrorCode, message: string) => {
      clearTimers();
      hasErroredRef.current = true;
      const errObj: VoiceError = { code, message };
      setError(errObj);
      setIsListening(false);
      setIsPushToTalk(false);
      isPushToTalkRef.current = false;
      setVoiceErrorState(code, message);
    },
    [clearTimers, setVoiceErrorState]
  );

  const cleanupRecognition = useCallback(() => {
    clearTimers();
    if (recognitionRef.current) {
      const instance = recognitionRef.current;
      instance.onstart = null;
      instance.onspeechstart = null;
      instance.onspeechend = null;
      instance.onresult = null;
      instance.onerror = null;
      instance.onend = null;
      try {
        instance.abort();
      } catch {
        // ignore abort errors during cleanup
      }
      recognitionRef.current = null;
    }
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      cleanupRecognition();
    };
  }, [cleanupRecognition]);

  const stopListening = useCallback(() => {
    clearTimers();
    setIsPushToTalk(false);
    isPushToTalkRef.current = false;
    if (!recognitionRef.current) {
      setIsListening(false);
      return;
    }
    try {
      lastSpeechActivityPerfRef.current = performance.now();
      transitionTo('processing');
      recognitionRef.current.stop();
    } catch {
      cleanupRecognition();
      setIsListening(false);
      transitionTo('idle');
    }
  }, [cleanupRecognition, clearTimers, transitionTo]);

  const startRecognitionSession = useCallback(
    async (
      overrideLang?: SupportedLanguage,
      pttMode = false
    ): Promise<void> => {
      if (!isSecureMicrophoneContext()) {
        reportError(
          'PERMISSION_DENIED',
          'Microphone requires HTTPS or localhost. Please open http://localhost:5173 or an HTTPS URL.'
        );
        return;
      }

      const RecognitionCtor = getSpeechRecognitionConstructor();
      if (!RecognitionCtor) {
        reportError(
          'SPEECH_API_UNSUPPORTED',
          'Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari, or type below.'
        );
        return;
      }

      // Prevent overlapping recognition sessions
      if (recognitionRef.current) {
        cleanupRecognition();
      }

      const targetLang = overrideLang || language;
      activeLangRef.current = targetLang;
      isCancelledRef.current = false;
      hasErroredRef.current = false;
      isPushToTalkRef.current = pttMode;
      setIsPushToTalk(pttMode);
      collectedFinalRef.current = '';
      collectedInterimRef.current = '';
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      setInteractionMode('voice');
      transitionTo('requesting_permission');

      try {
        const recognition = new RecognitionCtor();
        recognition.lang = targetLang;
        // Keep continuous=true so brief natural pauses between words don't cut off the user;
        // our VAD timer automatically stops after `vadSilenceMs` of silence once speech begins.
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        const scheduleVadAutoStop = () => {
          if (isPushToTalkRef.current) return;
          if (vadTimerRef.current) {
            clearTimeout(vadTimerRef.current);
          }
          vadTimerRef.current = setTimeout(() => {
            if (
              recognitionRef.current &&
              !isCancelledRef.current &&
              !hasErroredRef.current &&
              (collectedFinalRef.current || collectedInterimRef.current)
            ) {
              try {
                transitionTo('processing');
                recognitionRef.current.stop();
              } catch {
                // ignore
              }
            }
          }, vadSilenceMs);
        };

        recognition.onstart = () => {
          setIsListening(true);
          transitionTo('listening');

          // If no speech is detected within 8 seconds in normal mode, stop cleanly
          if (!isPushToTalkRef.current) {
            initialSilenceTimerRef.current = setTimeout(() => {
              if (
                recognitionRef.current &&
                !collectedFinalRef.current &&
                !collectedInterimRef.current
              ) {
                try {
                  recognitionRef.current.stop();
                } catch {
                  // ignore
                }
              }
            }, 8000);
          }
        };

        recognition.onspeechstart = () => {
          if (initialSilenceTimerRef.current) {
            clearTimeout(initialSilenceTimerRef.current);
            initialSilenceTimerRef.current = null;
          }
          lastSpeechActivityPerfRef.current = performance.now();
          transitionTo('speech_detected');
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          if (initialSilenceTimerRef.current) {
            clearTimeout(initialSilenceTimerRef.current);
            initialSilenceTimerRef.current = null;
          }
          lastSpeechActivityPerfRef.current = performance.now();

          let finalText = '';
          let interimText = '';

          for (let i = 0; i < event.results.length; i += 1) {
            const result = event.results[i];
            const piece = result[0]?.transcript || '';
            if (result.isFinal) {
              finalText += `${piece} `;
            } else {
              interimText += piece;
            }
          }

          if (finalText.trim()) {
            collectedFinalRef.current = finalText.trim();
            setTranscript(collectedFinalRef.current);
          }
          collectedInterimRef.current = interimText.trim();
          setInterimTranscript(collectedInterimRef.current);

          if (finalText.trim() || interimText.trim()) {
            transitionTo('speech_detected');
            scheduleVadAutoStop();
          }
        };

        recognition.onspeechend = () => {
          lastSpeechActivityPerfRef.current = performance.now();
          if (!isPushToTalkRef.current) {
            scheduleVadAutoStop();
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          const errType = event.error;
          if (isCancelledRef.current && errType === 'aborted') {
            return;
          }

          // If we already captured words and the browser emits no-speech/aborted on stop, deliver the words!
          if (
            (errType === 'no-speech' || errType === 'aborted') &&
            (collectedFinalRef.current || collectedInterimRef.current)
          ) {
            return;
          }

          if (errType === 'not-allowed' || errType === 'service-not-allowed') {
            reportError(
              'PERMISSION_DENIED',
              'Microphone access is blocked. Click the lock/tune icon in your browser address bar, set Microphone to "Allow", and try again.'
            );
            return;
          }

          if (errType === 'audio-capture') {
            reportError(
              'MIC_UNAVAILABLE',
              'No working microphone was detected. Please check your system audio input settings or connect a headset.'
            );
            return;
          }

          if (errType === 'network') {
            reportError(
              'RECOGNITION_INTERRUPTED',
              'Browser speech service reached a network issue. Try Chrome/Edge or use the text input below.'
            );
            return;
          }

          if (errType === 'no-speech') {
            reportError(
              'EMPTY_TRANSCRIPTION',
              'No speech was heard. Please check that your mic is unmuted and speak clearly, or hold "Push to Talk".'
            );
            return;
          }

          reportError(
            'RECOGNITION_INTERRUPTED',
            'Voice recognition was interrupted. Please tap Start Mic or hold Push-to-Talk to try again.'
          );
        };

        recognition.onend = () => {
          clearTimers();
          setIsListening(false);
          setIsPushToTalk(false);
          isPushToTalkRef.current = false;
          recognitionRef.current = null;

          if (isCancelledRef.current) {
            transitionTo('idle');
            return;
          }

          if (hasErroredRef.current) {
            return;
          }

          const finalOutput = [
            collectedFinalRef.current,
            collectedInterimRef.current,
          ]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (!finalOutput) {
            reportError(
              'EMPTY_TRANSCRIPTION',
              'No speech was recognized. Please try speaking closer to your microphone or hold Push-to-Talk.'
            );
            return;
          }

          const sttMs = Math.max(
            18,
            Math.round(
              performance.now() -
                (lastSpeechActivityPerfRef.current || performance.now() - 45)
            )
          );
          setLastSttLatencyMs(sttMs);
          setTranscript(finalOutput);
          setInterimTranscript('');
          transitionTo('processing');

          if (onTranscriptReadyRef.current) {
            onTranscriptReadyRef.current(
              finalOutput,
              activeLangRef.current,
              sttMs
            );
          }
        };

        recognitionRef.current = recognition;
        // Start synchronously within the user gesture stack so Chrome/Safari never block it
        recognition.start();
      } catch {
        reportError(
          'UNKNOWN_VOICE_ERROR',
          'Could not start microphone recognition. Please refresh the page or check browser permissions.'
        );
      }
    },
    [
      cleanupRecognition,
      clearTimers,
      language,
      reportError,
      setInteractionMode,
      transitionTo,
      vadSilenceMs,
    ]
  );

  const startListening = useCallback(
    async (overrideLang?: SupportedLanguage): Promise<void> => {
      await startRecognitionSession(overrideLang, false);
    },
    [startRecognitionSession]
  );

  const startPushToTalk = useCallback(
    async (overrideLang?: SupportedLanguage): Promise<void> => {
      await startRecognitionSession(overrideLang, true);
    },
    [startRecognitionSession]
  );

  const stopPushToTalk = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const cancelListening = useCallback(() => {
    isCancelledRef.current = true;
    collectedFinalRef.current = '';
    collectedInterimRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setIsListening(false);
    setIsPushToTalk(false);
    isPushToTalkRef.current = false;
    cleanupRecognition();
    transitionTo('idle');
  }, [cleanupRecognition, transitionTo]);

  const resetTranscript = useCallback(() => {
    collectedFinalRef.current = '';
    collectedInterimRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    isPushToTalk,
    transcript,
    interimTranscript,
    lastSttLatencyMs,
    error,
    startListening,
    stopListening,
    startPushToTalk,
    stopPushToTalk,
    cancelListening,
    resetTranscript,
  };
}
