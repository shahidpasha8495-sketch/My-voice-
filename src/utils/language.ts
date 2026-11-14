import type { LanguageMetadata, SupportedLanguage } from '../types';
import { isSupportedLanguage } from './validation';

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageMetadata> = {
  'en-US': {
    code: 'en-US',
    name: 'English',
    nativeName: 'English',
    shortLabel: 'EN',
    speechRecognitionLang: 'en-US',
    speechSynthesisLang: 'en-US',
    welcomeSubtitle: 'Start speaking or type below to converse naturally with Gemini AI.',
    voicePromptHint: 'Tap the microphone to speak or type a message...',
    suggestedPrompts: [
      {
        label: 'Explain a difficult topic',
        prompt: 'Explain quantum computing in simple terms with a real-world analogy.',
        category: 'Learning',
      },
      {
        label: 'Help me learn something new',
        prompt: 'Create a 5-minute daily learning plan to master public speaking.',
        category: 'Growth',
      },
      {
        label: 'Answer a question in Kannada',
        prompt: 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (AI) ಎಂದರೇನು? ಸರಳ ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸಿ.',
        category: 'Multilingual',
      },
    ],
  },
  'hi-IN': {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    shortLabel: 'हिं',
    speechRecognitionLang: 'hi-IN',
    speechSynthesisLang: 'hi-IN',
    welcomeSubtitle: 'बोलना शुरू करें या नीचे टाइप करें — MyVoice आपकी भाषा में संवाद करता है।',
    voicePromptHint: 'बोलने के लिए माइक दबाएं या संदेश लिखें...',
    suggestedPrompts: [
      {
        label: 'एक कठिन विषय समझाएं (Explain a topic)',
        prompt: 'कृत्रिम बुद्धिमत्ता (Artificial Intelligence) क्या है और यह कैसे काम करती है? सरल हिंदी में समझाएं।',
        category: 'शिक्षा',
      },
      {
        label: 'कुछ नया सीखने में मदद करें',
        prompt: 'मुझे समय प्रबंधन (Time Management) के 5 व्यावहारिक तरीके बताएं।',
        category: 'कौशल',
      },
      {
        label: 'कन्नड़ में उत्तर दें (Answer in Kannada)',
        prompt: 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (AI) ಎಂದರೇನು? ಸರಳ ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸಿ.',
        category: 'बहुभाषी',
      },
    ],
  },
  'kn-IN': {
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    shortLabel: 'ಕ',
    speechRecognitionLang: 'kn-IN',
    speechSynthesisLang: 'kn-IN',
    welcomeSubtitle: 'ಮಾತನಾಡಲು ಪ್ರಾರಂಭಿಸಿ ಅಥವಾ ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ — MyVoice ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸುತ್ತದೆ.',
    voicePromptHint: 'ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿರಿ ಅಥವಾ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...',
    suggestedPrompts: [
      {
        label: 'Answer a question in Kannada',
        prompt: 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (AI) ಎಂದರೇನು? ಸರಳ ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸಿ.',
        category: 'ತಿಳುವಳಿಕೆ',
      },
      {
        label: 'ಕಷ್ಟಕರವಾದ ವಿಷಯವನ್ನು ವಿವರಿಸಿ',
        prompt: 'ಬಾಹ್ಯಾಕಾಶ ತಂತ್ರಜ್ಞಾನ ಮತ್ತು ಉಪಗ್ರಹಗಳು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತವೆ ಎಂಬುದನ್ನು ವಿವರಿಸಿ.',
        category: 'ವಿಜ್ಞಾನ',
      },
      {
        label: 'ಹೊಸದನ್ನು ಕಲಿಯಲು ಸಹಾಯ ಮಾಡಿ',
        prompt: 'ದೈನಂದಿನ ಜೀವನದಲ್ಲಿ ಉತ್ತಮ ಅಭ್ಯಾಸಗಳನ್ನು ಬೆಳೆಸಿಕೊಳ್ಳಲು 5 ಸಲಹೆಗಳನ್ನು ನೀಡಿ.',
        category: 'ಕಲಿಕೆ',
      },
    ],
  },
};

