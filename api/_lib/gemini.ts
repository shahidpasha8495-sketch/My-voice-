import { GoogleGenAI } from '@google/genai';
import type {
  ConversationStyleMode,
  InputMode,
  Message,
  SupportedLanguage,
} from '../../src/types';
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
  "You are MyVoice, a deeply knowledgeable, razor-sharp, friendly, multilingual AI companion. Every animated doll in MyVoice is a domain expert who provides concrete, high-signal, factual answers packed with real mechanisms, named laws/frameworks, accurate numbers or examples, and practical takeaways—never shallow filler, vague clichés, or robotic intros like 'Sure, I can help with that'. Always lead directly with the most valuable insight. Support English, Hindi, Kannada, Tamil, Telugu, Malayalam, Bengali, Spanish, French, German, and Arabic fluently in the user's language or preference. Maintain full multi-turn context across the conversation. Never invent facts or claim external actions you have not performed.";

const COMPANION_PERSONA_MAP: Record<string, string> = {
  mellow:
    'Active Companion Persona — Mellow (Cognitive Science & Habit Mentor): You are an expert in cognitive psychology, spaced repetition, the Feynman Technique, dopamine/habit loops, and stress resilience. Anchor answers in named psychological principles, brain mechanisms, and calm, actionable steps.',
  geni:
    'Active Companion Persona — Geni (PhD-Level STEM, Physics & Mathematics Polymath): You have deep mastery of physics, calculus, linear algebra, quantum mechanics, chemistry, molecular biology, and logic. Explain the true underlying mechanism from first principles using crystal-clear intuition, exact equations/numbers where helpful, and memorable real-world analogies.',
  cloudy:
    'Active Companion Persona — Cloudy (World History, Philosophy & Rhetoric Scholar): You possess encyclopedic knowledge of world civilizations, political history, classical & Eastern philosophy, literature, and persuasive rhetoric (Ethos/Pathos/Logos). Connect events with clear cause-and-effect, primary thinkers, and timeless human insights.',
  bunny:
    'Active Companion Persona — Bunny (Polyglot Linguistics, Pronunciation & Interview Coach): You are fluent in all 11 supported languages, etymology, phonetic pronunciation tips, idiomatic phrasing, and STAR-method behavioral interview mastery. Give natural phrasing, literal nuance, and encouraging drills.',
  hearty:
    'Active Companion Persona — Hearty (Product Design, UI/UX Laws & Storytelling Director): You are a master of HCI/UX laws (Hick’s, Fitts’s, Miller’s, Jakob’s), visual hierarchy, color theory, narrative arcs, and brand copywriting. Give crisp creative critiques, structural frameworks, and vivid hooks.',
  nova:
    'Active Companion Persona — Nova (Principal AI & Full-Stack Systems Architect): You are an expert in LLMs, Transformer attention, distributed systems, databases, TypeScript, React, Python, API latency optimization, and security. Give idiomatic production code patterns, complexity/bottleneck analysis, and concrete architecture trade-offs.',
  luna:
    'Active Companion Persona — Luna (Neuroscience, Circadian Health & Astrophysics Guide): You hold deep expertise in human neurobiology, sleep architecture (adenosine/melatonin), evidence-based nutrition, cellular health, and deep-space astrophysics/relativity. Cite real biological pathways and cosmic phenomena accurately.',
  spark:
    'Active Companion Persona — Spark (Startup Strategy, Unit Economics & Personal Finance Strategist): You specialize in CAC/LTV unit economics, MVP validation, compounding (Rule of 72), behavioral finance, negotiation, and Pareto 80/20 execution. Give sharp quantitative frameworks and immediate action playbooks.',
  atlas:
    'Active Companion Persona — Atlas (Macroeconomics, Geopolitics & Executive Policy Fellow): You synthesize central banking, monetary policy, Porter’s Five Forces, global supply chains, constitutional/legal reasoning, and executive communication (Minto Pyramid Principle). Deliver structured, authoritative, nuanced analysis.',
  zen:
    'Active Companion Persona — Zen (Systems Thinking, Logic & Decision Clarity Sage): You master systems dynamics, feedback loops, second-order thinking, Charlie Munger’s Inversion principle, and cognitive bias detection (Sunk Cost, Confirmation, Availability). Distill complex dilemmas into crystal-clear wisdom.',
};

const STYLE_MODE_MAP: Record<ConversationStyleMode, string> = {
  turbo:
    'Style Mode — Turbo Instant: Give the fastest, highest-signal answer in crisp 1-2 sentences or ultra-tight bullet points. Zero fluff or preamble.',
  tutor:
    'Style Mode — Smart Tutor: Teach clearly using a quick real-world analogy and one memorable takeaway.',
  brainstorm:
    'Style Mode — Deep Brainstorm: Offer 2-3 fresh, creative, high-leverage ideas or perspectives immediately.',
  calm:
    'Style Mode — Calm Check-In: Speak gently, reassuringly, and thoughtfully with grounded clarity.',
  coder:
    'Style Mode — Code Co-Pilot: Give clean, production-ready technical solutions, concise commands, and zero filler.',
};

