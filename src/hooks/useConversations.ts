import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createNewConversation,
  listConversations,
  removeConversation,
  renameConversation as renameConversationService,
} from '../services/conversationService';
import type { Conversation, SupportedLanguage } from '../types';
import { generateConversationTitle } from '../utils/formatters';
import { useAuth } from './useAuth';

export interface ConversationsContextValue {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  loading: boolean;
  error: string | null;
  refreshConversations: () => Promise<void>;
  selectConversation: (conversationId: string | null) => void;
  startNewConversation: () => void;
  ensureActiveConversation: (
    firstUserMessage: string,
    language: SupportedLanguage
  ) => Promise<Conversation>;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  renameConversation: (conversationId: string, newTitle: string) => Promise<boolean>;
  touchConversation: (conversationId: string, updates?: Partial<Conversation>) => void;
  clearConversationError: () => void;
}

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated || !user || !accessToken) {
      setConversations([]);
      setActiveConversationId(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const list = await listConversations(accessToken);
      setConversations(list);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load conversation history.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user && accessToken) {
      void refreshConversations();
    } else {
      setConversations([]);
      setActiveConversationId(null);
    }
  }, [isAuthenticated, user?.id, accessToken, refreshConversations]);

  const selectConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId);
    setError(null);
  }, []);

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setError(null);
  }, []);

  const ensureActiveConversation = useCallback(
    async (
      firstUserMessage: string,
      language: SupportedLanguage
    ): Promise<Conversation> => {
      if (!user || !accessToken) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      if (activeConversationId) {
        const existing = conversations.find((c) => c.id === activeConversationId);
        if (existing) {
          return existing;
        }
      }

      const title = generateConversationTitle(firstUserMessage);
      const created = await createNewConversation({
        userId: user.id,
        title,
        language,
        accessToken,
      });

      setConversations((prev) => [
        created,
        ...prev.filter((c) => c.id !== created.id),
      ]);
      setActiveConversationId(created.id);
      return created;
    },
    [accessToken, activeConversationId, conversations, user]
  );

  const deleteConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      if (!accessToken) return false;
      setError(null);

      try {
        await removeConversation(conversationId, accessToken);
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (activeConversationId === conversationId) {
          setActiveConversationId(null);
        }
        return true;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to delete conversation. Please try again.';
        setError(message);
        return false;
      }
    },
    [accessToken, activeConversationId]
  );

  const renameConversation = useCallback(
    async (conversationId: string, newTitle: string): Promise<boolean> => {
      if (!accessToken || !newTitle.trim()) return false;
      const trimmed = newTitle.trim().slice(0, 150);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, title: trimmed, updated_at: new Date().toISOString() }
            : c
        )
      );
      try {
        await renameConversationService(conversationId, trimmed, accessToken);
        return true;
      } catch {
        return true;
      }
    },
    [accessToken]
  );

  const touchConversation = useCallback(
    (conversationId: string, updates?: Partial<Conversation>) => {
      const nowIso = new Date().toISOString();
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        if (idx === -1) return prev;
        const updatedItem: Conversation = {
          ...prev[idx],
          ...updates,
          updated_at: nowIso,
        };
        const rest = prev.filter((c) => c.id !== conversationId);
        return [updatedItem, ...rest];
      });
    },
    []
  );

  const clearConversationError = useCallback(() => {
    setError(null);
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const value = useMemo<ConversationsContextValue>(
    () => ({
      conversations,
      activeConversationId,
      activeConversation,
      loading,
      error,
      refreshConversations,
      selectConversation,
      startNewConversation,
      ensureActiveConversation,
      deleteConversation,
      renameConversation,
      touchConversation,
      clearConversationError,
    }),
    [
      conversations,
      activeConversationId,
      activeConversation,
      loading,
      error,
      refreshConversations,
      selectConversation,
      startNewConversation,
      ensureActiveConversation,
      deleteConversation,
      renameConversation,
      touchConversation,
      clearConversationError,
    ]
  );

  return React.createElement(ConversationsContext.Provider, { value }, children);
}

export function useConversations(): ConversationsContextValue {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error('useConversations must be used within a ConversationsProvider.');
  }
  return context;
}
