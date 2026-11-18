import type { LanguageMetadata, SupportedLanguage } from '../types/index.js';
import { isSupportedLanguage } from './validation.js';

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageMetadata> = {
  'en-US': {
    code: 'en-US',
    name: 'English',
    nativeName: 'English',
    shortLabel: 'EN',
    speechRecognitionLang: 'en-US',
    speechSynthesisLang: 'en-US',
    welcomeSubtitle: 'Start speaking or type below to converse naturally with Gemini AI.',
    voicePromptHint: 'Tap the microphone to speak or type a message...',
    suggestedPrompts: [
      {
        label: '🧩 Explain a Topic',
        prompt: 'Explain quantum computing in simple terms with a real-world analogy.',
        category: 'Learning',
      },
      {
        label: '📚 Learn Something',
        prompt: 'Create a 5-minute daily learning plan to master public speaking and confidence.',
        category: 'Growth',
      },
      {
        label: '🌐 Translate',
        prompt: 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (AI) ಎಂದರೇನು? ಸರಳ ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸಿ.',
        category: 'Multilingual',
      },
      {
        label: '✍️ Write Something',
        prompt: 'Write a polite, clear email requesting a project deadline extension of 3 days.',
        category: 'Writing',
      },
      {
        label: '🗣️ Practice English',
        prompt: 'Act as my friendly spoken English coach and practice a job interview with me.',
        category: 'Language',
      },
      {
        label: '💡 Generate Ideas',
        prompt: 'Brainstorm 5 creative startup ideas that use AI to help students learn faster.',
        category: 'Creativity',
      },
      {
        label: '💻 Coding Help',
        prompt: 'Explain how async/await works in TypeScript with a clean, practical example.',
        category: 'Coding',
      },
      {
        label: '💬 Ask Anything',
        prompt: 'Give me a focused morning-to-evening productivity routine for high energy.',
        category: 'Daily Life',
      },
    ],
  },
  'hi-IN': {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    shortLabel: 'हिं',
    speechRecognitionLang: 'hi-IN',
    speechSynthesisLang: 'hi-IN',
    welcomeSubtitle: 'बोलना शुरू करें या नीचे टाइप करें — MyVoice आपकी भाषा में संवाद करता है।',
    voicePromptHint: 'बोलने के लिए माइक दबाएं या संदेश लिखें...',
    suggestedPrompts: [
      {
        label: '🧩 एक कठिन विषय समझाएं',
        prompt: 'कृत्रिम बुद्धिमत्ता (Artificial Intelligence) क्या है और यह कैसे काम करती है? सरल हिंदी में समझाएं।',
        category: 'शिक्षा',
      },
      {
        label: '📚 कुछ नया सीखें',
        prompt: 'मुझे समय प्रबंधन (Time Management) के 5 व्यावहारिक तरीके बताएं।',
        category: 'कौशल',
      },
      {
        label: '🌐 अनुवाद करें (Translate)',
        prompt: 'दैनिक बातचीत में उपयोग होने वाले 5 महत्वपूर्ण वाक्य हिंदी, कन्नड़ और अंग्रेजी में बताएं।',
        category: 'बहुभाषी',
      },
      {
        label: '✍️ प्रोफेशनल ईमेल लिखें',
        prompt: 'छुट्टी के आवेदन के लिए एक विनम्र और पेशेवर ईमेल हिंदी में लिखें।',
        category: 'लेखन',
      },
      {
        label: '🗣️ अंग्रेजी बोलना सीखें',
        prompt: 'आत्मविश्वास के साथ अंग्रेजी बोलने के लिए 5 दैनिक अभ्यास टिप्स हिंदी में बताएं।',
        category: 'भाषा अभ्यास',
      },
      {
        label: '💻 कोडिंग सहायता',
        prompt: 'पायथन (Python) प्रोग्रामिंग भाषा की मूल बातें सरल उदाहरण के साथ हिंदी में समझाएं।',
        category: 'कोडिंग',
      },
    ],
  },
  'kn-IN': {
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    shortLabel: 'ಕ',
    speechRecognitionLang: 'kn-IN',
    speechSynthesisLang: 'kn-IN',
    welcomeSubtitle: 'ಮಾತನಾಡಲು ಪ್ರಾರಂಭಿಸಿ ಅಥವಾ ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ — MyVoice ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸುತ್ತದೆ.',
    voicePromptHint: 'ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿರಿ ಅಥವಾ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...',
    suggestedPrompts: [
      {
        label: '🧩 ಕಷ್ಟಕರವಾದ ವಿಷಯವನ್ನು ವಿವರಿಸಿ',
        prompt: 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (AI) ಎಂದರೇನು? ಸರಳ ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸಿ.',
        category: 'ತಿಳುವಳಿಕೆ',
      },
      {
        label: '📚 ಹೊಸದನ್ನು ಕಲಿಯಿರಿ',
        prompt: 'ಬಾಹ್ಯಾಕಾಶ ತಂತ್ರಜ್ಞಾನ ಮತ್ತು ಉಪಗ್ರಹಗಳು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತವೆ ಎಂಬುದನ್ನು ವಿವರಿಸಿ.',
        category: 'ವಿಜ್ಞಾನ',
      },
      {
        label: '💡 ಉತ್ತಮ ಅಭ್ಯಾಸಗಳು',
        prompt: 'ದೈನಂದಿನ ಜೀವನದಲ್ಲಿ ಉತ್ತಮ ಅಭ್ಯಾಸಗಳನ್ನು ಬೆಳೆಸಿಕೊಳ್ಳಲು 5 ಸಲಹೆಗಳನ್ನು ನೀಡಿ.',
        category: 'ಕಲಿಕೆ',
      },
      {
        label: '✍️ ವೃತ್ತಿಪರ ಇಮೇಲ್ ಬರೆಯಿರಿ',
        prompt: 'ಕೆಲಸದ ಸಂದರ್ಶನಕ್ಕೆ ಧನ್ಯವಾದ ತಿಳಿಸುವ ವೃತ್ತಿಪರ ಸಂದೇಶವನ್ನು ಕನ್ನಡದಲ್ಲಿ ಬರೆಯಿರಿ.',
        category: 'ವೃತ್ತಿ',
      },
      {
        label: '🗣️ ಇಂಗ್ಲಿಷ್ ಸಂವಹನ ಕಲಿಯಿರಿ',
        prompt: 'ದೈನಂದಿನ ಜೀವನದಲ್ಲಿ ಉಪಯೋಗವಾಗುವ 5 ಪ್ರಮುಖ ಇಂಗ್ಲಿಷ್ ವಾಕ್ಯಗಳನ್ನು ಕನ್ನಡ ಅರ್ಥದೊಂದಿಗೆ ತಿಳಿಸಿ.',
        category: 'ಭಾಷೆ',
      },
      {
        label: '💻 ಕೋಡಿಂಗ್ ಸಹಾಯ',
        prompt: 'ವೆಬ್ ಅಭಿವೃದ್ಧಿ (Web Development) ಕಲಿಯಲು ಸರಳ ಮಾರ್ಗದರ್ಶಿಯನ್ನು ಕನ್ನಡದಲ್ಲಿ ತಿಳಿಸಿ.',
        category: 'ತಂತ್ರಜ್ಞಾನ',
      },
    ],
  },
  'ta-IN': {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    shortLabel: 'த',
    speechRecognitionLang: 'ta-IN',
    speechSynthesisLang: 'ta-IN',
    welcomeSubtitle: 'பேசத் தொடங்குங்கள் அல்லது கீழே தட்டச்சு செய்யுங்கள் — MyVoice தமிழில் பதிலளிக்கும்.',
    voicePromptHint: 'பேச மைக்ரோஃபோனை அழுத்தவும் அல்லது செய்தியை உள்ளிடவும்...',
    suggestedPrompts: [
      {
        label: '🧩 எளிய விளக்கம் (Explain Topic)',
        prompt: 'செயற்கை நுண்ணறிவு (AI) என்றால் என்ன? எளிய தமிழில் விளக்கவும்.',
        category: 'கல்வி',
      },
      {
        label: '📚 புதியதைக் கற்றுக்கொள்ளுங்கள்',
        prompt: 'நேர மேலாண்மைக்கான 5 சிறந்த வழிமுறைகளை தமிழில் கூறுங்கள்.',
        category: 'வளர்ச்சி',
      },
      {
        label: '🗣️ ஆங்கிலம் பழகுங்கள்',
        prompt: 'தினசரி உரையாடலுக்குப் பயன்படும் 5 முக்கிய ஆங்கில வாக்கியங்களை தமிழ் அர்த்தத்துடன் கூறுங்கள்.',
        category: 'மொழி',
      },
    ],
  },
  'te-IN': {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    shortLabel: 'తె',
    speechRecognitionLang: 'te-IN',
    speechSynthesisLang: 'te-IN',
    welcomeSubtitle: 'మాట్లాడటం ప్రారంభించండి లేదా టైప్ చేయండి — MyVoice తెలుగులో సమాధానం ఇస్తుంది.',
    voicePromptHint: 'మాట్లాడటానికి మైక్ నొక్కండి లేదా సందేశాన్ని టైప్ చేయండి...',
    suggestedPrompts: [
      {
        label: '🧩 సులభంగా వివరించండి',
        prompt: 'కృత్రిమ మేధస్సు (Artificial Intelligence) అంటే ఏమిటి? సరళమైన తెలుగులో వివరించండి.',
        category: 'విద్య',
      },
      {
        label: '📚 కొత్త విషయం నేర్చుకోండి',
        prompt: 'సమయపాలన (Time Management) కోసం 5 ఆచరణాత్మక చిట్కాలు చెప్పండి.',
        category: 'నైపుణ్యం',
      },
      {
        label: '🗣️ ఇంగ్లీష్ ప్రాక్టీస్',
        prompt: 'రోజువారీ సంభాషణలో ఉపయోగించే 5 ముఖ్యమైన ఇంగ్లీష్ వాక్యాలను తెలుగు అర్థంతో చెప్పండి.',
        category: 'భాష',
      },
    ],
  },
  'ml-IN': {
    code: 'ml-IN',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    shortLabel: 'മ',
    speechRecognitionLang: 'ml-IN',
    speechSynthesisLang: 'ml-IN',
    welcomeSubtitle: 'സംസാരിച്ചു തുടങ്ങുക അല്ലെങ്കിൽ ടൈപ്പ് ചെയ്യുക — MyVoice മലയാളത്തിൽ മറുപടി നൽകും.',
    voicePromptHint: 'സംസാരിക്കാൻ മൈക്ക് അമർത്തുക അല്ലെങ്കിൽ സന്ദേശം ടൈപ്പ് ചെയ്യുക...',
    suggestedPrompts: [
      {
        label: '🧩 ലളിതമായി വിശദീകരിക്കുക',
        prompt: 'നിർമ്മിത ബുദ്ധി (AI) എന്താണ്? ലളിതമായ മലയാളത്തിൽ വിശദീകരിക്കുക.',
        category: 'പഠനം',
      },
      {
        label: '📚 പുതിയ അറിവുകൾ',
        prompt: 'മികച്ച പഠനശീലങ്ങൾ വളർത്താനുള്ള 5 മാർഗ്ഗങ്ങൾ മലയാളത്തിൽ പറയുക.',
        category: 'വളർച്ച',
      },
      {
        label: '🗣️ ഇംഗ്ലീഷ് പരിശീലനം',
        prompt: 'നിത്യജീവിതത്തിൽ ഉപയോഗിക്കുന്ന 5 പ്രധാന ഇംഗ്ലീഷ് വാചകങ്ങൾ മലയാളം അർത്ഥത്തോടെ നൽകുക.',
        category: 'ഭാഷ',
      },
    ],
  },
  'bn-IN': {
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    shortLabel: 'বাং',
    speechRecognitionLang: 'bn-IN',
    speechSynthesisLang: 'bn-IN',
    welcomeSubtitle: 'কথা বলুন বা নিচে টাইপ করুন — MyVoice বাংলায় উত্তর দেবে।',
    voicePromptHint: 'কথা বলতে মাইক চাপুন বা বার্তা লিখুন...',
    suggestedPrompts: [
      {
        label: '🧩 সহজ ভাষায় বোঝান',
        prompt: 'কৃত্রিম বুদ্ধিমত্তা (AI) কী এবং এটি কীভাবে কাজ করে? সহজ বাংলায় বোঝান।',
        category: 'শিক্ষা',
      },
      {
        label: '📚 নতুন কিছু শিখুন',
        prompt: 'সময় ব্যবস্থাপনার (Time Management) ৫টি কার্যকর উপায় বাংলায় বলুন।',
        category: 'দক্ষতা',
      },
      {
        label: '🗣️ ইংরেজি চর্চা',
        prompt: 'দৈনন্দিন কথোপকথনের জন্য ৫টি দরকারি ইংরেজি বাক্য বাংলা অর্থসহ বলুন।',
        category: 'ভাষা',
      },
    ],
  },
  'es-ES': {
    code: 'es-ES',
    name: 'Spanish',
    nativeName: 'Español',
    shortLabel: 'ES',
    speechRecognitionLang: 'es-ES',
    speechSynthesisLang: 'es-ES',
    welcomeSubtitle: 'Habla o escribe abajo para conversar naturalmente con MyVoice en español.',
    voicePromptHint: 'Toca el micrófono para hablar o escribe un mensaje...',
    suggestedPrompts: [
      {
        label: '🧩 Explicar un tema',
        prompt: 'Explica cómo funciona la inteligencia artificial de forma sencilla y con un ejemplo práctico.',
        category: 'Aprendizaje',
      },
      {
        label: '✍️ Redactar un correo',
        prompt: 'Escribe un correo electrónico profesional solicitando una reunión de seguimiento.',
        category: 'Escritura',
      },
      {
        label: '🗣️ Practicar idiomas',
        prompt: 'Enséñame 5 frases útiles para viajar y conversar en inglés y español.',
        category: 'Idiomas',
      },
    ],
  },
  'fr-FR': {
    code: 'fr-FR',
    name: 'French',
    nativeName: 'Français',
    shortLabel: 'FR',
    speechRecognitionLang: 'fr-FR',
    speechSynthesisLang: 'fr-FR',
    welcomeSubtitle: 'Parlez ou écrivez ci-dessous pour discuter naturellement avec MyVoice en français.',
    voicePromptHint: 'Appuyez sur le micro pour parler ou saisissez un message...',
    suggestedPrompts: [
      {
        label: '🧩 Expliquer un concept',
        prompt: "Expliquez l'informatique quantique simplement avec une analogie du quotidien.",
        category: 'Apprentissage',
      },
      {
        label: '✍️ Rédiger un message',
        prompt: 'Rédigez un e-mail professionnel clair et courtois pour remercier un client.',
        category: 'Rédaction',
      },
      {
        label: '💡 Générer des idées',
        prompt: 'Proposez 5 idées créatives pour organiser une journée productive.',
        category: 'Productivité',
      },
    ],
  },
  'de-DE': {
    code: 'de-DE',
    name: 'German',
    nativeName: 'Deutsch',
    shortLabel: 'DE',
    speechRecognitionLang: 'de-DE',
    speechSynthesisLang: 'de-DE',
    welcomeSubtitle: 'Sprechen oder tippen Sie unten, um sich natürlich auf Deutsch zu unterhalten.',
    voicePromptHint: 'Tippen Sie auf das Mikrofon oder geben Sie eine Nachricht ein...',
    suggestedPrompts: [
      {
        label: '🧩 Thema einfach erklären',
        prompt: 'Erkläre künstliche Intelligenz einfach und verständlich mit einem Alltagsbeispiel.',
        category: 'Lernen',
      },
      {
        label: '✍️ E-Mail verfassen',
        prompt: 'Schreibe eine höfliche und professionelle E-Mail für eine Terminvereinbarung.',
        category: 'Schreiben',
      },
      {
        label: '💻 Programmierhilfe',
        prompt: 'Erkläre den Unterschied zwischen synchronem und asynchronem Code mit einem kurzen Beispiel.',
        category: 'Technik',
      },
    ],
  },
  'ar-SA': {
    code: 'ar-SA',
    name: 'Arabic',
    nativeName: 'العربية',
    shortLabel: 'ع',
    speechRecognitionLang: 'ar-SA',
    speechSynthesisLang: 'ar-SA',
    welcomeSubtitle: 'تحدث أو اكتب أدناه للتواصل بشكل طبيعي مع مساعدك الذكي باللغة العربية.',
    voicePromptHint: 'اضغط على الميكروفون للتحدث أو اكتب رسالتك...',
    suggestedPrompts: [
      {
        label: '🧩 اشرح موضوعاً معقداً',
        prompt: 'اشرح الذكاء الاصطناعي بطريقة بسيطة وواضحة مع مثال من الحياة اليومية.',
        category: 'تعليم',
      },
      {
        label: '📚 خطة تعلم يومية',
        prompt: 'قدم لي 5 نصائح عملية لإدارة الوقت وزيادة الإنتاجية اليومية.',
        category: 'تطوير الذات',
      },
      {
        label: '✍️ كتابة رسالة احترافية',
        prompt: 'اكتب بريداً إلكترونياً احترافياً ومهذباً لطلب اجتماع عمل.',
        category: 'كتابة',
      },
    ],
  },
};

