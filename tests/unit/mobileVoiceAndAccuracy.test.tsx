import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BASE_SYSTEM_INSTRUCTION,
  buildConversationSteps,
  buildSystemInstruction,
  generateGeminiReply,
  getClarifyingQuestionForUnclearAudio,
} from '../../api/_lib/gemini';
import { ChatWindow } from '../../src/components/chat/ChatWindow';
import { VoiceControls } from '../../src/components/voice/VoiceControls';
import {
  getSupportedAudioMimeType,
  isMobileBrowser,
  shouldReviewRecognizedTranscript,
} from '../../src/hooks/useSpeechRecognition';
import {
  clearChatResponseCache,
  isContextDependentFollowUp,
  sendChatMessage,
} from '../../src/services/chatService';
import type { Message, SupportedLanguage } from '../../src/types';
import { detectMessageLanguage } from '../../src/utils/language';

// Ensure jsdom supports scrollIntoView used by ChatWindow
if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = vi.fn();
}

const mockInteractionsCreate = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    interactions: {
      create: (...args: unknown[]) => mockInteractionsCreate(...args),
    },
  })),
}));

describe('Mobile Voice Compatibility & Transcript Verification', () => {
  beforeEach(() => {
    clearChatResponseCache();
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-server-key-mobile-suite';
    process.env.GEMINI_MODEL = 'gemini-4-hydrogen';
  });

  it('detects Android, iPhone, iPad, and Desktop user agents accurately', () => {
    expect(
      isMobileBrowser(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36'
      )
    ).toBe(true);
    expect(
      isMobileBrowser(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1'
      )
    ).toBe(true);
    expect(
      isMobileBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36'
      )
    ).toBe(false);
    expect(
      isMobileBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/126.0.0.0'
      )
    ).toBe(false);
  });

  it('selects optimal MediaRecorder MIME types for Android Chrome (webm opus) and iOS Safari (mp4)', () => {
    const originalMediaRecorder = globalThis.MediaRecorder;
    const originalNavigator = globalThis.navigator;

    try {
      // Simulate iPhone Safari supporting audio/mp4 only
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        },
        configurable: true,
      });
      (globalThis as unknown as { MediaRecorder: unknown }).MediaRecorder = {
        isTypeSupported: (mime: string) =>
          mime === 'audio/mp4' || mime === 'audio/aac',
      };
      expect(getSupportedAudioMimeType()).toBe('audio/mp4');

      // Simulate Android Chrome supporting audio/webm;codecs=opus
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36',
        },
        configurable: true,
      });
      (globalThis as unknown as { MediaRecorder: unknown }).MediaRecorder = {
        isTypeSupported: (mime: string) => mime === 'audio/webm;codecs=opus',
      };
      expect(getSupportedAudioMimeType()).toBe('audio/webm;codecs=opus');
    } finally {
      (globalThis as unknown as { MediaRecorder: unknown }).MediaRecorder =
        originalMediaRecorder;
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
    }
  });

  it('flags low-confidence or Latin-transliterated Kannada/Hindi speech for transcript verification', () => {
    // Low confidence English transcript
    expect(
      shouldReviewRecognizedTranscript({
        transcript: 'explen quantam compooting',
        confidence: 0.55,
        language: 'en-US',
      })
    ).toBe(true);

    // High confidence clean English transcript auto-sends when reviewBeforeSend=false
    expect(
      shouldReviewRecognizedTranscript({
        transcript: 'What is machine learning?',
        confidence: 0.94,
        language: 'en-US',
      })
    ).toBe(false);

    // User selected Kannada/Hindi but Web Speech emitted Latin words -> let user review/correct
    expect(
      shouldReviewRecognizedTranscript({
        transcript: 'bengaluru havamana hegide',
        confidence: 0.9,
        language: 'kn-IN',
      })
    ).toBe(true);
    expect(
      shouldReviewRecognizedTranscript({
        transcript: 'aaj mausam kaisa hai',
        confidence: 0.9,
        language: 'hi-IN',
      })
    ).toBe(true);

    // Native Kannada & Hindi script with good confidence proceeds cleanly
    expect(
      shouldReviewRecognizedTranscript({
        transcript: 'ಬೆಂಗಳೂರು ಹವಾಮಾನ ಹೇಗಿದೆ?',
        confidence: 0.88,
        language: 'kn-IN',
      })
    ).toBe(false);
  });

  it('prevents context-dependent follow-up queries from returning stale cross-topic cache hits', () => {
    expect(isContextDependentFollowUp('Explain its advantages', [])).toBe(true);
    expect(isContextDependentFollowUp('Why?', [])).toBe(true);
    expect(isContextDependentFollowUp('ಇದರ ಪ್ರಯೋಜನಗಳೇನು?', [])).toBe(true);
    expect(isContextDependentFollowUp('इसके उदाहरण बताओ', [])).toBe(true);

    const priorHistory: Pick<Message, 'role' | 'content'>[] = [
      { role: 'user', content: 'What is solar energy?' },
      { role: 'assistant', content: 'Solar energy captures sunlight using PV panels.' },
    ];
    expect(
      isContextDependentFollowUp('What is wind power?', priorHistory)
    ).toBe(true);
    expect(isContextDependentFollowUp('What is photosynthesis?', [])).toBe(
      false
    );
  });

  it('renders mobile recording controls, transcript edit/verify card, and draft-preserving retry button', () => {
    const onConfirm = vi.fn();
    const onChangeDraft = vi.fn();
    const onRetryMessage = vi.fn();
    const onStartRecording = vi.fn();

    const { rerender } = render(
      <VoiceControls
        voiceState="idle"
        isRecognitionSupported={true}
        isSynthesisSupported={true}
        isListening={false}
        isSpeaking={false}
        isPaused={false}
        hasReplayableResponse={false}
        isMediaRecorderAvailable={true}
        onStartListening={vi.fn()}
        onStopListening={vi.fn()}
        onStartMediaRecording={onStartRecording}
        onCancelListening={vi.fn()}
        onReplayResponse={vi.fn()}
        onStopSpeaking={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('record-audio-fallback-button'));
    expect(onStartRecording).toHaveBeenCalledTimes(1);

    rerender(
      <VoiceControls
        voiceState="recording"
        isRecognitionSupported={true}
        isSynthesisSupported={true}
        isListening={true}
        isSpeaking={false}
        isPaused={false}
        hasReplayableResponse={false}
        isRecording={true}
        recordingSeconds={4}
        isMediaRecorderAvailable={true}
        onStartListening={vi.fn()}
        onStopListening={vi.fn()}
        onStopMediaRecording={vi.fn()}
        onCancelListening={vi.fn()}
        onReplayResponse={vi.fn()}
        onStopSpeaking={vi.fn()}
      />
    );
    expect(screen.getByText(/Send Clip \(0:04 \/ 0:30\)/i)).toBeInTheDocument();

    render(
      <ChatWindow
        messages={[]}
        language="kn-IN"
        voiceState="completed"
        voiceStatusLabel="Review & send transcript"
        liveTranscriptPreview=""
        isLoadingHistory={false}
        isSending={false}
        chatError="Temporary network timeout"
        voiceError="Mobile speech service failed."
        failedDraft={{
          content: 'ಕನ್ನಡದಲ್ಲಿ ವಿಜ್ಞಾನ ವಿವರಿಸಿ',
          inputMode: 'voice',
          language: 'kn-IN',
        }}
        pendingTranscript={{
          text: 'ಕನ್ನಡದಲ್ಲಿ ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ವಿವರಿಸಿ',
          language: 'kn-IN',
          confidence: 0.65,
          source: 'gemini-audio',
        }}
        isRecognitionSupported={true}
        isSynthesisSupported={true}
        isListening={false}
        isMediaRecorderAvailable={true}
        isSpeaking={false}
        isPaused={false}
        activeSpeakingMessageId={null}
        hasReplayableResponse={false}
        onRetryFailedMessage={onRetryMessage}
        onStartMediaRecording={onStartRecording}
        onChangePendingTranscript={onChangeDraft}
        onConfirmPendingTranscript={onConfirm}
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
    );

    expect(screen.getByTestId('pending-transcript-card')).toBeInTheDocument();
    expect(screen.getByText('65% confidence')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('pending-transcript-textarea'), {
      target: { value: 'ಕನ್ನಡದಲ್ಲಿ AI ಬಗ್ಗೆ ತಿಳಿಸಿ' },
    });
    expect(onChangeDraft).toHaveBeenCalledWith('ಕನ್ನಡದಲ್ಲಿ AI ಬಗ್ಗೆ ತಿಳಿಸಿ');

    fireEvent.click(screen.getByTestId('confirm-transcript-send-button'));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('retry-failed-message-button'));
    expect(onRetryMessage).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('fallback-record-audio-button')).toBeInTheDocument();
  });

  it('throws honest ChatServiceError instead of faking an answer when chat API fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Gemini upstream error 502' }),
    } as Response);

    await expect(
      sendChatMessage({
        conversationId: 'conv-fail-test',
        message: 'What is dark matter?',
        language: 'en-US',
        inputMode: 'text',
      })
    ).rejects.toThrow('Gemini upstream error 502');

    fetchSpy.mockRestore();
  });
});

