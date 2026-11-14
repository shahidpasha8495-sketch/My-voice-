import { SUPPORTED_LANGUAGES } from '../src/utils/validation';
import {
  applySecurityHeaders,
  getClientIdentifier,
  sendError,
  sendJson,
  type VercelRequest,
  type VercelResponse,
} from './_lib/http';
import { applyRateLimitHeaders, checkRateLimit } from './_lib/rateLimit';
import { isSupabaseServerConfigured } from './_lib/supabaseServer';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  applySecurityHeaders(res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendError(res, 405, 'Method not allowed.', 'METHOD_NOT_ALLOWED');
    return;
  }

  const rateLimit = checkRateLimit(getClientIdentifier(req), 60, 60_000);
  applyRateLimitHeaders(res, rateLimit);
  if (!rateLimit.allowed) {
    sendError(res, 429, 'Too many requests. Please slow down.', 'RATE_LIMIT_EXCEEDED');
    return;
  }

  const geminiConfigured = Boolean((process.env.GEMINI_API_KEY || '').trim());
  const supabaseConfigured = isSupabaseServerConfigured();

  sendJson(res, 200, {
    status: geminiConfigured && supabaseConfigured ? 'ok' : 'degraded',
    service: 'MyVoice API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    capabilities: {
      geminiConfigured,
      supabaseConfigured,
      supportedLanguages: SUPPORTED_LANGUAGES,
    },
  });
}
