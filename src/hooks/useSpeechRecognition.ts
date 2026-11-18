import { useCallback, useEffect, useRef, useState } from 'react';
import { transcribeRecordedAudio } from '../services/chatService';
import type { SupportedLanguage, VoiceError, VoiceErrorCode } from '../types';
import { normalizeError } from '../utils/normalizeError';
import { playMicOpenChime, playMicStopChime } from '../utils/soundEffects';
import { MAX_AUDIO_BYTES } from '../utils/validation';
import { useAuth } from './useAuth';
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

export const MAX_RECORDING_SECONDS = 30;

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isMobileBrowser(userAgent?: string): boolean {
  const ua =
    userAgent ??
    (typeof navigator !== 'undefined' ? navigator.userAgent || '' : '');
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    ua
  );
}

export function isMediaRecorderSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  );
}

/**
 * Selects the highest-compatibility audio recording MIME type across iOS Safari (audio/mp4),
 * Android Chrome (audio/webm;codecs=opus), and Desktop browsers.
 */
export function getSupportedAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined;
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
  ];
  // Prefer audio/mp4 on iOS WebKit devices if supported, otherwise webm opus first
  const iosOrderedCandidates = isMobileBrowser() && /iPhone|iPad|iPod/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  )
    ? ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm']
    : candidates;

  for (const mime of iosOrderedCandidates) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    } catch {
      // Ignore probe error
    }
  }
  return undefined;
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

export function shouldReviewRecognizedTranscript(params: {
  transcript: string;
  confidence?: number;
  language: SupportedLanguage;
  alwaysReview?: boolean;
}): boolean {
  const { transcript, confidence, language, alwaysReview = false } = params;
  if (alwaysReview) return true;
  const trimmed = transcript.trim();
  if (!trimmed) return false;
  if (typeof confidence === 'number' && confidence > 0 && confidence < 0.72) {
    return true;
  }
  // If user selected Hindi or Kannada but browser STT emitted Latin-only transliteration,
  // let the user review/correct it rather than silently submitting garbled phonetic English!
  const isLatinOnly = /^[A-Za-z0-9\s.,?!'"-]+$/.test(trimmed);
  if ((language === 'kn-IN' || language === 'hi-IN') && isLatinOnly && trimmed.split(/\s+/).length >= 2) {
    return true;
  }
  return false;
}

async function blobToBase64(blob: Blob): Promise<string> {
  if (typeof blob.arrayBuffer === 'function') {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to encode audio recording.'));
    reader.readAsDataURL(blob);
  });
}

function mapMediaDeviceError(err: unknown): { code: VoiceErrorCode; message: string } {
  const errName =
    err && typeof err === 'object' && 'name' in err
      ? String((err as { name: unknown }).name)
      : '';
  const errMsg = normalizeError(err, '');

  if (
    errName === 'NotAllowedError' ||
    errName === 'PermissionDeniedError' ||
    /permission|denied|not allowed/i.test(errMsg)
  ) {
    return {
      code: 'PERMISSION_DENIED',
      message: 'Please allow microphone access in your browser settings.',
    };
  }
  if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
    return {
      code: 'MIC_UNAVAILABLE',
      message:
        'Microphone is unavailable. Please connect a microphone or use text chat.',
    };
  }
  if (errName === 'NotReadableError' || errName === 'TrackStartError') {
    return {
      code: 'MIC_UNAVAILABLE',
      message:
        'Your microphone is currently busy in another app. Close other audio apps and try again.',
    };
  }
  if (errName === 'SecurityError') {
    return {
      code: 'PERMISSION_DENIED',
      message: 'Microphone access requires a secure HTTPS connection.',
    };
  }
  return {
    code: 'RECORDING_FAILED',
    message: normalizeError(
      err,
      'Could not start audio recording on this device. Please try again or type your message.'
    ),
  };
}

export interface PendingTranscriptDraft {
  text: string;
  language: SupportedLanguage;
  confidence?: number;
  source: 'web-speech' | 'gemini-audio';
}

