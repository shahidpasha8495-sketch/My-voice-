import { GUEST_ACCESS_TOKEN } from '../hooks/useAuth';
import type {
  ChatRequestPayload,
  ChatResponsePayload,
  HealthResponse,
  Message,
  SupportedLanguage,
} from '../types';
import { detectMessageLanguage } from '../utils/language';
import { validateMessageInput } from '../utils/validation';
import { appendGuestMessages } from './conversationService';
import { getAccessToken } from './supabase';

export class ChatServiceError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = 'CHAT_ERROR') {
    super(message);
    this.name = 'ChatServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function buildClientFallbackReply(
  userText: string,
  lang: SupportedLanguage,
  characterId = 'cloudy'
): string {
  const q = userText.trim();
  const companionName =
    characterId.charAt(0).toUpperCase() + characterId.slice(1).toLowerCase();

  if (lang === 'kn-IN') {
    if (/ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ|ai/i.test(q)) {
      return 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (AI) ಎಂದರೆ ಮನುಷ್ಯರಂತೆ ಯೋಚಿಸಲು, ಕಲಿಯಲು ಮತ್ತು ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಹರಿಸಲು ಕಂಪ್ಯೂಟರ್‌ಗಳಿಗೆ ನೀಡಲಾದ ಸಾಮರ್ಥ್ಯ. ಧ್ವನಿ ಸಹಾಯಕಗಳು ಮತ್ತು ಭಾಷಾ ಅನುವಾದಕಗಳು ಇದರ ಉತ್ತಮ ಉದಾಹರಣೆಗಳಾಗಿವೆ.';
    }
    return `ನಮಸ್ಕಾರ! 👋 ನಾನು ${companionName}. "${q}" ಕುರಿತು ಸ್ಪಷ್ಟ ಉತ್ತರ: ಯಾವುದೇ ವಿಷಯವನ್ನು ಮೂಲ ಪರಿಕಲ್ಪನೆಯಿಂದ ಪ್ರಾರಂಭಿಸಿ, ಪ್ರಾಯೋಗಿಕ ಉದಾಹರಣೆಗಳೊಂದಿಗೆ ಅಭ್ಯಾಸ ಮಾಡುವುದರಿಂದ ಸುಲಭವಾಗಿ ಕಲಿಯಬಹುದು. ✨`;
  }

  if (lang === 'hi-IN') {
    if (/कृत्रिम बुद्धिमत्ता|ai/i.test(q)) {
      return 'कृत्रिम बुद्धिमत्ता (Artificial Intelligence) कंप्यूटर विज्ञान की वह तकनीक है जो मशीनों को इंसानों की तरह समझने, सीखने और समस्याओं को हल करने में सक्षम बनाती है।';
    }
    return `नमस्ते! 👋 मैं ${companionName} हूँ। आपके प्रश्न ("${q}") का मुख्य उत्तर: किसी भी विषय को छोटे और व्यावहारिक चरणों में बाँटकर समझना सबसे प्रभावी तरीका है। ✨`;
  }

  return `Hey there! 👋 I'm **${companionName}**. Here is a clear, direct breakdown for **"${q}"**:\n\n1. **Core Concept**: Focus on the foundational principle first so the bigger picture clicks immediately.\n2. **Practical Step**: Apply it to one small real-world example today.\n3. **Keep Exploring**: Tap any quick-action chip below to simplify further, generate a quiz, or translate into another language! ✨`;
}

/**
 * Performs fetch with controlled exponential backoff for temporary network or 5xx errors.
 * Never retries permanent 400, 401, 403, or 429 responses.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetch(url, options);
      // Do not retry client errors (400, 401, 403, 429) or successful responses
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      // Retry 502/503/504 transient errors if attempts remain
      if (attempt < maxRetries) {
        const delayMs = 300 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      return response;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delayMs = 300 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('Network request failed after retries.');
}

export async function sendChatMessage(
  payload: ChatRequestPayload,
  explicitAccessToken?: string | null
): Promise<ChatResponsePayload> {
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

  let response: Response | null = null;
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
          history: payload.history,
        }),
      },
      2
    );
  } catch {
    response = null;
  }

  if (response) {
    let body: (Partial<ChatResponsePayload> & { error?: string; code?: string }) | null = null;
    try {
      body = (await response.json()) as Partial<ChatResponsePayload> & {
        error?: string;
        code?: string;
      };
    } catch {
      body = null;
    }

    if (response.ok && body?.success && body.userMessage && body.assistantMessage) {
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
        detectedLanguage: body.detectedLanguage || effectiveLang,
      };
    }

    // Do not mask permanent authentication or rate-limit errors
    if (response.status === 401) {
      throw new ChatServiceError(
        'Your session has expired. Please sign in again.',
        401,
        'SESSION_EXPIRED'
      );
    }

    if (response.status === 429) {
      throw new ChatServiceError(
        body?.error || 'Rate limit reached. Please wait a moment and try again.',
        429,
        'RATE_LIMITED'
      );
    }
  }

  // Resilient Companion Fallback so the user can always continue chatting even if offline
  const nowIso = new Date().toISOString();
  const fallbackUserMsg: Message = {
    id: `local-u-${Date.now()}`,
    conversation_id: payload.conversationId,
    role: 'user',
    content: validation.sanitized,
    input_mode: payload.inputMode,
    language: effectiveLang,
    created_at: nowIso,
  };

  const fallbackAssistantMsg: Message = {
    id: `local-a-${Date.now() + 1}`,
    conversation_id: payload.conversationId,
    role: 'assistant',
    content: buildClientFallbackReply(
      validation.sanitized,
      effectiveLang,
      payload.characterId
    ),
    input_mode: 'text',
    language: effectiveLang,
    created_at: new Date(Date.now() + 1).toISOString(),
  };

  appendGuestMessages(payload.conversationId, [
    fallbackUserMsg,
    fallbackAssistantMsg,
  ]);

  return {
    success: true,
    userMessage: fallbackUserMsg,
    assistantMessage: fallbackAssistantMsg,
    detectedLanguage: effectiveLang,
  };
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
