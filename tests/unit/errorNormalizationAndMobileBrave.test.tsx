import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from '../../src/components/auth/LoginForm';
import { ChatWindow } from '../../src/components/chat/ChatWindow';
import { AuthProvider } from '../../src/hooks/useAuth';
import { useSpeechRecognition } from '../../src/hooks/useSpeechRecognition';
import { VoiceStateProvider } from '../../src/hooks/useVoiceState';
import {
  ChatServiceError,
  clearChatResponseCache,
  sendChatMessage,
} from '../../src/services/chatService';
import {
  getGuestConversations,
  removeConversation,
} from '../../src/services/conversationService';
import {
  DEFAULT_UNKNOWN_ERROR_MESSAGE,
  normalizeApiErrorPayload,
  normalizeError,
} from '../../src/utils/normalizeError';

if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = vi.fn();
}

describe('Task 2 & 6: Error Normalization Utility & [object Object] Prevention', () => {
  beforeEach(() => {
    clearChatResponseCache();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes Error instances, nested Vercel API objects, strings, DOMExceptions, null, undefined, and unknown values without ever returning [object Object]', () => {
    // 1. Standard Error
    expect(normalizeError(new Error('Gemini rate limit reached'))).toBe(
      'Gemini rate limit reached'
    );

    // 2. Corrupted Error("[object Object]") caused by bad upstream coercion
    expect(normalizeError(new Error('[object Object]'))).toBe(
      DEFAULT_UNKNOWN_ERROR_MESSAGE
    );
    expect(
      normalizeError(
        new Error('[object Object]', {
          cause: { message: 'Nested cause recovered cleanly' },
        })
      )
    ).toBe('Nested cause recovered cleanly');

    // 3. Exact Vercel HTTP 500 JSON payload returned by deployed my-voice-one.vercel.app
    const vercel500 = {
      error: {
        code: '500',
        message: 'A server error has occurred',
      },
    };
    expect(normalizeError(vercel500)).toBe('A server error has occurred');
    expect(normalizeApiErrorPayload(vercel500, 500)).toBe(
      'Server temporarily unavailable (500). Please try again.'
    );
    expect(normalizeApiErrorPayload(vercel500, 500)).not.toContain('[object Object]');

    // 4. Supabase Auth & Postgrest error shapes
    expect(
      normalizeError({ error_description: 'Invalid login credentials' })
    ).toBe('Invalid login credentials');
    expect(normalizeError({ details: 'Row level security violation' })).toBe(
      'Row level security violation'
    );

    // 5. DOMException handling
    const deniedDom = new DOMException('Permission denied by user', 'NotAllowedError');
    expect(normalizeError(deniedDom)).toBe(
      'Please allow microphone access in your browser settings.'
    );
    const notFoundDom = new DOMException('Requested device not found', 'NotFoundError');
    expect(normalizeError(notFoundDom)).toBe(
      'Microphone is unavailable. Please connect a microphone or use text chat.'
    );

    // 6. String, literal "[object Object]" string, null, undefined, cyclic/unknown objects
    expect(normalizeError('  Simple text error  ')).toBe('Simple text error');
    expect(normalizeError('[object Object]')).toBe(DEFAULT_UNKNOWN_ERROR_MESSAGE);
    expect(normalizeError(null)).toBe(DEFAULT_UNKNOWN_ERROR_MESSAGE);
    expect(normalizeError(undefined)).toBe(DEFAULT_UNKNOWN_ERROR_MESSAGE);
    expect(normalizeError(42)).toBe(DEFAULT_UNKNOWN_ERROR_MESSAGE);

    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(normalizeError(cyclic)).toBe(DEFAULT_UNKNOWN_ERROR_MESSAGE);
  });

  it('prevents [object Object] when Vercel returns { error: { code: "500", message: "A server error has occurred" } } on chat or delete', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: { code: '500', message: 'A server error has occurred' },
      }),
    } as Response);

    await expect(
      sendChatMessage({
        conversationId: 'conv-vercel-500',
        message: 'Hi',
        language: 'en-US',
        inputMode: 'text',
      })
    ).rejects.toMatchObject({
      name: 'ChatServiceError',
      message: 'Server temporarily unavailable (500). Please try again.',
    });

    // Also verify ChatServiceError coerces directly passed object payloads safely
    const forced = new ChatServiceError(
      { error: { message: 'Nested gateway error' } } as unknown as string,
      502
    );
    expect(forced.message).toBe('Nested gateway error');
    expect(forced.message).not.toContain('[object Object]');

    // Also verify delete endpoint handles nested { error: { message } } safely
    await expect(removeConversation('conv-123', 'user-jwt')).rejects.toThrow(
      'Server temporarily unavailable (500). Please try again.'
    );

    fetchSpy.mockRestore();
  });

  it('recovers cleanly if localStorage guest conversation storage contains corrupted non-array JSON', () => {
    localStorage.setItem('myvoice.guest_conversations', '{"broken":true}');
    expect(getGuestConversations()).toEqual([]);

    localStorage.setItem('myvoice.guest_conversations', 'not-valid-json');
    expect(getGuestConversations()).toEqual([]);
  });

  it('guarantees ChatWindow and LoginForm never display [object Object] even if passed malformed object errors', () => {
    render(
      <MemoryRouter>
        <ChatWindow
          messages={[]}
          language="en-US"
          voiceState="idle"
          voiceStatusLabel="Ready for voice or text"
          liveTranscriptPreview=""
          isLoadingHistory={false}
          isSending={false}
          chatError={'[object Object]'}
          voiceError={({ error: 'network' } as unknown) as string}
          isRecognitionSupported={true}
          isSynthesisSupported={true}
          isListening={false}
          isSpeaking={false}
          isPaused={false}
          activeSpeakingMessageId={null}
          hasReplayableResponse={false}
          onSelectSuggestedPrompt={vi.fn()}
          onStartListening={vi.fn()}
          onStopListening={vi.fn()}
          onCancelListening={vi.fn()}
          onSpeakMessage={vi.fn()}
          onStopSpeaking={vi.fn()}
          onPauseSpeaking={vi.fn()}
          onResumeSpeaking={vi.fn()}
          onReplayResponse={vi.fn()}
          onDismissChatError={vi.fn()}
          onDismissVoiceError={vi.fn()}
        />
        <LoginForm
          onSubmit={vi.fn().mockResolvedValue(false)}
          error={'[object Object]'}
          onClearError={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText(/\[object Object\]/i)).not.toBeInTheDocument();
    expect(
      screen.getByText('Unable to complete request. Please try again.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Your internet connection seems unstable.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Unable to sign in. Please try again.')
    ).toBeInTheDocument();
  });
});