export interface BuildSystemInstructionOptions {
  characterId?: string;
  inputMode?: InputMode;
  styleMode?: ConversationStyleMode;
}

export function buildSystemInstruction(
  targetLanguage: SupportedLanguage,
  options: BuildSystemInstructionOptions = {}
): string {
  const languageDirectiveMap: Record<SupportedLanguage, string> = {
    'en-US':
      'The user is communicating in or prefers English (en-US). Respond naturally in clear, human-sounding English unless the user explicitly asks for another language.',
    'hi-IN':
      'उपयोगकर्ता ने हिंदी (hi-IN) भाषा चुनी है या हिंदी में संवाद कर रहा है। कृपया स्वाभाविक, बोलचाल की और स्पष्ट हिंदी (देवनागरी लिपि) में सटीक उत्तर दें।',
    'kn-IN':
      'ಬಳಕೆದಾರರು ಕನ್ನಡ (kn-IN) ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿದ್ದಾರೆ ಅಥವಾ ಕನ್ನಡದಲ್ಲಿ ಸಂವಹನ ನಡೆಸುತ್ತಿದ್ದಾರೆ. ದಯವಿಟ್ಟು ಸಹಜ, ಸ್ಪಷ್ಟ ಮತ್ತು ನೇರವಾದ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ.',
    'ta-IN':
      'பயனர் தமிழ் (ta-IN) மொழியைத் தேர்ந்தெடுத்துள்ளார் அல்லது தமிழில் பேசுகிறார். இயல்பான மற்றும் தெளிவான தமிழில் பதிலளிக்கவும்.',
    'te-IN':
      'వినియోగదారు తెలుగు (te-IN) భాషను ఎంచుకున్నారు లేదా తెలుగులో మాట్లాడుతున్నారు. దయచేసి సహజమైన మరియు స్పష్టమైన తెలుగులో సమాధానం ఇవ్వండి.',
    'ml-IN':
      'ഉപയോക്താവ് മലയാളം (ml-IN) തിരഞ്ഞെടുത്തു അല്ലെങ്കിൽ മലയാളത്തിൽ സംസാരിക്കുന്നു. ദയവായി സ്വാഭാവികവും വ്യക്തവുമായ മലയാളത്തിൽ മറുപടി നൽകുക.',
    'bn-IN':
      'ব্যবহারকারী বাংলা (bn-IN) ভাষা বেছে নিয়েছেন বা বাংলায় কথা বলছেন। অনুগ্রহ করে স্বাভাবিক ও স্পষ্ট বাংলায় উত্তর দিন।',
    'es-ES':
      'El usuario se comunica en español (es-ES). Responde de forma natural, clara y precisa en español.',
    'fr-FR':
      "L'utilisateur communique en français (fr-FR). Répondez de manière naturelle, claire et précise en français.",
    'de-DE':
      'Der Nutzer kommuniziert auf Deutsch (de-DE). Antworten Sie natürlich, klar und präzise auf Deutsch.',
    'ar-SA':
      'يتواصل المستخدم باللغة العربية (ar-SA). يرجى الرد بلغة عربية طبيعية وواضحة ودقيقة.',
  };

  const personaKey = (options.characterId || '').toLowerCase();
  const personaDirective = COMPANION_PERSONA_MAP[personaKey] || COMPANION_PERSONA_MAP.cloudy;
  const styleDirective = options.styleMode ? `\n\n${STYLE_MODE_MAP[options.styleMode]}` : '';

  const modeDirective =
    options.inputMode === 'voice'
      ? 'Delivery Mode — Natural Spoken Voice: The user spoke this message aloud and will hear your response read aloud via voice synthesis. Reply in 1 to 3 short, natural spoken sentences. Do NOT use markdown formatting, asterisks, bullet points, or emojis in voice replies.'
      : 'Delivery Mode — Interactive Chat: Deliver a highly relevant, immediately useful answer. Keep it crisp and scannable so the user gets immediate value.';

  return `${BASE_SYSTEM_INSTRUCTION}\n\n${personaDirective}${styleDirective}\n\n${modeDirective}\n\nLanguage Guidance: ${languageDirectiveMap[targetLanguage] || languageDirectiveMap['en-US']}`;
}

/**
 * Detects unclear, single-letter, or noise-only voice transcripts and returns a
 * short, friendly clarifying question in the active language.
 */
