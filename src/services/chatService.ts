import { GUEST_ACCESS_TOKEN } from '../hooks/useAuth';
import type { ChatRequestPayload, ChatResponsePayload, HealthResponse } from '../types';
import { validateMessageInput } from '../utils/validation';
import { appendGuestMessages } from './conversationService';
import { getAccessToken } from './supabase';

export class ChatServiceError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = 'CHAT_ERROR') {
    super(message);
    this.name = 'ChatServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export async function sendChatMessage(
  payload: ChatRequestPayload,
  explicitAccessToken?: string | null
): Promise<ChatResponsePayload> {
  const validation = validateMessageInput(payload.message);
  if (!validation.valid) {
    throw new ChatServiceError(
      validation.error || 'Invalid message content.',
      400,
      'VALIDATION_ERROR'
    );
  }

  const token = explicitAccessToken || (await getAccessToken());
  if (!token) {
    throw new ChatServiceError(
      'Your session has expired. Please sign in again.',
      401,
      'SESSION_EXPIRED'
    );
  }

  let response: Response;
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        conversationId: payload.conversationId,
        message: validation.sanitized,
        language: payload.language,
        inputMode: payload.inputMode,
        characterId: payload.characterId,
        history: payload.history,
      }),
    });
  } catch {
    throw new ChatServiceError(
      'Unable to connect. Please try again.',
      503,
      'NETWORK_ERROR'
    );
  }

  let body: (Partial<ChatResponsePayload> & { error?: string; code?: string }) | null = null;
  try {
    body = (await response.json()) as Partial<ChatResponsePayload> & {
      error?: string;
      code?: string;
    };
  } catch {
    body = null;
  }

  if (!response.ok || !body?.success || !body.userMessage || !body.assistantMessage) {
    if (response.status === 401) {
      throw new ChatServiceError(
        'Your session has expired. Please sign in again.',
        401,
        'SESSION_EXPIRED'
      );
    }

    if (response.status === 429) {
      throw new ChatServiceError(
        body?.error || 'Rate limit reached. Please wait a moment and try again.',
        429,
        'RATE_LIMITED'
      );
    }

    const message =
      body?.error || 'AI response could not be generated. Please try again.';
    throw new ChatServiceError(
      message,
      response.status || 500,
      body?.code || 'GENERATION_FAILED'
    );
  }

  if (token === GUEST_ACCESS_TOKEN) {
    appendGuestMessages(payload.conversationId, [
      body.userMessage,
      body.assistantMessage,
    ]);
  }

  return {
    success: true,
    userMessage: body.userMessage,
    assistantMessage: body.assistantMessage,
    detectedLanguage: body.detectedLanguage,
  };
}

export async function fetchBackendHealth(): Promise<HealthResponse | null> {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    return (await response.json()) as HealthResponse;
  } catch {
    return null;
  }
}
