import { useCallback, useEffect, useRef, useState } from 'react';
import { sendChatMessage } from '../services/chatService';
import { getConversationWithMessages } from '../services/conversationService';
import type { InputMode, Message, SupportedLanguage } from '../types';
import { validateMessageInput } from '../utils/validation';
import { useAuth } from './useAuth';
import { useCharacter } from './useCharacter';
import { useConversations } from './useConversations';
import { useLanguagePreference } from './useLanguagePreference';
import { useVoiceState } from './useVoiceState';

export interface UseChatOptions {
  onAssistantResponse?: (message: Message, inputMode: InputMode) => void;
}

export interface UseChatReturn {
  messages: Message[];
  isLoadingHistory: boolean;
  isSending: boolean;
  error: string | null;
  sendMessage: (
    content: string,
    inputMode?: InputMode,
    overrideLanguage?: SupportedLanguage
  ) => Promise<Message | null>;
  clearChatError: () => void;
  resetMessages: () => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { onAssistantResponse } = options;
  const { accessToken } = useAuth();
  const { characterId } = useCharacter();
  const {
    activeConversationId,
    ensureActiveConversation,
    touchConversation,
  } = useConversations();
  const { resolveEffectiveLanguage } = useLanguagePreference();
  const { transitionTo } = useVoiceState();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isSubmittingRef = useRef<boolean>(false);
  const skipNextFetchForConvRef = useRef<string | null>(null);
  const onAssistantResponseRef = useRef(onAssistantResponse);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    onAssistantResponseRef.current = onAssistantResponse;
  }, [onAssistantResponse]);

  // Load messages when activeConversationId changes
  useEffect(() => {
    let cancelled = false;

    if (!activeConversationId) {
      setMessages([]);
      setError(null);
      setIsLoadingHistory(false);
      return;
    }

    // If we just created this conversation during sendMessage, don't wipe optimistic messages
    if (skipNextFetchForConvRef.current === activeConversationId) {
      skipNextFetchForConvRef.current = null;
      return;
    }

    async function loadMessages(convId: string) {
      setIsLoadingHistory(true);
      setError(null);
      try {
        const result = await getConversationWithMessages(convId, accessToken);
        if (!cancelled) {
          setMessages(result.messages);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Unable to load conversation messages.';
          setError(msg);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    }

    void loadMessages(activeConversationId);

    return () => {
      cancelled = true;
    };
  }, [activeConversationId, accessToken]);

  const sendMessage = useCallback(
    async (
      rawContent: string,
      inputMode: InputMode = 'text',
      overrideLanguage?: SupportedLanguage
    ): Promise<Message | null> => {
      // Prevent accidental duplicate submissions
      if (isSubmittingRef.current) {
        return null;
      }

      const validation = validateMessageInput(rawContent);
      if (!validation.valid) {
        setError(validation.error || 'Please enter a valid message.');
        return null;
      }

      const effectiveLanguage =
        overrideLanguage || resolveEffectiveLanguage(validation.sanitized);

      isSubmittingRef.current = true;
      setIsSending(true);
      setError(null);
      transitionTo('generating_response');

      const optimisticId = `optimistic-${Date.now()}`;

      // Show optimistic user message on the VERY FIRST FRAME (0ms UI latency)
      const optimisticUserMsg: Message = {
        id: optimisticId,
        conversation_id: activeConversationId || 'pending-conversation',
        role: 'user',
        content: validation.sanitized,
        input_mode: inputMode,
        language: effectiveLanguage,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUserMsg]);

      try {
        let targetConversationId = activeConversationId;
        if (!targetConversationId) {
          const createdConv = await ensureActiveConversation(
            validation.sanitized,
            effectiveLanguage
          );
          targetConversationId = createdConv.id;
          skipNextFetchForConvRef.current = createdConv.id;
        }

        const recentHistory = messagesRef.current
          .filter((m) => !m.id.startsWith('optimistic-'))
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await sendChatMessage(
          {
            conversationId: targetConversationId,
            message: validation.sanitized,
            language: effectiveLanguage,
            inputMode,
            characterId,
            history: recentHistory,
          },
          accessToken
        );

        // Replace optimistic user message with persisted message and append assistant message
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimisticId),
          response.userMessage,
          response.assistantMessage,
        ]);

        touchConversation(targetConversationId, {
          language: response.detectedLanguage || effectiveLanguage,
        });

        transitionTo('idle');

        if (onAssistantResponseRef.current) {
          onAssistantResponseRef.current(response.assistantMessage, inputMode);
        }

        return response.assistantMessage;
      } catch (err) {
        // Remove optimistic message on failure so user can retry cleanly
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        const errMessage =
          err instanceof Error
            ? err.message
            : 'AI response could not be generated. Please try again.';
        setError(errMessage);
        transitionTo('idle');
        return null;
      } finally {
        isSubmittingRef.current = false;
        setIsSending(false);
      }
    },
    [
      accessToken,
      activeConversationId,
      characterId,
      ensureActiveConversation,
      resolveEffectiveLanguage,
      touchConversation,
      transitionTo,
    ]
  );

  const clearChatError = useCallback(() => {
    setError(null);
  }, []);

  const resetMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoadingHistory,
    isSending,
    error,
    sendMessage,
    clearChatError,
    resetMessages,
  };
}