export const LANGUAGE_LIST: LanguageMetadata[] = [
  LANGUAGE_CONFIGS['en-US'],
  LANGUAGE_CONFIGS['hi-IN'],
  LANGUAGE_CONFIGS['kn-IN'],
  LANGUAGE_CONFIGS['ta-IN'],
  LANGUAGE_CONFIGS['te-IN'],
  LANGUAGE_CONFIGS['ml-IN'],
  LANGUAGE_CONFIGS['bn-IN'],
  LANGUAGE_CONFIGS['es-ES'],
  LANGUAGE_CONFIGS['fr-FR'],
  LANGUAGE_CONFIGS['de-DE'],
  LANGUAGE_CONFIGS['ar-SA'],
];

const DEFAULT_FOLLOW_UPS = [
  { label: '✨ Explain simpler', prompt: 'Explain that in even simpler, everyday terms with a quick example.' },
  { label: '🎯 Practical example', prompt: 'Give me a concrete, real-world example of how to apply this.' },
  { label: '📋 3-bullet summary', prompt: 'Summarize the key takeaways in 3 short, actionable bullet points.' },
  { label: '🇮🇳 इन हिंदी (Hindi)', prompt: 'इसी उत्तर को सरल और स्वाभाविक हिंदी में समझाएं।' },
  { label: '🇮🇳 ಕನ್ನಡದಲ್ಲಿ (Kannada)', prompt: 'ಇದೇ ಉತ್ತರವನ್ನು ಸರಳ ಮತ್ತು ಸಹಜ ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸಿ.' },
  { label: '🧠 Quiz me', prompt: 'Create a quick 3-question interactive quiz to test my understanding of this topic.' },
];

