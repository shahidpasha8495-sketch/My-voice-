import { GUEST_ACCESS_TOKEN, GUEST_USER_ID } from '../hooks/useAuth';
import type {
  Conversation,
  ConversationDetailResponse,
  ConversationsListResponse,
  Message,
  SupportedLanguage,
} from '../types';
import { getAccessToken, supabase } from './supabase';

const GUEST_CONVERSATIONS_KEY = 'myvoice.guest_conversations';
const GUEST_MESSAGES_KEY = 'myvoice.guest_messages';

function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getGuestConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_CONVERSATIONS_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

export function saveGuestConversations(list: Conversation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_CONVERSATIONS_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

export function getGuestMessagesMap(): Record<string, Message[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(GUEST_MESSAGES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Message[]>) : {};
  } catch {
    return {};
  }
}

export function appendGuestMessages(
  conversationId: string,
  newMessages: Message[]
): void {
  if (typeof window === 'undefined') return;
  try {
    const map = getGuestMessagesMap();
    const existing = map[conversationId] || [];
    map[conversationId] = [...existing, ...newMessages];
    localStorage.setItem(GUEST_MESSAGES_KEY, JSON.stringify(map));

    // Also update conversation updated_at
    const convs = getGuestConversations();
    const idx = convs.findIndex((c) => c.id === conversationId);
    if (idx !== -1) {
      convs[idx].updated_at = new Date().toISOString();
      saveGuestConversations(convs);
    }
  } catch {
    // ignore storage errors
  }
}

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
 * Retrieves all conversations belonging to the authenticated user (or Guest session),
 * ordered by most recent activity first (updated_at DESC).
 */
export async function listConversations(accessToken?: string | null): Promise<Conversation[]> {
  const token = await resolveToken(accessToken);

  if (token === GUEST_ACCESS_TOKEN) {
    return getGuestConversations().sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

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
    return getGuestConversations().sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
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

  if (token === GUEST_ACCESS_TOKEN) {
    const conv = getGuestConversations().find((c) => c.id === conversationId);
    if (!conv) {
      throw new ConversationServiceError('Conversation not found.', 404);
    }
    const messages = getGuestMessagesMap()[conversationId] || [];
    return { conversation: conv, messages };
  }

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
    const localConv = getGuestConversations().find((c) => c.id === conversationId);
    if (localConv) {
      return {
        conversation: localConv,
        messages: getGuestMessagesMap()[conversationId] || [],
      };
    }
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
 * Creates a new conversation in Supabase (or in local storage for Guest sessions).
 */
export async function createNewConversation(params: {
  userId: string;
  title: string;
  language: SupportedLanguage;
  accessToken?: string | null;
}): Promise<Conversation> {
  const { userId, title, language, accessToken } = params;
  const token = await resolveToken(accessToken);

  if (token === GUEST_ACCESS_TOKEN) {
    const nowIso = new Date().toISOString();
    const guestConv: Conversation = {
      id: generateUuidV4(),
      user_id: userId || GUEST_USER_ID,
      title,
      language,
      created_at: nowIso,
      updated_at: nowIso,
    };
    const existing = getGuestConversations();
    saveGuestConversations([guestConv, ...existing]);
    return guestConv;
  }

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
    const nowIso = new Date().toISOString();
    const localConv: Conversation = {
      id: generateUuidV4(),
      user_id: userId || GUEST_USER_ID,
      title,
      language,
      created_at: nowIso,
      updated_at: nowIso,
    };
    const existing = getGuestConversations();
    saveGuestConversations([localConv, ...existing]);
    return localConv;
  }

  return data as Conversation;
}

/**
 * Renames an owned conversation.
 */
export async function renameConversation(
  conversationId: string,
  newTitle: string,
  accessToken?: string | null
): Promise<Conversation | null> {
  const trimmed = newTitle.trim().slice(0, 150);
  if (!trimmed) return null;

  const token = await resolveToken(accessToken);

  // Always update in local storage if present
  const localConvs = getGuestConversations();
  const localIdx = localConvs.findIndex((c) => c.id === conversationId);
  if (localIdx !== -1) {
    localConvs[localIdx] = {
      ...localConvs[localIdx],
      title: trimmed,
      updated_at: new Date().toISOString(),
    };
    saveGuestConversations(localConvs);
    if (token === GUEST_ACCESS_TOKEN) {
      return localConvs[localIdx];
    }
  }

  try {
    const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({ title: trimmed }),
    });
    if (response.ok) {
      const body = (await response.json()) as { conversation?: Conversation };
      if (body.conversation) return body.conversation;
    }
  } catch {
    // Fallback to direct Supabase update
  }

  const { data } = await supabase
    .from('conversations')
    .update({ title: trimmed, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .select('id, user_id, title, language, created_at, updated_at')
    .maybeSingle();

  return (data as Conversation) || (localIdx !== -1 ? localConvs[localIdx] : null);
}

/**
 * Deletes an owned conversation and its associated messages.
 */
export async function removeConversation(
  conversationId: string,
  accessToken?: string | null
): Promise<void> {
  const token = await resolveToken(accessToken);

  if (token === GUEST_ACCESS_TOKEN) {
    const filtered = getGuestConversations().filter((c) => c.id !== conversationId);
    saveGuestConversations(filtered);
    const msgMap = getGuestMessagesMap();
    delete msgMap[conversationId];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(GUEST_MESSAGES_KEY, JSON.stringify(msgMap));
      } catch {
        // ignore storage errors
      }
    }
    return;
  }

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
    // Also clean up if stored in local fallback storage
    const localFiltered = getGuestConversations().filter((c) => c.id !== conversationId);
    if (localFiltered.length !== getGuestConversations().length) {
      saveGuestConversations(localFiltered);
      return;
    }
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
