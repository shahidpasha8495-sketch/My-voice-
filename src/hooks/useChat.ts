import { useCallback, useEffect, useRef, useState } from 'react';
import { sendChatMessageStream } from '../services/chatService';
import { getConversationWithMessages } from '../services/conversationService';
import type {
  ConversationStyleMode,
  InputMode,
  Message,
  SupportedLanguage,
} from '../types';
import { playFirstTokenChime } from '../utils/soundEffects';
import { validateMessageInput } from '../utils/validation';
import { useAuth } from './useAuth';
import { useCharacter } from './useCharacter';
import { useConversations } from './useConversations';
import { useLanguagePreference } from './useLanguagePreference';
import { useVoiceState } from './useVoiceState';

export interface UseChatOptions {
  styleMode?: ConversationStyleMode;
  onStreamStart?: (
    language: SupportedLanguage,
    inputMode: InputMode,
    messageId: string
  ) => void;
  onStreamSentence?: (
    sentence: string,
    language: SupportedLanguage,
    inputMode: InputMode,
    messageId: string
  ) => void;
  onStreamComplete?: (inputMode: InputMode) => void;
  onAssistantResponse?: (message: Message, inputMode: InputMode) => void;
}

export interface FailedMessageDraft {
  content: string;
  inputMode: InputMode;
  language: SupportedLanguage;
}

