import { GUEST_ACCESS_TOKEN } from '../hooks/useAuth';
import type {
  ChatRequestPayload,
  ChatResponsePayload,
  HealthResponse,
  Message,
  SupportedLanguage,
  TranscribeRequestPayload,
  TranscribeResponsePayload,
} from '../types';
import { detectMessageLanguage } from '../utils/language';
import { normalizeApiErrorPayload, normalizeError } from '../utils/normalizeError';
import { validateMessageInput } from '../utils/validation';
import { appendGuestMessages } from './conversationService';
import { getAccessToken } from './supabase';

export class ChatServiceError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = 'CHAT_ERROR') {
    super(
      normalizeError(
        message,
        "I'm having trouble generating a response. Please try again."
      )
    );
    this.name = 'ChatServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

interface CachedReplyEntry {
  assistantContent: string;
  detectedLanguage: SupportedLanguage;
  expiresAt: number;
}

const RESPONSE_CACHE = new Map<string, CachedReplyEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CHAT_REQUEST_TIMEOUT_MS = 25_000;

export function clearChatResponseCache(): void {
  RESPONSE_CACHE.clear();
}

/**
 * Prevents context-dependent follow-ups ("explain its advantages", "why?", "give an example",
 * "translate", etc.) from colliding with cached answers on different topics.
 */
export function isContextDependentFollowUp(
  sanitizedMessage: string,
  history?: Array<Pick<Message, 'role' | 'content'>>
): boolean {
  if (history && history.length > 0) {
    return true;
  }
  const lower = sanitizedMessage.toLowerCase();
  if (
    /\b(it|its|this|that|these|those|they|them|their|above|previous|simpler|more|elaborate|continue|repeat|why|how so|example|quiz)\b/i.test(
      lower
    )
  ) {
    return true;
  }
  if (
    /(इसका|इसके|उसका|उसके|इसे|अधिक|उदाहरण|ಇದರ|ಅದರ|ಇದನ್ನು|ಇನ್ನಷ್ಟು|ಉದಾಹರಣೆ)/.test(
      sanitizedMessage
    )
  ) {
    return true;
  }
  return false;
}

function buildScopedCacheKey(
  payload: ChatRequestPayload,
  effectiveLang: SupportedLanguage,
  sanitizedMessage: string
): string {
  const prevTurn = (payload.history || [])
    .slice(-2)
    .map((m) => `${m.role}:${m.content.slice(0, 60)}`)
    .join('|');
  return `${payload.conversationId}::${payload.characterId || 'cloudy'}::${payload.styleMode || 'turbo'}::${effectiveLang}::${payload.inputMode}::${prevTurn}::${sanitizedMessage.toLowerCase()}`;
}

export async function transcribeRecordedAudio(
  payload: TranscribeRequestPayload,
  explicitAccessToken?: string | null
): Promise<TranscribeResponsePayload> {
  const token =
    explicitAccessToken || (await getAccessToken()) || GUEST_ACCESS_TOKEN;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 22_000);

