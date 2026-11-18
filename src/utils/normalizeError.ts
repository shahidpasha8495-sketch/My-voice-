export const DEFAULT_UNKNOWN_ERROR_MESSAGE =
  'Something unexpected happened. Please try again.';

const OBJECT_TAG_REGEX = /^\[object\s+[^\]]+\]$/i;

const DOM_EXCEPTION_MESSAGE_MAP: Record<string, string> = {
  NotAllowedError: 'Please allow microphone access in your browser settings.',
  PermissionDeniedError: 'Please allow microphone access in your browser settings.',
  SecurityError:
    'Microphone access requires a secure HTTPS connection.',
  NotFoundError:
    'Microphone is unavailable. Please connect a microphone or use text chat.',
  DevicesNotFoundError:
    'Microphone is unavailable. Please connect a microphone or use text chat.',
  NotReadableError:
    'Your microphone is currently busy in another app. Close other audio apps and try again.',
  TrackStartError:
    'Your microphone is currently busy in another app. Close other audio apps and try again.',
  AbortError: 'The request timed out or was interrupted. Please try again.',
  OverconstrainedError:
    'Your device microphone settings are unsupported. Trying standard audio capture.',
};

const SPEECH_ERROR_CODE_MAP: Record<string, string> = {
  'not-allowed': 'Please allow microphone access in your browser settings.',
  'service-not-allowed':
    'Browser voice recognition is blocked here. Tap "Record Audio" or use text chat.',
  'audio-capture':
    'Microphone is unavailable. Please check your device microphone settings.',
  'no-speech': "I couldn't hear you. Please try again.",
  network: 'Your internet connection seems unstable.',
  aborted: 'Voice listening was interrupted. Please try again.',
  'language-not-supported':
    'This language is unsupported by browser speech recognition. Try "Record Audio" instead.',
};

export function isUnreadableErrorText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (OBJECT_TAG_REGEX.test(trimmed)) return true;
  if (trimmed === 'undefined' || trimmed === 'null' || trimmed === 'NaN') {
    return true;
  }
  return false;
}

function extractFromUnknown(
  value: unknown,
  depth: number,
  seen: WeakSet<object>
): string | null {
  if (value === null || value === undefined || depth > 5) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (isUnreadableErrorText(trimmed)) {
      return null;
    }
    // Map bare Web Speech error codes cleanly if encountered as raw strings
    if (SPEECH_ERROR_CODE_MAP[trimmed]) {
      return SPEECH_ERROR_CODE_MAP[trimmed];
    }
    return trimmed;
  }

  if (typeof value !== 'object') {
    return null;
  }

  if (seen.has(value)) {
    return null;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = extractFromUnknown(item, depth + 1, seen);
      if (candidate) return candidate;
    }
    return null;
  }

  const record = value as Record<string, unknown>;

  // Browser DOMException (cross-realm safe check)
  const rawName = typeof record.name === 'string' ? record.name : '';
  const isDomException =
    (typeof DOMException !== 'undefined' && value instanceof DOMException) ||
    rawName in DOM_EXCEPTION_MESSAGE_MAP;

  if (isDomException && rawName && DOM_EXCEPTION_MESSAGE_MAP[rawName]) {
    return DOM_EXCEPTION_MESSAGE_MAP[rawName];
  }

  // Standard Error instance (check .message, then .cause)
  if (value instanceof Error) {
    if (
      typeof value.message === 'string' &&
      !isUnreadableErrorText(value.message)
    ) {
      return value.message.trim();
    }
    if ('cause' in value && (value as { cause?: unknown }).cause !== undefined) {
      const fromCause = extractFromUnknown(
        (value as { cause?: unknown }).cause,
        depth + 1,
        seen
      );
      if (fromCause) return fromCause;
    }
  }

  // Browser SpeechRecognitionErrorEvent ({ error: 'no-speech' | 'network' | ..., message })
  if (
    typeof record.error === 'string' &&
    SPEECH_ERROR_CODE_MAP[record.error]
  ) {
    return SPEECH_ERROR_CODE_MAP[record.error];
  }

  // Common API, Vercel, Supabase, Zod, and nested JSON error fields
  const priorityKeys = [
    'message',
    'error',
    'error_description',
    'msg',
    'details',
    'detail',
    'hint',
    'reason',
    'statusText',
    'cause',
    'data',
  ];

  for (const key of priorityKeys) {
    if (key in record && record[key] !== undefined && record[key] !== null) {
      const candidate = extractFromUnknown(record[key], depth + 1, seen);
      if (candidate) {
        return candidate;
      }
    }
  }

  // Last-ditch scan over remaining enumerable own keys
  for (const key of Object.keys(record)) {
    if (priorityKeys.includes(key) || key === 'stack' || key === 'code') {
      continue;
    }
    const candidate = extractFromUnknown(record[key], depth + 1, seen);
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

/**
 * Safely converts any thrown error, Error instance, DOMException, Supabase error,
 * Vercel error payload ({ error: { code, message } }), string, or unknown value
 * into a clean, readable string. Never returns "[object Object]".
 */
export function normalizeError(
  error: unknown,
  fallbackMessage = DEFAULT_UNKNOWN_ERROR_MESSAGE
): string {
  const safeFallback =
    typeof fallbackMessage === 'string' && !isUnreadableErrorText(fallbackMessage)
      ? fallbackMessage.trim()
      : DEFAULT_UNKNOWN_ERROR_MESSAGE;

  const extracted = extractFromUnknown(error, 0, new WeakSet<object>());
  if (!extracted || isUnreadableErrorText(extracted)) {
    return safeFallback;
  }
  return extracted;
}

/**
 * Extracts a clean, user-friendly error message from an API HTTP JSON payload
 * (including nested Vercel gateway errors like { error: { code: "500", message: "..." } }).
 */
export function normalizeApiErrorPayload(
  payload: unknown,
  statusCode?: number,
  fallbackMessage = "I'm having trouble generating a response. Please try again."
): string {
  const extracted = extractFromUnknown(payload, 0, new WeakSet<object>());

  if (extracted && !isUnreadableErrorText(extracted)) {
    // Clarify generic Vercel gateway 500 text while preserving informative server errors
    if (/^a server error has occurred$/i.test(extracted)) {
      return statusCode && statusCode >= 500
        ? `Server temporarily unavailable (${statusCode}). Please try again.`
        : fallbackMessage;
    }
    return extracted;
  }

  if (statusCode === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  if (statusCode === 429) {
    return 'Too many requests right now. Please wait a moment and try again.';
  }
  if (statusCode && statusCode >= 500) {
    return `Server error (${statusCode}). Please try again in a moment.`;
  }

  return normalizeError(null, fallbackMessage);
}