export interface UseChatReturn {
  messages: Message[];
  isLoadingHistory: boolean;
  isSending: boolean;
  streamingMessageId: string | null;
  error: string | null;
  failedDraft: FailedMessageDraft | null;
  lastFirstTokenMs: number | null;
  lastLlmLatencyMs: number | null;
  lastResponseCached: boolean;
  lastResponseInterrupted: boolean;
  sendMessage: (
    content: string,
    inputMode?: InputMode,
    overrideLanguage?: SupportedLanguage
  ) => Promise<Message | null>;
  retryFailedMessage: () => Promise<Message | null>;
  clearChatError: () => void;
  resetMessages: () => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    styleMode = 'turbo',
    onStreamStart,
    onStreamSentence,
    onStreamComplete,
    onAssistantResponse,
  } = options;
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
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedDraft, setFailedDraft] = useState<FailedMessageDraft | null>(null);
  const [lastFirstTokenMs, setLastFirstTokenMs] = useState<number | null>(null);
  const [lastLlmLatencyMs, setLastLlmLatencyMs] = useState<number | null>(null);
  const [lastResponseCached, setLastResponseCached] = useState<boolean>(false);
  const [lastResponseInterrupted, setLastResponseInterrupted] = useState<boolean>(false);

  const isSubmittingRef = useRef<boolean>(false);
  const skipNextFetchForConvRef = useRef<string | null>(null);
  const onStreamStartRef = useRef(onStreamStart);
  const onStreamSentenceRef = useRef(onStreamSentence);
  const onStreamCompleteRef = useRef(onStreamComplete);
  const onAssistantResponseRef = useRef(onAssistantResponse);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    onStreamStartRef.current = onStreamStart;
    onStreamSentenceRef.current = onStreamSentence;
    onStreamCompleteRef.current = onStreamComplete;
    onAssistantResponseRef.current = onAssistantResponse;
  }, [onAssistantResponse, onStreamComplete, onStreamSentence, onStreamStart]);

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
      setFailedDraft(null);
      setLastResponseInterrupted(false);
      transitionTo('generating_response');

      const optimisticUserId = `optimistic-u-${Date.now()}`;
      const optimisticAssistantId = `optimistic-a-${Date.now() + 1}`;

      // Show optimistic user message on the VERY FIRST FRAME (0ms UI latency)
      const optimisticUserMsg: Message = {
        id: optimisticUserId,
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

        const llmStartPerf = performance.now();
        let hasInitializedStreamingBubble = false;
        let detectedStreamLang = effectiveLanguage;

        onStreamStartRef.current?.(
          effectiveLanguage,
          inputMode,
          optimisticAssistantId
        );

        const response = await sendChatMessageStream(
          {
            conversationId: targetConversationId,
            message: validation.sanitized,
            language: effectiveLanguage,
            inputMode,
            characterId,
            styleMode,
            stream: true,
            history: recentHistory,
          },
          accessToken,
          {
            onMeta: ({ detectedLanguage }) => {
              detectedStreamLang = detectedLanguage;
            },
            onToken: (_chunk, fullText, firstTokenMs) => {
              if (!hasInitializedStreamingBubble) {
                hasInitializedStreamingBubble = true;
                playFirstTokenChime();
                setLastFirstTokenMs(firstTokenMs);
                setStreamingMessageId(optimisticAssistantId);
                const liveAssistantMsg: Message = {
                  id: optimisticAssistantId,
                  conversation_id: targetConversationId!,
                  role: 'assistant',
                  content: fullText,
                  input_mode: 'text',
                  language: detectedStreamLang,
                  created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, liveAssistantMsg]);
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === optimisticAssistantId
                      ? { ...m, content: fullText }
                      : m
                  )
                );
              }
            },
            onSentenceReady: (sentence, sentenceLang) => {
              onStreamSentenceRef.current?.(
                sentence,
                sentenceLang,
                inputMode,
                optimisticAssistantId
              );
            },
          }
        );

        setStreamingMessageId(null);

        const measuredLlmMs =
          response.latencyMs ??
          Math.max(5, Math.round(performance.now() - llmStartPerf));
        const measuredTtftMs = response.firstTokenMs ?? measuredLlmMs;
        setLastFirstTokenMs(measuredTtftMs);
        setLastLlmLatencyMs(measuredLlmMs);
        setLastResponseCached(Boolean(response.cached));
        setLastResponseInterrupted(Boolean(response.interrupted));
        setFailedDraft(null);

        // Log stage latency breakdown for developer visibility
        if (typeof console !== 'undefined' && console.info) {
          console.info(
            `[MyVoice Speed] Mode=${inputMode}/${styleMode} | FirstToken=${measuredTtftMs}ms | TotalLLM=${measuredLlmMs}ms | Cached=${Boolean(response.cached)} | Context=${recentHistory.length}/20`
          );
        }

        // Replace optimistic messages with final canonical messages
        setMessages((prev) => [
          ...prev.filter(
            (m) => m.id !== optimisticUserId && m.id !== optimisticAssistantId
          ),
          response.userMessage,
          response.assistantMessage,
        ]);

        touchConversation(targetConversationId, {
          language: response.detectedLanguage || effectiveLanguage,
        });

        onStreamCompleteRef.current?.(inputMode);

        if (onAssistantResponseRef.current && !hasInitializedStreamingBubble) {
          onAssistantResponseRef.current(response.assistantMessage, inputMode);
        }

        return response.assistantMessage;
      } catch (err) {
        setStreamingMessageId(null);
        // Preserve original message in failedDraft so user never loses spoken/typed words on failure
        setFailedDraft({
          content: validation.sanitized,
          inputMode,
          language: effectiveLanguage,
        });
        setMessages((prev) =>
          prev.filter(
            (m) => m.id !== optimisticUserId && m.id !== optimisticAssistantId
          )
        );
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
      styleMode,
      touchConversation,
      transitionTo,
    ]
  );

  const retryFailedMessage = useCallback(async (): Promise<Message | null> => {
    if (!failedDraft || isSubmittingRef.current) return null;
    const draft = failedDraft;
    return sendMessage(draft.content, draft.inputMode, draft.language);
  }, [failedDraft, sendMessage]);

  const clearChatError = useCallback(() => {
    setError(null);
    setFailedDraft(null);
  }, []);

  const resetMessages = useCallback(() => {
    setMessages([]);
    setStreamingMessageId(null);
    setError(null);
    setFailedDraft(null);
    setLastResponseInterrupted(false);
  }, []);

  return {
    messages,
    isLoadingHistory,
    isSending,
    streamingMessageId,
    error,
    failedDraft,
    lastFirstTokenMs,
    lastLlmLatencyMs,
    lastResponseCached,
    lastResponseInterrupted,
    sendMessage,
    retryFailedMessage,
    clearChatError,
    resetMessages,
  };
}