  try {
    const response = await fetch('/api/voice/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    let body: Partial<TranscribeResponsePayload> = {};
    let rawBody: unknown = {};
    try {
      rawBody = await response.json();
      if (rawBody && typeof rawBody === 'object') {
        body = rawBody as Partial<TranscribeResponsePayload>;
      }
    } catch {
      rawBody = {};
      body = {};
    }

    if (response.status === 401) {
      throw new ChatServiceError(
        'Your session has expired. Please sign in again.',
        401,
        'SESSION_EXPIRED'
      );
    }

    if (!response.ok || !body.success || typeof body.transcript !== 'string' || !body.transcript) {
      throw new ChatServiceError(
        normalizeApiErrorPayload(
          rawBody,
          response.status,
          'Unable to transcribe the recorded audio. Please speak clearly or type your message.'
        ),
        response.status || 500,
        typeof body.code === 'string' ? body.code : 'TRANSCRIPTION_FAILED'
      );
    }

    return {
      success: true,
      transcript: body.transcript,
      language: body.language || payload.language,
      confidence: body.confidence,
      provider: body.provider,
    };
  } catch (err) {
    if (err instanceof ChatServiceError) {
      throw err;
    }
    const isAbort = err instanceof Error && err.name === 'AbortError';
    throw new ChatServiceError(
      isAbort
        ? 'Audio transcription timed out. Please try a shorter recording or type below.'
        : 'Network error during audio transcription. Please check your connection and try again.',
      isAbort ? 504 : 503,
      isAbort ? 'TRANSCRIBE_TIMEOUT' : 'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function getClientClarifyingQuestionForUnclearAudio(
  rawMessage: string,
  language: SupportedLanguage,
  inputMode?: 'text' | 'voice'
): string | null {
  if (inputMode !== 'voice') return null;
  const cleaned = rawMessage
    .trim()
    .replace(/[.,!?…\-_'"`~]/g, '')
    .trim();

  const isTooShort = cleaned.length <= 1;
  const isFillerNoise =
    /^(uh+|um+|hmm+|hm+|er+|ah+|oh+|huh|mm+|ha+|he+|eh+)$/i.test(cleaned);

  if (!isTooShort && !isFillerNoise) {
    return null;
  }

  switch (language) {
    case 'hi-IN':
      return 'क्षमा करें, आपकी आवाज़ थोड़ी अस्पष्ट थी। क्या आप कृपया इसे दोबारा कह सकते हैं?';
    case 'kn-IN':
      return 'ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಧ್ವನಿ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಹೇಳುತ್ತೀರಾ?';
    case 'ta-IN':
      return 'மன்னிக்கவும், உங்கள் குரல் தெளிவாகக் கேட்கவில்லை. தயவுசெய்து மீண்டும் கூறுவீர்களா?';
    case 'te-IN':
      return 'క్షಮించండి, మీ మాట స్పష్టంగా వినిపించలేదు. దయచేసి మళ్ళీ చెబుతారా?';
    default:
      return "I caught a bit of background noise and didn't quite hear that clearly. Could you say that one more time?";
  }
}

/**
 * Performs fetch with controlled exponential backoff for temporary network or 5xx errors.
 * Never retries permanent 400, 401, 403, 429, or user/timeout-aborted requests.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 1
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      if (attempt < maxRetries) {
        const delayMs = 300 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      return response;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw err;
      }
      lastError = err;
      if (attempt < maxRetries) {
        const delayMs = 300 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('Network request failed after retries.');
}

export interface StreamChatCallbacks {
  onMeta?: (info: { detectedLanguage: SupportedLanguage }) => void;
  onToken?: (chunk: string, fullText: string, firstTokenMs: number) => void;
  onSentenceReady?: (sentence: string, language: SupportedLanguage) => void;
}

/**
 * Extracts completed sentences from a streaming buffer so TTS speaks
 * immediately after Sentence #1 arrives instead of waiting for full generation.
 */
function drainCompleteSentences(
  buffer: string
): { sentences: string[]; remainder: string } {
  const sentences: string[] = [];
  const sentenceBoundaryRegex = /([\s\S]*?[.!?।](?:\s+|$))/u;
  let working = buffer;

  while (true) {
    const match = sentenceBoundaryRegex.exec(working);
    if (!match) break;
    const candidate = match[1].trim();
    if (candidate.length >= 6) {
      sentences.push(candidate);
      working = working.slice(match[0].length);
    } else {
      break;
    }
  }

  return { sentences, remainder: working };
}

export async function sendChatMessageStream(
  payload: ChatRequestPayload,
  explicitAccessToken?: string | null,
  callbacks: StreamChatCallbacks = {}
): Promise<ChatResponsePayload> {
  const startPerf = performance.now();

  const validation = validateMessageInput(payload.message);
  if (!validation.valid) {
    throw new ChatServiceError(
      validation.error || 'Invalid message content.',
      400,
      'VALIDATION_ERROR'
    );
  }

  const token = explicitAccessToken || (await getAccessToken()) || GUEST_ACCESS_TOKEN;
  const detection = detectMessageLanguage(validation.sanitized, payload.language);
  const effectiveLang = detection.language;
  callbacks.onMeta?.({ detectedLanguage: effectiveLang });

  // 1. Unclear/garbled voice audio short-circuit (< 2ms instant clarifying question)
  const clarifyingReply = getClientClarifyingQuestionForUnclearAudio(
    validation.sanitized,
    effectiveLang,
    payload.inputMode
  );
  if (clarifyingReply) {
    const ms = Math.max(2, Math.round(performance.now() - startPerf));
    callbacks.onToken?.(clarifyingReply, clarifyingReply, ms);
    callbacks.onSentenceReady?.(clarifyingReply, effectiveLang);
    const nowIso = new Date().toISOString();
    const userMsg: Message = {
      id: `clarify-u-${Date.now()}`,
      conversation_id: payload.conversationId,
      role: 'user',
      content: validation.sanitized,
      input_mode: payload.inputMode,
      language: effectiveLang,
      created_at: nowIso,
    };
    const assistantMsg: Message = {
      id: `clarify-a-${Date.now() + 1}`,
      conversation_id: payload.conversationId,
      role: 'assistant',
      content: clarifyingReply,
      input_mode: 'text',
      language: effectiveLang,
      created_at: new Date(Date.now() + 1).toISOString(),
    };
    if (token === GUEST_ACCESS_TOKEN) {
      appendGuestMessages(payload.conversationId, [userMsg, assistantMsg]);
    }
    return {
      success: true,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      detectedLanguage: effectiveLang,
      firstTokenMs: ms,
      latencyMs: ms,
      cached: true,
    };
  }

  // 2. Scoped Response Cache lookup (never reuses answers across different topics/follow-ups)
  const allowCache = !isContextDependentFollowUp(
    validation.sanitized,
    payload.history
  );
  const cacheKey = buildScopedCacheKey(
    payload,
    effectiveLang,
    validation.sanitized
  );
  const cachedEntry = allowCache ? RESPONSE_CACHE.get(cacheKey) : undefined;
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    const ms = Math.max(2, Math.round(performance.now() - startPerf));
    callbacks.onToken?.(cachedEntry.assistantContent, cachedEntry.assistantContent, ms);
    const { sentences, remainder } = drainCompleteSentences(cachedEntry.assistantContent);
    sentences.forEach((s) => callbacks.onSentenceReady?.(s, cachedEntry.detectedLanguage));
    if (remainder.trim()) {
      callbacks.onSentenceReady?.(remainder.trim(), cachedEntry.detectedLanguage);
    }

    const nowIso = new Date().toISOString();
    const cachedUserMsg: Message = {
      id: `cache-u-${Date.now()}`,
      conversation_id: payload.conversationId,
      role: 'user',
      content: validation.sanitized,
      input_mode: payload.inputMode,
      language: effectiveLang,
      created_at: nowIso,
    };
    const cachedAssistantMsg: Message = {
      id: `cache-a-${Date.now() + 1}`,
      conversation_id: payload.conversationId,
      role: 'assistant',
      content: cachedEntry.assistantContent,
      input_mode: 'text',
      language: cachedEntry.detectedLanguage,
      created_at: new Date(Date.now() + 1).toISOString(),
    };
    if (token === GUEST_ACCESS_TOKEN) {
      appendGuestMessages(payload.conversationId, [
        cachedUserMsg,
        cachedAssistantMsg,
      ]);
    }
    return {
      success: true,
      userMessage: cachedUserMsg,
      assistantMessage: cachedAssistantMsg,
      detectedLanguage: cachedEntry.detectedLanguage,
      firstTokenMs: ms,
      latencyMs: ms,
      cached: true,
    };
  }

  // 3. Real-Time SSE Streaming Request to `/api/chat` with explicit timeout & error propagation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHAT_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('/api/chat?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream, application/json',
      },
      body: JSON.stringify({
        conversationId: payload.conversationId,
        message: validation.sanitized,
        language: payload.language,
        inputMode: payload.inputMode,
        characterId: payload.characterId,
        styleMode: payload.styleMode,
        stream: true,
        history: payload.history,
      }),
      signal: controller.signal,
    });

    if (response.status === 401) {
      throw new ChatServiceError(
        'Your session has expired. Please sign in again.',
        401,
        'SESSION_EXPIRED'
      );
    }

    if (response.status === 403) {
      throw new ChatServiceError(
        'Access denied to this conversation. Please start a new conversation.',
        403,
        'FORBIDDEN'
      );
    }

    if (response.status === 429) {
      let errPayload: unknown = {};
      try {
        errPayload = await response.json();
      } catch {
        errPayload = {};
      }
      throw new ChatServiceError(
        normalizeApiErrorPayload(
          errPayload,
          429,
          'Rate limit reached. Please wait a moment and try again.'
        ),
        429,
        'RATE_LIMITED'
      );
    }

    if (!response.ok) {
      let rawErrBody: unknown = {};
      try {
        rawErrBody = await response.json();
      } catch {
        rawErrBody = {};
      }
      const errCode =
        rawErrBody &&
        typeof rawErrBody === 'object' &&
        'code' in rawErrBody &&
        typeof (rawErrBody as { code?: unknown }).code === 'string'
          ? (rawErrBody as { code: string }).code
          : 'CHAT_SERVER_ERROR';
      throw new ChatServiceError(
        normalizeApiErrorPayload(
          rawErrBody,
          response.status,
          `Server error (${response.status}). Please retry your message.`
        ),
        response.status,
        errCode
      );
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();

    if (contentType.includes('text/event-stream') && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';
      let currentEvent = 'message';
      let accumulatedText = '';
      let sentenceBuffer = '';
      let firstTokenMs: number | undefined;
      let detectedLang = effectiveLang;
      let finalPayload: ChatResponsePayload | null = null;
      let streamErrorMsg: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        let newlineIdx = sseBuffer.indexOf('\n');

        while (newlineIdx !== -1) {
          const rawLine = sseBuffer.slice(0, newlineIdx);
          sseBuffer = sseBuffer.slice(newlineIdx + 1);
          newlineIdx = sseBuffer.indexOf('\n');

          const line = rawLine.trimEnd();
          if (!line) {
            currentEvent = 'message';
            continue;
          }
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
            continue;
          }
          if (!line.startsWith('data:')) continue;

          const jsonText = line.slice(5).trim();
          if (!jsonText) continue;

          try {
            const eventData = JSON.parse(jsonText) as Record<string, unknown>;
            if (currentEvent === 'meta') {
              const langFromServer = eventData.detectedLanguage as SupportedLanguage | undefined;
              if (langFromServer) {
                detectedLang = langFromServer;
                callbacks.onMeta?.({ detectedLanguage: detectedLang });
              }
            } else if (currentEvent === 'delta') {
              const piece =
                typeof eventData.text === 'string' ? eventData.text : '';
              if (piece) {
                if (firstTokenMs === undefined) {
                  firstTokenMs = Math.max(5, Math.round(performance.now() - startPerf));
                }
                accumulatedText += piece;
                sentenceBuffer += piece;
                callbacks.onToken?.(piece, accumulatedText, firstTokenMs);

                const drained = drainCompleteSentences(sentenceBuffer);
                sentenceBuffer = drained.remainder;
                drained.sentences.forEach((sentence) => {
                  callbacks.onSentenceReady?.(sentence, detectedLang);
                });
              }
            } else if (currentEvent === 'error') {
              streamErrorMsg = normalizeError(
                eventData.error ?? eventData,
                'AI response was interrupted. Please try again.'
              );
            } else if (currentEvent === 'done') {
              const userMessage = eventData.userMessage as Message | undefined;
              const assistantMessage = eventData.assistantMessage as Message | undefined;
              if (userMessage && assistantMessage) {
                finalPayload = {
                  success: true,
                  userMessage,
                  assistantMessage,
                  detectedLanguage:
                    (eventData.detectedLanguage as SupportedLanguage) || detectedLang,
                  firstTokenMs:
                    firstTokenMs ??
                    (typeof eventData.firstTokenMs === 'number'
                      ? eventData.firstTokenMs
                      : Math.max(8, Math.round(performance.now() - startPerf))),
                  latencyMs: Math.max(10, Math.round(performance.now() - startPerf)),
                  cached: false,
                };
              }
            }
          } catch {
            // Skip malformed SSE event payload
          }
        }
      }

      if (sentenceBuffer.trim()) {
        callbacks.onSentenceReady?.(sentenceBuffer.trim(), detectedLang);
      }

      if (finalPayload) {
        if (allowCache) {
          RESPONSE_CACHE.set(cacheKey, {
            assistantContent: finalPayload.assistantMessage.content,
            detectedLanguage: finalPayload.detectedLanguage || detectedLang,
            expiresAt: Date.now() + CACHE_TTL_MS,
          });
        }
        if (token === GUEST_ACCESS_TOKEN) {
          appendGuestMessages(payload.conversationId, [
            finalPayload.userMessage,
            finalPayload.assistantMessage,
          ]);
        }
        return finalPayload;
      }

      // If stream broke mid-way AFTER tokens had started arriving, preserve & mark interrupted clearly!
      if (accumulatedText.trim()) {
        const nowIso = new Date().toISOString();
        const partialUser: Message = {
          id: `partial-u-${Date.now()}`,
          conversation_id: payload.conversationId,
          role: 'user',
          content: validation.sanitized,
          input_mode: payload.inputMode,
          language: detectedLang,
          created_at: nowIso,
        };
        const partialAssistant: Message = {
          id: `partial-a-${Date.now() + 1}`,
          conversation_id: payload.conversationId,
          role: 'assistant',
          content: `${accumulatedText.trim()}\n\n_[Response interrupted before completion — tap Retry if needed.]_`,
          input_mode: 'text',
          language: detectedLang,
          created_at: new Date(Date.now() + 1).toISOString(),
        };
        return {
          success: true,
          userMessage: partialUser,
          assistantMessage: partialAssistant,
          detectedLanguage: detectedLang,
          firstTokenMs: firstTokenMs ?? Math.max(10, Math.round(performance.now() - startPerf)),
          latencyMs: Math.max(10, Math.round(performance.now() - startPerf)),
          cached: false,
          interrupted: true,
        };
      }

      throw new ChatServiceError(
        streamErrorMsg || 'AI stream ended before returning an answer. Please retry.',
        502,
        'STREAM_INTERRUPTED'
      );
    }
  } catch (err) {
    if (err instanceof ChatServiceError) {
      throw err;
    }
    const isAbort = err instanceof Error && err.name === 'AbortError';
    throw new ChatServiceError(
      isAbort
        ? 'The AI request timed out. Please try again.'
        : 'Unable to reach MyVoice AI servers. Check your connection and retry.',
      isAbort ? 504 : 503,
      isAbort ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback to non-streaming JSON /api/chat if server returned non-SSE JSON response
  const fallbackResult = await sendChatMessage(payload, explicitAccessToken);
  const ms =
    fallbackResult.latencyMs ?? Math.max(5, Math.round(performance.now() - startPerf));
  callbacks.onToken?.(fallbackResult.assistantMessage.content, fallbackResult.assistantMessage.content, ms);
  const { sentences, remainder } = drainCompleteSentences(fallbackResult.assistantMessage.content);
  const outLang = fallbackResult.detectedLanguage || effectiveLang;
  sentences.forEach((s) => callbacks.onSentenceReady?.(s, outLang));
  if (remainder.trim()) {
    callbacks.onSentenceReady?.(remainder.trim(), outLang);
  }
  return {
    ...fallbackResult,
    firstTokenMs: fallbackResult.firstTokenMs ?? ms,
  };
}

export async function sendChatMessage(
  payload: ChatRequestPayload,
  explicitAccessToken?: string | null
): Promise<ChatResponsePayload> {
  const startPerf = performance.now();

  const validation = validateMessageInput(payload.message);
  if (!validation.valid) {
    throw new ChatServiceError(
      validation.error || 'Invalid message content.',
      400,
      'VALIDATION_ERROR'
    );
  }

  const token = explicitAccessToken || (await getAccessToken()) || GUEST_ACCESS_TOKEN;
  const detection = detectMessageLanguage(validation.sanitized, payload.language);
  const effectiveLang = detection.language;

  const clarifyingReply = getClientClarifyingQuestionForUnclearAudio(
    validation.sanitized,
    effectiveLang,
    payload.inputMode
  );
  if (clarifyingReply) {
    const nowIso = new Date().toISOString();
    const userMsg: Message = {
      id: `clarify-u-${Date.now()}`,
      conversation_id: payload.conversationId,
      role: 'user',
      content: validation.sanitized,
      input_mode: payload.inputMode,
      language: effectiveLang,
      created_at: nowIso,
    };
    const assistantMsg: Message = {
      id: `clarify-a-${Date.now() + 1}`,
      conversation_id: payload.conversationId,
      role: 'assistant',
      content: clarifyingReply,
      input_mode: 'text',
      language: effectiveLang,
      created_at: new Date(Date.now() + 1).toISOString(),
    };
    if (token === GUEST_ACCESS_TOKEN) {
      appendGuestMessages(payload.conversationId, [userMsg, assistantMsg]);
    }
    return {
      success: true,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      detectedLanguage: effectiveLang,
      latencyMs: Math.max(2, Math.round(performance.now() - startPerf)),
      cached: true,
    };
  }

  const allowCache = !isContextDependentFollowUp(
    validation.sanitized,
    payload.history
  );
  const cacheKey = buildScopedCacheKey(
    payload,
    effectiveLang,
    validation.sanitized
  );
  const cachedEntry = allowCache ? RESPONSE_CACHE.get(cacheKey) : undefined;
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    const nowIso = new Date().toISOString();
    const cachedUserMsg: Message = {
      id: `cache-u-${Date.now()}`,
      conversation_id: payload.conversationId,
      role: 'user',
      content: validation.sanitized,
      input_mode: payload.inputMode,
      language: effectiveLang,
      created_at: nowIso,
    };
    const cachedAssistantMsg: Message = {
      id: `cache-a-${Date.now() + 1}`,
      conversation_id: payload.conversationId,
      role: 'assistant',
      content: cachedEntry.assistantContent,
      input_mode: 'text',
      language: cachedEntry.detectedLanguage,
      created_at: new Date(Date.now() + 1).toISOString(),
    };
    if (token === GUEST_ACCESS_TOKEN) {
      appendGuestMessages(payload.conversationId, [
        cachedUserMsg,
        cachedAssistantMsg,
      ]);
    }
    return {
      success: true,
      userMessage: cachedUserMsg,
      assistantMessage: cachedAssistantMsg,
      detectedLanguage: cachedEntry.detectedLanguage,
      latencyMs: Math.max(2, Math.round(performance.now() - startPerf)),
      cached: true,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHAT_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetchWithRetry(
      '/api/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          conversationId: payload.conversationId,
          message: validation.sanitized,
          language: payload.language,
          inputMode: payload.inputMode,
          characterId: payload.characterId,
          styleMode: payload.styleMode,
          history: payload.history,
        }),
        signal: controller.signal,
      },
      1
    );
  } catch (err) {
    clearTimeout(timeoutId);
    const isAbort = err instanceof Error && err.name === 'AbortError';
    throw new ChatServiceError(
      isAbort
        ? 'The AI request timed out. Please try again.'
        : 'Network request failed. Please check your internet connection and retry.',
      isAbort ? 504 : 503,
      isAbort ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let rawBody: unknown = null;
  let body: (Partial<ChatResponsePayload> & { code?: unknown }) | null = null;
  try {
    rawBody = await response.json();
    if (rawBody && typeof rawBody === 'object') {
      body = rawBody as Partial<ChatResponsePayload> & { code?: unknown };
    }
  } catch {
    rawBody = null;
    body = null;
  }

  if (response.ok && body?.success && body.userMessage && body.assistantMessage) {
    const detectedLang = body.detectedLanguage || effectiveLang;
    if (allowCache) {
      RESPONSE_CACHE.set(cacheKey, {
        assistantContent: body.assistantMessage.content,
        detectedLanguage: detectedLang,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
    }

    if (token === GUEST_ACCESS_TOKEN) {
      appendGuestMessages(payload.conversationId, [
        body.userMessage,
        body.assistantMessage,
      ]);
    }

    return {
      success: true,
      userMessage: body.userMessage,
      assistantMessage: body.assistantMessage,
      detectedLanguage: detectedLang,
      latencyMs: Math.max(10, Math.round(performance.now() - startPerf)),
      cached: false,
    };
  }

  if (response.status === 401) {
    throw new ChatServiceError(
      'Your session has expired. Please sign in again.',
      401,
      'SESSION_EXPIRED'
    );
  }

  if (response.status === 403) {
    throw new ChatServiceError(
      'Conversation access denied. Please start a new conversation.',
      403,
      'FORBIDDEN'
    );
  }

  if (response.status === 429) {
    throw new ChatServiceError(
      normalizeApiErrorPayload(
        rawBody,
        429,
        'Rate limit reached. Please wait a moment and try again.'
      ),
      429,
      'RATE_LIMITED'
    );
  }

  throw new ChatServiceError(
    normalizeApiErrorPayload(
      rawBody,
      response.status,
      "I'm having trouble generating a response. Please try again."
    ),
    response.status || 500,
    typeof body?.code === 'string' ? body.code : 'CHAT_ERROR'
  );
}

export async function fetchBackendHealth(): Promise<HealthResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) return null;
      return (await response.json()) as HealthResponse;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return null;
  }
}
