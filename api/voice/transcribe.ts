import { detectMessageLanguage } from '../../src/utils/language.js';
import {
  MAX_AUDIO_BYTES,
  voiceTranscribeSchema,
} from '../../src/utils/validation.js';
import { transcribeAudioWithGemini } from '../_lib/gemini.js';
import {
  ApiError,
  MAX_AUDIO_UPLOAD_BODY_BYTES,
  applySecurityHeaders,
  getClientIdentifier,
  parseJsonBody,
  sendError,
  sendJson,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js';
import { applyRateLimitHeaders, checkRateLimit } from '../_lib/rateLimit.js';
import { verifyRequestAuth } from '../_lib/supabaseServer.js';

const GUEST_BEARER_HEADER = 'bearer guest-session-token';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  applySecurityHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendError(res, 405, 'Method not allowed.', 'METHOD_NOT_ALLOWED');
    return;
  }

  try {
    const rawAuthHeader = req.headers.authorization || req.headers.Authorization;
    const authHeaderStr = (
      Array.isArray(rawAuthHeader) ? rawAuthHeader[0] : rawAuthHeader || ''
    )
      .trim()
      .toLowerCase();
    const isGuestRequest = authHeaderStr === GUEST_BEARER_HEADER;

    let rateIdentifier: string;
    if (isGuestRequest) {
      rateIdentifier = getClientIdentifier(req, 'voice-guest');
    } else {
      const identity = await verifyRequestAuth(req);
      rateIdentifier = getClientIdentifier(req, `voice-${identity.userId}`);
    }

    const rateLimit = checkRateLimit(rateIdentifier, 15, 60_000);
    applyRateLimitHeaders(res, rateLimit);
    if (!rateLimit.allowed) {
      sendError(
        res,
        429,
        'Voice transcription rate limit reached. Please wait a moment and try again.',
        'RATE_LIMIT_EXCEEDED'
      );
      return;
    }

    const rawBody = await parseJsonBody(req, MAX_AUDIO_UPLOAD_BODY_BYTES);
    const parsed = voiceTranscribeSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstIssue =
        parsed.error.issues[0]?.message || 'Invalid audio transcription payload.';
      throw new ApiError(400, firstIssue, 'VALIDATION_ERROR');
    }

    const { audioBase64, mimeType, language } = parsed.data;
    // Strip data URI prefix if present (e.g. data:audio/webm;base64,...)
    const cleanBase64 = audioBase64.includes(',')
      ? audioBase64.split(',').pop()!.trim()
      : audioBase64.trim();

    const decodedBuffer = Buffer.from(cleanBase64, 'base64');
    if (decodedBuffer.byteLength < 64) {
      throw new ApiError(
        400,
        'Recorded audio is too short. Please hold or speak a little longer.',
        'EMPTY_AUDIO'
      );
    }
    if (decodedBuffer.byteLength > MAX_AUDIO_BYTES) {
      throw new ApiError(
        413,
        'Audio recording exceeds the 4 MB maximum size limit. Please keep voice clips under 30 seconds.',
        'AUDIO_TOO_LARGE'
      );
    }

    const { transcript, provider } = await transcribeAudioWithGemini({
      audioBase64: cleanBase64,
      mimeType,
      language,
    });

    const detected = detectMessageLanguage(transcript, language);

    sendJson(res, 200, {
      success: true,
      transcript,
      language: detected.language,
      provider,
    });
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      sendError(res, err.statusCode, err.message, err.code);
      return;
    }
    sendError(
      res,
      500,
      'Unable to transcribe voice recording. Please type your message or try again.',
      'TRANSCRIPTION_ERROR'
    );
  }
}
