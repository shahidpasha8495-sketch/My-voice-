import type {
  Conversation,
  ConversationDetailResponse,
  ConversationsListResponse,
  Message,
  SupportedLanguage,
} from '../types';
import { getAccessToken, supabase } from './supabase';

export class ConversationServiceError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'ConversationServiceError';
    this.statusCode = statusCode;
  }
}

async function resolveToken(explicitToken?: string | null): Promise<string> {
  const token = explicitToken || (await getAccessToken());
  if (!token) {
    throw new ConversationServiceError(
      'Your session has expired. Please sign in again.',
      401
    );
  }
  return token;
}

/**
 * Retrieves all conversations belonging to the authenticated user,
 * ordered by most recent activity first (updated_at DESC).
 */
export async function listConversations(accessToken?: string | null): Promise<Conversation[]> {
  const token = await resolveToken(accessToken);

  try {
    const response = await fetch('/api/conversations', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (response.status === 401) {
      throw new ConversationServiceError(
        'Your session has expired. Please sign in again.',
        401
      );
    }

    if (response.ok) {
      const body = (await response.json()) as ConversationsListResponse;
      return body.conversations ?? [];
    }
  } catch (err) {
    if (err instanceof ConversationServiceError) {
      throw err;
    }
    // Fall back to direct RLS-protected Supabase read if API route is unreachable
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('id, user_id, title, language, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new ConversationServiceError('Unable to load conversation history.');
  }

  return (data ?? []) as Conversation[];
}

/**
 * Retrieves a single owned conversation and its messages ordered chronologically.
 */
export async function getConversationWithMessages(
  conversationId: string,
  accessToken?: string | null
): Promise<{ conversation: Conversation; messages: Message[] }> {
  const token = await resolveToken(accessToken);

  try {
    const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (response.status === 401) {
      throw new ConversationServiceError(
        'Your session has expired. Please sign in again.',
        401
      );
    }

    if (response.status === 404 || response.status === 403) {
      throw new ConversationServiceError(
        'Conversation not found or access denied.',
        response.status
      );
    }

    if (response.ok) {
      const body = (await response.json()) as ConversationDetailResponse;
      return {
        conversation: body.conversation,
        messages: body.messages ?? [],
      };
    }
  } catch (err) {
    if (err instanceof ConversationServiceError) {
      throw err;
    }
  }

  // Fallback to direct RLS-protected Supabase queries
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id, user_id, title, language, created_at, updated_at')
    .eq('id', conversationId)
    .single();

  if (convError || !conversation) {
    throw new ConversationServiceError('Conversation not found or access denied.', 404);
  }

  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('id, conversation_id, role, content, input_mode, language, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (msgError) {
    throw new ConversationServiceError('Unable to load conversation messages.');
  }

  return {
    conversation: conversation as Conversation,
    messages: (messages ?? []) as Message[],
  };
}

/**
 * Creates a new conversation in Supabase.
 */
export async function createNewConversation(params: {
  userId: string;
  title: string;
  language: SupportedLanguage;
  accessToken?: string | null;
}): Promise<Conversation> {
  const { userId, title, language, accessToken } = params;
  const token = await resolveToken(accessToken);

  try {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({ title, language }),
    });

    if (response.status === 401) {
      throw new ConversationServiceError(
        'Your session has expired. Please sign in again.',
        401
      );
    }

    if (response.ok) {
      const data = (await response.json()) as { conversation: Conversation };
      if (data.conversation) {
        return data.conversation;
      }
    }
  } catch (err) {
    if (err instanceof ConversationServiceError) {
      throw err;
    }
  }

  // Direct RLS insert fallback
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title,
      language,
    })
    .select('id, user_id, title, language, created_at, updated_at')
    .single();

  if (error || !data) {
    throw new ConversationServiceError('Failed to start a new conversation.');
  }

  return data as Conversation;
}

/**
 * Deletes an owned conversation and its associated messages (via ON DELETE CASCADE).
 */
export async function removeConversation(
  conversationId: string,
  accessToken?: string | null
): Promise<void> {
  const token = await resolveToken(accessToken);

  const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (response.status === 401) {
    throw new ConversationServiceError(
      'Your session has expired. Please sign in again.',
      401
    );
  }

  if (!response.ok) {
    let message = 'Unable to delete conversation. Please try again.';
    try {
      const errBody = (await response.json()) as { error?: string };
      if (errBody.error) {
        message = errBody.error;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new ConversationServiceError(message, response.status);
  }
}
