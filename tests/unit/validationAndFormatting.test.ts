import { describe, expect, it } from 'vitest';
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

  it('validates supported languages accurately', () => {
    expect(isSupportedLanguage('en-US')).toBe(true);
    expect(isSupportedLanguage('hi-IN')).toBe(true);
    expect(isSupportedLanguage('kn-IN')).toBe(true);
    expect(isSupportedLanguage('fr-FR')).toBe(false);
    expect(isSupportedLanguage(null)).toBe(false);
  });

  it('validates backend chatRequestSchema with Zod', () => {
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
      language: 'es-ES',
    });
    expect(invalidLang.success).toBe(false);
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
