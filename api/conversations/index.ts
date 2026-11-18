import { createConversationSchema } from '../../src/utils/validation.js';
import {
  ApiError,
  applySecurityHeaders,
  getClientIdentifier,
  parseJsonBody,
  sendError,
  sendJson,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js';
import { applyRateLimitHeaders, checkRateLimit } from '../_lib/rateLimit.js';
import { createUserSupabaseClient, verifyRequestAuth } from '../_lib/supabaseServer.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  applySecurityHeaders(res);

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    sendError(res, 405, 'Method not allowed.', 'METHOD_NOT_ALLOWED');
    return;
  }

  try {
    const identity = await verifyRequestAuth(req);
    const rateLimit = checkRateLimit(getClientIdentifier(req, identity.userId), 60, 60_000);
    applyRateLimitHeaders(res, rateLimit);

    if (!rateLimit.allowed) {
      sendError(res, 429, 'Too many requests. Please try again shortly.', 'RATE_LIMIT_EXCEEDED');
      return;
    }

    const supabase = createUserSupabaseClient(identity.accessToken);

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, user_id, title, language, created_at, updated_at')
        .eq('user_id', identity.userId)
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) {
        throw new ApiError(500, 'Unable to load conversation history.', 'DB_FETCH_ERROR');
      }

      sendJson(res, 200, {
        success: true,
        conversations: data ?? [],
      });
      return;
    }

    // POST /api/conversations
    const body = await parseJsonBody(req);
    const parsed = createConversationSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || 'Invalid conversation payload.';
      throw new ApiError(400, issue, 'VALIDATION_ERROR');
    }

    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({
        user_id: identity.userId,
        title: parsed.data.title,
        language: parsed.data.language,
      })
      .select('id, user_id, title, language, created_at, updated_at')
      .single();

    if (createError || !created) {
      throw new ApiError(500, 'Failed to create conversation.', 'DB_INSERT_ERROR');
    }

    sendJson(res, 201, {
      success: true,
      conversation: created,
    });
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      sendError(res, err.statusCode, err.message, err.code);
      return;
    }
    sendError(res, 500, 'Unable to connect. Please try again.', 'INTERNAL_ERROR');
  }
}
