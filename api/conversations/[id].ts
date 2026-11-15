import { updateConversationSchema, uuidSchema } from '../../src/utils/validation';
import {
  ApiError,
  applySecurityHeaders,
  getClientIdentifier,
  parseJsonBody,
  sendError,
  sendJson,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http';
import { applyRateLimitHeaders, checkRateLimit } from '../_lib/rateLimit';
import { createUserSupabaseClient, verifyRequestAuth } from '../_lib/supabaseServer';

function extractConversationId(req: VercelRequest): string {
  const fromQuery = req.query?.id;
  if (typeof fromQuery === 'string' && fromQuery.trim()) {
    return fromQuery.trim();
  }
  if (Array.isArray(fromQuery) && fromQuery[0]) {
    return fromQuery[0].trim();
  }

  // Fallback extraction from URL path /api/conversations/:id
  const rawUrl = req.url || '';
  const pathPart = rawUrl.split('?')[0] || '';
  const segments = pathPart.split('/').filter(Boolean);
  return segments[segments.length - 1] || '';
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  applySecurityHeaders(res);

  if (req.method !== 'GET' && req.method !== 'DELETE' && req.method !== 'PATCH') {
    res.setHeader('Allow', 'GET, PATCH, DELETE');
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

    const rawId = extractConversationId(req);
    const idValidation = uuidSchema.safeParse(rawId);
    if (!idValidation.success) {
      throw new ApiError(400, 'Invalid conversation ID.', 'INVALID_CONVERSATION_ID');
    }
    const conversationId = idValidation.data;

    const supabase = createUserSupabaseClient(identity.accessToken);

    // Verify ownership first
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, user_id, title, language, created_at, updated_at')
      .eq('id', conversationId)
      .eq('user_id', identity.userId)
      .maybeSingle();

    if (convError) {
      throw new ApiError(500, 'Failed to verify conversation ownership.', 'DB_ERROR');
    }

    if (!conversation || conversation.user_id !== identity.userId) {
      throw new ApiError(404, 'Conversation not found or access denied.', 'NOT_FOUND');
    }

    if (req.method === 'GET') {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, conversation_id, role, content, input_mode, language, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) {
        throw new ApiError(500, 'Failed to load conversation messages.', 'DB_FETCH_ERROR');
      }

      sendJson(res, 200, {
        success: true,
        conversation,
        messages: messages ?? [],
      });
      return;
    }

    if (req.method === 'PATCH') {
      const body = await parseJsonBody(req);
      const parsed = updateConversationSchema.safeParse(body);
      if (!parsed.success) {
        const issue = parsed.error.issues[0]?.message || 'Invalid conversation title.';
        throw new ApiError(400, issue, 'VALIDATION_ERROR');
      }

      const { data: updated, error: updateError } = await supabase
        .from('conversations')
        .update({
          title: parsed.data.title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .eq('user_id', identity.userId)
        .select('id, user_id, title, language, created_at, updated_at')
        .single();

      if (updateError || !updated) {
        throw new ApiError(500, 'Failed to rename conversation.', 'DB_UPDATE_ERROR');
      }

      sendJson(res, 200, {
        success: true,
        conversation: updated,
      });
      return;
    }

    // DELETE /api/conversations/[id]
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', identity.userId);

    if (deleteError) {
      throw new ApiError(500, 'Failed to delete conversation.', 'DB_DELETE_ERROR');
    }

    sendJson(res, 200, {
      success: true,
      deletedId: conversationId,
    });
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      sendError(res, err.statusCode, err.message, err.code);
      return;
    }
    sendError(res, 500, 'Unable to connect. Please try again.', 'INTERNAL_ERROR');
  }
}
