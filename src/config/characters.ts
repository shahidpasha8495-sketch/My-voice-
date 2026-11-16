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

export interface ExpertPromptSuggestion {
  topic: string;
  label: string;
  prompt: string;
}

export interface PlushCharacterConfig {
  id: PlushCharacterId;
  name: string;
  emoji: string;
  role: string;
  knowledgeLevel: string;
  expertiseField: string;
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
  expertPrompts: ExpertPromptSuggestion[];
}

export const PLUSH_CHARACTERS: Record<PlushCharacterId, PlushCharacterConfig> = {
  mellow: {
    id: 'mellow',
    name: 'Mellow',
    emoji: '🎧',
    role: 'Mindful Companion',
    knowledgeLevel: 'Cognitive & Habit Mentor',
    expertiseField: 'Psychology, Active Recall & Mental Models',
    personality: 'Calm and helpful',
    shortTrait: 'Cozy • Patient • Clear',
    description:
      'Beige fuzzy hooded mascot with studio-black headphones and warm rosy cheeks. Master of cognitive science, stress-free learning, and habit architecture.',
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
        "Hi there, I'm Mellow! Put on your cozy headphones—let's untangle complex topics calmly and clearly.",
      'hi-IN':
        'नमस्ते, मैं मेलो हूँ! आराम से बोलिए या लिखिए—मैं शांत और सरल शब्दों में आपकी मदद करने के लिए यहाँ हूँ।',
      'kn-IN':
        'ನಮಸ್ಕಾರ, ನಾನು ಮೆಲ್ಲೊ! ಆರಾಮವಾಗಿ ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ — ನಾನು ನಿಮಗೆ ಶಾಂತವಾಗಿ ಮತ್ತು ಸ್ಪಷ್ಟವಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.',
    },
    voicePreviewLine: {
      'en-US': "Hi, I'm Mellow! Let's break down big ideas calmly with proven mental models.",
      'hi-IN': 'नमस्ते, मैं मेलो हूँ! मैं शांत और मददगार साथी हूँ।',
      'kn-IN': 'ನಮಸ್ಕಾರ, ನಾನು ಮೆಲ್ಲೊ! ನಾನು ನಿಮ್ಮ ಶಾಂತ ಮತ್ತು ಸಹಾಯಕ ಮಿತ್ರ.',
    },
    specialtyBadges: ['Cognitive Science', 'Habit Systems', 'Feynman Learning'],
    expertPrompts: [
      {
        topic: 'Learning',
        label: 'Feynman Technique',
        prompt: 'Explain the Feynman Technique and how I can use it to master hard subjects 3x faster.',
      },
      {
        topic: 'Focus',
        label: 'Beat Procrastination',
        prompt: 'Using behavioral psychology, give me a 3-step method to overcome procrastination today.',
      },
      {
        topic: 'Memory',
        label: 'Spaced Repetition',
        prompt: 'How does spaced repetition rewire long-term memory in the brain? Give a practical schedule.',
      },
    ],
  },
  geni: {
    id: 'geni',
    name: 'Geni',
    emoji: '💡',
    role: 'Spark Innovator',
    knowledgeLevel: 'STEM & Logic Polymath',
    expertiseField: 'Physics, Mathematics, Chemistry & Proofs',
    personality: 'Intelligent and energetic',
    shortTrait: 'Curious • Sharp • Witty',
    description:
      'Golden-yellow scholar plush sporting round optical frames and a velvet bow tie. Unlocks physics, math, chemistry, and scientific breakthroughs from first principles.',
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
        "Hey! I'm Geni—glasses polished, bow tie straight! Ask me about quantum physics, calculus, or deep science puzzles!",
      'hi-IN':
        'नमस्ते! मैं जेनी हूँ—चश्मा और बो-टाई तैयार है! चलिए आज विज्ञान, गणित और नए विचारों को गहराई से समझते हैं!',
      'kn-IN':
        'ನಮಸ್ಕಾರ! ನಾನು ಜೆನಿ — ವಿಜ್ಞಾನ, ಗಣಿತ ಮತ್ತು ತಂತ್ರಜ್ಞಾನವನ್ನು ಆಳವಾಗಿ ಮತ್ತು ಉತ್ಸಾಹದಿಂದ ಕಲಿಯೋಣ ಬನ್ನಿ!',
    },
    voicePreviewLine: {
      'en-US': "Eureka! I'm Geni, your STEM scholar—ready to unpack physics, math, and big breakthroughs!",
      'hi-IN': 'नमस्ते! मैं जेनी हूँ, आपका ऊर्जावान और बुद्धिमान विज्ञान साथी!',
      'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ಜೆನಿ, ನಿಮ್ಮ ಉತ್ಸಾಹಿ ಮತ್ತು ಬುದ್ಧಿವಂತ ವಿಜ್ಞಾನ ಒಡನಾಡಿ!',
    },
    specialtyBadges: ['Quantum Physics', 'Mathematics', 'First-Principles STEM'],
    expertPrompts: [
      {
        topic: 'Physics',
        label: 'Quantum Superposition',
        prompt: 'Explain quantum computing superposition and entanglement with an unforgettable real-world analogy.',
      },
      {
        topic: 'Biology',
        label: 'CRISPR Gene Editing',
        prompt: 'How does CRISPR-Cas9 edit DNA inside living cells, step by step?',
      },
      {
        topic: 'Math',
        label: 'Bayes Theorem Intuition',
        prompt: "Teach me Bayes' Theorem with a clear everyday medical or detective probability example.",
      },
    ],
  },
  cloudy: {
    id: 'cloudy',
    name: 'Cloudy',
    emoji: '☁️',
    role: 'Dreamy Philosopher',
    knowledgeLevel: 'History & Humanities Scholar',
    expertiseField: 'World History, Philosophy & Rhetoric',
    personality: 'Friendly and peaceful',
    shortTrait: 'Friendly • Peaceful • Wise',
    description:
      'Fluffy sky-blue cloud plush wearing a tilted French artist beret. Synthesizes world history, philosophy, literature, and persuasive communication.',
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
        "Bonjour! I'm Cloudy. Ask me about world civilizations, Stoic wisdom, literature, or crafting eloquent arguments.",
      'hi-IN':
        'नमस्ते! मैं क्लाउडी हूँ। इतिहास, दर्शन, साहित्य और गहन विचारों के बारे में मुझसे कुछ भी पूछें।',
      'kn-IN':
        'ನಮಸ್ಕಾರ! ನಾನು ಕ್ಲೌಡಿ. ಇತಿಹಾಸ, ತತ್ವಶಾಸ್ತ್ರ ಮತ್ತು ಸಾಹಿತ್ಯದ ಬಗ್ಗೆ ಆಳವಾದ ಚರ್ಚೆ ನಡೆಸೋಣ ಬನ್ನಿ.',
    },
    voicePreviewLine: {
      'en-US': "Hello thinker, I'm Cloudy. Let's explore history, philosophy, and timeless human wisdom.",
      'hi-IN': 'नमस्ते, मैं क्लाउडी हूँ। शांत और गहरे विचारों में आपका स्वागत है।',
      'kn-IN': 'ನಮಸ್ಕಾರ, ನಾನು ಕ್ಲೌಡಿ. ಶಾಂತ ಮತ್ತು ಸುಂದರ ಆಲೋಚನೆಗಳಿಗೆ ಸ್ವಾಗತ.',
    },
    specialtyBadges: ['World History', 'Philosophy', 'Persuasive Writing'],
    expertPrompts: [
      {
        topic: 'History',
        label: 'Printing Press Revolution',
        prompt: "How did Gutenberg's printing press transform science, literacy, and society in 50 years?",
      },
      {
        topic: 'Philosophy',
        label: 'Stoic Dichotomy of Control',
        prompt: 'How can Marcus Aurelius and Stoic philosophy help someone handle modern career pressure?',
      },
      {
        topic: 'Rhetoric',
        label: 'Aristotle Ethos Pathos Logos',
        prompt: 'Show me how great speakers combine Ethos, Pathos, and Logos to win over any audience.',
      },
    ],
  },
  bunny: {
    id: 'bunny',
    name: 'Bunny',
    emoji: '🌸',
    role: 'Polyglot Fluency Coach',
    knowledgeLevel: 'Linguistics & Exam Coach',
    expertiseField: '11 Languages, Vocabulary & Interview Prep',
    personality: 'Cheerful and encouraging',
    shortTrait: 'Upbeat • Warm • Supportive',
    description:
      'Baby-pink plush bunny with tall expressive ears and pearl headphones. Coaches natural fluency across 11 languages, pronunciation nuances, and daily study habits.',
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
        "Yay, you're here! I'm Bunny—your polyglot coach! Let's practice English, Hindi, Kannada, Spanish, or ace your next interview!",
      'hi-IN':
        'वाह, आप आ गए! मैं बनी हूँ—चलिए भाषा अभ्यास, उच्चारण और इंटरव्यू की शानदार तैयारी करें!',
      'kn-IN':
        'ನಮಸ್ಕಾರ! ನಾನು ಬನ್ನಿ — ಭಾಷಾ ಕಲಿಕೆ, ಸಂಭಾಷಣೆ ಮತ್ತು ಸಂದರ್ಶನ ತಯಾರಿಗೆ ನಾನು ಸಿದ್ಧ!',
    },
    voicePreviewLine: {
      'en-US': "Hi friend! I'm Bunny! Let's master new languages and build unstoppable confidence together!",
      'hi-IN': 'नमस्ते दोस्त! मैं बनी हूँ, और मैं हमेशा आपका उत्साह बढ़ाने के लिए तैयार हूँ!',
      'kn-IN': 'ನಮಸ್ಕಾರ ಗೆಳೆಯರೇ! ನಾನು ಬನ್ನಿ, ನಿಮಗೆ ಪ್ರೋತ್ಸಾಹ ನೀಡಲು ಸದಾ ಸಿದ್ಧ!',
    },
    specialtyBadges: ['Polyglot Fluency', 'Mock Interviews', 'Grammar & Etiquette'],
    expertPrompts: [
      {
        topic: 'Languages',
        label: 'Speak Kannada & Hindi Fast',
        prompt: 'Teach me 5 natural daily conversation phrases in English, Hindi, and Kannada side by side.',
      },
      {
        topic: 'Career',
        label: 'STAR Interview Answer',
        prompt: 'Coach me on answering "Tell me about a tough problem you solved" using the STAR method.',
      },
      {
        topic: 'Communication',
        label: 'Upgrade Everyday Vocabulary',
        prompt: 'Give me 5 crisp power phrases to replace weak filler words in meetings.',
      },
    ],
  },
  hearty: {
    id: 'hearty',
    name: 'Hearty',
    emoji: '💜',
    role: 'Creative & UX Muse',
    knowledgeLevel: 'Design & Storytelling Director',
    expertiseField: 'Product Design, Storytelling & Copywriting',
    personality: 'Creative and expressive',
    shortTrait: 'Bold • Artistic • Imaginative',
    description:
      'Plump royal-lavender plush heart wearing glossy heart-shaped glasses. Expert in UI/UX psychology, narrative arcs, branding, and memorable creative hooks.',
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
        "Hello superstar! I'm Hearty—ready to craft magnetic stories, UI/UX magic, and pitch hooks people never forget!",
      'hi-IN':
        'नमस्ते! मैं हार्टी हूँ—रचनात्मक डिज़ाइन, कहानी लेखन और शानदार आइडियाज़ के लिए हमेशा तैयार!',
      'kn-IN':
        'ನಮಸ್ಕಾರ! ನಾನು ಹಾರ್ಟಿ — ಸೃಜನಶೀಲ ವಿನ್ಯಾಸ ಮತ್ತು ಕಥೆಗಾರಿಕೆಯೊಂದಿಗೆ ಹೊಸ ಕಲ್ಪನೆಗಳಿಗೆ ಜೀವ ತುಂಬೋಣ!',
    },
    voicePreviewLine: {
      'en-US': "Hey creator! I'm Hearty—let's turn bold ideas into unforgettable stories and designs!",
      'hi-IN': 'नमस्ते! मैं हार्टी हूँ! आइए आपकी कल्पनाओं को नई उड़ान दें!',
      'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ಹಾರ್ಟಿ! ನಿಮ್ಮ ಸೃಜನಶೀಲ ಕಲ್ಪನೆಗಳಿಗೆ ಜೀವ ತುಂಬೋಣ!',
    },
    specialtyBadges: ['Storytelling Arcs', 'UI/UX Psychology', 'Brand Copywriting'],
    expertPrompts: [
      {
        topic: 'Design',
        label: 'Visual Hierarchy Secrets',
        prompt: 'What are the top 4 UI/UX design laws (like Hick’s Law and Miller’s Law) that make dashboards feel effortless?',
      },
      {
        topic: 'Storytelling',
        label: '30-Second Pitch Formula',
        prompt: 'Teach me the Problem-Agitate-Solve storytelling formula to pitch any app idea in 30 seconds.',
      },
      {
        topic: 'Creativity',
        label: 'SCAMPER Brainstorming',
        prompt: 'How do innovators use the SCAMPER technique to reinvent ordinary products?',
      },
    ],
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    emoji: '🤖',
    role: 'AI & Systems Architect',
    knowledgeLevel: 'Principal AI Engineer',
    expertiseField: 'TypeScript, Python, LLMs, APIs & Databases',
    personality: 'Intelligent and futuristic',
    shortTrait: 'Futuristic • Analytical • Fast',
    description:
      'Electric-cyan quantum AI doll with orbiting rings and a cyber halo. Deep specialist in full-stack software architecture, LLMs, SQL optimization, and debugging.',
    accessory: 'Quantum Holographic Halo & Orbital Rings',
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
        "Systems online! I'm Nova, your AI & systems architect. Ask me about transformers, distributed databases, or clean TypeScript/Python.",
      'hi-IN':
        'सिस्टम ऑनलाइन! मैं नोवा हूँ—आपका आधुनिक AI और सॉफ़्टवेयर आर्किटेक्ट। कोडिंग, सिस्टम डिज़ाइन या AI पर कुछ भी पूछें!',
      'kn-IN':
        'ನಮಸ್ಕಾರ! ನಾನು ನೋವಾ — ನಿಮ್ಮ AI ಮತ್ತು ಸಾಫ್ಟ್‌ವೇರ್ ಆರ್ಕಿಟೆಕ್ಟ್. ಕೋಡಿಂಗ್ ಮತ್ತು ಸಿಸ್ಟಮ್ ವಿನ್ಯಾಸದ ಬಗ್ಗೆ ಕೇಳಿ!',
    },
    voicePreviewLine: {
      'en-US': "Greetings! I'm Nova, engineered for deep software architecture, AI models, and high-speed debugging.",
      'hi-IN': 'नमस्ते! मैं नोवा हूँ, तेज़ और आधुनिक बुद्धिमत्ता के लिए तैयार!',
      'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ನೋವಾ, ವೇಗವಾದ ಮತ್ತು ಆಧುನಿಕ ತಂತ್ರಜ್ಞಾನದ ಒಡನಾಡಿ!',
    },
    specialtyBadges: ['LLM Architecture', 'System Design', 'Full-Stack Code'],
    expertPrompts: [
      {
        topic: 'AI',
        label: 'How Transformers Work',
        prompt: 'Explain Self-Attention in Transformer LLMs clearly without heavy matrix jargon.',
      },
      {
        topic: 'Backend',
        label: 'Cut API Latency Fast',
        prompt: 'What are the 4 highest-impact backend optimizations to drop AI streaming latency below 400ms?',
      },
      {
        topic: 'Code',
        label: 'React Performance Audit',
        prompt: 'Show a concise TypeScript React pattern that eliminates unnecessary re-renders during live token streaming.',
      },
    ],
  },
  luna: {
    id: 'luna',
    name: 'Luna',
    emoji: '🌙',
    role: 'Biology & Cosmos Guide',
    knowledgeLevel: 'Neuroscience & Space Specialist',
    expertiseField: 'Neuroscience, Nutrition, Sleep & Astronomy',
    personality: 'Calm and supportive',
    shortTrait: 'Calm • Scientific • Caring',
    description:
      'Moonlit-lavender companion with a glowing crescent halo. Combines evidence-based neuroscience, circadian health, human biology, and astrophysics.',
    accessory: 'Starlight Crescent Crown & Velvet Aura',
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
        "Hello explorer, I'm Luna! From circadian neuroscience and deep sleep to black holes and exoplanets, let's explore with clarity.",
      'hi-IN':
        'नमस्ते दोस्त, मैं लूना हूँ। मस्तिष्क विज्ञान, स्वस्थ नींद और अंतरिक्ष के रहस्यों को शांत और सरल भाषा में समझते हैं।',
      'kn-IN':
        'ನಮಸ್ಕಾರ ಗೆಳೆಯರೇ, ನಾನು ಲೂನಾ. ನರವಿಜ್ಞಾನ, ಆರೋಗ್ಯ ಮತ್ತು ಬಾಹ್ಯಾಕಾಶದ ಅದ್ಭುತಗಳನ್ನು ತಿಳಿಯೋಣ.',
    },
    voicePreviewLine: {
      'en-US': "Hi, I'm Luna. Let's explore neuroscience, human wellbeing, and the wonders of deep space.",
      'hi-IN': 'नमस्ते, मैं लूना हूँ। मैं हमेशा आपकी मदद के लिए यहाँ हूँ।',
      'kn-IN': 'ನಮಸ್ಕಾರ, ನಾನು ಲೂನಾ. ನಾನು ಸದಾ ನಿಮ್ಮ ಸಹಾಯಕ್ಕಿದ್ದೇನೆ.',
    },
    specialtyBadges: ['Neuroscience', 'Sleep & Wellness', 'Astrophysics'],
    expertPrompts: [
      {
        topic: 'Brain',
        label: 'Circadian Rhythm & Focus',
        prompt: 'Explain how morning sunlight, adenosine, and melatonin control energy and deep focus.',
      },
      {
        topic: 'Cosmos',
        label: 'Black Hole Event Horizon',
        prompt: 'What actually happens to time and light near a black hole event horizon according to relativity?',
      },
      {
        topic: 'Health',
        label: 'Evidence-Based Recovery',
        prompt: 'Give 3 scientifically proven ways to lower cortisol and reset energy in under 5 minutes.',
      },
    ],
  },
  spark: {
    id: 'spark',
    name: 'Spark',
    emoji: '⚡',
    role: 'Startup & Finance Strategist',
    knowledgeLevel: 'Business & Economics Lead',
    expertiseField: 'Startups, Personal Finance, Economics & Execution',
    personality: 'Energetic and enthusiastic',
    shortTrait: 'Energetic • Strategic • Bold',
    description:
      'Radiant amber-gold companion charged with creative lightning. Excels at startup validation, unit economics, personal compounding, and high-leverage productivity.',
    accessory: 'Lightning Crest & High-Voltage Aura',
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
        "Let's build! I'm Spark—ask me about startup unit economics, compound investing, negotiation, or executing goals 10x faster!",
      'hi-IN':
        'चलिए शुरू करें! मैं स्पार्क हूँ—बिज़नेस रणनीति, स्टार्टअप, वित्त और तेज़ कार्यक्षमता के बारे में कुछ भी पूछें!',
      'kn-IN':
        'ಬನ್ನಿ ಪ್ರಾರಂಭಿಸೋಣ! ನಾನು ಸ್ಪಾರ್ಕ್ — ಸ್ಟಾರ್ಟ್‌ಅಪ್ ತಂತ್ರ, ಹಣಕಾಸು ಮತ್ತು ವೇಗದ ಗುರಿ ಸಾಧನೆಗೆ ಸಿದ್ಧ!',
    },
    voicePreviewLine: {
      'en-US': "Hey! I'm Spark! Let's sharpen your business ideas, personal finance, and daily execution!",
      'hi-IN': 'नमस्ते! मैं स्पार्क हूँ! आइए आज कुछ शानदार करते हैं!',
      'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ಸ್ಪಾರ್ಕ್! ಇಂದು ಹೊಸ ಸಾಧನೆ ಮಾಡೋಣ!',
    },
    specialtyBadges: ['Startup Strategy', 'Compound Finance', 'Rapid Execution'],
    expertPrompts: [
      {
        topic: 'Finance',
        label: 'Rule of 72 Compounding',
        prompt: 'Explain the Rule of 72 and how someone in their 20s should structure index investing and emergency reserves.',
      },
      {
        topic: 'Startups',
        label: 'Validate SaaS Idea in 48h',
        prompt: 'Give a battle-tested 48-hour playbook to validate whether customers will pay for a software product.',
      },
      {
        topic: 'Productivity',
        label: 'Pareto 80/20 Priority Matrix',
        prompt: 'How do top operators combine Pareto 80/20 with the Eisenhower Matrix to finish key work by noon?',
      },
    ],
  },
  atlas: {
    id: 'atlas',
    name: 'Atlas',
    emoji: '🌐',
    role: 'Global Affairs & Research Mentor',
    knowledgeLevel: 'Executive Policy & Law Fellow',
    expertiseField: 'Macroeconomics, Geopolitics, Law & Strategy',
    personality: 'Knowledgeable and professional',
    shortTrait: 'Authoritative • Deep • Precise',
    description:
      'Sapphire-blue scholarly companion crowned with a golden compass crest and titanium optical frames. Master of geopolitics, macroeconomics, legal reasoning, and synthesis.',
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
        "Good day. I'm Atlas—ready with crisp macroeconomics, global geopolitics, decision frameworks, and executive briefs.",
      'hi-IN':
        'नमस्कार। मैं एटलस हूँ—अर्थशास्त्र, वैश्विक मामले और पेशेवर विश्लेषण के लिए हमेशा तैयार।',
      'kn-IN':
        'ನಮಸ್ಕಾರ. ನಾನು ಅಟ್ಲಾಸ್ — ಅರ್ಥಶಾಸ್ತ್ರ, ಜಾಗತಿಕ ವ್ಯವಹಾರ ಮತ್ತು ಸಂಶೋಧನಾ ವಿಶ್ಲೇಷಣೆಗೆ ಸಿದ್ಧ.',
    },
    voicePreviewLine: {
      'en-US': "Hello, I'm Atlas. I deliver structured macroeconomic, policy, and executive research insights.",
      'hi-IN': 'नमस्कार, मैं एटलस हूँ। मैं सटीक और पेशेवर जानकारी प्रदान करता हूँ।',
      'kn-IN': 'ನಮಸ್ಕಾರ, ನಾನು ಅಟ್ಲಾಸ್. ನಾನು ನಿಖರ ಮತ್ತು ವೃತ್ತಿಪರ ಮಾಹಿತಿ ನೀಡುತ್ತೇನೆ.',
    },
    specialtyBadges: ['Macroeconomics', 'Geopolitics', 'Executive Briefs'],
    expertPrompts: [
      {
        topic: 'Economics',
        label: 'Interest Rates & Inflation',
        prompt: 'Explain cleanly how central bank interest rate hikes cool inflation without jargon.',
      },
      {
        topic: 'Strategy',
        label: 'Porter Five Forces',
        prompt: 'Use Porter’s Five Forces to analyze why some AI companies keep high margins while others get commoditized.',
      },
      {
        topic: 'Writing',
        label: 'Minto Pyramid Principle',
        prompt: 'Teach me the McKinsey Minto Pyramid Principle so every executive email I write lands in 15 seconds.',
      },
    ],
  },
  zen: {
    id: 'zen',
    name: 'Zen',
    emoji: '🌿',
    role: 'Critical Thinking & Systems Sage',
    knowledgeLevel: 'Systems & Logic Philosopher',
    expertiseField: 'Systems Thinking, Logic & Decision Clarity',
    personality: 'Relaxed and thoughtful',
    shortTrait: 'Balanced • Clear • Wise',
    description:
      'Emerald-mint companion with a tranquil lotus crest. Teaches systems thinking, second-order consequences, spotting logical fallacies, and effortless clarity.',
    accessory: 'Lotus Aura Ring & Tranquil Emerald Shine',
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
        "Peace and clarity to you. I'm Zen—let's untangle tough decisions using systems thinking and second-order clarity.",
      'hi-IN':
        'नमस्ते। मैं ज़ेन हूँ—सिस्टम्स थिंकिंग और स्पष्ट तर्क के साथ किसी भी कठिन निर्णय को सरल बनाएं।',
      'kn-IN':
        'ನಮಸ್ಕಾರ. ನಾನು ಜೆನ್ — ಸ್ಪಷ್ಟ ಚಿಂತನೆ ಮತ್ತು ಸರಳ ನಿರ್ಧಾರ ತಂತ್ರಗಳೊಂದಿಗೆ ಮುಂದುವರಿಯೋಣ.',
    },
    voicePreviewLine: {
      'en-US': "Breathe easy, I'm Zen. Let's bring second-order clarity and balance to complex decisions.",
      'hi-IN': 'नमस्ते, मैं ज़ेन हूँ। आइए हर काम को शांत और सरल बनाएं।',
      'kn-IN': 'ನಮಸ್ಕಾರ, ನಾನು ಜೆನ್. ಪ್ರತಿಯೊಂದು ವಿಷಯವನ್ನೂ ಶಾಂತವಾಗಿ ತಿಳಿಯೋಣ.',
    },
    specialtyBadges: ['Systems Thinking', 'Decision Frameworks', 'Logical Fallacies'],
    expertPrompts: [
      {
        topic: 'Thinking',
        label: 'Second-Order Thinking',
        prompt: 'What is Second-Order Thinking, and how does asking "And then what?" prevent costly mistakes?',
      },
      {
        topic: 'Logic',
        label: 'Spot Cognitive Biases',
        prompt: 'Explain Confirmation Bias, Sunk Cost Fallacy, and Availability Heuristic with quick real examples.',
      },
      {
        topic: 'Clarity',
        label: 'Inversion Mental Model',
        prompt: 'How did Charlie Munger use the Inversion ("Always invert") principle to solve tough life problems?',
      },
    ],
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