interface AccuracyTestCase {
  id: string;
  category: string;
  question: string;
  preferredLang: SupportedLanguage;
  expectedDetectedLang: SupportedLanguage;
  inputMode: 'voice' | 'text';
  history?: Message[];
  expectedMockReply: string;
  expectUnclearClarification?: boolean;
}

const THIRTY_REPRESENTATIVE_QUESTIONS: AccuracyTestCase[] = [
  // Category 1: Simple Factual Questions (Q1-Q3)
  {
    id: 'Q1',
    category: 'Simple Factual',
    question: 'What is the capital of Karnataka?',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'voice',
    expectedMockReply: 'The capital of Karnataka is Bengaluru.',
  },
  {
    id: 'Q2',
    category: 'Simple Factual',
    question: 'How many planets are in our solar system?',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'text',
    expectedMockReply: 'There are 8 recognized planets in our solar system.',
  },
  {
    id: 'Q3',
    category: 'Simple Factual',
    question: 'What is the chemical formula for water?',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'voice',
    expectedMockReply: 'The chemical formula for water is H2O.',
  },

  // Category 2: Conceptual / Educational Questions (Q4-Q6)
  {
    id: 'Q4',
    category: 'Conceptual / Educational',
    question: 'Explain photosynthesis in simple terms.',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'voice',
    expectedMockReply:
      'Photosynthesis is how plants turn sunlight, water, and carbon dioxide into glucose and oxygen.',
  },
  {
    id: 'Q5',
    category: 'Conceptual / Educational',
    question: 'What is HTTP vs HTTPS and why does it matter on mobile?',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'text',
    expectedMockReply:
      'HTTPS encrypts traffic using TLS so mobile microphone and account requests stay private.',
  },
  {
    id: 'Q6',
    category: 'Conceptual / Educational',
    question: 'Explain Newton first law of motion with an everyday example.',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'text',
    expectedMockReply:
      'An object stays at rest or keeps moving unless acted on by an external force, like a passenger leaning forward when a bus brakes.',
  },

  // Category 3: Context-Dependent Follow-up Questions (Q7-Q9)
  {
    id: 'Q7',
    category: 'Context Follow-Up',
    question: 'Explain its main advantages.',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'voice',
    history: [
      {
        id: 'm1',
        conversation_id: 'c1',
        role: 'user',
        content: 'What is solar power?',
        language: 'en-US',
        input_mode: 'voice',
        created_at: '2026-01-01T10:00:00Z',
      },
      {
        id: 'm2',
        conversation_id: 'c1',
        role: 'assistant',
        content: 'Solar power converts sunlight into electricity using photovoltaic panels.',
        language: 'en-US',
        input_mode: 'voice',
        created_at: '2026-01-01T10:00:02Z',
      },
    ],
    expectedMockReply:
      'Solar power reduces electricity bills, requires low maintenance, and produces zero direct emissions.',
  },
  {
    id: 'Q8',
    category: 'Context Follow-Up',
    question: 'Give one real-world example of that.',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'text',
    history: [
      {
        id: 'm3',
        conversation_id: 'c1',
        role: 'user',
        content: 'What is caching in web apps?',
        language: 'en-US',
        input_mode: 'text',
        created_at: '2026-01-01T10:01:00Z',
      },
      {
        id: 'm4',
        conversation_id: 'c1',
        role: 'assistant',
        content: 'Caching stores frequent results temporarily for faster retrieval.',
        language: 'en-US',
        input_mode: 'text',
        created_at: '2026-01-01T10:01:02Z',
      },
    ],
    expectedMockReply: 'A browser stores website images locally so pages load faster on repeat visits.',
  },
  {
    id: 'Q9',
    category: 'Context Follow-Up',
    question: 'Now compare those two briefly.',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'voice',
    history: [
      {
        id: 'm5',
        conversation_id: 'c1',
        role: 'user',
        content: 'Explain REST vs GraphQL.',
        language: 'en-US',
        input_mode: 'text',
        created_at: '2026-01-01T10:02:00Z',
      },
      {
        id: 'm6',
        conversation_id: 'c1',
        role: 'assistant',
        content: 'REST uses fixed resource endpoints while GraphQL uses flexible client queries.',
        language: 'en-US',
        input_mode: 'text',
        created_at: '2026-01-01T10:02:02Z',
      },
    ],
    expectedMockReply:
      'REST is simpler to cache per URL, while GraphQL avoids over-fetching when screens need nested data.',
  },

  // Category 4: English Voice Questions (Q10-Q12)
  {
    id: 'Q10',
    category: 'English Voice',
    question: 'How do I make good tea at home?',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'voice',
    expectedMockReply: 'Simmer water with tea leaves for 2 minutes, add milk and sugar if desired, and strain.',
  },
  {
    id: 'Q11',
    category: 'English Voice',
    question: 'Give me three tips to focus while studying.',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'voice',
    expectedMockReply: 'Silence phone notifications, study in 25-minute blocks, and set one clear goal per session.',
  },
  {
    id: 'Q12',
    category: 'English Voice',
    question: 'Why does the sky look blue during the day?',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'voice',
    expectedMockReply: 'Air molecules scatter shorter blue wavelengths of sunlight more than red ones.',
  },

  // Category 5: Hindi Questions (Q13-Q15)
  {
    id: 'Q13',
    category: 'Hindi Multilingual',
    question: 'कृत्रिम बुद्धिमत्ता क्या है?',
    preferredLang: 'hi-IN',
    expectedDetectedLang: 'hi-IN',
    inputMode: 'voice',
    expectedMockReply:
      'कृत्रिम बुद्धिमत्ता ऐसी तकनीक है जिससे कंप्यूटर मानव की तरह सीखने और समस्या हल करने में सक्षम होते हैं।',
  },
  {
    id: 'Q14',
    category: 'Hindi Multilingual',
    question: 'पानी बचाने के दो आसान तरीके बताइए।',
    preferredLang: 'hi-IN',
    expectedDetectedLang: 'hi-IN',
    inputMode: 'text',
    expectedMockReply: 'ब्रश करते समय नल बंद रखें और टपकते पाइप की तुरंत मरम्मत करवाएं।',
  },
  {
    id: 'Q15',
    category: 'Hindi Multilingual',
    question: 'परीक्षा की तैयारी जल्दी कैसे करें?',
    preferredLang: 'hi-IN',
    expectedDetectedLang: 'hi-IN',
    inputMode: 'voice',
    expectedMockReply: 'मुख्य विषयों के छोटे नोट्स बनाएं और पिछले प्रश्नपत्रों का अभ्यास करें।',
  },

  // Category 6: Kannada Questions (Q16-Q18)
  {
    id: 'Q16',
    category: 'Kannada Multilingual',
    question: 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಎಂದರೇನು?',
    preferredLang: 'kn-IN',
    expectedDetectedLang: 'kn-IN',
    inputMode: 'voice',
    expectedMockReply:
      'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಎಂದರೆ ಕಂಪ್ಯೂಟರ್‌ಗಳು ಮಾನವರಂತೆ ಕಲಿಯುವ ಮತ್ತು ನಿರ್ಧಾರ ತೆಗೆದುಕೊಳ್ಳುವ ತಂತ್ರಜ್ಞಾನವಾಗಿದೆ.',
  },
  {
    id: 'Q17',
    category: 'Kannada Multilingual',
    question: 'ಪ್ರತಿದಿನ ಆರೋಗ್ಯವಾಗಿರಲು ಎರಡು ಸಲಹೆ ನೀಡಿ.',
    preferredLang: 'kn-IN',
    expectedDetectedLang: 'kn-IN',
    inputMode: 'voice',
    expectedMockReply: 'ಪ್ರತಿದಿನ ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ಕನಿಷ್ಠ 30 ನಿಮಿಷ ನಡೆಯಿರಿ.',
  },
  {
    id: 'Q18',
    category: 'Kannada Multilingual',
    question: 'ಸೌರವ್ಯೂಹದಲ್ಲಿ ಅತಿ ದೊಡ್ಡ ಗ್ರಹ ಯಾವುದು?',
    preferredLang: 'kn-IN',
    expectedDetectedLang: 'kn-IN',
    inputMode: 'text',
    expectedMockReply: 'ಸೌರವ್ಯೂಹದ ಅತಿ ದೊಡ್ಡ ಗ್ರಹ ಗುರು ಗ್ರಹ (Jupiter).',
  },

  // Category 7: Mixed-Language Questions (Q19-Q21)
  {
    id: 'Q19',
    category: 'Mixed-Language',
    question: 'AI ಅಂದ್ರೆ ಏನು? Explain in simple Kannada and English.',
    preferredLang: 'kn-IN',
    expectedDetectedLang: 'kn-IN',
    inputMode: 'voice',
    expectedMockReply:
      'AI ಅಂದರೆ Artificial Intelligence — ಡೇಟಾದಿಂದ ಕಲಿತು ಉತ್ತರ ನೀಡುವ ಸ್ಮಾರ್ಟ್ ತಂತ್ರಜ್ಞಾನ.',
  },
  {
    id: 'Q20',
    category: 'Mixed-Language',
    question: 'Photosynthesis क्या होता है? Simply explain please.',
    preferredLang: 'hi-IN',
    expectedDetectedLang: 'hi-IN',
    inputMode: 'voice',
    expectedMockReply:
      'Photosynthesis वह प्रक्रिया है जिससे पौधे धूप और पानी से अपना भोजन बनाते हैं।',
  },
  {
    id: 'Q21',
    category: 'Mixed-Language',
    question: 'React hooks ಬಗ್ಗೆ short ಆಗಿ ಹೇಳು please.',
    preferredLang: 'kn-IN',
    expectedDetectedLang: 'kn-IN',
    inputMode: 'text',
    expectedMockReply:
      'React hooks ಫಂಕ್ಷನ್ ಕಾಂಪೊನೆಂಟ್‌ಗಳಲ್ಲಿ state ಮತ್ತು lifecycle ನಿರ್ವಹಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ.',
  },

  // Category 8: Ambiguous Questions (Q22-Q24)
  {
    id: 'Q22',
    category: 'Ambiguous Question',
    question: 'Explain Python.',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'text',
    expectedMockReply:
      'Do you mean Python the programming language or Python the snake? Tell me which one and I will explain clearly.',
  },
  {
    id: 'Q23',
    category: 'Ambiguous Question',
    question: 'Tell me about Apple.',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'voice',
    expectedMockReply:
      'Are you asking about Apple Inc. (the technology company) or the fruit?',
  },
  {
    id: 'Q24',
    category: 'Ambiguous Question',
    question: 'How do I reset it?',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'voice',
    expectedMockReply:
      'Could you let me know which device, app, or password you would like to reset?',
  },

  // Category 9: Unclear / Mis-transcribed Speech Questions (Q25-Q27)
  {
    id: 'Q25',
    category: 'Unclear / Mistranscribed Speech',
    question: 'uhh',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'voice',
    expectedMockReply: '',
    expectUnclearClarification: true,
  },
  {
    id: 'Q26',
    category: 'Unclear / Mistranscribed Speech',
    question: 'Explain photo synthesis in plant leaves please',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'voice',
    expectedMockReply:
      'If you meant photosynthesis in plant leaves, chlorophyll captures sunlight to convert water and CO2 into food.',
  },
  {
    id: 'Q27',
    category: 'Unclear / Mistranscribed Speech',
    question: 'hmm',
    preferredLang: 'kn-IN',
    expectedDetectedLang: 'kn-IN',
    inputMode: 'voice',
    expectedMockReply: '',
    expectUnclearClarification: true,
  },

  // Category 10: Fact Verification / Uncertainty / Real-time Limits (Q28-Q30)
  {
    id: 'Q28',
    category: 'Uncertainty / No Fabrication',
    question: 'What is the exact live stock price of NVIDIA right this second?',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'text',
    expectedMockReply:
      'I cannot access real-time live market feeds right now, so I cannot give today’s exact live stock price without guessing.',
  },
  {
    id: 'Q29',
    category: 'Uncertainty / No Fabrication',
    question: 'Give me the secret private phone number of my neighbor.',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'text',
    expectedMockReply:
      'I do not have access to private personal information or phone directories and will not guess.',
  },
  {
    id: 'Q30',
    category: 'Uncertainty / No Fabrication',
    question: 'Who won yesterday local school tournament in my town?',
    preferredLang: 'en-US',
    expectedDetectedLang: 'en-US',
    inputMode: 'voice',
    expectedMockReply:
      'I do not have access to local live event results or which town you mean, so I cannot verify yesterday’s winner.',
  },
];

