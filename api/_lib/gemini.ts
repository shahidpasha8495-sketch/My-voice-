import { GoogleGenAI } from '@google/genai';
import type { InputMode, Message, SupportedLanguage } from '../../src/types';
import { CONTEXT_WINDOW_LIMIT } from '../../src/utils/validation';
import { ApiError } from './http';

export const DEFAULT_GEMINI_MODEL = 'gemini-4-hydrogen';

const DEPRECATED_MODEL_PREFIXES = [
  'gemini-1.5',
  'gemini-2.0',
  'gemini-2.5',
];

// Reuse a singleton GoogleGenAI client per API key to avoid cold-init overhead on every turn
let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

function getGeminiClient(apiKey: string): GoogleGenAI {
  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenAI({ apiKey });
    cachedApiKey = apiKey;
  }
  return cachedClient;
}

/**
 * Resolves the Gemini model from GEMINI_MODEL env var.
 * Replaces deprecated models (1.5, 2.0, 2.5) with gemini-4-hydrogen.
 */
export function resolveGeminiModel(configuredModel?: string): string {
  const raw = (configuredModel || process.env.GEMINI_MODEL || '').trim();
  if (!raw) {
    return DEFAULT_GEMINI_MODEL;
  }

  const lower = raw.toLowerCase();
  if (DEPRECATED_MODEL_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return DEFAULT_GEMINI_MODEL;
  }

  return raw;
}

export const BASE_SYSTEM_INSTRUCTION =
  "You are MyVoice, a friendly, fast, intelligent and multilingual conversational AI companion. Understand the user's exact intent and provide highly relevant, accurate, practical and natural answers. Start directly with the answer—never use robotic filler intros like 'Sure, I can help with that' or 'As an AI'. Support English, Hindi and Kannada fluently. Respond in the language used by the user or their selected preference. Maintain relevant context within the current conversation. Keep responses warm, clear and concise unless the user asks for a detailed breakdown. Never claim to perform actions you have not performed.";

const COMPANION_PERSONA_MAP: Record<string, string> = {
  mellow:
    'Active Companion Persona — Mellow (Mindful Companion): Speak with a calm, cozy, patient, and soothing presence that makes complex topics feel effortless and stress-free.',
  geni:
    'Active Companion Persona — Geni (Spark Innovator): Speak with bright, curious, sharp analytical clarity, offering clever insights and practical solutions.',
  cloudy:
    'Active Companion Persona — Cloudy (Dreamy Philosopher): Speak with serene, thoughtful, and articulate wisdom, bringing calm clarity and depth to the user’s question.',
  bunny:
    'Active Companion Persona — Bunny (Joyful Cheerleader): Speak with warm, upbeat, encouraging, and supportive energy that motivates the user while answering accurately.',
  hearty:
    'Active Companion Persona — Hearty (Creative Muse): Speak with expressive, imaginative warmth and fresh creative angles while staying directly relevant to the user’s goal.',
};

export interface BuildSystemInstructionOptions {
  characterId?: string;
  inputMode?: InputMode;
}

export function buildSystemInstruction(
  targetLanguage: SupportedLanguage,
  options: BuildSystemInstructionOptions = {}
): string {
  const languageDirectiveMap: Record<SupportedLanguage, string> = {
    'en-US':
      'The user is communicating in or prefers English (en-US). Respond naturally in clear, human-sounding English unless the user explicitly asks for Hindi or Kannada in their message.',
    'hi-IN':
      'उपयोगकर्ता ने हिंदी (hi-IN) भाषा चुनी है या हिंदी में संवाद कर रहा है। कृपया स्वाभाविक, बोलचाल की और स्पष्ट हिंदी (देवनागरी लिपि) में सटीक उत्तर दें, जब तक कि उपयोगकर्ता स्पष्ट रूप से किसी अन्य भाषा में उत्तर न मांगे।',
    'kn-IN':
      'ಬಳಕೆದಾರರು ಕನ್ನಡ (kn-IN) ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿದ್ದಾರೆ ಅಥವಾ ಕನ್ನಡದಲ್ಲಿ ಸಂವಹನ ನಡೆಸುತ್ತಿದ್ದಾರೆ. ಬಳಕೆದಾರರು ಬೇರೆ ಭಾಷೆಯಲ್ಲಿ ಕೇಳದ ಹೊರತು ದಯವಿಟ್ಟು ಸಹಜ, ಸ್ಪಷ್ಟ ಮತ್ತು ನೇರವಾದ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ.',
  };

  const personaKey = (options.characterId || '').toLowerCase();
  const personaDirective = COMPANION_PERSONA_MAP[personaKey] || COMPANION_PERSONA_MAP.mellow;

  const modeDirective =
    options.inputMode === 'voice'
      ? 'Delivery Mode — Natural Spoken Voice: The user spoke this message aloud and will hear your response read aloud via voice synthesis. Write in natural, flowing spoken sentences with human conversational rhythm (2 to 4 crisp sentences for simple questions, or clear spoken steps). Avoid raw markdown clutter, tables, or long symbol lists unless specifically asked for code.'
      : 'Delivery Mode — Interactive Chat: Deliver a highly relevant, immediately useful answer. Use clean formatting, concrete examples, or concise bullet points when they make the answer easier to scan and apply.';

  return `${BASE_SYSTEM_INSTRUCTION}\n\n${personaDirective}\n\n${modeDirective}\n\nLanguage Guidance: ${languageDirectiveMap[targetLanguage]}`;
}