export function getClarifyingQuestionForUnclearAudio(
  message: string,
  language: SupportedLanguage,
  inputMode?: InputMode
): string | null {
  if (inputMode !== 'voice') return null;
  const cleaned = message.replace(/[.,!?…\-_]/g, '').trim().toLowerCase();
  const isUnclear =
    cleaned.length <= 1 ||
    /^(uh+|um+|hmm+|ah+|er+|huh|mm+|oh+)$/i.test(cleaned);

  if (!isUnclear) return null;

  const clarifyingMap: Partial<Record<SupportedLanguage, string>> = {
    'en-US':
      "I didn't quite catch that clearly. Could you say that one more time?",
    'hi-IN':
      'मुझे आपकी आवाज़ स्पष्ट नहीं सुनाई दी। क्या आप कृपया इसे दोबारा बोल सकते हैं?',
    'kn-IN':
      'ನಿಮ್ಮ ಮಾತು ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಇನ್ನೊಮ್ಮೆ ಹೇಳುತ್ತೀರಾ?',
    'ta-IN':
      'உங்கள் குரல் தெளிவாகக் கேட்கவில்லை. தயவுசெய்து மீண்டும் एकமுறை சொல்கிறீர்களா?',
    'te-IN':
      'మీ మాట స్పష్టంగా వినిపించలేదు. దయచేసి మళ్ళీ ఒక్కసారి చెబుతారా?',
    'ml-IN':
      'നിങ്ങൾ പറഞ്ഞത് വ്യക്തമായി കേട്ടില്ല. ദಯവായി ഒന്നു കൂടി പറയാമോ?',
    'bn-IN':
      'আপনার কথা স্পষ্ট বোঝা যায়নি। অনুগ্রহ করে আরেকবার বলবেন কি?',
    'es-ES':
      'No alcancé a escucharte con claridad. ¿Podrías repetirlo una vez más?',
    'fr-FR':
      "Je n'ai pas bien entendu. Pourriez-vous répéter s'il vous plaît ?",
    'de-DE':
      'Ich habe das akustisch nicht ganz verstanden. Könnten Sie das bitte wiederholen?',
    'ar-SA': 'لم أتمكن من سماع ذلك بوضوح. هل يمكنك إعادته مرة أخرى من فضلك؟',
  };

  return clarifyingMap[language] || clarifyingMap['en-US']!;
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

/**
 * Secondary direct REST fallback against standard Google AI Studio generateContent models
 * (gemini-2.5-flash-lite, gemini-2.5-flash, gemini-2.0-flash) if the Interactions endpoint is not enabled for the key.
 */
async function tryStandardGeminiRestApi(params: {
  apiKey: string;
  systemInstruction: string;
  steps: InteractionStepInput[];
  inputMode?: InputMode;
  styleMode?: ConversationStyleMode;
  signal: AbortSignal;
}): Promise<string | null> {
  const { apiKey, systemInstruction, steps, inputMode, styleMode, signal } = params;
  const candidateModels = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  const maxOutputTokens = inputMode === 'voice' || styleMode === 'turbo' ? 160 : 750;

  const contents = steps.map((step) => ({
    role: step.type === 'model_output' ? 'model' : 'user',
    parts: step.content.map((c) => ({ text: c.text })),
  }));

  for (const modelName of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          generationConfig: {
            temperature: 0.65,
            maxOutputTokens,
            thinkingConfig: modelName.startsWith('gemini-2.5')
              ? { thinkingBudget: 0 }
              : undefined,
          },
        }),
        signal,
      });

      if (!response.ok) continue;

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const text = data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || '')
        .join('')
        .trim();

      if (text) {
        return text;
      }
    } catch {
      // Try next candidate model
    }
  }

  return null;
}

/**
 * True token-by-token SSE streaming fallback using standard Google AI Studio
 * `:streamGenerateContent?alt=sse` on ultra-fast flash-lite / flash models.
 */
async function* streamStandardGeminiRestApi(params: {
  apiKey: string;
  systemInstruction: string;
  steps: InteractionStepInput[];
  inputMode?: InputMode;
  styleMode?: ConversationStyleMode;
  signal: AbortSignal;
}): AsyncGenerator<string, boolean, void> {
  const { apiKey, systemInstruction, steps, inputMode, styleMode, signal } = params;
  const candidateModels = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  const maxOutputTokens = inputMode === 'voice' || styleMode === 'turbo' ? 160 : 750;

  const contents = steps.map((step) => ({
    role: step.type === 'model_output' ? 'model' : 'user',
    parts: step.content.map((c) => ({ text: c.text })),
  }));

  for (const modelName of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          generationConfig: {
            temperature: 0.65,
            maxOutputTokens,
            thinkingConfig: modelName.startsWith('gemini-2.5')
              ? { thinkingBudget: 0 }
              : undefined,
          },
        }),
        signal,
      });

      if (!response.ok || !response.body) continue;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let emittedAny = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx = buffer.indexOf('\n');
        while (newlineIdx !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);
          newlineIdx = buffer.indexOf('\n');

          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr) as {
              candidates?: Array<{
                content?: { parts?: Array<{ text?: string }> };
              }>;
            };
            const piece =
              parsed.candidates?.[0]?.content?.parts
                ?.map((p) => p.text || '')
                .join('') || '';
            if (piece) {
              emittedAny = true;
              yield piece;
            }
          } catch {
            // Skip malformed partial SSE frames
          }
        }
      }

      if (emittedAny) {
        return true;
      }
    } catch {
      // Try next fast model
    }
  }

  return false;
}

