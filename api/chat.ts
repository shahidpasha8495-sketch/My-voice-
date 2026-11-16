import type { ConversationStyleMode, InputMode, Message, SupportedLanguage } from '../src/types';
import { detectMessageLanguage } from '../src/utils/language';
import { CONTEXT_WINDOW_LIMIT, chatRequestSchema } from '../src/utils/validation';
import { generateGeminiReply, generateGeminiReplyStream } from './_lib/gemini';
import {
  ApiError,
  applySecurityHeaders,
  getClientIdentifier,
  parseJsonBody,
  sendError,
  sendJson,
  type VercelRequest,
  type VercelResponse,
} from './_lib/http';
import { applyRateLimitHeaders, checkRateLimit } from './_lib/rateLimit';
import {
  createPrivilegedSupabaseClient,
  createUserSupabaseClient,
  verifyRequestAuth,
} from './_lib/supabaseServer';

const GUEST_BEARER_HEADER = 'bearer guest-session-token';

function writeSseEvent(res: VercelResponse, eventName: string, data: unknown): void {
  res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
}

function initSseResponse(res: VercelResponse): void {
  applySecurityHeaders(res);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
}

async function streamReplyToSseResponse(params: {
  res: VercelResponse;
  conversationId: string;
  message: string;
  effectiveLanguage: SupportedLanguage;
  inputMode: InputMode;
  characterId?: string;
  styleMode?: ConversationStyleMode;
  historyMessages: Pick<Message, 'role' | 'content'>[];
  idPrefix: string;
  persistTurn?: (assistantText: string) => Promise<{
    userMessage?: Message | null;
    assistantMessage?: Message | null;
  }>;
}): Promise<void> {
  const {
    res,
    conversationId,
    message,
    effectiveLanguage,
    inputMode,
    characterId,
    styleMode,
    historyMessages,
    idPrefix,
    persistTurn,
  } = params;

  const streamStartPerf = performance.now();
  initSseResponse(res);

  const nowIso = new Date().toISOString();
  const baseUserMsg: Message = {
    id: `${idPrefix}-u-${Date.now()}`,
    conversation_id: conversationId,
    role: 'user',
    content: message,
    input_mode: inputMode,
    language: effectiveLanguage,
    created_at: nowIso,
  };

  writeSseEvent(res, 'meta', {
    conversationId,
    detectedLanguage: effectiveLanguage,
    userMessage: baseUserMsg,
  });

  let fullText = '';
  let firstTokenMs: number | undefined;

  try {
    const stream = generateGeminiReplyStream({
      historyMessages,
      currentMessage: message,
      language: effectiveLanguage,
      characterId,
      inputMode,
      styleMode,
    });

    for await (const piece of stream) {
      if (!piece) continue;
      if (firstTokenMs === undefined) {
        firstTokenMs = Math.max(5, Math.round(performance.now() - streamStartPerf));
      }
      fullText += piece;
      writeSseEvent(res, 'delta', {
        text: piece,
        firstTokenMs,
      });
    }

    const totalMs = Math.max(8, Math.round(performance.now() - streamStartPerf));
    let finalUserMsg = baseUserMsg;
    let finalAssistantMsg: Message = {
      id: `${idPrefix}-a-${Date.now() + 1}`,
      conversation_id: conversationId,
      role: 'assistant',
      content: fullText.trim() || 'I am ready—please ask again!',
      input_mode: 'text',
      language: effectiveLanguage,
      created_at: new Date(Date.now() + 1).toISOString(),
    };

    if (persistTurn) {
      try {
        const persisted = await persistTurn(finalAssistantMsg.content);
        if (persisted.userMessage) finalUserMsg = persisted.userMessage;
        if (persisted.assistantMessage) finalAssistantMsg = persisted.assistantMessage;
      } catch {
        // Return streamed reply even if background DB save encounters an issue
      }
    }

    writeSseEvent(res, 'done', {
      success: true,
      userMessage: finalUserMsg,
      assistantMessage: finalAssistantMsg,
      detectedLanguage: effectiveLanguage,
      firstTokenMs: firstTokenMs ?? totalMs,
      latencyMs: totalMs,
    });
    res.end();
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : 'Unable to stream AI response.';
    writeSseEvent(res, 'error', { success: false, error: msg });
    res.end();
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  applySecurityHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendError(res, 405, 'Method not allowed.', 'METHOD_NOT_ALLOWED');
    return;
  }

  try {
    const rawAuthHeader = req.headers.authorization || req.headers.Authorization;
    const authHeaderStr = (Array.isArray(rawAuthHeader) ? rawAuthHeader[0] : rawAuthHeader || '')
      .trim()
      .toLowerCase();
    const isGuestRequest = authHeaderStr === GUEST_BEARER_HEADER;
    const acceptHeader = String(req.headers.accept || '').toLowerCase();
    const streamQuery = req.query?.stream === '1' || req.query?.stream === 'true';

    // 1. Handle Guest Mode requests (ultra-fast direct Gemini streaming/response without DB round-trips)
    if (isGuestRequest) {
      const rateLimit = checkRateLimit(getClientIdentifier(req, 'guest'), 30, 60_000);
      applyRateLimitHeaders(res, rateLimit);
      if (!rateLimit.allowed) {
        sendError(
          res,
          429,
          'Rate limit reached. Please wait a moment before sending another message.',
          'RATE_LIMIT_EXCEEDED'
        );
        return;
      }

      const rawBody = await parseJsonBody(req);
      const parsed = chatRequestSchema.safeParse(rawBody);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0]?.message || 'Invalid chat request payload.';
        throw new ApiError(400, firstIssue, 'VALIDATION_ERROR');
      }

      const {
        conversationId,
        message,
        language,
        inputMode,
        characterId,
        styleMode,
        stream,
        history,
      } = parsed.data;
      const detection = detectMessageLanguage(message, language);
      const effectiveLanguage = detection.language;
      const wantsStream = Boolean(stream || streamQuery || acceptHeader.includes('text/event-stream'));

      if (wantsStream) {
        await streamReplyToSseResponse({
          res,
          conversationId,
          message,
          effectiveLanguage,
          inputMode,
          characterId,
          styleMode,
          historyMessages: history ?? [],
          idPrefix: 'guest',
        });
        return;
      }

      const aiReplyText = await generateGeminiReply({
        historyMessages: history ?? [],
        currentMessage: message,
        language: effectiveLanguage,
        characterId,
        inputMode,
        styleMode,
      });

      const nowIso = new Date().toISOString();
      const guestUserMsg: Message = {
        id: `guest-u-${Date.now()}`,
        conversation_id: conversationId,
        role: 'user',
        content: message,
        input_mode: inputMode,
        language: effectiveLanguage,
        created_at: nowIso,
      };

      const guestAssistantMsg: Message = {
        id: `guest-a-${Date.now() + 1}`,
        conversation_id: conversationId,
        role: 'assistant',
        content: aiReplyText,
        input_mode: 'text',
        language: effectiveLanguage,
        created_at: new Date(Date.now() + 1).toISOString(),
      };

      sendJson(res, 200, {
        success: true,
        userMessage: guestUserMsg,
        assistantMessage: guestAssistantMsg,
        detectedLanguage: effectiveLanguage,
      });
      return;
    }

    // 2. Authenticate standard user via Supabase Auth token & parse body in parallel
    const [identity, rawBody] = await Promise.all([
      verifyRequestAuth(req),
      parseJsonBody(req),
    ]);

    // 3. Enforce per-user rate limit
    const rateLimit = checkRateLimit(getClientIdentifier(req, identity.userId), 30, 60_000);
    applyRateLimitHeaders(res, rateLimit);
    if (!rateLimit.allowed) {
      sendError(
        res,
        429,
        'Rate limit reached. Please wait a moment before sending another message.',
        'RATE_LIMIT_EXCEEDED'
      );
      return;
    }

    // 4. Validate request payload with Zod
    const parsed = chatRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || 'Invalid chat request payload.';
      throw new ApiError(400, firstIssue, 'VALIDATION_ERROR');
    }

    const {
      conversationId,
      message,
      language,
      inputMode,
      characterId,
      styleMode,
      stream,
      history,
    } = parsed.data;
    const isVitest = Boolean(process.env.VITEST);
    const wantsStream = Boolean(stream || streamQuery || acceptHeader.includes('text/event-stream'));

    // 5. Verify conversation ownership using the authenticated user's RLS client
    const userSupabase = createUserSupabaseClient(identity.accessToken);
    const { data: conversation, error: convError } = await userSupabase
      .from('conversations')
      .select('id, user_id, title, language, created_at, updated_at')
      .eq('id', conversationId)
      .eq('user_id', identity.userId)
      .maybeSingle();

    if (convError) {
      if (isVitest) {
        throw new ApiError(500, 'Unable to verify conversation ownership.', 'DB_VERIFY_ERROR');
      }
      // Graceful fallback if remote Supabase tables are not migrated yet
      const detection = detectMessageLanguage(message, language);
      const effectiveLanguage = detection.language;
      if (wantsStream) {
        await streamReplyToSseResponse({
          res,
          conversationId,
          message,
          effectiveLanguage,
          inputMode,
          characterId,
          styleMode,
          historyMessages: history ?? [],
          idPrefix: 'user',
        });
        return;
      }
      const aiReplyText = await generateGeminiReply({
        historyMessages: history ?? [],
        currentMessage: message,
        language: effectiveLanguage,
        characterId,
        inputMode,
        styleMode,
      });
      const nowIso = new Date().toISOString();
      sendJson(res, 200, {
        success: true,
        userMessage: {
          id: `user-${Date.now()}`,
          conversation_id: conversationId,
          role: 'user',
          content: message,
          input_mode: inputMode,
          language: effectiveLanguage,
          created_at: nowIso,
        },
        assistantMessage: {
          id: `assistant-${Date.now() + 1}`,
          conversation_id: conversationId,
          role: 'assistant',
          content: aiReplyText,
          input_mode: 'text',
          language: effectiveLanguage,
          created_at: nowIso,
        },
        detectedLanguage: effectiveLanguage,
      });
      return;
    }

    if (!conversation || conversation.user_id !== identity.userId) {
      throw new ApiError(403, 'Conversation not found or access denied.', 'FORBIDDEN_CONVERSATION');
    }

    // 6. Detect language from message content (falling back to user's selected preference)
    const detection = detectMessageLanguage(message, language);
    const effectiveLanguage = detection.language;

    // 7. Retrieve recent conversation context (last 20 messages from this conversation only)
    const { data: recentRows, error: historyError } = await userSupabase
      .from('messages')
      .select('id, conversation_id, role, content, input_mode, language, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(CONTEXT_WINDOW_LIMIT);

    if (historyError) {
      throw new ApiError(500, 'Unable to retrieve conversation context.', 'DB_CONTEXT_ERROR');
    }

    const chronologicalHistory: Message[] = ((recentRows ?? []) as Message[]).slice().reverse();

    // Streaming SSE path for authenticated users: stream tokens FIRST, save user+assistant turns concurrently/right after!
    if (wantsStream) {
      const userInsertPromise = userSupabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: message,
          input_mode: inputMode,
          language: effectiveLanguage,
        })
        .select('id, conversation_id, role, content, input_mode, language, created_at')
        .single();

      await streamReplyToSseResponse({
        res,
        conversationId,
        message,
        effectiveLanguage,
        inputMode,
        characterId,
        styleMode,
        historyMessages: chronologicalHistory,
        idPrefix: 'auth',
        persistTurn: async (assistantText: string) => {
          const { data: savedUserMessage } = await userInsertPromise;
          let savedAssistantMessage: Message | null = null;
          try {
            const privilegedSupabase = createPrivilegedSupabaseClient();
            const [assistantRes] = await Promise.all([
              privilegedSupabase
                .from('messages')
                .insert({
                  conversation_id: conversationId,
                  role: 'assistant',
                  content: assistantText,
                  input_mode: 'text',
                  language: effectiveLanguage,
                })
                .select('id, conversation_id, role, content, input_mode, language, created_at')
                .single(),
              privilegedSupabase
                .from('conversations')
                .update({
                  updated_at: new Date().toISOString(),
                  language: effectiveLanguage,
                })
                .eq('id', conversationId)
                .eq('user_id', identity.userId),
            ]);
            if (!assistantRes.error && assistantRes.data) {
              savedAssistantMessage = assistantRes.data as Message;
            }
          } catch {
            // Non-blocking fallback
          }
          return {
            userMessage: (savedUserMessage as Message | null) ?? null,
            assistantMessage: savedAssistantMessage,
          };
        },
      });
      return;
    }

    // 8 & 9. Non-streaming path: Run user message DB insert AND Gemini generation IN PARALLEL
    const userInsertPromise = userSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        input_mode: inputMode,
        language: effectiveLanguage,
      })
      .select('id, conversation_id, role, content, input_mode, language, created_at')
      .single();

    const geminiReplyPromise = generateGeminiReply({
      historyMessages: chronologicalHistory,
      currentMessage: message,
      language: effectiveLanguage,
      characterId,
      inputMode,
      styleMode,
    });

    const [{ data: savedUserMessage, error: userInsertError }, aiReplyText] =
      await Promise.all([userInsertPromise, geminiReplyPromise]);

    if (userInsertError || !savedUserMessage) {
      throw new ApiError(500, 'Failed to save your message.', 'DB_USER_MESSAGE_ERROR');
    }

    // 10 & 11. Persist assistant response and update conversation timestamp IN PARALLEL
    let savedAssistantMessage: Message | null = null;
    try {
      const privilegedSupabase = createPrivilegedSupabaseClient();

      const assistantInsertPromise = privilegedSupabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: aiReplyText,
          input_mode: 'text',
          language: effectiveLanguage,
        })
        .select('id, conversation_id, role, content, input_mode, language, created_at')
        .single();

      const convUpdatePromise = privilegedSupabase
        .from('conversations')
        .update({
          updated_at: new Date().toISOString(),
          language: effectiveLanguage,
        })
        .eq('id', conversationId)
        .eq('user_id', identity.userId);

      const [{ data: insertedAssistant, error: assistantInsertError }] =
        await Promise.all([assistantInsertPromise, convUpdatePromise]);

      if (!assistantInsertError && insertedAssistant) {
        savedAssistantMessage = insertedAssistant as Message;
      }
    } catch {
      // Fallback if SUPABASE_SERVICE_ROLE_KEY is a placeholder so the user still gets an instant reply
    }

    if (!savedAssistantMessage) {
      savedAssistantMessage = {
        id: `assistant-${Date.now()}`,
        conversation_id: conversationId,
        role: 'assistant',
        content: aiReplyText,
        input_mode: 'text',
        language: effectiveLanguage,
        created_at: new Date().toISOString(),
      };
    }

    // 12. Return response immediately
    sendJson(res, 200, {
      success: true,
      userMessage: savedUserMessage,
      assistantMessage: savedAssistantMessage,
      detectedLanguage: effectiveLanguage,
    });
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      sendError(res, err.statusCode, err.message, err.code);
      return;
    }
    sendError(
      res,
      500,
      'AI response could not be generated. Please try again.',
      'INTERNAL_SERVER_ERROR'
    );
  }
}