export const FOLLOW_UP_QUICK_ACTIONS: Record<
  SupportedLanguage,
  Array<{ label: string; prompt: string }>
> = {
  'en-US': DEFAULT_FOLLOW_UPS,
  'hi-IN': [
    { label: '✨ और सरल शब्दों में', prompt: 'इसे और भी सरल और बोलचाल की भाषा में उदाहरण के साथ समझाएं।' },
    { label: '🎯 व्यावहारिक उदाहरण', prompt: 'इसका एक वास्तविक जीवन का व्यावहारिक उदाहरण दें।' },
    { label: '📋 3 मुख्य बिंदु', prompt: 'इस उत्तर को 3 संक्षिप्त और मुख्य बिंदुओं में सारांशित करें।' },
    { label: '🌐 In English', prompt: 'Translate and explain this response in clear, natural English.' },
    { label: '🇮🇳 ಕನ್ನಡದಲ್ಲಿ (Kannada)', prompt: 'ಇದೇ ಉತ್ತರವನ್ನು ಸರಳ ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸಿ.' },
  ],
  'kn-IN': [
    { label: '✨ ಇನ್ನಷ್ಟು ಸರಳವಾಗಿ', prompt: 'ಇದನ್ನು ಇನ್ನಷ್ಟು ಸರಳವಾಗಿ ಒಂದು ಚಿಕ್ಕ ಉದಾಹರಣೆಯೊಂದಿಗೆ ವಿವರಿಸಿ.' },
    { label: '🎯 ನೈಜ ಉದಾಹರಣೆ', prompt: 'ಇದಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಒಂದು ಪ್ರಾಯೋಗಿಕ ಉದಾಹರಣೆಯನ್ನು ನೀಡಿ.' },
    { label: '📋 3 ಪ್ರಮುಖ ಅಂಶಗಳು', prompt: 'ಇದರ ಪ್ರಮುಖ ಅಂಶಗಳನ್ನು 3 ಚಿಕ್ಕ ಸಾಲುಗಳಲ್ಲಿ ತಿಳಿಸಿ.' },
    { label: '🌐 In English', prompt: 'Translate and explain this response in clear, natural English.' },
    { label: '🇮🇳 हिंदी में (Hindi)', prompt: 'इसी उत्तर को सरल हिंदी में समझाएं।' },
  ],
  'ta-IN': DEFAULT_FOLLOW_UPS,
  'te-IN': DEFAULT_FOLLOW_UPS,
  'ml-IN': DEFAULT_FOLLOW_UPS,
  'bn-IN': DEFAULT_FOLLOW_UPS,
  'es-ES': DEFAULT_FOLLOW_UPS,
  'fr-FR': DEFAULT_FOLLOW_UPS,
  'de-DE': DEFAULT_FOLLOW_UPS,
  'ar-SA': DEFAULT_FOLLOW_UPS,
};