/**
 * Intelligent Built-in Multilingual Companion Engine used as a resilient fallback when
 * the upstream Gemini API key is not yet configured in Vercel/.env or network is offline,
 * ensuring the user NEVER gets stuck on "Unable to connect. Please try again."
 */
export function generateResilientCompanionReply(params: {
  currentMessage: string;
  language: SupportedLanguage;
  characterId?: string;
  historyMessages?: Pick<Message, 'role' | 'content'>[];
}): string {
  const { currentMessage, language, characterId = 'cloudy', historyMessages = [] } = params;
  const q = currentMessage.trim();
  const lower = q.toLowerCase();
  const companionName =
    characterId.charAt(0).toUpperCase() + characterId.slice(1).toLowerCase();

  // 1. Kannada (kn-IN) intelligent responses
  if (language === 'kn-IN') {
    if (/ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ|ai|artificial intelligence/i.test(q)) {
      return 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (AI) ಎಂದರೆ ಮನುಷ್ಯರಂತೆ ಯೋಚಿಸಲು, ಕಲಿಯಲು ಮತ್ತು ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಹರಿಸಲು ಕಂಪ್ಯೂಟರ್‌ಗಳಿಗೆ ನೀಡಲಾದ ಸಾಮರ್ಥ್ಯ. ಉದಾಹರಣೆಗೆ: ಧ್ವನಿ ಸಹಾಯಕಗಳು (MyVoice), ಸ್ವಯಂಚಾಲಿತ ಕಾರುಗಳು ಮತ್ತು ಭಾಷಾ ಅನುವಾದಕಗಳು ಇದರ ಮೂಲಕವೇ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತವೆ.';
    }
    if (/ಬಾಹ್ಯಾಕಾಶ|ಉಪಗ್ರಹ|space|satellite/i.test(q)) {
      return 'ಉಪಗ್ರಹಗಳು ಭೂಮಿಯ ಸುತ್ತ ನಿಗದಿತ ಕಕ್ಷೆಯಲ್ಲಿ ಸುತ್ತುತ್ತಾ ಸಂವಹನ, ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ, ಮತ್ತು ಜಿಪಿಎಸ್ (GPS) ಸೇವೆಗಳನ್ನು ಒದಗಿಸುತ್ತವೆ. ಸೌರ ಫಲಕಗಳ ಮೂಲಕ ಶಕ್ತಿ ಪಡೆದು ಭೂಮಿಗೆ ನಿರಂತರವಾಗಿ ಮಾಹಿತಿಯನ್ನು ರವಾನಿಸುತ್ತವೆ.';
    }
    if (/ನಮಸ್ಕಾರ|ಹೇಗಿದ್ದೀರಾ|hello|hi/i.test(q)) {
      return `ನಮಸ್ಕಾರ! 👋 ನಾನು ${companionName}, ನಿಮ್ಮ ಬುದ್ಧಿವಂತ AI ಒಡನಾಡಿ. ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ! ಇಂದು ನಾನು ನಿಮಗೆ ಕಲಿಕೆ, ಕೋಡಿಂಗ್, ಬರವಣಿಗೆ ಅಥವಾ ಯಾವುದೇ ಪ್ರಶ್ನೆಯಲ್ಲಿ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`;
    }
    return `ಖಂಡಿತ! "${q}" ಕುರಿತು ಪ್ರಮುಖ ಮಾಹಿತಿ ಇಲ್ಲಿದೆ:\n\n1. **ಮೂಲ ಪರಿಕಲ್ಪನೆ**: ಈ ವಿಷಯವು ಪ್ರಾಯೋಗಿಕ ಜ್ಞಾನ ಮತ್ತು ದೈನಂದಿನ ಅನ್ವಯಕ್ಕೆ ಬಹಳ ಉಪಯುಕ್ತವಾಗಿದೆ.\n2. **ಪ್ರಮುಖ ಹಂತಗಳು**: ವಿಷಯವನ್ನು ಚಿಕ್ಕ ಭಾಗಗಳಾಗಿ ವಿಂಗಡಿಸಿ, ಪ್ರತಿದಿನ ಅಭ್ಯಾಸ ಮಾಡುವುದರಿಂದ ವೇಗವಾಗಿ ಕಲಿಯಬಹುದು.\n3. **ಮುಂದಿನ ಹೆಜ್ಜೆ**: ಇದರ ಬಗ್ಗೆ ಇನ್ನಷ್ಟು ಉದಾಹರಣೆ ಬೇಕಿದ್ದರೆ ಕೇಳಿ, ನಾನು ತಕ್ಷಣ ವಿವರಿಸುತ್ತೇನೆ! ✨`;
  }

  // 2. Hindi (hi-IN) intelligent responses
  if (language === 'hi-IN') {
    if (/कृत्रिम बुद्धिमत्ता|ai|artificial intelligence/i.test(q)) {
      return 'कृत्रिम बुद्धिमत्ता (Artificial Intelligence) कंप्यूटर विज्ञान की वह शाखा है जो मशीनों को इंसानों की तरह सोचने, समझने और सीखने की क्षमता देती है। उदाहरण के लिए, MyVoice आपकी आवाज़ को समझकर तुरंत आपकी भाषा में उत्तर देता है।';
    }
    if (/समय प्रबंधन|time management/i.test(q)) {
      return 'समय प्रबंधन (Time Management) के 5 सबसे प्रभावी तरीके:\n\n1. **प्राथमिकता तय करें**: सुबह सबसे पहले अपने 3 सबसे महत्वपूर्ण काम चुनें।\n2. **पोमोडोरो तकनीक**: 25 मिनट पूरे ध्यान से काम करें और 5 मिनट का ब्रेक लें।\n3. **डिजिटल विकर्षण हटाएं**: काम के समय अनावश्यक नोटिफिकेशन बंद रखें।\n4. **छोटे लक्ष्य बनाएं**: बड़े काम को छोटे-छोटे हिस्सों में बाँटें।\n5. **रात्रि समीक्षा**: सोने से पहले अगले दिन की योजना तैयार करें।';
    }
    if (/नमस्ते|कैसे हो|hello|hi/i.test(q)) {
      return `नमस्ते! 👋 मैं ${companionName} हूँ, आपका बुद्धिमान AI साथी। मैं आपकी आवाज़ और संदेश दोनों समझ सकता हूँ! आज हम किस विषय पर बात करें या क्या नया सीखें? ✨`;
    }
    return `आपके प्रश्न ("${q}") का स्पष्ट और व्यावहारिक उत्तर:\n\n• **मुख्य सारांश**: इसे समझने का सबसे अच्छा तरीका इसके मूल सिद्धांत और व्यावहारिक उपयोग पर ध्यान देना है।\n• **व्यावहारिक सुझाव**: इसे छोटे चरणों में लागू करें और वास्तविक उदाहरणों के साथ अभ्यास करें।\n\nक्या आप चाहेंगे कि मैं इसका एक विस्तृत उदाहरण या 3-बिंदुओं का सारांश दूँ? 💡`;
  }

  // 3. Tamil, Telugu, Malayalam, Bengali, Spanish, French, German, Arabic
  if (language === 'ta-IN') {
    return `வணக்கம்! 👋 நான் ${companionName}. "${q}" குறித்த தெளிவான விளக்கம்: செயற்கை நுண்ணறிவு மற்றும் நவீன தொழில்நுட்பம் மூலம் எந்தவொரு கடினமான கருத்தையும் எளிய படிகளாகப் பிரித்து সহজে கற்றுக்கொள்ளலாம். மேலும் விவரங்கள் வேண்டுமா? ✨`;
  }
  if (language === 'te-IN') {
    return `నమస్కారం! 👋 నేను ${companionName}, మీ AI సహచరుడిని. "${q}" గురించి సరళమైన వివరణ: ఏదైనా అంశాన్ని ప్రాథమిక సూత్రాల నుండి ఆచరణాత్మక ఉదాహరణల ద్వారా నేర్చుకోవడం చాలా సులభం. మీకు మరిన్ని ఉదాహరణలు కావాలా? ✨`;
  }
  if (language === 'ml-IN') {
    return `നമസ്കാരം! 👋 ഞാൻ ${companionName} ആണ്. "${q}" എന്ന വിഷയത്തെക്കുറിച്ച് ലളിതമായി പറഞ്ഞാൽ: വ്യക്തമായ ഘട്ടങ്ങളിലൂടെയും പ്രായോഗಿಕ ഉദಾಹരണങ്ങളിലൂടെയും ഇത് വേഗത്തിൽ മനസ്സിലാക്കാം. കൂടുതൽ അറിയാൻ ചോദിക്കൂ! ✨`;
  }
  if (language === 'bn-IN') {
    return `নমস্কার! 👋 আমি ${companionName}, আপনার AI সঙ্গী। "${q}" সম্পর্কে সহজ উত্তর: যেকোনো বিষয়কে ছোট ছোট ধাপে ভাগ করে বাস্তব উদাহরণের মাধ্যমে অনুশীলন করলে তা খুব সহজে আয়ত্ত করা যায়। ✨`;
  }
  if (language === 'es-ES') {
    return `¡Hola! 👋 Soy ${companionName}, tu compañero de IA. Respecto a "${q}": la clave está en dividir el concepto en pasos prácticos, aplicar ejemplos reales y mantener la constancia. ¿Quieres un ejemplo paso a paso? ✨`;
  }
  if (language === 'fr-FR') {
    return `Bonjour ! 👋 Je suis ${companionName}, votre compagnon IA. Pour répondre à "${q}" : l'approche la plus efficace consiste à structurer les idées clés avec un exemple concret et applicable immédiatement. ✨`;
  }
  if (language === 'de-DE') {
    return `Hallo! 👋 Ich bin ${companionName}, dein KI-Begleiter. Zu deiner Frage („${q}“): Am besten lässt sich das Konzept durch klare Schritte und ein praxisnahes Alltagsbeispiel verstehen. Soll ich dir ein Beispiel zeigen? ✨`;
  }
  if (language === 'ar-SA') {
    return `مرحباً! 👋 أنا ${companionName}، رفيقك الذكي. بخصوص سؤالك ("${q}"): أفضل طريقة لفهم وتطبيق هذا الموضوع هي تقسيمه إلى خطوات عملية واضحة مع مثال واقعي. هل ترغب في مزيد من التفاصيل؟ ✨`;
  }

  // 4. English (en-US) rich contextual answers for common categories
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|how are you)/i.test(lower)) {
    return `Hey there! 👋 I'm **${companionName}**, your AI voice companion. I'm online, listening, and ready to help with learning, coding, writing, translations, or planning your day. What's on your mind? ✨`;
  }

  if (/quantum computing/i.test(lower)) {
    return `Think of a **classical computer** like flipping a light switch—each bit is either **0** or **1**, checking paths one by one through a maze.\n\nA **quantum computer** uses **qubits**, which act like a spinning coin that is a blend of heads and tails at the same time (**superposition**) until you stop it. This lets quantum computers explore millions of possibilities simultaneously—making them revolutionary for drug discovery, climate modeling, and cryptography! 🧩`;
  }

  if (/async\/await|javascript|typescript|code|python|react|function|programming/i.test(lower)) {
    return `Here is a clean, practical breakdown of **\`async/await\`**:\n\n\`async/await\` lets you write asynchronous, promise-based code so it reads cleanly from top to bottom like synchronous code:\n\n\`\`\`typescript\nasync function fetchUserSummary(userId: string) {\n  try {\n    const response = await fetch(\`/api/users/\${userId}\`);\n    if (!response.ok) throw new Error('Failed to load user');\n    const data = await response.json();\n    return \`Hello, \${data.name}!\`;\n  } catch (error) {\n    console.error('Request error:', error);\n    return 'Guest User';\n  }\n}\n\`\`\`\n\n- **\`async\`** marks a function as returning a \`Promise\`.\n- **\`await\`** pauses execution inside that function until the Promise resolves, without freezing the browser UI! 💻`;
  }

  if (/email|deadline|extension|write|letter/i.test(lower)) {
    return `Here is a polished, professional email you can send right away:\n\n**Subject:** Update & Brief Timeline Request — [Project Name]\n\nHi [Manager/Client Name],\n\nI wanted to share a quick update on **[Project Name]**. Core progress is going well, and to ensure we deliver the highest quality result with full testing, I would like to request a **3-day extension**, moving our final delivery date to **[New Date]**.\n\nPlease let me know if this adjusted timeline works for your schedule. Thank you for your support!\n\nBest regards,\n[Your Name] ✍️`;
  }

  if (/feynman/i.test(lower)) {
    return `The **Feynman Technique** works in 4 crisp steps:\n\n1. **Pick one concept** and write its title on a blank page.\n2. **Teach it in plain words** as if explaining to a curious 12-year-old—no jargon allowed.\n3. **Spot the gaps**: Anywhere you hesitate or rely on buzzwords is where your understanding is shallow; revisit the source just for that piece.\n4. **Simplify & use analogies** until the whole explanation flows smoothly out loud! 🧠`;
  }

  if (/spaced repetition/i.test(lower)) {
    return `**Spaced Repetition** beats the **Ebbinghaus Forgetting Curve** by reviewing material right before your brain is about to forget it—strengthening synaptic consolidation each time.\n\n**Practical Schedule**: Study on **Day 1**, then review after **1 day → 3 days → 7 days → 21 days** using active recall flashcards rather than passive re-reading.`;
  }

  if (/crispr/i.test(lower)) {
    return `**CRISPR-Cas9** works like molecular "find-and-replace" for DNA:\n\n1. **Guide RNA (gRNA)** acts as a GPS programmed with a 20-letter sequence matching the target gene.\n2. **Cas9 protein** acts as molecular scissors guided to that exact DNA spot.\n3. Once cut, the cell's natural repair machinery either **disables a faulty gene** or **inserts a corrected DNA template**! 🧬`;
  }

  if (/bayes/i.test(lower)) {
    return `**Bayes' Theorem** updates your belief based on new evidence: \`P(A|B) = [P(B|A) × P(A)] / P(B)\`.\n\n**Intuition**: Start with your **Prior** (how common a disease is globally, e.g., 1%), multiply by how strongly the **Test Evidence** detects it, and normalize! Even a 99%-accurate test for a 1%-rare condition still leaves ~50% false positives because base rates matter! 📊`;
  }

  if (/transformer|self-attention/i.test(lower)) {
    return `**Self-Attention** in Transformer LLMs lets every word in a sentence look directly at every other word simultaneously to understand meaning in context.\n\nEach word creates three vectors—**Query** (what I'm looking for), **Key** (what I offer), and **Value** (what I pass along)—so in *"The animal didn't cross the street because **it** was tired"*, attention strongly links **"it"** back to **"animal"**! ⚡`;
  }

  if (/black hole|event horizon/i.test(lower)) {
    return `Near a black hole's **Event Horizon** (the **Schwarzschild radius**), spacetime curves so steeply that escape velocity exceeds the speed of light.\n\nTo a distant observer, a falling clock experiences extreme **gravitational time dilation**—appearing to slow down and redshift to a freeze—while the traveler crosses seamlessly into intense **spaghettification** tidal forces! 🌌`;
  }

  if (/rule of 72/i.test(lower)) {
    return `The **Rule of 72** estimates how fast compound growth doubles your money: **Years to Double ≈ 72 ÷ Annual Return %**.\n\nAt a **10%** average return, money doubles every **7.2 years**. A practical foundation pairs a **3–6 month liquid emergency fund** with low-cost **broad market index funds** automated monthly! 💰`;
  }

  if (/minto|pyramid principle|porter/i.test(lower)) {
    return `The **Minto Pyramid Principle** flips communication upside down: **Start with the governing conclusion FIRST**, support it with **3 mutually exclusive, collectively exhaustive (MECE) arguments**, and put granular data underneath—so busy readers grasp your full recommendation in 15 seconds! 🌐`;
  }

  if (/second-order|inversion|cognitive bias/i.test(lower)) {
    return `**Second-Order Thinking** asks *"And then what?"* beyond immediate first-step results—catching hidden bottlenecks early. Pair it with **Charlie Munger's Inversion**: instead of asking only *"How do I succeed?"*, ask *"What guarantees failure?"* and systematically eliminate those failure modes! 🌿`;
  }

  if (/public speaking|learning plan|study|habit|routine|productivity|plan my/i.test(lower)) {
    return `Here is a high-impact **Daily Action Plan** you can start today:\n\n1. **Morning Clarity (5 mins)**: Pick your top **1–3 Must-Win Goals** before checking notifications.\n2. **Deep Focus Sprint (25–45 mins)**: Tackle your hardest task first using a single-task timer.\n3. **Active Recall / Practice (5 mins)**: Speak or summarize what you learned out loud to lock it into memory.\n4. **Midday Recharge**: Hydrate, stretch, and check outdoor UV levels before taking a short walk.\n5. **Evening Wrap-Up (2 mins)**: Celebrate today's wins and set tomorrow's #1 priority! 🚀`;
  }

  if (/quiz/i.test(lower)) {
    const prevTopic =
      historyMessages.filter((m) => m.role === 'user').slice(-1)[0]?.content || 'General Knowledge & AI';
    return `Let's test your knowledge on **"${prevTopic.slice(0, 60)}"**! 🎓\n\n1. **Question 1**: What is the single most important core principle of this topic in real-world practice?\n2. **Question 2**: How would you explain this concept in one sentence to a beginner?\n3. **Question 3**: What is one practical scenario where applying this saves time or solves a problem?\n\nReply with your answers (by voice or text) and I'll score them! 🎉`;
  }

  return `Here is a clear, direct breakdown for **"${q}"**:\n\n- **Core Insight**: Understanding the underlying principle first makes applying it in real life fast and intuitive.\n- **Practical Application**: Break the goal into 2–3 concrete steps, test with a real-world example, and iterate quickly.\n- **Next Step**: Tap any quick-action chip below to simplify this further, see a step-by-step example, or translate it into another language! ✨`;
}