export const LANGUAGE_LIST: LanguageMetadata[] = [
  LANGUAGE_CONFIGS['en-US'],
  LANGUAGE_CONFIGS['hi-IN'],
  LANGUAGE_CONFIGS['kn-IN'],
];

// Unicode script regexes
// Kannada Unicode block: U+0C80 to U+0CFF
const KANNADA_SCRIPT_REGEX = /[\u0C80-\u0CFF]/g;
// Devanagari Unicode block: U+0900 to U+097F
const DEVANAGARI_SCRIPT_REGEX = /[\u0900-\u097F]/g;
// Basic Latin letters
const LATIN_LETTERS_REGEX = /[A-Za-z]/g;

// Explicit language request patterns in Roman script
const EXPLICIT_KANNADA_HINT = /\b(in kannada|kannada dalli|kannadadalli|namaskara|hegiddira|yenu)\b/i;
const EXPLICIT_HINDI_HINT = /\b(in hindi|hindi mein|namaste|kaise ho|kya hai|samjhao)\b/i;
const EXPLICIT_ENGLISH_HINT = /\b(in english|answer in english|explain in english)\b/i;

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: 'high' | 'medium' | 'fallback';
}

/**
 * Automatically detects whether the user's message is in Kannada (kn-IN),
 * Hindi (hi-IN), or English (en-US).
 *
 * Rules from specification:
 * - Preserve the user's intended meaning.
 * - Respond in the language used by the user unless a different preference is explicitly selected.
 * - Fall back to the saved preference when language detection is uncertain.
 */
export function detectMessageLanguage(
  text: string,
  fallbackPreference: SupportedLanguage = 'en-US'
): LanguageDetectionResult {
  const safeFallback: SupportedLanguage = isSupportedLanguage(fallbackPreference)
    ? fallbackPreference
    : 'en-US';

  const trimmed = text.trim();
  if (!trimmed) {
    return { language: safeFallback, confidence: 'fallback' };
  }

  // Count characters in each script
  const kannadaMatches = trimmed.match(KANNADA_SCRIPT_REGEX)?.length ?? 0;
  const devanagariMatches = trimmed.match(DEVANAGARI_SCRIPT_REGEX)?.length ?? 0;
  const latinMatches = trimmed.match(LATIN_LETTERS_REGEX)?.length ?? 0;

  // 1. Native script detection (high confidence)
  if (kannadaMatches > 0 && kannadaMatches >= devanagariMatches) {
    return { language: 'kn-IN', confidence: 'high' };
  }

  if (devanagariMatches > 0 && devanagariMatches > kannadaMatches) {
    return { language: 'hi-IN', confidence: 'high' };
  }

  // 2. Explicit language request hints in Latin script
  if (EXPLICIT_KANNADA_HINT.test(trimmed)) {
    return { language: 'kn-IN', confidence: 'medium' };
  }

  if (EXPLICIT_HINDI_HINT.test(trimmed)) {
    return { language: 'hi-IN', confidence: 'medium' };
  }

  if (EXPLICIT_ENGLISH_HINT.test(trimmed)) {
    return { language: 'en-US', confidence: 'medium' };
  }

  // 3. If the user has explicitly selected Hindi or Kannada as their preference,
  // and types a short or ambiguous Latin-script prompt, respect their selected preference
  // unless they clearly wrote a multi-word English sentence and their preference is en-US.
  if (safeFallback !== 'en-US') {
    return { language: safeFallback, confidence: 'fallback' };
  }

  if (latinMatches >= 2) {
    return { language: 'en-US', confidence: 'medium' };
  }

  return { language: safeFallback, confidence: 'fallback' };
}

export function getLanguageMetadata(lang?: string | null): LanguageMetadata {
  if (lang && isSupportedLanguage(lang)) {
    return LANGUAGE_CONFIGS[lang];
  }
  return LANGUAGE_CONFIGS['en-US'];
}
