import { useEffect, useRef, useState } from 'react';
import type { VoiceState } from '../types';

export interface AudioAnalyzerState {
  /** Normalized amplitude 0..1 */
  amplitude: number;
  /** 16 frequency bands normalized 0..1 */
  bands: number[];
  /** Whether actual Web Audio API microphone stream is being measured */
  isMeasuringMic: boolean;
}

const DEFAULT_BANDS = new Array(16).fill(0.08);

export function useAudioAnalyzer(voiceState: VoiceState): AudioAnalyzerState {
  const [amplitude, setAmplitude] = useState<number>(0);
  const [bands, setBands] = useState<number[]>(DEFAULT_BANDS);
  const [isMeasuringMic, setIsMeasuringMic] = useState<boolean>(false);

  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;

    const cleanupAudio = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      setIsMeasuringMic(false);
    };

    const isListening =
      voiceState === 'listening' || voiceState === 'speech_detected';
    const isSpeaking = voiceState === 'speaking';

    if (!isListening && !isSpeaking) {
      cleanupAudio();
      setAmplitude(0);
      setBands(DEFAULT_BANDS);
      return cleanupAudio;
    }

    // Attempt real Web Audio API microphone measurement when listening
    const AudioContextCtor =
      typeof window !== 'undefined'
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext
        : undefined;

    if (
      isListening &&
      AudioContextCtor &&
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          const ctx = new AudioContextCtor();
          audioCtxRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.78;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          setIsMeasuringMic(true);

          const tick = () => {
            if (cancelled) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            const nextBands: number[] = [];
            for (let i = 0; i < 16; i += 1) {
              const val = (dataArray[i] || 0) / 255;
              sum += val;
              nextBands.push(Math.max(0.08, Math.min(1, val)));
            }
            const avg = Math.min(1, sum / 16);
            setAmplitude(avg);
            setBands(nextBands);
            rafRef.current = requestAnimationFrame(tick);
          };

          rafRef.current = requestAnimationFrame(tick);
        })
        .catch(() => {
          // If microphone stream cannot be opened concurrently with SpeechRecognition,
          // fall back to state-driven animation without claiming raw mic measurement.
          setIsMeasuringMic(false);
        });
    }

    // State-synchronized cadence animation for speaking (or when concurrent mic stream isn't active)
    let phase = 0;
    const animateCadence = () => {
      if (cancelled) return;
      phase += isSpeaking ? 0.16 : 0.12;
      const simulatedBands = Array.from({ length: 16 }, (_, idx) => {
        const wave1 = Math.sin(phase + idx * 0.45) * 0.35 + 0.45;
        const wave2 = Math.cos(phase * 1.4 - idx * 0.3) * 0.2;
        return Math.max(0.1, Math.min(0.95, wave1 + wave2));
      });
      const avg =
        simulatedBands.reduce((acc, v) => acc + v, 0) / simulatedBands.length;
      setBands((prev) => (streamRef.current ? prev : simulatedBands));
      setAmplitude((prev) => (streamRef.current ? prev : avg));
      rafRef.current = requestAnimationFrame(animateCadence);
    };

    if (!streamRef.current) {
      rafRef.current = requestAnimationFrame(animateCadence);
    }

    return () => {
      cancelled = true;
      cleanupAudio();
    };
  }, [voiceState]);

  return {
    amplitude,
    bands,
    isMeasuringMic,
  };
}