export interface InteractionStepInput {
  type: 'user_input' | 'model_output';
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

/**
 * Constructs the Gemini Interactions API steps array from recent conversation history
 * (up to CONTEXT_WINDOW_LIMIT = 20 messages) plus the new user message.
 */
export function buildConversationSteps(
  historyMessages: Pick<Message, 'role' | 'content'>[],
  currentMessage: string,
  maxWindow = CONTEXT_WINDOW_LIMIT
): InteractionStepInput[] {
  const recentHistory = historyMessages.slice(-maxWindow);
  const steps: InteractionStepInput[] = [];

  for (const msg of recentHistory) {
    const trimmed = msg.content?.trim();
    if (!trimmed) continue;

    steps.push({
      type: msg.role === 'assistant' ? 'model_output' : 'user_input',
      content: [{ type: 'text', text: trimmed }],
    });
  }

  // Ensure the current message is the final user_input step
  const trimmedCurrent = currentMessage.trim();
  const lastStep = steps[steps.length - 1];
  const alreadyEndsWithCurrent =
    lastStep &&
    lastStep.type === 'user_input' &&
    lastStep.content[0]?.text === trimmedCurrent;

  if (!alreadyEndsWithCurrent) {
    steps.push({
      type: 'user_input',
      content: [{ type: 'text', text: trimmedCurrent }],
    });
  }

  return steps;
}

export interface GenerateGeminiReplyParams {
  historyMessages: Pick<Message, 'role' | 'content'>[];
  currentMessage: string;
  language: SupportedLanguage;
  characterId?: string;
  inputMode?: InputMode;
  timeoutMs?: number;
}

export async function generateGeminiReply({
  historyMessages,
  currentMessage,
  language,
  characterId,
  inputMode,
  timeoutMs = 25_000,
}: GenerateGeminiReplyParams): Promise<string> {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw new ApiError(
      503,
      'AI response could not be generated because the server Gemini API key is not configured.',
      'GEMINI_NOT_CONFIGURED'
    );
  }

  const model = resolveGeminiModel(process.env.GEMINI_MODEL);
  const systemInstruction = buildSystemInstruction(language, {
    characterId,
    inputMode,
  });
  const steps = buildConversationSteps(historyMessages, currentMessage, CONTEXT_WINDOW_LIMIT);

  const client = getGeminiClient(apiKey);

  // Use low thinking level for ultra-fast interactive voice/chat turnaround
  // ('minimal' is supported on flash-lite models; 'low' is the fastest level on gemini-4-* models)
  const thinkingLevel = model.includes('flash-lite') ? 'minimal' : 'low';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const interaction = await client.interactions.create(
      {
        model,
        system_instruction: systemInstruction,
        input: steps,
        generation_config: {
          thinking_level: thinkingLevel,
        },
        store: false,
      },
      {
        signal: controller.signal,
      }
    );

    if (interaction.status === 'failed' || interaction.status === 'cancelled') {
      throw new ApiError(
        502,
        'AI response could not be generated. Please try again.',
        'GEMINI_GENERATION_FAILED'
      );
    }

    let outputText = interaction.output_text?.trim() ?? '';

    if (!outputText && Array.isArray(interaction.steps)) {
      const textParts: string[] = [];
      for (const step of interaction.steps) {
        if (step.type === 'model_output' && Array.isArray(step.content)) {
          for (const item of step.content) {
            if (item.type === 'text' && typeof item.text === 'string') {
              textParts.push(item.text);
            }
          }
        }
      }
      outputText = textParts.join('\n').trim();
    }

    if (!outputText) {
      throw new ApiError(
        502,
        'AI response could not be generated. Please try rephrasing your message.',
        'EMPTY_AI_RESPONSE'
      );
    }

    return outputText;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }

    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorName = err instanceof Error ? err.name : '';

    if (errorName === 'AbortError' || /abort|timed?\s*out/i.test(errorMessage)) {
      throw new ApiError(
        504,
        'The AI request timed out. Please try again.',
        'GEMINI_TIMEOUT'
      );
    }

    if (/401|403|api[_\s-]?key|permission|unauthenticated/i.test(errorMessage)) {
      throw new ApiError(
        502,
        'AI service authentication failed. Please check the server configuration.',
        'GEMINI_AUTH_ERROR'
      );
    }

    if (/429|quota|rate[_\s-]?limit|resource[_\s-]?exhausted/i.test(errorMessage)) {
      throw new ApiError(
        429,
        'AI rate limit reached. Please wait a moment and try again.',
        'GEMINI_RATE_LIMIT'
      );
    }

    if (/404|not\s*found|model.*unavailable|503|overloaded/i.test(errorMessage)) {
      throw new ApiError(
        503,
        'The AI model is temporarily unavailable. Please try again shortly.',
        'GEMINI_MODEL_UNAVAILABLE'
      );
    }

    if (/fetch|network|econnrefused|enotfound/i.test(errorMessage)) {
      throw new ApiError(
        503,
        'Unable to connect. Please try again.',
        'GEMINI_NETWORK_ERROR'
      );
    }

    throw new ApiError(
      502,
      'AI response could not be generated. Please try again.',
      'GEMINI_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
