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
      {
        label: 'Draft a professional email',
        prompt: 'Write a polite, clear email requesting a project deadline extension of 3 days.',
        category: 'Work & Writing',
      },
      {
        label: 'Plan my productive day',
        prompt: 'Give me a focused morning-to-evening productivity routine for a busy student or professional.',
        category: 'Daily Life',
      },
      {
        label: 'Solve & debug code fast',
        prompt: 'Explain how async/await works in JavaScript with a clean, practical example.',
        category: 'Coding & Tech',
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
      {
        label: 'प्रोफेशनल ईमेल लिखें (Write Email)',
        prompt: 'छुट्टी के आवेदन के लिए एक विनम्र और पेशेवर ईमेल हिंदी में लिखें।',
        category: 'लेखन',
      },
      {
        label: 'अंग्रेजी बोलना सीखें (Spoken English)',
        prompt: 'दैनिक बातचीत में उपयोग होने वाले 5 महत्वपूर्ण अंग्रेजी वाक्य हिंदी अर्थ के साथ बताएं।',
        category: 'भाषा अभ्यास',
      },
      {
        label: 'स्वास्थ्य और दिनचर्या (Daily Routine)',
        prompt: 'दिनभर ऊर्जावान और केंद्रित रहने के लिए एक सरल सुबह की दिनचर्या बताएं।',
        category: 'जीवनशैली',
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
      {
        label: 'ವೃತ್ತಿಪರ ಇಮೇಲ್ ಬರೆಯಿರಿ (Write Email)',
        prompt: 'ಕೆಲಸದ ಸಂದರ್ಶನಕ್ಕೆ ಧನ್ಯವಾದ ತಿಳಿಸುವ ವೃತ್ತಿಪರ ಸಂದೇಶವನ್ನು ಕನ್ನಡದಲ್ಲಿ ಬರೆಯಿರಿ.',
        category: 'ವೃತ್ತಿ',
      },
      {
        label: 'ಇಂಗ್ಲಿಷ್ ಸಂವಹನ ಕಲಿಯಿರಿ (Spoken English)',
        prompt: 'ದೈನಂದಿನ ಜೀವನದಲ್ಲಿ ಉಪಯೋಗವಾಗುವ 5 ಪ್ರಮುಖ ಇಂಗ್ಲಿಷ್ ವಾಕ್ಯಗಳನ್ನು ಕನ್ನಡ ಅರ್ಥದೊಂದಿಗೆ ತಿಳಿಸಿ.',
        category: 'ಭಾಷೆ',
      },
      {
        label: 'ದಿನಚರಿ ಮತ್ತು ಸಮಯ ನಿರ್ವಹಣೆ',
        prompt: 'ವಿದ್ಯಾರ್ಥಿಗಳು ಮತ್ತು ಉದ್ಯೋಗಿಗಳಿಗಾಗಿ ಸಮಯ ನಿರ್ವಹಣೆಯ 5 ಸರಳ ಸೂತ್ರಗಳನ್ನು ತಿಳಿಸಿ.',
        category: 'ಜೀವನಶೈಲಿ',
      },
    ],
  },
};

export const FOLLOW_UP_QUICK_ACTIONS: Record<
  SupportedLanguage,
  Array<{ label: string; prompt: string }>
> = {
  'en-US': [
    { label: '✨ Explain simpler', prompt: 'Explain that in even simpler, everyday terms with a quick example.' },
    { label: '🎯 Practical example', prompt: 'Give me a concrete, real-world example of how to apply this.' },
    { label: '📋 3-bullet summary', prompt: 'Summarize the key takeaways in 3 short, actionable bullet points.' },
    { label: '🇮🇳 इन हिंदी (Hindi)', prompt: 'इसी उत्तर को सरल और स्वाभाविक हिंदी में समझाएं।' },
    { label: '🇮🇳 ಕನ್ನಡದಲ್ಲಿ (Kannada)', prompt: 'ಇದೇ ಉತ್ತರವನ್ನು ಸರಳ ಮತ್ತು ಸಹಜ ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸಿ.' },
  ],
  'hi-IN': [
    { label: '✨ और सरल शब्दों में', prompt: 'इसे और भी सरल और बोलचाल की भाषा में उदाहरण के साथ समझाएं।' },
    { label: '🎯 व्यावहारिक उदाहरण', prompt: 'इसका एक वास्तविक जीवन का व्यावहारिक उदाहरण दें।' },
    { label: '📋 3 मुख्य बिंदु', prompt: 'इस उत्तर को 3 संक्षिप्त और मुख्य बिंदुओं में सारांशित करें।' },
    { label: '🌐 In English', prompt: 'Translate and explain this response in clear, natural English.' },
    { label: '🇮🇳 ಕನ್ನಡದಲ್ಲಿ (Kannada)', prompt: 'ಇದೇ ಉತ್ತರವನ್ನು ಸರಳ ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸಿ.' },
  ],
  'kn-IN': [
    { label: '✨ ಇನ್ನಷ್ಟು ಸರಳವಾಗಿ', prompt: 'ಇದನ್ನು ಇನ್ನಷ್ಟು ಸರಳವಾಗಿ ಒಂದು ಚಿಕ್ಕ ಉದಾಹರಣೆಯೊಂದಿಗೆ ವಿವರಿಸಿ.' },
    { label: '🎯 ನೈಜ ಉದಾಹರಣೆ', prompt: 'ಇದಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಒಂದು ಪ್ರಾಯೋಗಿಕ ಉದಾಹರಣೆಯನ್ನು ನೀಡಿ.' },
    { label: '📋 3 ಪ್ರಮುಖ ಅಂಶಗಳು', prompt: 'ಇದರ ಪ್ರಮುಖ ಅಂಶಗಳನ್ನು 3 ಚಿಕ್ಕ ಸಾಲುಗಳಲ್ಲಿ ತಿಳಿಸಿ.' },
    { label: '🌐 In English', prompt: 'Translate and explain this response in clear, natural English.' },
    { label: '🇮🇳 हिंदी में (Hindi)', prompt: 'इसी उत्तर को सरल हिंदी में समझाएं।' },
  ],
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
