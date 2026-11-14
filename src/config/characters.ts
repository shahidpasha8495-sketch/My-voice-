import type { SupportedLanguage } from '../types';

export type PlushCharacterId = 'mellow' | 'geni' | 'cloudy' | 'bunny' | 'hearty';

export interface PlushCharacterConfig {
  id: PlushCharacterId;
  name: string;
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
  welcomeMessages: Record<SupportedLanguage, string>;
  voicePreviewLine: Record<SupportedLanguage, string>;
  specialtyBadges: string[];
}

export const PLUSH_CHARACTERS: Record<PlushCharacterId, PlushCharacterConfig> = {
  mellow: {
    id: 'mellow',
    name: 'Mellow',
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
    role: 'Spark Innovator',
    personality: 'Intelligent and energetic',
    shortTrait: 'Curious • Sharp •Witty',
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
    role: 'Dreamy Philosopher',
    personality: 'Peaceful and thoughtful',
    shortTrait: 'Serene • Poetic • Wise',
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
        "Bonjour! I'm Cloudy. Let your thoughts float freely—I'm listening with a peaceful mind.",
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
};

export const PLUSH_CHARACTER_LIST: PlushCharacterConfig[] = [
  PLUSH_CHARACTERS.mellow,
  PLUSH_CHARACTERS.geni,
  PLUSH_CHARACTERS.cloudy,
  PLUSH_CHARACTERS.bunny,
  PLUSH_CHARACTERS.hearty,
];

export const CHARACTER_STORAGE_KEY = 'plush.selected_character';

export function isValidCharacterId(value: unknown): value is PlushCharacterId {
  return (
    typeof value === 'string' &&
    value in PLUSH_CHARACTERS
  );
}

export function getDailyGreeting(displayName?: string | null, hour = new Date().getHours()): string {
  const cleanName = displayName?.trim() || 'Friend';
  if (hour < 12) {
    return `Good morning, ${cleanName}`;
  }
  if (hour < 17) {
    return `Good afternoon, ${cleanName}`;
  }
  return `Good evening, ${cleanName}`;
}