// Unicode script regexes
const KANNADA_SCRIPT_REGEX = /[\u0C80-\u0CFF]/g;
const DEVANAGARI_SCRIPT_REGEX = /[\u0900-\u097F]/g;
const TAMIL_SCRIPT_REGEX = /[\u0B80-\u0BFF]/g;
const TELUGU_SCRIPT_REGEX = /[\u0C00-\u0C7F]/g;
const MALAYALAM_SCRIPT_REGEX = /[\u0D00-\u0D7F]/g;
const BENGALI_SCRIPT_REGEX = /[\u0980-\u09FF]/g;
const ARABIC_SCRIPT_REGEX = /[\u0600-\u06FF]/g;
const LATIN_LETTERS_REGEX = /[A-Za-z]/g;

// Explicit language request patterns in Roman script
const EXPLICIT_KANNADA_HINT = /\b(in kannada|kannada dalli|kannadadalli|namaskara|hegiddira|yenu)\b/i;
const EXPLICIT_HINDI_HINT = /\b(in hindi|hindi mein|namaste|kaise ho|kya hai|samjhao)\b/i;
const EXPLICIT_TAMIL_HINT = /\b(in tamil|vanakkam|eppadi)\b/i;
const EXPLICIT_TELUGU_HINT = /\b(in telugu|ela unnaru|enti)\b/i;
const EXPLICIT_MALAYALAM_HINT = /\b(in malayalam|sukhamano)\b/i;
const EXPLICIT_BENGALI_HINT = /\b(in bengali|bangla|kemon acho)\b/i;
const EXPLICIT_SPANISH_HINT = /\b(in spanish|en español|hola|gracias|explica en español)\b/i;
const EXPLICIT_FRENCH_HINT = /\b(in french|en français|bonjour|merci|expliquez)\b/i;
const EXPLICIT_GERMAN_HINT = /\b(in german|auf deutsch|guten tag|bitte erkläre)\b/i;
const EXPLICIT_ARABIC_HINT = /\b(in arabic|marhaban|shukran)\b/i;
const EXPLICIT_ENGLISH_HINT = /\b(in english|answer in english|explain in english)\b/i;

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: 'high' | 'medium' | 'fallback';
}

