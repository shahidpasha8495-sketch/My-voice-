import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  cleanTextForSpeech,
  selectBestVoice,
} from '../../src/hooks/useSpeechSynthesis';
import { useVoiceStateStandalone } from '../../src/hooks/useVoiceState';
import {
  detectMessageLanguage,
  getLanguageMetadata,
} from '../../src/utils/language';

describe('Unit: Multilingual Detection & Language Selection', () => {
  it('detects Kannada script (kn-IN) with high confidence', () => {
    const result = detectMessageLanguage(
      'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಎಂದರೇನು?',
      'en-US'
    );
    expect(result.language).toBe('kn-IN');
    expect(result.confidence).toBe('high');
  });

  it('detects Hindi Devanagari script (hi-IN) with high confidence', () => {
    const result = detectMessageLanguage(
      'कृत्रिम बुद्धिमत्ता क्या है?',
      'en-US'
    );
    expect(result.language).toBe('hi-IN');
    expect(result.confidence).toBe('high');
  });

  it('detects explicit Romanized Kannada and Hindi requests', () => {
    expect(
      detectMessageLanguage('Please answer this question in Kannada', 'en-US')
        .language
    ).toBe('kn-IN');
    expect(
      detectMessageLanguage('Namaste, yeh kya hai? Explain in Hindi', 'en-US')
        .language
    ).toBe('hi-IN');
  });

  it('falls back to saved user preference when detection is uncertain', () => {
    const emptyResult = detectMessageLanguage('   ', 'kn-IN');
    expect(emptyResult.language).toBe('kn-IN');
    expect(emptyResult.confidence).toBe('fallback');

    const numericResult = detectMessageLanguage('12345 + 67890 = ?', 'hi-IN');
    expect(numericResult.language).toBe('hi-IN');
  });

  it('returns correct metadata for en-US, hi-IN, and kn-IN', () => {
    expect(getLanguageMetadata('en-US').name).toBe('English');
    expect(getLanguageMetadata('hi-IN').nativeName).toBe('हिन्दी');
    expect(getLanguageMetadata('kn-IN').nativeName).toBe('ಕನ್ನಡ');
    expect(getLanguageMetadata('unknown').code).toBe('en-US');
  });
});

describe('Unit: Voice Interaction States (All 9 Mandatory States)', () => {
  it('transitions cleanly through all 9 required voice states', () => {
    const { result } = renderHook(() => useVoiceStateStandalone());

    // 1. Idle
    expect(result.current.voiceState).toBe('idle');

    // 2. Requesting permission
    act(() => result.current.transitionTo('requesting_permission'));
    expect(result.current.voiceState).toBe('requesting_permission');

    // 3. Listening
    act(() => result.current.transitionTo('listening'));
    expect(result.current.voiceState).toBe('listening');

    // 4. Speech detected
    act(() => result.current.transitionTo('speech_detected'));
    expect(result.current.voiceState).toBe('speech_detected');

    // 5. Processing
    act(() => result.current.transitionTo('processing'));
    expect(result.current.voiceState).toBe('processing');

    // 6. Generating response
    act(() => result.current.transitionTo('generating_response'));
    expect(result.current.voiceState).toBe('generating_response');

    // 7. Speaking
    act(() => result.current.transitionTo('speaking'));
    expect(result.current.voiceState).toBe('speaking');

    // 8. Paused
    act(() => result.current.transitionTo('paused'));
    expect(result.current.voiceState).toBe('paused');

    // 9. Error
    act(() =>
      result.current.setVoiceErrorState(
        'PERMISSION_DENIED',
        'Microphone permission is required.'
      )
    );
    expect(result.current.voiceState).toBe('error');
    expect(result.current.voiceError?.code).toBe('PERMISSION_DENIED');
    expect(result.current.stateLabel).toBe('Microphone permission is required.');

    // Reset back to idle
    act(() => result.current.resetVoiceState());
    expect(result.current.voiceState).toBe('idle');
    expect(result.current.voiceError).toBeNull();
  });

  it('cleans markdown formatting before speech synthesis and selects matching voices', () => {
    const cleaned = cleanTextForSpeech(
      '### Welcome\nHere is **bold** text and `inline code`.\n```js\nconsole.log(1);\n```'
    );
    expect(cleaned).toContain('Welcome');
    expect(cleaned).toContain('Here is bold text and inline code.');
    expect(cleaned).not.toContain('**');

    const mockVoices = [
      { lang: 'en-US', name: 'English US Standard' } as SpeechSynthesisVoice,
      { lang: 'hi-IN', name: 'Google हिन्दी' } as SpeechSynthesisVoice,
      { lang: 'kn-IN', name: 'Google ಕನ್ನಡ' } as SpeechSynthesisVoice,
    ];

    expect(selectBestVoice(mockVoices, 'kn-IN')?.name).toBe('Google ಕನ್ನಡ');
    expect(selectBestVoice(mockVoices, 'hi-IN')?.name).toBe('Google हिन्दी');
    expect(selectBestVoice(mockVoices, 'en-US')?.name).toBe('English US Standard');
  });
});