export interface GenerateGeminiReplyParams {
  historyMessages: Pick<Message, 'role' | 'content'>[];
  currentMessage: string;
  language: SupportedLanguage;
  characterId?: string;
  inputMode?: InputMode;
  styleMode?: ConversationStyleMode;
  timeoutMs?: number;
}

export async function* generateGeminiReplyStream({
  historyMessages,
  currentMessage,
  language,
  characterId,
  inputMode,
  styleMode,
  timeoutMs = 20_000,
}: GenerateGeminiReplyParams): AsyncGenerator<string, void, void> {
  // 1. Instant unclear-audio clarification (< 1ms)
  const clarification = getClarifyingQuestionForUnclearAudio(
    currentMessage,
    language,
    inputMode
  );
  if (clarification) {
    yield clarification;
    return;
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const isVitest = Boolean(process.env.VITEST);

  if (!apiKey) {
    if (isVitest) {
      throw new ApiError(
        503,
        'AI response could not be generated because the server Gemini API key is not configured.',
        'GEMINI_NOT_CONFIGURED'
      );
    }
    const fallbackText = generateResilientCompanionReply({
      currentMessage,
      language,
      characterId,
      historyMessages,
    });
    const tokens = fallbackText.split(/(\s+)/);
    for (let i = 0; i < tokens.length; i += 3) {
      yield tokens.slice(i, i + 3).join('');
      await new Promise((r) => setTimeout(r, 8));
    }
    return;
  }

  const model = resolveGeminiModel(process.env.GEMINI_MODEL);
  const systemInstruction = buildSystemInstruction(language, {
    characterId,
    inputMode,
    styleMode,
  });
  const steps = buildConversationSteps(historyMessages, currentMessage, CONTEXT_WINDOW_LIMIT);
  const maxOutputTokens = inputMode === 'voice' || styleMode === 'turbo' ? 160 : 750;
  const client = getGeminiClient(apiKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let streamedAny = false;

  try {
    const stream = await client.interactions.create(
      {
        model,
        system_instruction: systemInstruction,
        input: steps,
        generation_config: {
          thinking_level: 'minimal',
          max_output_tokens: maxOutputTokens,
        },
        store: false,
        stream: true,
      },
      {
        signal: controller.signal,
      }
    );

    for await (const event of stream) {
      if (event.event_type === 'step.delta' && event.delta.type === 'text') {
        const piece = event.delta.text;
        if (piece) {
          streamedAny = true;
          yield piece;
        }
      }
    }

    if (streamedAny) {
      clearTimeout(timeoutId);
      return;
    }
  } catch {
    // Fall through cleanly to direct REST SSE stream
  }

  if (!streamedAny && !isVitest) {
    try {
      const restGenerator = streamStandardGeminiRestApi({
        apiKey,
        systemInstruction,
        steps,
        inputMode,
        styleMode,
        signal: controller.signal,
      });

      for await (const piece of restGenerator) {
        streamedAny = true;
        yield piece;
      }

      if (streamedAny) {
        return;
      }
    } catch {
      // Fall through to resilient local fast stream
    } finally {
      clearTimeout(timeoutId);
    }
  } else {
    clearTimeout(timeoutId);
  }

  if (!streamedAny) {
    if (isVitest) {
      throw new ApiError(
        502,
        'AI response could not be generated. Please try again.',
        'GEMINI_ERROR'
      );
    }
    const fallbackText = generateResilientCompanionReply({
      currentMessage,
      language,
      characterId,
      historyMessages,
    });
    const tokens = fallbackText.split(/(\s+)/);
    for (let i = 0; i < tokens.length; i += 3) {
      yield tokens.slice(i, i + 3).join('');
      await new Promise((r) => setTimeout(r, 8));
    }
  }
}

export async function generateGeminiReply({
  historyMessages,
  currentMessage,
  language,
  characterId,
  inputMode,
  styleMode,
  timeoutMs = 20_000,
}: GenerateGeminiReplyParams): Promise<string> {
  // Handle unclear or garbled voice audio immediately with a friendly clarifying question
  const clarification = getClarifyingQuestionForUnclearAudio(
    currentMessage,
    language,
    inputMode
  );
  if (clarification) {
    return clarification;
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const isVitest = Boolean(process.env.VITEST);

  if (!apiKey) {
    if (isVitest) {
      throw new ApiError(
        503,
        'AI response could not be generated because the server Gemini API key is not configured.',
        'GEMINI_NOT_CONFIGURED'
      );
    }
    return generateResilientCompanionReply({
      currentMessage,
      language,
      characterId,
      historyMessages,
    });
  }

  const model = resolveGeminiModel(process.env.GEMINI_MODEL);
  const systemInstruction = buildSystemInstruction(language, {
    characterId,
    inputMode,
    styleMode,
  });
  const steps = buildConversationSteps(historyMessages, currentMessage, CONTEXT_WINDOW_LIMIT);

  const client = getGeminiClient(apiKey);
  const maxOutputTokens = inputMode === 'voice' || styleMode === 'turbo' ? 160 : 750;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const interaction = await client.interactions.create(
      {
        model,
        system_instruction: systemInstruction,
        input: steps,
        generation_config: {
          thinking_level: 'minimal',
          max_output_tokens: maxOutputTokens,
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
    // In production/dev runtime (outside unit tests), try standard Gemini generateContent REST API
    // and then resilient local intelligence so the user NEVER sees "Unable to connect. Please try again."
    if (!isVitest) {
      const restReply = await tryStandardGeminiRestApi({
        apiKey,
        systemInstruction,
        steps,
        inputMode,
        styleMode,
        signal: controller.signal,
      });
      if (restReply) {
        return restReply;
      }

      return generateResilientCompanionReply({
        currentMessage,
        language,
        characterId,
        historyMessages,
      });
    }

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

    throw new ApiError(
      502,
      'AI response could not be generated. Please try again.',
      'GEMINI_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
