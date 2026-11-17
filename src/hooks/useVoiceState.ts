import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { InputMode, VoiceError, VoiceErrorCode, VoiceState } from '../types';

export const VOICE_STATE_LABELS: Record<VoiceState, string> = {
  idle: 'Ready for voice or text',
  requesting_permission: 'Requesting microphone permission…',
  listening: 'Listening… Speak now',
  speech_detected: 'Speech detected… Capturing audio',
  recording: 'Recording mobile audio… Tap Stop when done',
  transcribing: 'Transcribing speech with Gemini…',
  processing: 'Processing recognized speech…',
  generating_response: 'Gemini is generating a response…',
  speaking: 'Speaking AI response…',
  paused: 'Speech playback paused',
  completed: 'Completed',
  error: 'Voice interaction issue',
};

export interface VoiceStateContextValue {
  voiceState: VoiceState;
  stateLabel: string;
  voiceError: VoiceError | null;
  interactionMode: InputMode;
  autoSpeakResponses: boolean;
  transitionTo: (nextState: VoiceState) => void;
  setVoiceErrorState: (code: VoiceErrorCode, message: string) => void;
  clearVoiceError: () => void;
  resetVoiceState: () => void;
  setInteractionMode: (mode: InputMode) => void;
  setAutoSpeakResponses: (enabled: boolean) => void;
}

const VoiceStateContext = createContext<VoiceStateContextValue | null>(null);

export function useVoiceStateStandalone() {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceError, setVoiceError] = useState<VoiceError | null>(null);
  const [interactionMode, setInteractionMode] = useState<InputMode>('text');
  const [autoSpeakResponses, setAutoSpeakResponses] = useState<boolean>(true);

  const transitionTo = useCallback((nextState: VoiceState) => {
    setVoiceState(nextState);
    if (nextState !== 'error') {
      setVoiceError(null);
    }
  }, []);

  const setVoiceErrorState = useCallback((code: VoiceErrorCode, message: string) => {
    setVoiceError({ code, message });
    setVoiceState('error');
  }, []);

  const clearVoiceError = useCallback(() => {
    setVoiceError(null);
    setVoiceState((prev) => (prev === 'error' ? 'idle' : prev));
  }, []);

  const resetVoiceState = useCallback(() => {
    setVoiceError(null);
    setVoiceState('idle');
  }, []);

  return useMemo<VoiceStateContextValue>(
    () => ({
      voiceState,
      stateLabel:
        voiceState === 'error' && voiceError?.message
          ? voiceError.message
          : VOICE_STATE_LABELS[voiceState],
      voiceError,
      interactionMode,
      autoSpeakResponses,
      transitionTo,
      setVoiceErrorState,
      clearVoiceError,
      resetVoiceState,
      setInteractionMode,
      setAutoSpeakResponses,
    }),
    [
      voiceState,
      voiceError,
      interactionMode,
      autoSpeakResponses,
      transitionTo,
      setVoiceErrorState,
      clearVoiceError,
      resetVoiceState,
    ]
  );
}

export function VoiceStateProvider({ children }: { children: ReactNode }) {
  const value = useVoiceStateStandalone();
  return React.createElement(VoiceStateContext.Provider, { value }, children);
}

export function useVoiceState(): VoiceStateContextValue {
  const context = useContext(VoiceStateContext);
  const standalone = useVoiceStateStandalone();
  return context ?? standalone;
}