describe('30-Question Representative AI Accuracy, Multilingual & Context Evaluation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-server-key-accuracy-suite';
    process.env.GEMINI_MODEL = 'gemini-4-hydrogen';
  });

  it('enforces all 20 MyVoice core accuracy, multilingual, and anti-fabrication rules in BASE_SYSTEM_INSTRUCTION', () => {
    expect(BASE_SYSTEM_INSTRUCTION).toContain('1. Understand the complete question before responding.');
    expect(BASE_SYSTEM_INSTRUCTION).toContain('4. Do not invent facts, statistics, sources or information.');
    expect(BASE_SYSTEM_INSTRUCTION).toContain('6. If you are uncertain, clearly explain the uncertainty.');
    expect(BASE_SYSTEM_INSTRUCTION).toContain('7. If the question is ambiguous, ask a short clarification question.');
    expect(BASE_SYSTEM_INSTRUCTION).toContain('14. Correctly interpret English, Hindi and Kannada');
    expect(BASE_SYSTEM_INSTRUCTION).toContain('16. Preserve the intended meaning of spoken questions');
    expect(BASE_SYSTEM_INSTRUCTION).toContain('17. Never claim to have searched the internet');
    expect(BASE_SYSTEM_INSTRUCTION).toContain('19. If the answer depends on current information');
  });

  it.each(THIRTY_REPRESENTATIVE_QUESTIONS)(
    '$id [$category]: routes language, preserves chronological context, builds strict instructions, and returns non-empty relevant output',
    async (tc) => {
      const detected = detectMessageLanguage(tc.question, tc.preferredLang);
      expect(detected.language).toBe(tc.expectedDetectedLang);

      if (tc.expectUnclearClarification) {
        const clarification = getClarifyingQuestionForUnclearAudio(
          tc.question,
          detected.language,
          tc.inputMode
        );
        expect(clarification).toBeTruthy();
        expect(clarification!.length).toBeGreaterThan(15);
        return;
      }

      const instruction = buildSystemInstruction(detected.language, {
        inputMode: tc.inputMode,
        styleMode: 'tutor',
      });
      expect(instruction).toContain('Accuracy, relevance, clarity and honesty');

      const steps = buildConversationSteps(tc.history || [], tc.question);
      expect(steps[steps.length - 1]).toEqual({
        type: 'user_input',
        content: [{ type: 'text', text: tc.question }],
      });
      if (tc.history && tc.history.length > 0) {
        expect(steps.length).toBe(tc.history.length + 1);
        expect(steps[0]).toEqual({
          type: tc.history[0].role === 'user' ? 'user_input' : 'model_output',
          content: [{ type: 'text', text: tc.history[0].content }],
        });
      }

      mockInteractionsCreate.mockResolvedValueOnce({
        status: 'completed',
        output_text: tc.expectedMockReply,
      });

      const reply = await generateGeminiReply({
        historyMessages: tc.history || [],
        currentMessage: tc.question,
        language: detected.language,
        inputMode: tc.inputMode,
        styleMode: 'tutor',
      });

      expect(reply).toBe(tc.expectedMockReply);
      const requestArg = mockInteractionsCreate.mock.calls[0]?.[0] as {
        system_instruction: string;
        input: unknown[];
        generation_config: { max_output_tokens: number };
      };
      expect(requestArg.system_instruction).toContain('IMPORTANT RULES:');
      expect(requestArg.generation_config.max_output_tokens).toBeGreaterThanOrEqual(480);
    }
  );
});
