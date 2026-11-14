import type { Message } from '../src/types';
import { detectMessageLanguage } from '../src/utils/language';
import { CONTEXT_WINDOW_LIMIT, chatRequestSchema } from '../src/utils/validation';
import { generateGeminiReply } from './_lib/gemini';
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

    // 1. Handle Guest Mode requests (real Gemini response without requiring Supabase login)
    if (isGuestRequest) {
      const rateLimit = checkRateLimit(getClientIdentifier(req, 'guest'), 20, 60_000);
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

      const { conversationId, message, language, inputMode } = parsed.data;
      const detection = detectMessageLanguage(message, language);
      const effectiveLanguage = detection.language;

      const aiReplyText = await generateGeminiReply({
        historyMessages: [],
        currentMessage: message,
        language: effectiveLanguage,
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

    // 2. Authenticate standard user via Supabase Auth token
    const identity = await verifyRequestAuth(req);

    // 3. Enforce per-user rate limit
    const rateLimit = checkRateLimit(getClientIdentifier(req, identity.userId), 20, 60_000);
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

    // 4. Parse and validate request payload with Zod
    const rawBody = await parseJsonBody(req);
    const parsed = chatRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || 'Invalid chat request payload.';
      throw new ApiError(400, firstIssue, 'VALIDATION_ERROR');
    }

    const { conversationId, message, language, inputMode } = parsed.data;

    // 5. Verify conversation ownership using the authenticated user's RLS client
    const userSupabase = createUserSupabaseClient(identity.accessToken);
    const { data: conversation, error: convError } = await userSupabase
      .from('conversations')
      .select('id, user_id, title, language, created_at, updated_at')
      .eq('id', conversationId)
      .eq('user_id', identity.userId)
      .maybeSingle();

    if (convError) {
      throw new ApiError(500, 'Unable to verify conversation ownership.', 'DB_VERIFY_ERROR');
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

    // 8. Save the user message via RLS-protected user client
    const { data: savedUserMessage, error: userInsertError } = await userSupabase
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

    if (userInsertError || !savedUserMessage) {
      throw new ApiError(500, 'Failed to save your message.', 'DB_USER_MESSAGE_ERROR');
    }

    // 9. Generate AI response from Google Gemini API
    const aiReplyText = await generateGeminiReply({
      historyMessages: chronologicalHistory,
      currentMessage: message,
      language: effectiveLanguage,
    });

    // 10. Persist assistant response using the privileged server-side Supabase client
    const privilegedSupabase = createPrivilegedSupabaseClient();

    const { data: savedAssistantMessage, error: assistantInsertError } = await privilegedSupabase
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

    if (assistantInsertError || !savedAssistantMessage) {
      throw new ApiError(500, 'Failed to save AI response.', 'DB_ASSISTANT_MESSAGE_ERROR');
    }

    // 11. Update conversation's updated_at timestamp and active language
    await privilegedSupabase
      .from('conversations')
      .update({
        updated_at: new Date().toISOString(),
        language: effectiveLanguage,
      })
      .eq('id', conversationId)
      .eq('user_id', identity.userId);

    // 12. Return response
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