/**
 * Automatically detects the language of the user's message across all 11 supported languages.
 */
export function detectMessageLanguage(
  text: string,
  fallbackPreference: SupportedLanguage = 'en-US'
): LanguageDetectionResult {
  const safeFallback: SupportedLanguage = isSupportedLanguage(fallbackPreference)
    ? fallbackPreference
    : 'en-US';

  const trimmed = text.trim();
  if (!trimmed) {
    return { language: safeFallback, confidence: 'fallback' };
  }

  // 1. Native Unicode script detection (high confidence)
  const scriptCounts: Array<{ lang: SupportedLanguage; count: number }> = [
    { lang: 'kn-IN', count: trimmed.match(KANNADA_SCRIPT_REGEX)?.length ?? 0 },
    { lang: 'hi-IN', count: trimmed.match(DEVANAGARI_SCRIPT_REGEX)?.length ?? 0 },
    { lang: 'ta-IN', count: trimmed.match(TAMIL_SCRIPT_REGEX)?.length ?? 0 },
    { lang: 'te-IN', count: trimmed.match(TELUGU_SCRIPT_REGEX)?.length ?? 0 },
    { lang: 'ml-IN', count: trimmed.match(MALAYALAM_SCRIPT_REGEX)?.length ?? 0 },
    { lang: 'bn-IN', count: trimmed.match(BENGALI_SCRIPT_REGEX)?.length ?? 0 },
    { lang: 'ar-SA', count: trimmed.match(ARABIC_SCRIPT_REGEX)?.length ?? 0 },
  ];

  const topScript = scriptCounts.reduce((best, curr) =>
    curr.count > best.count ? curr : best
  );
  if (topScript.count > 0) {
    return { language: topScript.lang, confidence: 'high' };
  }

  // 2. Explicit language request hints in Latin script
  if (EXPLICIT_KANNADA_HINT.test(trimmed)) return { language: 'kn-IN', confidence: 'medium' };
  if (EXPLICIT_HINDI_HINT.test(trimmed)) return { language: 'hi-IN', confidence: 'medium' };
  if (EXPLICIT_TAMIL_HINT.test(trimmed)) return { language: 'ta-IN', confidence: 'medium' };
  if (EXPLICIT_TELUGU_HINT.test(trimmed)) return { language: 'te-IN', confidence: 'medium' };
  if (EXPLICIT_MALAYALAM_HINT.test(trimmed)) return { language: 'ml-IN', confidence: 'medium' };
  if (EXPLICIT_BENGALI_HINT.test(trimmed)) return { language: 'bn-IN', confidence: 'medium' };
  if (EXPLICIT_SPANISH_HINT.test(trimmed)) return { language: 'es-ES', confidence: 'medium' };
  if (EXPLICIT_FRENCH_HINT.test(trimmed)) return { language: 'fr-FR', confidence: 'medium' };
  if (EXPLICIT_GERMAN_HINT.test(trimmed)) return { language: 'de-DE', confidence: 'medium' };
  if (EXPLICIT_ARABIC_HINT.test(trimmed)) return { language: 'ar-SA', confidence: 'medium' };
  if (EXPLICIT_ENGLISH_HINT.test(trimmed)) return { language: 'en-US', confidence: 'medium' };

  // 3. Respect user's explicit non-English language preference if no conflicting script
  if (safeFallback !== 'en-US') {
    return { language: safeFallback, confidence: 'fallback' };
  }

  const latinMatches = trimmed.match(LATIN_LETTERS_REGEX)?.length ?? 0;
  if (latinMatches >= 2) {
    return { language: 'en-US', confidence: 'medium' };
  }

  return { language: safeFallback, confidence: 'fallback' };
}

export function getLanguageMetadata(lang?: string | null): LanguageMetadata {
  if (lang && isSupportedLanguage(lang)) {
    return LANGUAGE_CONFIGS[lang];
  }
  return LANGUAGE_CONFIGS['en-US'];
}