describe('Task 3 & 5: Android Chrome & Brave Mobile Voice Fallback + Backgrounding Cleanup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('switches automatically to MediaRecorder on Brave Android when Web Speech emits network or service-not-allowed errors, and remembers fallback', async () => {
    const originalSpeech = window.SpeechRecognition;
    const originalWebkitSpeech = window.webkitSpeechRecognition;
    const originalMediaDevices = navigator.mediaDevices;
    const originalMediaRecorder = globalThis.MediaRecorder;

    const mockTrackStop = vi.fn();
    const mockGetUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: mockTrackStop }],
    });

    const mockRecorderStop = vi.fn();
    const mockRecorderStart = vi.fn();
    class MockMediaRecorder {
      public static isTypeSupported = (m: string) => m === 'audio/webm;codecs=opus';
      public state: 'inactive' | 'recording' = 'recording';
      public mimeType = 'audio/webm;codecs=opus';
      public ondataavailable: ((ev: unknown) => void) | null = null;
      public onstop: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      start() {
        mockRecorderStart();
      }
      stop() {
        mockRecorderStop();
      }
    }

    let createdInstances = 0;
    let triggerSpeechError: ((ev: { error: string }) => void) | null = null;
    class MockSpeechRecognition {
      lang = 'en-US';
      continuous = false;
      interimResults = true;
      maxAlternatives = 1;
      onstart: (() => void) | null = null;
      onspeechstart: (() => void) | null = null;
      onspeechend: (() => void) | null = null;
      onresult: ((ev: unknown) => void) | null = null;
      onerror: ((ev: { error: string }) => void) | null = null;
      onend: (() => void) | null = null;
      constructor() {
        createdInstances += 1;
      }
      start() {
        triggerSpeechError = this.onerror;
      }
      stop() {}
      abort() {}
    }

    try {
      window.SpeechRecognition = MockSpeechRecognition as unknown as typeof window.SpeechRecognition;
      window.webkitSpeechRecognition = undefined;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        configurable: true,
      });
      (globalThis as unknown as { MediaRecorder: unknown }).MediaRecorder = MockMediaRecorder;

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <AuthProvider>
          <VoiceStateProvider>{children}</VoiceStateProvider>
        </AuthProvider>
      );

      const { result } = renderHook(
        () => useSpeechRecognition({ language: 'kn-IN' }),
        { wrapper }
      );

      // 1. User taps Start Mic -> Web Speech starts
      await act(async () => {
        await result.current.startListening('kn-IN');
      });
      expect(createdInstances).toBe(1);

      // 2. Brave Android blocks Google STT and emits 'network' -> seamlessly falls back to MediaRecorder!
      await act(async () => {
        triggerSpeechError?.({ error: 'network' });
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
      expect(mockRecorderStart).toHaveBeenCalledTimes(1);
      expect(result.current.isRecording).toBe(true);
      expect(result.current.error).toBeNull();

      // 3. Cancel & test browser backgrounding cleanup (visibilitychange -> hidden)
      act(() => {
        Object.defineProperty(document, 'hidden', {
          value: true,
          configurable: true,
        });
        fireEvent(document, new Event('visibilitychange'));
      });

      expect(mockTrackStop).toHaveBeenCalled();
      expect(result.current.isRecording).toBe(false);
      expect(result.current.isListening).toBe(false);

      // 4. Subsequent tap skips blocked Web Speech & opens MediaRecorder directly!
      await act(async () => {
        await result.current.startListening('kn-IN');
      });
      expect(createdInstances).toBe(1);
      expect(mockRecorderStart).toHaveBeenCalledTimes(2);
    } finally {
      window.SpeechRecognition = originalSpeech;
      window.webkitSpeechRecognition = originalWebkitSpeech;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: originalMediaDevices,
        configurable: true,
      });
      (globalThis as unknown as { MediaRecorder: unknown }).MediaRecorder =
        originalMediaRecorder;
      Object.defineProperty(document, 'hidden', {
        value: false,
        configurable: true,
      });
    }
  });
});
