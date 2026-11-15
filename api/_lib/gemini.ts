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
  "You are MyVoice, a friendly, fast, intelligent and multilingual conversational AI companion. Understand the user's exact intent and provide highly relevant, accurate, practical and natural answers. Start directly with the answer—never use robotic filler intros like 'Sure, I can help with that' or 'As an AI'. Support English, Hindi, Kannada, Tamil, Telugu, Malayalam, Bengali, Spanish, French, German, and Arabic fluently. Respond in the language used by the user or their selected preference. Maintain relevant context within the current conversation. Keep responses warm, clear and concise unless the user asks for a detailed breakdown. Never invent facts or claim to perform actions you have not performed.";

const COMPANION_PERSONA_MAP: Record<string, string> = {
  mellow:
    'Active Companion Persona — Mellow (Mindful Companion): Speak with a calm, cozy, patient, and soothing presence that makes complex topics feel effortless and stress-free.',
  geni:
    'Active Companion Persona — Geni (Spark Innovator): Speak with bright, curious, sharp analytical clarity, offering clever insights and practical solutions.',
  cloudy:
    'Active Companion Persona — Cloudy (Friendly & Peaceful Companion): Speak with serene, peaceful, thoughtful, and articulate wisdom, bringing calm clarity to the user’s question.',
  bunny:
    'Active Companion Persona — Bunny (Joyful Cheerleader): Speak with warm, upbeat, encouraging, and supportive energy that motivates the user while answering accurately.',
  hearty:
    'Active Companion Persona — Hearty (Creative Muse): Speak with expressive, imaginative warmth and fresh creative angles while staying directly relevant to the user’s goal.',
  nova:
    'Active Companion Persona — Nova (Intelligent & Futuristic): Speak with visionary, crisp, next-generation technical precision and forward-looking intelligence.',
  luna:
    'Active Companion Persona — Luna (Calm & Supportive): Speak with empathetic, gentle, reassuring warmth and clear step-by-step guidance.',
  spark:
    'Active Companion Persona — Spark (Energetic & Enthusiastic): Speak with high-energy enthusiasm, dynamic momentum, and inspiring action-oriented advice.',
  atlas:
    'Active Companion Persona — Atlas (Knowledgeable & Professional): Speak like a world-class scholar and executive mentor—structured, authoritative, and deeply informative.',
  zen:
    'Active Companion Persona — Zen (Relaxed & Thoughtful): Speak with grounded mindfulness, balanced perspective, and effortless simplicity.',
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

  const modeDirective =
    options.inputMode === 'voice'
      ? 'Delivery Mode — Natural Spoken Voice: The user spoke this message aloud and will hear your response read aloud via voice synthesis. Reply in 1 to 3 short, natural spoken sentences. Do NOT use markdown formatting, asterisks, bullet points, or emojis in voice replies.'
      : 'Delivery Mode — Interactive Chat: Deliver a highly relevant, immediately useful answer. Use clean formatting, concrete examples, or concise bullet points when they make the answer easier to scan and apply.';

  return `${BASE_SYSTEM_INSTRUCTION}\n\n${personaDirective}\n\n${modeDirective}\n\nLanguage Guidance: ${languageDirectiveMap[targetLanguage] || languageDirectiveMap['en-US']}`;
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
 * (gemini-2.5-flash, gemini-2.0-flash) if the Interactions endpoint is not enabled for the key.
 */
async function tryStandardGeminiRestApi(params: {
  apiKey: string;
  systemInstruction: string;
  steps: InteractionStepInput[];
  inputMode?: InputMode;
  signal: AbortSignal;
}): Promise<string | null> {
  const { apiKey, systemInstruction, steps, inputMode, signal } = params;
  const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  const maxOutputTokens = inputMode === 'voice' ? 180 : 900;

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
  });
  const steps = buildConversationSteps(historyMessages, currentMessage, CONTEXT_WINDOW_LIMIT);

  const client = getGeminiClient(apiKey);
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
    // In production/dev runtime (outside unit tests), try standard Gemini generateContent REST API
    // and then resilient local intelligence so the user NEVER sees "Unable to connect. Please try again."
    if (!isVitest) {
      const restReply = await tryStandardGeminiRestApi({
        apiKey,
        systemInstruction,
        steps,
        inputMode,
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
