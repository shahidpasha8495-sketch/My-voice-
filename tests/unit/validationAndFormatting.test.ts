import { describe, expect, it } from 'vitest';
import { generateResilientCompanionReply } from '../../api/_lib/gemini';
import {
  getUvGuidance,
  getWeatherDescription,
} from '../../src/components/weather/WeatherUvWidget';
import { ALL_COMPANION_LIST } from '../../src/config/characters';
import { BACKGROUND_THEME_LIST } from '../../src/config/theme';
import {
  formatMessageTimestamp,
  formatRelativeTime,
  generateConversationTitle,
} from '../../src/utils/formatters';
import {
  MAX_MESSAGE_LENGTH,
  chatRequestSchema,
  createConversationSchema,
  isSupportedLanguage,
  loginSchema,
  signupSchema,
  updateConversationSchema,
  validateMessageInput,
} from '../../src/utils/validation';

describe('Unit: Message Validation & Schemas', () => {
  it('rejects empty or whitespace-only messages', () => {
    expect(validateMessageInput('').valid).toBe(false);
    expect(validateMessageInput('   \n\t  ').valid).toBe(false);
    expect(validateMessageInput('   ').error).toMatch(/before sending/i);
  });

  it('trims leading and trailing whitespace on valid messages', () => {
    const result = validateMessageInput('  Hello MyVoice!  ');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Hello MyVoice!');
  });

  it('enforces the 4,000 character limit', () => {
    const exactLimit = 'a'.repeat(MAX_MESSAGE_LENGTH);
    expect(validateMessageInput(exactLimit).valid).toBe(true);

    const overLimit = 'a'.repeat(MAX_MESSAGE_LENGTH + 1);
    const res = validateMessageInput(overLimit);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/4,000/);
  });

  it('validates all 11 supported languages accurately', () => {
    expect(isSupportedLanguage('en-US')).toBe(true);
    expect(isSupportedLanguage('hi-IN')).toBe(true);
    expect(isSupportedLanguage('kn-IN')).toBe(true);
    expect(isSupportedLanguage('ta-IN')).toBe(true);
    expect(isSupportedLanguage('te-IN')).toBe(true);
    expect(isSupportedLanguage('ml-IN')).toBe(true);
    expect(isSupportedLanguage('bn-IN')).toBe(true);
    expect(isSupportedLanguage('es-ES')).toBe(true);
    expect(isSupportedLanguage('fr-FR')).toBe(true);
    expect(isSupportedLanguage('de-DE')).toBe(true);
    expect(isSupportedLanguage('ar-SA')).toBe(true);
    expect(isSupportedLanguage('xx-XX')).toBe(false);
    expect(isSupportedLanguage(null)).toBe(false);
  });

  it('validates backend chatRequestSchema and updateConversationSchema with Zod', () => {
    const validPayload = {
      conversationId: '550e8400-e29b-41d4-a716-446655440000',
      message: 'Explain artificial intelligence',
      language: 'en-US',
      inputMode: 'text',
    };
    const parsed = chatRequestSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);

    const invalidUuid = chatRequestSchema.safeParse({
      ...validPayload,
      conversationId: 'not-a-uuid',
    });
    expect(invalidUuid.success).toBe(false);

    const invalidLang = chatRequestSchema.safeParse({
      ...validPayload,
      language: 'xx-INVALID',
    });
    expect(invalidLang.success).toBe(false);

    expect(
      updateConversationSchema.safeParse({ title: 'Renamed Conversation' })
        .success
    ).toBe(true);
  });

  it('validates Weather & UV Index risk guidance, 6 themes, 10 companions, and resilient AI fallback', () => {
    expect(getUvGuidance(1.5).category).toBe('Low');
    expect(getUvGuidance(4.2).category).toBe('Moderate');
    expect(getUvGuidance(7.0).category).toBe('High');
    expect(getUvGuidance(9.5).category).toBe('Very High');
    expect(getUvGuidance(11.5).category).toBe('Extreme');
    expect(getWeatherDescription(0).label).toBe('Clear Sky');

    expect(BACKGROUND_THEME_LIST).toHaveLength(6);
    expect(ALL_COMPANION_LIST).toHaveLength(10);

    const reply = generateResilientCompanionReply({
      currentMessage: 'How can I stay productive today?',
      language: 'en-US',
      characterId: 'nova',
    });
    expect(reply.length).toBeGreaterThan(20);
  });

  it('validates login, signup, and createConversation schemas', () => {
    expect(
      loginSchema.safeParse({ email: 'user@example.com', password: 'password123' }).success
    ).toBe(true);
    expect(
      loginSchema.safeParse({ email: 'bad-email', password: '123' }).success
    ).toBe(false);

    expect(
      signupSchema.safeParse({
        displayName: 'Priya',
        email: 'priya@example.com',
        password: 'password123',
        preferredLanguage: 'kn-IN',
      }).success
    ).toBe(true);

    expect(
      createConversationSchema.safeParse({
        title: 'Learning Kannada',
        language: 'kn-IN',
      }).success
    ).toBe(true);
  });
});

describe('Unit: Conversation Formatting', () => {
  it('generates clean titles from first user message without extra API calls', () => {
    expect(generateConversationTitle('  ### Explain quantum computing  ')).toBe(
      'Explain quantum computing'
    );
    expect(generateConversationTitle('')).toBe('New Conversation');

    const longMessage =
      'Can you explain how transformer neural networks process sequential natural language tokens in parallel?';
    const title = generateConversationTitle(longMessage);
    expect(title.length).toBeLessThanOrEqual(49);
    expect(title.endsWith('…')).toBe(true);
  });

  it('formats relative time and message timestamps safely', () => {
    const nowIso = new Date().toISOString();
    expect(formatRelativeTime(nowIso)).toBe('Just now');

    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(formatRelativeTime(tenMinsAgo)).toBe('10m ago');

    expect(formatRelativeTime('invalid-date')).toBe('');
    expect(formatMessageTimestamp(nowIso).length).toBeGreaterThan(0);
    expect(formatMessageTimestamp('invalid-date')).toBe('');
  });
});
