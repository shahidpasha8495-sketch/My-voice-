import { z } from 'zod';
import type { SupportedLanguage } from '../types/index.js';

export const SUPPORTED_LANGUAGES: readonly [SupportedLanguage, ...SupportedLanguage[]] = [
  'en-US',
  'hi-IN',
  'kn-IN',
  'ta-IN',
  'te-IN',
  'ml-IN',
  'bn-IN',
  'es-ES',
  'fr-FR',
  'de-DE',
  'ar-SA',
];

export const MAX_MESSAGE_LENGTH = 4000;
export const CONTEXT_WINDOW_LIMIT = 20;

export const supportedLanguageSchema = z.enum(SUPPORTED_LANGUAGES, {
  errorMap: () => ({ message: 'Unsupported language. Choose English (en-US), Hindi (hi-IN), or Kannada (kn-IN).' }),
});

export const inputModeSchema = z.enum(['text', 'voice'], {
  errorMap: () => ({ message: 'Input mode must be either "text" or "voice".' }),
});

export const uuidSchema = z.string().uuid('Invalid conversation ID format.');

export const messageContentSchema = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, {
    message: 'Message cannot be empty.',
  })
  .refine((val) => val.length <= MAX_MESSAGE_LENGTH, {
    message: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
  });

export const conversationStyleModeSchema = z.enum([
  'turbo',
  'tutor',
  'brainstorm',
  'calm',
  'coder',
]);

export const chatRequestSchema = z.object({
  conversationId: uuidSchema,
  message: messageContentSchema,
  language: supportedLanguageSchema,
  inputMode: inputModeSchema.default('text'),
  characterId: z.string().max(32).optional(),
  styleMode: conversationStyleModeSchema.optional(),
  stream: z.boolean().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(MAX_MESSAGE_LENGTH * 2),
      })
    )
    .max(CONTEXT_WINDOW_LIMIT)
    .optional(),
});

export const MAX_AUDIO_DURATION_SECONDS = 45;
export const MAX_AUDIO_BYTES = 4 * 1024 * 1024; // 4 MB decoded audio limit

export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/m4a',
  'audio/aac',
  'audio/ogg',
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/flac',
] as const;

export function normalizeAudioMimeType(rawMime: string): string {
  return rawMime.split(';')[0].trim().toLowerCase();
}

export const voiceTranscribeSchema = z.object({
  audioBase64: z
    .string()
    .min(16, 'Recorded audio is empty.')
    .max(6 * 1024 * 1024, 'Audio recording exceeds maximum upload limit.'),
  mimeType: z
    .string()
    .transform((val) => normalizeAudioMimeType(val))
    .refine(
      (val) => (ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(val),
      {
        message: 'Unsupported audio recording format.',
      }
    ),
  language: supportedLanguageSchema.default('en-US'),
  durationSeconds: z
    .number()
    .min(0.1)
    .max(MAX_AUDIO_DURATION_SECONDS, `Audio recording cannot exceed ${MAX_AUDIO_DURATION_SECONDS} seconds.`)
    .optional(),
});

export const createConversationSchema = z.object({
  title: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0 && val.length <= 150, {
      message: 'Conversation title must be between 1 and 150 characters.',
    }),
  language: supportedLanguageSchema.default('en-US'),
});

export const updateConversationSchema = z.object({
  title: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0 && val.length <= 150, {
      message: 'Conversation title must be between 1 and 150 characters.',
    }),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const signupSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters.')
    .max(60, 'Display name cannot exceed 60 characters.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  preferredLanguage: supportedLanguageSchema.default('en-US'),
});

export interface MessageValidationResult {
  valid: boolean;
  sanitized: string;
  error?: string;
}

export function validateMessageInput(raw: string): MessageValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      valid: false,
      sanitized: '',
      error: 'Please enter or speak a message before sending.',
    };
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      sanitized: trimmed,
      error: `Message is too long (${trimmed.length.toLocaleString()} characters). Maximum allowed is ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.`,
    };
  }
  return {
    valid: true,
    sanitized: trimmed,
  };
}

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