export interface UseSpeechRecognitionOptions {
  language?: SupportedLanguage;
  /** Silence duration (ms) after speech before VAD auto-stops listening on desktop. Default: 750ms in turboMode */
  vadSilenceMs?: number;
  turboMode?: boolean;
  onTranscriptReady?: (
    transcript: string,
    language: SupportedLanguage,
    sttLatencyMs?: number
  ) => void;
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isSpeechApiSupported: boolean;
  isMediaRecorderAvailable: boolean;
  isMobile: boolean;
  isListening: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  recordingSeconds: number;
  isPushToTalk: boolean;
  transcript: string;
  interimTranscript: string;
  pendingTranscript: PendingTranscriptDraft | null;
  reviewBeforeSend: boolean;
  lastSttLatencyMs: number | null;
  error: VoiceError | null;
  startListening: (overrideLang?: SupportedLanguage) => Promise<void>;
  stopListening: () => void;
  startMediaRecording: (overrideLang?: SupportedLanguage) => Promise<void>;
  stopMediaRecording: () => void;
  startPushToTalk: (overrideLang?: SupportedLanguage) => Promise<void>;
  stopPushToTalk: () => void;
  cancelListening: () => void;
  resetTranscript: () => void;
  setReviewBeforeSend: (enabled: boolean) => void;
  setPendingTranscriptText: (text: string) => void;
  confirmPendingTranscript: () => void;
  discardPendingTranscript: () => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    language = 'en-US',
    turboMode = true,
    vadSilenceMs = turboMode ? 750 : 1350,
    onTranscriptReady,
  } = options;
  const { accessToken } = useAuth();
  const { transitionTo, setVoiceErrorState, setInteractionMode } = useVoiceState();

  const [isSpeechApiSupported, setIsSpeechApiSupported] = useState<boolean>(() =>
    Boolean(getSpeechRecognitionConstructor())
  );
  const [isMediaRecorderAvailable, setIsMediaRecorderAvailable] = useState<boolean>(() =>
    isMediaRecorderSupported()
  );
  const [isMobile] = useState<boolean>(() => isMobileBrowser());

  const [isListening, setIsListening] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isPushToTalk, setIsPushToTalk] = useState<boolean>(false);

  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [pendingTranscript, setPendingTranscript] =
    useState<PendingTranscriptDraft | null>(null);
  const [reviewBeforeSend, setReviewBeforeSend] = useState<boolean>(false);
  const [lastSttLatencyMs, setLastSttLatencyMs] = useState<number | null>(null);
  const [error, setError] = useState<VoiceError | null>(null);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartPerfRef = useRef<number>(0);
  const recordingDurationSecRef = useRef<number>(0);

  const isCancelledRef = useRef<boolean>(false);
  const hasErroredRef = useRef<boolean>(false);
  const isPushToTalkRef = useRef<boolean>(false);
  const preferMediaRecorderFallbackRef = useRef<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);
  const collectedFinalRef = useRef<string>('');
  const collectedInterimRef = useRef<string>('');
  const lastConfidenceRef = useRef<number>(1);
  const activeLangRef = useRef<SupportedLanguage>(language);
  const reviewBeforeSendRef = useRef<boolean>(reviewBeforeSend);
  const vadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSilenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSpeechActivityPerfRef = useRef<number>(0);
  const onTranscriptReadyRef = useRef(onTranscriptReady);
  const accessTokenRef = useRef(accessToken);

  useEffect(() => {
    onTranscriptReadyRef.current = onTranscriptReady;
  }, [onTranscriptReady]);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    reviewBeforeSendRef.current = reviewBeforeSend;
  }, [reviewBeforeSend]);

  useEffect(() => {
    setIsSpeechApiSupported(Boolean(getSpeechRecognitionConstructor()));
    setIsMediaRecorderAvailable(isMediaRecorderSupported());
  }, []);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const clearTimers = useCallback(() => {
    if (vadTimerRef.current) {
      clearTimeout(vadTimerRef.current);
      vadTimerRef.current = null;
    }
    if (initialSilenceTimerRef.current) {
      clearTimeout(initialSilenceTimerRef.current);
      initialSilenceTimerRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const releaseMediaResources = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current) {
      const rec = mediaRecorderRef.current;
      rec.ondataavailable = null;
      rec.onstop = null;
      rec.onerror = null;
      if (rec.state !== 'inactive') {
        try {
          rec.stop();
        } catch {
          // ignore
        }
      }
      mediaRecorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }
  }, []);

  const reportError = useCallback(
    (code: VoiceErrorCode, message: string) => {
      clearTimers();
      releaseMediaResources();
      hasErroredRef.current = true;
      const safeMessage = normalizeError(
        message,
        'Something unexpected happened. Please try again.'
      );
      const errObj: VoiceError = { code, message: safeMessage };
      setError(errObj);
      setIsListening(false);
      setIsRecording(false);
      setIsTranscribing(false);
      setIsPushToTalk(false);
      isPushToTalkRef.current = false;
      setVoiceErrorState(code, safeMessage);
    },
    [clearTimers, releaseMediaResources, setVoiceErrorState]
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
    const handleVisibilityChange = () => {
      if (
        typeof document !== 'undefined' &&
        document.hidden &&
        (isListeningRef.current || isRecordingRef.current)
      ) {
        isCancelledRef.current = true;
        cleanupRecognition();
        releaseMediaResources();
        setIsListening(false);
        setIsRecording(false);
        setIsPushToTalk(false);
        isPushToTalkRef.current = false;
        transitionTo('idle');
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      cleanupRecognition();
      releaseMediaResources();
    };
  }, [cleanupRecognition, releaseMediaResources, transitionTo]);

  const deliverTranscript = useCallback(
    (params: {
      text: string;
      lang: SupportedLanguage;
      confidence?: number;
      source: 'web-speech' | 'gemini-audio';
      sttLatencyMs: number;
    }) => {
      const { text, lang, confidence, source, sttLatencyMs } = params;
      setLastSttLatencyMs(sttLatencyMs);
      setTranscript(text);
      setInterimTranscript('');

      if (
        shouldReviewRecognizedTranscript({
          transcript: text,
          confidence,
          language: lang,
          alwaysReview: reviewBeforeSendRef.current,
        })
      ) {
        setPendingTranscript({ text, language: lang, confidence, source });
        transitionTo('completed');
        return;
      }

      setPendingTranscript(null);
      transitionTo('processing');
      onTranscriptReadyRef.current?.(text, lang, sttLatencyMs);
    },
    [transitionTo]
  );

  const stopMediaRecording = useCallback(() => {
    clearTimers();
    setIsPushToTalk(false);
    isPushToTalkRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        playMicStopChime();
        mediaRecorderRef.current.stop();
      } catch {
        releaseMediaResources();
        setIsRecording(false);
        transitionTo('idle');
      }
    } else {
      releaseMediaResources();
      setIsRecording(false);
    }
  }, [clearTimers, releaseMediaResources, transitionTo]);

  /**
   * Mobile-Safe MediaRecorder Capture + Gemini Audio Transcription Fallback.
   * Works reliably on iOS Safari, Chrome on iOS, Firefox, Brave, and Android devices
   * where browser SpeechRecognition is unsupported or throws service errors.
   */
  const startMediaRecording = useCallback(
    async (overrideLang?: SupportedLanguage): Promise<void> => {
      if (!isSecureMicrophoneContext()) {
        reportError(
          'PERMISSION_DENIED',
          'Microphone recording requires HTTPS or localhost. Please open this app using https://'
        );
        return;
      }

      if (!isMediaRecorderSupported()) {
        reportError(
          'MIC_UNAVAILABLE',
          'Audio recording is unavailable in this browser. Please type your message below.'
        );
        return;
      }

      // Prevent duplicate active sessions
      cleanupRecognition();
      releaseMediaResources();

      const targetLang = overrideLang || language;
      activeLangRef.current = targetLang;
      isCancelledRef.current = false;
      hasErroredRef.current = false;
      audioChunksRef.current = [];
      recordingDurationSecRef.current = 0;
      setRecordingSeconds(0);
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      setPendingTranscript(null);
      setInteractionMode('voice');
      transitionTo('requesting_permission');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 16000,
          },
        });

        if (isCancelledRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          transitionTo('idle');
          return;
        }

        mediaStreamRef.current = stream;
        const mimeType = getSupportedAudioMimeType();
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        audioChunksRef.current = [];
        recordingStartPerfRef.current = performance.now();

        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onerror = () => {
          reportError(
            'RECORDING_FAILED',
            'Audio recording interrupted on this device. Please tap Retry or use text chat.'
          );
        };

        recorder.onstop = async () => {
          const capturedChunks = [...audioChunksRef.current];
          const actualMime =
            recorder.mimeType || mimeType || 'audio/webm';
          const durationSec = Math.max(
            0.3,
            Math.round(((performance.now() - recordingStartPerfRef.current) / 1000) * 10) / 10
          );

          // Immediately release OS microphone hardware tracks after capture!
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => {
              try {
                t.stop();
              } catch {
                // ignore
              }
            });
            mediaStreamRef.current = null;
          }
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          mediaRecorderRef.current = null;
          setIsRecording(false);
          setIsListening(false);

          if (isCancelledRef.current || hasErroredRef.current) {
            return;
          }

          const audioBlob = new Blob(capturedChunks, { type: actualMime });
          if (audioBlob.size < 128) {
            reportError(
              'EMPTY_TRANSCRIPTION',
              'Recording was too short or silent. Tap Start Mic and speak clearly before stopping.'
            );
            return;
          }

          if (audioBlob.size > MAX_AUDIO_BYTES) {
            reportError(
              'AUDIO_TOO_LARGE',
              'Recording exceeded 4 MB. Please keep your voice message under 30 seconds.'
            );
            return;
          }

          try {
            setIsTranscribing(true);
            transitionTo('transcribing');
            const sttStart = performance.now();
            const audioBase64 = await blobToBase64(audioBlob);

            const result = await transcribeRecordedAudio(
              {
                audioBase64,
                mimeType: actualMime,
                language: activeLangRef.current,
                durationSeconds: durationSec,
              },
              accessTokenRef.current
            );

            setIsTranscribing(false);
            if (isCancelledRef.current) {
              transitionTo('idle');
              return;
            }

            const sttMs = Math.max(40, Math.round(performance.now() - sttStart));
            deliverTranscript({
              text: result.transcript,
              lang: result.language || activeLangRef.current,
              confidence: result.confidence ?? 0.9,
              source: 'gemini-audio',
              sttLatencyMs: sttMs,
            });
          } catch (transcribeErr) {
            setIsTranscribing(false);
            const msg = normalizeError(
              transcribeErr,
              'Unable to transcribe recorded audio. Please try again or type your message.'
            );
            reportError('TRANSCRIPTION_FAILED', msg);
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start(250);
        setIsRecording(true);
        setIsListening(true);
        playMicOpenChime();
        transitionTo('recording');

        recordingTimerRef.current = setInterval(() => {
          recordingDurationSecRef.current += 1;
          setRecordingSeconds(recordingDurationSecRef.current);
          if (recordingDurationSecRef.current >= MAX_RECORDING_SECONDS) {
            stopMediaRecording();
          }
        }, 1000);
      } catch (err) {
        const mapped = mapMediaDeviceError(err);
        reportError(mapped.code, mapped.message);
      }
    },
    [
      cleanupRecognition,
      deliverTranscript,
      language,
      releaseMediaResources,
      reportError,
      setInteractionMode,
      stopMediaRecording,
      transitionTo,
    ]
  );

  const stopListening = useCallback(() => {
    clearTimers();
    setIsPushToTalk(false);
    isPushToTalkRef.current = false;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      stopMediaRecording();
      return;
    }

    if (!recognitionRef.current) {
      setIsListening(false);
      return;
    }
    try {
      lastSpeechActivityPerfRef.current = performance.now();
      playMicStopChime();
      transitionTo('processing');
      recognitionRef.current.stop();
    } catch {
      cleanupRecognition();
      setIsListening(false);
      transitionTo('idle');
    }
  }, [cleanupRecognition, clearTimers, stopMediaRecording, transitionTo]);

  const startRecognitionSession = useCallback(
    async (
      overrideLang?: SupportedLanguage,
      pttMode = false
    ): Promise<void> => {
      if (!isSecureMicrophoneContext()) {
        reportError(
          'PERMISSION_DENIED',
          'Microphone requires HTTPS or localhost. Please open https:// or http://localhost.'
        );
        return;
      }

      const RecognitionCtor = getSpeechRecognitionConstructor();

      // Priority 2 Fallback: If browser Web Speech API is absent (e.g. Firefox, iOS WebViews)
      // or previously blocked/unreliable in this session (e.g. Brave Android privacy shield),
      // use MediaRecorder audio capture + backend Gemini transcription seamlessly!
      if (!RecognitionCtor || (preferMediaRecorderFallbackRef.current && isMediaRecorderSupported())) {
        if (isMediaRecorderSupported()) {
          isPushToTalkRef.current = pttMode;
          setIsPushToTalk(pttMode);
          await startMediaRecording(overrideLang);
          return;
        }
        reportError(
          'SPEECH_API_UNSUPPORTED',
          'Voice recognition is unavailable in this browser. Please use text chat.'
        );
        return;
      }

      // Prevent overlapping sessions across both SpeechRecognition & MediaRecorder
      if (recognitionRef.current) {
        cleanupRecognition();
      }
      releaseMediaResources();

      const targetLang = overrideLang || language;
      activeLangRef.current = targetLang;
      isCancelledRef.current = false;
      hasErroredRef.current = false;
      isPushToTalkRef.current = pttMode;
      setIsPushToTalk(pttMode);
      collectedFinalRef.current = '';
      collectedInterimRef.current = '';
      lastConfidenceRef.current = 1;
      setTranscript('');
      setInterimTranscript('');
      setPendingTranscript(null);
      setError(null);
      setInteractionMode('voice');
      transitionTo('requesting_permission');

      try {
        const recognition = new RecognitionCtor();
        recognition.lang = targetLang;
        // CRITICAL MOBILE FIX: On Android Chrome & iOS Safari, continuous=true causes repeated word
        // duplication and WebKit crashes. Use continuous=false on mobile devices & continuous=true on desktop.
        recognition.continuous = !isMobile;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        const scheduleVadAutoStop = (customMs?: number) => {
          if (isPushToTalkRef.current || isMobile) return;
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
                playMicStopChime();
                transitionTo('processing');
                recognitionRef.current.stop();
              } catch {
                // ignore
              }
            }
          }, customMs ?? vadSilenceMs);
        };

        recognition.onstart = () => {
          setIsListening(true);
          playMicOpenChime();
          transitionTo('listening');

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
            }, 8500);
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
          let bestConfidence = 1;

          for (let i = 0; i < event.results.length; i += 1) {
            const result = event.results[i];
            const piece = result[0]?.transcript || '';
            const conf = result[0]?.confidence;
            if (typeof conf === 'number' && conf > 0) {
              bestConfidence = Math.min(bestConfidence, conf);
            }
            if (result.isFinal) {
              finalText += `${piece} `;
            } else {
              interimText += piece;
            }
          }

          lastConfidenceRef.current = bestConfidence;

          if (finalText.trim()) {
            collectedFinalRef.current = finalText.trim();
            setTranscript(collectedFinalRef.current);
          }
          collectedInterimRef.current = interimText.trim();
          setInterimTranscript(collectedInterimRef.current);

          if (finalText.trim() || interimText.trim()) {
            transitionTo('speech_detected');
            const fastDelay =
              turboMode && finalText.trim() && !interimText.trim()
                ? Math.min(520, vadSilenceMs)
                : vadSilenceMs;
            scheduleVadAutoStop(fastDelay);
          }
        };

        recognition.onspeechend = () => {
          lastSpeechActivityPerfRef.current = performance.now();
          if (!isPushToTalkRef.current && !isMobile) {
            scheduleVadAutoStop();
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          const errType = event.error;
          if (isCancelledRef.current && errType === 'aborted') {
            return;
          }

          if (
            (errType === 'no-speech' || errType === 'aborted') &&
            (collectedFinalRef.current || collectedInterimRef.current)
          ) {
            return;
          }

          // Mobile Brave / Safari / Chrome fallback: if browser Speech Recognition engine is blocked,
          // unsupported for this language, or hits a service/network error, remember and switch to MediaRecorder!
          if (
            (errType === 'service-not-allowed' ||
              errType === 'network' ||
              errType === 'language-not-supported') &&
            isMediaRecorderSupported()
          ) {
            preferMediaRecorderFallbackRef.current = true;
            cleanupRecognition();
            setIsListening(false);
            void startMediaRecording(activeLangRef.current);
            return;
          }

          if (errType === 'not-allowed' || errType === 'service-not-allowed') {
            reportError(
              'PERMISSION_DENIED',
              'Please allow microphone access in your browser settings.'
            );
            return;
          }

          if (errType === 'audio-capture') {
            reportError(
              'MIC_UNAVAILABLE',
              'Microphone is unavailable. Please check your device microphone or use text chat.'
            );
            return;
          }

          if (errType === 'network') {
            reportError(
              'RECOGNITION_INTERRUPTED',
              'Your internet connection seems unstable.'
            );
            return;
          }

          if (errType === 'no-speech') {
            reportError(
              'EMPTY_TRANSCRIPTION',
              "I couldn't hear you. Please try again."
            );
            return;
          }

          reportError(
            'RECOGNITION_INTERRUPTED',
            normalizeError(
              event,
              'Voice recognition was interrupted. Tap Start Mic or Record Audio to try again.'
            )
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
              "I couldn't hear you. Please try again."
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

          deliverTranscript({
            text: finalOutput,
            lang: activeLangRef.current,
            confidence: lastConfidenceRef.current,
            source: 'web-speech',
            sttLatencyMs: sttMs,
          });
        };

        recognitionRef.current = recognition;
        // Start synchronously inside user tap/click handler so mobile Safari & Chrome never block user gesture!
        recognition.start();
      } catch {
        if (isMediaRecorderSupported()) {
          await startMediaRecording(targetLang);
          return;
        }
        reportError(
          'UNKNOWN_VOICE_ERROR',
          'Could not start microphone recognition. Please check browser permissions or type below.'
        );
      }
    },
    [
      cleanupRecognition,
      clearTimers,
      deliverTranscript,
      isMobile,
      language,
      releaseMediaResources,
      reportError,
      setInteractionMode,
      startMediaRecording,
      transitionTo,
      turboMode,
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
    setIsRecording(false);
    setIsTranscribing(false);
    setIsPushToTalk(false);
    isPushToTalkRef.current = false;
    cleanupRecognition();
    releaseMediaResources();
    transitionTo('idle');
  }, [cleanupRecognition, releaseMediaResources, transitionTo]);

  const resetTranscript = useCallback(() => {
    collectedFinalRef.current = '';
    collectedInterimRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setPendingTranscript(null);
    setError(null);
  }, []);

  const setPendingTranscriptText = useCallback((nextText: string) => {
    setPendingTranscript((prev) =>
      prev ? { ...prev, text: nextText } : null
    );
    setTranscript(nextText);
  }, []);

  const confirmPendingTranscript = useCallback(() => {
    if (!pendingTranscript) return;
    const cleaned = pendingTranscript.text.trim();
    if (!cleaned) return;
    const targetLang = pendingTranscript.language;
    setPendingTranscript(null);
    setTranscript(cleaned);
    transitionTo('processing');
    onTranscriptReadyRef.current?.(cleaned, targetLang, lastSttLatencyMs ?? 120);
  }, [lastSttLatencyMs, pendingTranscript, transitionTo]);

  const discardPendingTranscript = useCallback(() => {
    setPendingTranscript(null);
    setTranscript('');
    transitionTo('idle');
  }, [transitionTo]);

  return {
    isSupported: isSpeechApiSupported || isMediaRecorderAvailable,
    isSpeechApiSupported,
    isMediaRecorderAvailable,
    isMobile,
    isListening: isListening || isRecording,
    isRecording,
    isTranscribing,
    recordingSeconds,
    isPushToTalk,
    transcript,
    interimTranscript,
    pendingTranscript,
    reviewBeforeSend,
    lastSttLatencyMs,
    error,
    startListening,
    stopListening,
    startMediaRecording,
    stopMediaRecording,
    startPushToTalk,
    stopPushToTalk,
    cancelListening,
    resetTranscript,
    setReviewBeforeSend,
    setPendingTranscriptText,
    confirmPendingTranscript,
    discardPendingTranscript,
  };
}
