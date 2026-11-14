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

export interface UseSpeechRecognitionOptions {
  language?: SupportedLanguage;
  onTranscriptReady?: (transcript: string, language: SupportedLanguage) => void;
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: VoiceError | null;
  startListening: (overrideLang?: SupportedLanguage) => Promise<void>;
  stopListening: () => void;
  cancelListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { language = 'en-US', onTranscriptReady } = options;
  const { transitionTo, setVoiceErrorState, setInteractionMode } = useVoiceState();

  const [isSupported, setIsSupported] = useState<boolean>(() =>
    Boolean(getSpeechRecognitionConstructor())
  );
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [error, setError] = useState<VoiceError | null>(null);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const hasErroredRef = useRef<boolean>(false);
  const hasMicPermissionRef = useRef<boolean>(false);
  const collectedFinalRef = useRef<string>('');
  const collectedInterimRef = useRef<string>('');
  const activeLangRef = useRef<SupportedLanguage>(language);
  const onTranscriptReadyRef = useRef(onTranscriptReady);

  useEffect(() => {
    onTranscriptReadyRef.current = onTranscriptReady;
  }, [onTranscriptReady]);

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognitionConstructor()));
  }, []);

  const reportError = useCallback(
    (code: VoiceErrorCode, message: string) => {
      hasErroredRef.current = true;
      const errObj: VoiceError = { code, message };
      setError(errObj);
      setIsListening(false);
      setVoiceErrorState(code, message);
    },
    [setVoiceErrorState]
  );

  const cleanupRecognition = useCallback(() => {
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
  }, []);

  useEffect(() => {
    return () => {
      cleanupRecognition();
    };
  }, [cleanupRecognition]);

  const startListening = useCallback(
    async (overrideLang?: SupportedLanguage): Promise<void> => {
      const RecognitionCtor = getSpeechRecognitionConstructor();
      if (!RecognitionCtor) {
        reportError(
          'SPEECH_API_UNSUPPORTED',
          'Voice recognition is not supported in this browser. You can continue using text chat.'
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
      collectedFinalRef.current = '';
      collectedInterimRef.current = '';
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      setInteractionMode('voice');
      transitionTo('requesting_permission');

      // Pre-check microphone permission once per session when mediaDevices.getUserMedia is available
      if (
        !hasMicPermissionRef.current &&
        typeof navigator !== 'undefined' &&
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === 'function'
      ) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          hasMicPermissionRef.current = true;
          // Immediately release the raw MediaStream tracks so SpeechRecognition can bind cleanly
          stream.getTracks().forEach((track) => track.stop());
        } catch (permErr: unknown) {
          const errName = permErr instanceof Error ? permErr.name : '';
          if (
            errName === 'NotAllowedError' ||
            errName === 'PermissionDeniedError' ||
            errName === 'SecurityError'
          ) {
            reportError(
              'PERMISSION_DENIED',
              'Microphone permission is required. Please allow microphone access and try again.'
            );
            return;
          }
          if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
            reportError(
              'MIC_UNAVAILABLE',
              'Microphone is unavailable. Please connect a microphone or use text chat.'
            );
            return;
          }
        }
      }

      try {
        const recognition = new RecognitionCtor();
        recognition.lang = targetLang;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          transitionTo('listening');
        };

        recognition.onspeechstart = () => {
          transitionTo('speech_detected');
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalText = '';
          let interimText = '';

          for (let i = 0; i < event.results.length; i += 1) {
            const result = event.results[i];
            const piece = result[0]?.transcript || '';
            if (result.isFinal) {
              finalText += piece;
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
          }
        };

        recognition.onspeechend = () => {
          if (!isCancelledRef.current && !hasErroredRef.current) {
            transitionTo('processing');
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          const errType = event.error;
          if (isCancelledRef.current && errType === 'aborted') {
            return;
          }

          if (errType === 'not-allowed' || errType === 'service-not-allowed') {
            reportError(
              'PERMISSION_DENIED',
              'Microphone permission is required. Please enable microphone access in your browser.'
            );
            return;
          }

          if (errType === 'audio-capture') {
            reportError(
              'MIC_UNAVAILABLE',
              'Microphone is unavailable. Please check your audio input device.'
            );
            return;
          }

          if (errType === 'no-speech') {
            reportError(
              'EMPTY_TRANSCRIPTION',
              'No speech was detected. Please try speaking clearly into your microphone.'
            );
            return;
          }

          if (errType === 'aborted') {
            reportError(
              'RECOGNITION_INTERRUPTED',
              'Voice recognition was interrupted. Please try again.'
            );
            return;
          }

          reportError(
            'RECOGNITION_INTERRUPTED',
            'Voice recognition encountered an issue. You can retry or type your message.'
          );
        };

        recognition.onend = () => {
          setIsListening(false);
          recognitionRef.current = null;

          if (isCancelledRef.current) {
            transitionTo('idle');
            return;
          }

          if (hasErroredRef.current) {
            return;
          }

          const finalOutput = (
            collectedFinalRef.current || collectedInterimRef.current
          ).trim();

          if (!finalOutput) {
            reportError(
              'EMPTY_TRANSCRIPTION',
              'No speech was recognized. Please try again or type your message.'
            );
            return;
          }

          setTranscript(finalOutput);
          setInterimTranscript('');
          transitionTo('processing');

          if (onTranscriptReadyRef.current) {
            onTranscriptReadyRef.current(finalOutput, activeLangRef.current);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        reportError(
          'UNKNOWN_VOICE_ERROR',
          'Could not start voice recognition. Please try again or use text chat.'
        );
      }
    },
    [language, cleanupRecognition, reportError, setInteractionMode, transitionTo]
  );

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) {
      setIsListening(false);
      return;
    }
    try {
      transitionTo('processing');
      recognitionRef.current.stop();
    } catch {
      cleanupRecognition();
      setIsListening(false);
      transitionTo('idle');
    }
  }, [cleanupRecognition, transitionTo]);

  const cancelListening = useCallback(() => {
    isCancelledRef.current = true;
    collectedFinalRef.current = '';
    collectedInterimRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setIsListening(false);
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
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    cancelListening,
    resetTranscript,
  };
}
