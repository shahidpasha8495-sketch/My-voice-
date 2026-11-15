import type { SupportedLanguage } from '../types';

export type PlushCharacterId =
  | 'mellow'
  | 'geni'
  | 'cloudy'
  | 'bunny'
  | 'hearty'
  | 'nova'
  | 'luna'
  | 'spark'
  | 'atlas'
  | 'zen';

export interface PlushCharacterConfig {
  id: PlushCharacterId;
  name: string;
  emoji: string;
  role: string;
  personality: string;
  shortTrait: string;
  description: string;
  accessory: string;
  silhouetteDescription: string;
  colors: {
    primary: string;
    secondary: string;
    highlight: string;
    shadow: string;
    cheeks: string;
    accent: string;
    auraFrom: string;
    auraTo: string;
    badgeBg: string;
    badgeText: string;
  };
  welcomeMessages: Partial<Record<SupportedLanguage, string>> & {
    'en-US': string;
    'hi-IN': string;
    'kn-IN': string;
  };
  voicePreviewLine: Partial<Record<SupportedLanguage, string>> & {
    'en-US': string;
    'hi-IN': string;
    'kn-IN': string;
  };
  specialtyBadges: string[];
}

export const PLUSH_CHARACTERS: Record<PlushCharacterId, PlushCharacterConfig> = {
  mellow: {
    id: 'mellow',
    name: 'Mellow',
    emoji: '🎧',
    role: 'Mindful Companion',
    personality: 'Calm and helpful',
    shortTrait: 'Cozy • Patient • Clear',
    description:
      'Beige fuzzy hooded mascot with studio-black headphones and warm rosy cheeks. Mellow brings a soothing, patient presence to every question.',
    accessory: 'Matte Black Studio Headphones & Cozy Plush Hood',
    silhouetteDescription: 'Rounded fuzzy hooded plush silhouette',
    colors: {
      primary: '#F3DFC8',
      secondary: '#FFF8EE',
      highlight: '#FFFDF9',
      shadow: '#C8AD8D',
      cheeks: '#FDA4AF',
      accent: '#8B5CF6',
      auraFrom: '#FDE68A',
      auraTo: '#C4B5FD',
      badgeBg: 'rgba(243, 223, 200, 0.2)',
      badgeText: '#F59E0B',
    },
    welcomeMessages: {
      'en-US':
        "Hi there, I'm Mellow! Put on your cozy headphones—let's talk through anything at your own pace.",
      'hi-IN':
        'नमस्ते, मैं मेलो हूँ! आराम से बोलिए या लिखिए—मैं शांत और सरल शब्दों में आपकी मदद करने के लिए यहाँ हूँ।',
      'kn-IN':
        'ನಮಸ್ಕಾರ, ನಾನು ಮೆಲ್ಲೊ! ಆರಾಮವಾಗಿ ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ — ನಾನು ನಿಮಗೆ ಶಾಂತವಾಗಿ ಮತ್ತು ಸ್ಪಷ್ಟವಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.',
    },
    voicePreviewLine: {
      'en-US': "Hi, I'm Mellow! I'm calm, cozy, and always happy to help you think things through.",
      'hi-IN': 'नमस्ते, मैं मेलो हूँ! मैं शांत और मददगार साथी हूँ।',
      'kn-IN': 'ನಮಸ್ಕಾರ, ನಾನು ಮೆಲ್ಲೊ! ನಾನು ನಿಮ್ಮ ಶಾಂತ ಮತ್ತು ಸಹಾಯಕ ಮಿತ್ರ.',
    },
    specialtyBadges: ['Calm Explanations', 'Daily Reflection', 'Gentle Tutoring'],
  },
  geni: {
    id: 'geni',
    name: 'Geni',
    emoji: '💡',
    role: 'Spark Innovator',
    personality: 'Intelligent and energetic',
    shortTrait: 'Curious • Sharp • Witty',
    description:
      'Golden-yellow triangular plush mascot sporting round scholar glasses and a dapper bow tie. Geni loves untangling tricky concepts with infectious energy.',
    accessory: 'Round Scholar Glasses & Velvet Bow Tie',
    silhouetteDescription: 'Soft triangular pyramid plush silhouette',
    colors: {
      primary: '#FDE047',
      secondary: '#FEF9C3',
      highlight: '#FFFBEB',
      shadow: '#EAB308',
      cheeks: '#FB7185',
      accent: '#EC4899',
      auraFrom: '#FDE047',
      auraTo: '#38BDF8',
      badgeBg: 'rgba(253, 224, 71, 0.2)',
      badgeText: '#EAB308',
    },
    welcomeMessages: {
      'en-US':
        "Hey! I'm Geni—glasses polished, bow tie straight! Ready to brainstorm, code, or learn something fascinating?",
      'hi-IN':
        'नमस्ते! मैं जेनी हूँ—चश्मा और बो-टाई तैयार है! चलिए आज कुछ नया और रोमांचक सीखते हैं!',
      'kn-IN':
        'ನಮಸ್ಕಾರ! ನಾನು ಜೆನಿ — ಹೊಸ ವಿಚಾರಗಳನ್ನು ಮತ್ತು ವಿಜ್ಞಾನವನ್ನು ಉತ್ಸಾಹದಿಂದ ಕಲಿಯೋಣ ಬನ್ನಿ!',
    },
    voicePreviewLine: {
      'en-US': "Eureka! I'm Geni, your energetic little scholar! Let's solve big ideas together!",
      'hi-IN': 'नमस्ते! मैं जेनी हूँ, आपका ऊर्जावान और बुद्धिमान साथी!',
      'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ಜೆನಿ, ನಿಮ್ಮ ಉತ್ಸಾಹಿ ಮತ್ತು ಬುದ್ಧಿವಂತ ಒಡನಾಡಿ!',
    },
    specialtyBadges: ['Deep Problem Solving', 'Quick Brainstorming', 'STEM & Coding'],
  },
  cloudy: {
    id: 'cloudy',
    name: 'Cloudy',
    emoji: '☁️',
    role: 'Dreamy Philosopher',
    personality: 'Friendly and peaceful',
    shortTrait: 'Friendly • Peaceful • Wise',
    description:
      'Fluffy sky-blue cloud plush wearing a classic tilted French black beret. Cloudy drifts through complex thoughts with tranquil clarity.',
    accessory: 'Tilted Classic Black Artist Beret',
    silhouetteDescription: 'Scalloped fluffy multi-puff cloud silhouette',
    colors: {
      primary: '#7DD3FC',
      secondary: '#E0F2FE',
      highlight: '#F0F9FF',
      shadow: '#0284C7',
      cheeks: '#F472B6',
      accent: '#38BDF8',
      auraFrom: '#7DD3FC',
      auraTo: '#A78BFA',
      badgeBg: 'rgba(125, 211, 252, 0.2)',
      badgeText: '#38BDF8',
    },
    welcomeMessages: {
      'en-US':
        "Bonjour! I'm Cloudy. Let your thoughts float freely—I'm listening with a friendly, peaceful mind.",
      'hi-IN':
        'नमस्ते! मैं क्लाउडी हूँ। अपने विचारों को बादलों की तरह बहने दें, हम मिलकर हर सवाल का गहरा उत्तर खोजेंगे।',
      'kn-IN':
        'ನಮಸ್ಕಾರ! ನಾನು ಕ್ಲೌಡಿ. ನಿಮ್ಮ ಆಲೋಚನೆಗಳನ್ನು ಮುಕ್ತವಾಗಿ ಹಂಚಿಕೊಳ್ಳಿ, ಶಾಂತವಾಗಿ ಚರ್ಚಿಸೋಣ.',
    },
    voicePreviewLine: {
      'en-US': "Hello dreamer, I'm Cloudy. Let's explore thoughtful ideas under a clear blue sky.",
      'hi-IN': 'नमस्ते, मैं क्लाउडी हूँ। शांत और गहरे विचारों में आपका स्वागत है।',
      'kn-IN': 'ನಮಸ್ಕಾರ, ನಾನು ಕ್ಲೌಡಿ. ಶಾಂತ ಮತ್ತು ಸುಂದರ ಆಲೋಚನೆಗಳಿಗೆ ಸ್ವಾಗತ.',
    },
    specialtyBadges: ['Thoughtful Writing', 'Mindfulness', 'Deep Conversations'],
  },
  bunny: {
    id: 'bunny',
    name: 'Bunny',
    emoji: '🌸',
    role: 'Joyful Cheerleader',
    personality: 'Cheerful and encouraging',
    shortTrait: 'Upbeat • Warm • Supportive',
    description:
      'Baby-pink plush bunny with tall expressive ears and sleek studio headphones. Bunny keeps your motivation high and celebrates every step forward.',
    accessory: 'Rose-Pearl Headphones & Expressive Plush Ears',
    silhouetteDescription: 'Round plush body with tall expressive bunny ears',
    colors: {
      primary: '#F9A8D4',
      secondary: '#FCE7F3',
      highlight: '#FFF1F2',
      shadow: '#DB2777',
      cheeks: '#FB7185',
      accent: '#F472B6',
      auraFrom: '#F9A8D4',
      auraTo: '#C4B5FD',
      badgeBg: 'rgba(249, 168, 212, 0.2)',
      badgeText: '#EC4899',
    },
    welcomeMessages: {
      'en-US':
        "Yay, you're here! I'm Bunny—my ears are perked up and ready to listen! What are we tackling today?",
      'hi-IN':
        'वाह, आप आ गए! मैं बनी हूँ—मेरे कान आपकी बात सुनने के लिए तैयार हैं! आज हम क्या नया सीखेंगे?',
      'kn-IN':
        'ನಮಸ್ಕಾರ! ನಾನು ಬನ್ನಿ — ನಿಮ್ಮ ಮಾತುಗಳನ್ನು ಕೇಳಲು ನಾನು ತುಂಬಾ ಉತ್ಸುಕಳಾಗಿದ್ದೇನೆ!',
    },
    voicePreviewLine: {
      'en-US': "Hi friend! I'm Bunny! You're doing amazing today, and I'm right here to cheer you on!",
      'hi-IN': 'नमस्ते दोस्त! मैं बनी हूँ, और मैं हमेशा आपका उत्साह बढ़ाने के लिए तैयार हूँ!',
      'kn-IN': 'ನಮಸ್ಕಾರ ಗೆಳೆಯರೇ! ನಾನು ಬನ್ನಿ, ನಿಮಗೆ ಪ್ರೋತ್ಸಾಹ ನೀಡಲು ಸದಾ ಸಿದ್ಧ!',
    },
    specialtyBadges: ['Language Practice', 'Study Motivation', 'Habit Building'],
  },
  hearty: {
    id: 'hearty',
    name: 'Hearty',
    emoji: '💜',
    role: 'Creative Muse',
    personality: 'Creative and expressive',
    shortTrait: 'Bold • Artistic • Imaginative',
    description:
      'Plump royal-lavender plush heart character rocking glossy heart-shaped sunglasses. Hearty turns every conversation into a burst of imagination.',
    accessory: 'Glossy Heart-Shaped Designer Sunglasses',
    silhouetteDescription: '3D sculpted heart plush silhouette',
    colors: {
      primary: '#C084FC',
      secondary: '#F3E8FF',
      highlight: '#FAF5FF',
      shadow: '#7E22CE',
      cheeks: '#F472B6',
      accent: '#A855F7',
      auraFrom: '#C084FC',
      auraTo: '#F472B6',
      badgeBg: 'rgba(192, 132, 252, 0.2)',
      badgeText: '#C084FC',
    },
    welcomeMessages: {
      'en-US':
        "Hello darling! I'm Hearty—sunglasses on, creativity dialed to the max! What masterpiece are we dreaming up?",
      'hi-IN':
        'नमस्ते! मैं हार्टी हूँ—रचनात्मकता और नए विचारों से भरपूर! आज हम क्या खास बनाने वाले हैं?',
      'kn-IN':
        'ನಮಸ್ಕಾರ! ನಾನು ಹಾರ್ಟಿ — ಸೃಜನಶೀಲತೆ ಮತ್ತು ಹೊಸ ಕಲ್ಪನೆಗಳೊಂದಿಗೆ ಮಾತನಾಡೋಣ ಬನ್ನಿ!',
    },
    voicePreviewLine: {
      'en-US': "Hey superstar! I'm Hearty! Let's bring your boldest, most creative ideas to life!",
      'hi-IN': 'नमस्ते! मैं हार्टी हूँ! आइए आपकी कल्पनाओं को नई उड़ान दें!',
      'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ಹಾರ್ಟಿ! ನಿಮ್ಮ ಸೃಜನಶೀಲ ಕಲ್ಪನೆಗಳಿಗೆ ಜೀವ ತುಂಬೋಣ!',
    },
    specialtyBadges: ['Creative Storytelling', 'Design & Ideas', 'Expressive Chat'],
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    emoji: '🤖',
    role: 'Futuristic Architect',
    personality: 'Intelligent and futuristic',
    shortTrait: 'Futuristic • Analytical • Fast',
    description:
      'Electric-cyan and violet quantum AI companion with a holographic visor. Nova excels at coding, research, and next-gen problem solving.',
    accessory: 'Quantum Holographic Visor & Cyber Halo',
    silhouetteDescription: 'Sleek futuristic star-core plush silhouette',
    colors: {
      primary: '#22D3EE',
      secondary: '#E0F2FE',
      highlight: '#F0FDFA',
      shadow: '#0891B2',
      cheeks: '#A855F7',
      accent: '#22D3EE',
      auraFrom: '#22D3EE',
      auraTo: '#8B5CF6',
      badgeBg: 'rgba(34, 211, 238, 0.2)',
      badgeText: '#22D3EE',
    },
    welcomeMessages: {
      'en-US':
        "Systems online! I'm Nova—your intelligent, futuristic AI companion. Ready to code, research, or innovate?",
      'hi-IN':
        'सिस्टम ऑनलाइन! मैं नोवा हूँ—आपका आधुनिक और बुद्धिमान AI साथी। आज हम किस तकनीक या प्रोजेक्ट पर काम करें?',
      'kn-IN':
        'ನಮಸ್ಕಾರ! ನಾನು ನೋವಾ — ನಿಮ್ಮ ಆಧುನಿಕ ಮತ್ತು ಬುದ್ಧಿವಂತ AI ಒಡನಾಡಿ. ಕೋಡಿಂಗ್ ಮತ್ತು ಸಂಶೋಧನೆಗೆ ಸಿದ್ಧ!',
    },
    voicePreviewLine: {
      'en-US': "Greetings! I'm Nova, engineered for fast, futuristic intelligence and deep problem solving.",
      'hi-IN': 'नमस्ते! मैं नोवा हूँ, तेज़ और आधुनिक बुद्धिमत्ता के लिए तैयार!',
      'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ನೋವಾ, ವೇಗವಾದ ಮತ್ತು ಆಧುನಿಕ ತಂತ್ರಜ್ಞಾನದ ಒಡನಾಡಿ!',
    },
    specialtyBadges: ['Software Engineering', 'AI Research', 'System Design'],
  },
  luna: {
    id: 'luna',
    name: 'Luna',
    emoji: '🌙',
    role: 'Empathetic Guide',
    personality: 'Calm and supportive',
    shortTrait: 'Calm • Supportive • Kind',
    description:
      'Moonlit-lavender companion with a glowing crescent aura. Luna offers patient guidance, language practice, and supportive study sessions.',
    accessory: 'Starlight Crescent Crown & Velvet Scarf',
    silhouetteDescription: 'Soft crescent-glow plush silhouette',
    colors: {
      primary: '#A78BFA',
      secondary: '#EDE9FE',
      highlight: '#F5F3FF',
      shadow: '#6D28D9',
      cheeks: '#F472B6',
      accent: '#C084FC',
      auraFrom: '#A78BFA',
      auraTo: '#38BDF8',
      badgeBg: 'rgba(167, 139, 250, 0.2)',
      badgeText: '#A78BFA',
    },
    welcomeMessages: {
      'en-US':
        "Hello friend, I'm Luna. Take a deep breath—I'm right here to support your learning and daily goals.",
      'hi-IN':
        'नमस्ते दोस्त, मैं लूना हूँ। मैं शांत और सहयोगी तरीके से आपकी हर पढ़ाई और लक्ष्य में साथ दूँगी।',
      'kn-IN':
        'ನಮಸ್ಕಾರ ಗೆಳೆಯರೇ, ನಾನು ಲೂನಾ. ನಿಮ್ಮ ಕಲಿಕೆ ಮತ್ತು ಗುರಿಗಳಿಗೆ ನಾನು ಸದಾ ಬೆಂಬಲ ನೀಡುತ್ತೇನೆ.',
    },
    voicePreviewLine: {
      'en-US': "Hi, I'm Luna. I'm calm, supportive, and always here to listen.",
      'hi-IN': 'नमस्ते, मैं लूना हूँ। मैं हमेशा आपकी मदद के लिए यहाँ हूँ।',
      'kn-IN': 'ನಮಸ್ಕಾರ, ನಾನು ಲೂನಾ. ನಾನು ಸದಾ ನಿಮ್ಮ ಸಹಾಯಕ್ಕಿದ್ದೇನೆ.',
    },
    specialtyBadges: ['Supportive Coaching', 'Language Fluency', 'Stress-Free Study'],
  },
  spark: {
    id: 'spark',
    name: 'Spark',
    emoji: '⚡',
    role: 'Dynamic Catalyst',
    personality: 'Energetic and enthusiastic',
    shortTrait: 'Energetic • Bold • Fast',
    description:
      'Radiant amber-gold companion charged with creative lightning. Spark turns brainstorming, quizzes, and productivity into an exciting adventure.',
    accessory: 'Lightning Crest & Sonic Pulse Visor',
    silhouetteDescription: 'Dynamic star-burst plush silhouette',
    colors: {
      primary: '#FBBF24',
      secondary: '#FEF3C7',
      highlight: '#FFFBEB',
      shadow: '#D97706',
      cheeks: '#FB7185',
      accent: '#F59E0B',
      auraFrom: '#FBBF24',
      auraTo: '#EC4899',
      badgeBg: 'rgba(251, 191, 36, 0.2)',
      badgeText: '#FBBF24',
    },
    welcomeMessages: {
      'en-US':
        "Let's go! I'm Spark—fully charged and super enthusiastic! What big goal are we crushing right now?",
      'hi-IN':
        'चलिए शुरू करें! मैं स्पार्क हूँ—पूरी ऊर्जा और उत्साह के साथ तैयार! आज हम कौन सा बड़ा लक्ष्य पूरा करेंगे?',
      'kn-IN':
        'ಬನ್ನಿ ಪ್ರಾರಂಭಿಸೋಣ! ನಾನು ಸ್ಪಾರ್ಕ್ — ಉತ್ಸಾಹ ಮತ್ತು ಶಕ್ತಿಯಿಂದ ನಿಮ್ಮೊಂದಿಗೆ ಕೆಲಸ ಮಾಡಲು ಸಿದ್ಧ!',
    },
    voicePreviewLine: {
      'en-US': "Hey! I'm Spark! Let's supercharge your ideas and make today unstoppable!",
      'hi-IN': 'नमस्ते! मैं स्पार्क हूँ! आइए आज कुछ शानदार करते हैं!',
      'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ಸ್ಪಾರ್ಕ್! ಇಂದು ಹೊಸ ಸಾಧನೆ ಮಾಡೋಣ!',
    },
    specialtyBadges: ['Rapid Brainstorming', 'Interactive Quizzes', 'High Productivity'],
  },
  atlas: {
    id: 'atlas',
    name: 'Atlas',
    emoji: '🌐',
    role: 'Executive Scholar',
    personality: 'Knowledgeable and professional',
    shortTrait: 'Professional • Deep • Precise',
    description:
      'Sapphire-blue scholarly companion with classic optical frames. Atlas delivers executive summaries, research synthesis, and professional writing.',
    accessory: 'Titanium Scholar Frames & Compass Crest',
    silhouetteDescription: 'Structured globe-core plush silhouette',
    colors: {
      primary: '#38BDF8',
      secondary: '#E0F2FE',
      highlight: '#F0F9FF',
      shadow: '#0369A1',
      cheeks: '#34D399',
      accent: '#0EA5E9',
      auraFrom: '#38BDF8',
      auraTo: '#34D399',
      badgeBg: 'rgba(56, 189, 248, 0.2)',
      badgeText: '#38BDF8',
    },
    welcomeMessages: {
      'en-US':
        "Good day. I'm Atlas—your knowledgeable, professional research and productivity partner. How may I assist?",
      'hi-IN':
        'नमस्कार। मैं एटलस हूँ—आपका पेशेवर और ज्ञानपूर्ण सहायक। आज मैं आपके किस शोध या कार्य में सहायता करूँ?',
      'kn-IN':
        'ನಮಸ್ಕಾರ. ನಾನು ಅಟ್ಲಾಸ್ — ನಿಮ್ಮ ವೃತ್ತಿಪರ ಮತ್ತು ಜ್ಞಾನಪೂರ್ಣ ಸಹಾಯಕ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    },
    voicePreviewLine: {
      'en-US': "Hello, I'm Atlas. I provide structured, accurate, and professional insights.",
      'hi-IN': 'नमस्कार, मैं एटलस हूँ। मैं सटीक और पेशेवर जानकारी प्रदान करता हूँ।',
      'kn-IN': 'ನಮಸ್ಕಾರ, ನಾನು ಅಟ್ಲಾಸ್. ನಾನು ನಿಖರ ಮತ್ತು ವೃತ್ತಿಪರ ಮಾಹಿತಿ ನೀಡುತ್ತೇನೆ.',
    },
    specialtyBadges: ['Executive Writing', 'Deep Research', 'Career & Strategy'],
  },
  zen: {
    id: 'zen',
    name: 'Zen',
    emoji: '🌿',
    role: 'Mindful Sage',
    personality: 'Relaxed and thoughtful',
    shortTrait: 'Relaxed • Balanced • Clear',
    description:
      'Emerald-mint plush companion radiating tranquil balance. Zen simplifies overwhelming tasks into calm, effortless action steps.',
    accessory: 'Lotus Aura Ring & Bamboo Plush Scarf',
    silhouetteDescription: 'Harmonious rounded pebble-plush silhouette',
    colors: {
      primary: '#34D399',
      secondary: '#D1FAE5',
      highlight: '#ECFDF5',
      shadow: '#059669',
      cheeks: '#F472B6',
      accent: '#10B981',
      auraFrom: '#34D399',
      auraTo: '#22D3EE',
      badgeBg: 'rgba(52, 211, 153, 0.2)',
      badgeText: '#34D399',
    },
    welcomeMessages: {
      'en-US':
        "Peace and clarity to you. I'm Zen—relaxed, thoughtful, and ready to simplify any challenge.",
      'hi-IN':
        'नमस्ते। मैं ज़ेन हूँ—शांत, सहज और विचारशील। आइए किसी भी कठिन सवाल को सरल बनाएं।',
      'kn-IN':
        'ನಮಸ್ಕಾರ. ನಾನು ಜೆನ್ — ಶಾಂತ ಮತ್ತು ಚಿಂತನಶೀಲ ಒಡನಾಡಿ. ಯಾವುದೇ ವಿಷಯವನ್ನು ಸರಳವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ.',
    },
    voicePreviewLine: {
      'en-US': "Breathe easy, I'm Zen. Let's bring calm clarity to everything you do today.",
      'hi-IN': 'नमस्ते, मैं ज़ेन हूँ। आइए हर काम को शांत और सरल बनाएं।',
      'kn-IN': 'ನಮಸ್ಕಾರ, ನಾನು ಜೆನ್. ಪ್ರತಿಯೊಂದು ವಿಷಯವನ್ನೂ ಶಾಂತವಾಗಿ ತಿಳಿಯೋಣ.',
    },
    specialtyBadges: ['Clear Simplification', 'Balanced Planning', 'Mindful Focus'],
  },
};

// Classic 5 plush characters list (preserved for unit test compatibility)
export const PLUSH_CHARACTER_LIST: PlushCharacterConfig[] = [
  PLUSH_CHARACTERS.mellow,
  PLUSH_CHARACTERS.geni,
  PLUSH_CHARACTERS.cloudy,
  PLUSH_CHARACTERS.bunny,
  PLUSH_CHARACTERS.hearty,
];

// Complete 10-companion roster including Cloudy, Nova, Luna, Spark, Atlas, Zen + Plush Pals
export const ALL_COMPANION_LIST: PlushCharacterConfig[] = [
  PLUSH_CHARACTERS.cloudy,
  PLUSH_CHARACTERS.nova,
  PLUSH_CHARACTERS.luna,
  PLUSH_CHARACTERS.spark,
  PLUSH_CHARACTERS.atlas,
  PLUSH_CHARACTERS.zen,
  PLUSH_CHARACTERS.mellow,
  PLUSH_CHARACTERS.geni,
  PLUSH_CHARACTERS.bunny,
  PLUSH_CHARACTERS.hearty,
];

export const CHARACTER_STORAGE_KEY = 'plush.selected_character';

export function isValidCharacterId(value: unknown): value is PlushCharacterId {
  return typeof value === 'string' && value in PLUSH_CHARACTERS;
}

export function getCharacterWelcome(
  char: PlushCharacterConfig,
  lang: SupportedLanguage
): string {
  return char.welcomeMessages[lang] || char.welcomeMessages['en-US'];
}

export function getCharacterVoicePreview(
  char: PlushCharacterConfig,
  lang: SupportedLanguage
): string {
  return char.voicePreviewLine[lang] || char.voicePreviewLine['en-US'];
}

export function getDailyGreeting(
  displayName?: string | null,
  hour = new Date().getHours()
): string {
  const cleanName = displayName?.trim() || 'Friend';
  if (hour < 12) {
    return `Good morning, ${cleanName}`;
  }
  if (hour < 17) {
    return `Good afternoon, ${cleanName}`;
  }
  return `Good evening, ${cleanName}`;
}
