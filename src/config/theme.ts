import type { BackgroundThemeId } from '../types';

export type ThemeMode = 'light' | 'dark';

export interface ThemeTokens {
  mode: ThemeMode;
  label: string;
  backgroundPrimary: string;
  backgroundSecondary: string;
  sidebarSurface: string;
  cardSurface: string;
  glassBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPurple: string;
  accentViolet: string;
  accentCyan: string;
  accentPink: string;
  accentMint: string;
}

export interface BackgroundThemePreset {
  id: BackgroundThemeId;
  name: string;
  emoji: string;
  description: string;
  mode: ThemeMode;
  bgGradient: string;
  orb1: string;
  orb2: string;
  orb3: string;
  particleColors: string[];
}

export const BACKGROUND_THEME_PRESETS: Record<
  BackgroundThemeId,
  BackgroundThemePreset
> = {
  'aurora-galaxy': {
    id: 'aurora-galaxy',
    name: 'Aurora Galaxy',
    emoji: '🌌',
    description: 'Deep midnight blue with electric cyan, violet & soft magenta aurora.',
    mode: 'dark',
    bgGradient: 'linear-gradient(135deg, #060818 0%, #10132E 48%, #1A0F2E 100%)',
    orb1: 'radial-gradient(circle, rgba(139,92,246,0.30) 0%, transparent 70%)',
    orb2: 'radial-gradient(circle, rgba(34,211,238,0.25) 0%, transparent 70%)',
    orb3: 'radial-gradient(circle, rgba(244,114,182,0.22) 0%, transparent 70%)',
    particleColors: ['#22D3EE', '#8B5CF6', '#F472B6', '#A855F7', '#34D399'],
  },
  'deep-space': {
    id: 'deep-space',
    name: 'Deep Space',
    emoji: '🚀',
    description: 'Cosmic obsidian starfield with deep nebula indigo and cyan stardust.',
    mode: 'dark',
    bgGradient: 'linear-gradient(135deg, #03040B 0%, #090D1F 55%, #0D132A 100%)',
    orb1: 'radial-gradient(circle, rgba(56,189,248,0.22) 0%, transparent 70%)',
    orb2: 'radial-gradient(circle, rgba(99,102,241,0.24) 0%, transparent 70%)',
    orb3: 'radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)',
    particleColors: ['#E0F2FE', '#38BDF8', '#818CF8', '#C084FC', '#FFFFFF'],
  },
  'neon-cyberpunk': {
    id: 'neon-cyberpunk',
    name: 'Neon Cyberpunk',
    emoji: '⚡',
    description: 'Futuristic AI lab glow with electric cyan, neon magenta & laser violet.',
    mode: 'dark',
    bgGradient: 'linear-gradient(135deg, #090418 0%, #16092B 50%, #061A2E 100%)',
    orb1: 'radial-gradient(circle, rgba(236,72,153,0.32) 0%, transparent 70%)',
    orb2: 'radial-gradient(circle, rgba(34,211,238,0.30) 0%, transparent 70%)',
    orb3: 'radial-gradient(circle, rgba(168,85,247,0.28) 0%, transparent 70%)',
    particleColors: ['#22D3EE', '#EC4899', '#F43F5E', '#A855F7', '#FDE047'],
  },
  'ocean-dreams': {
    id: 'ocean-dreams',
    name: 'Ocean Dreams',
    emoji: '🌊',
    description: 'Tranquil bioluminescent sapphire, aquamarine & emerald sea currents.',
    mode: 'dark',
    bgGradient: 'linear-gradient(135deg, #041322 0%, #072238 50%, #0A2E3D 100%)',
    orb1: 'radial-gradient(circle, rgba(34,211,238,0.28) 0%, transparent 70%)',
    orb2: 'radial-gradient(circle, rgba(52,211,153,0.24) 0%, transparent 70%)',
    orb3: 'radial-gradient(circle, rgba(56,189,248,0.22) 0%, transparent 70%)',
    particleColors: ['#22D3EE', '#34D399', '#38BDF8', '#6EE7B7', '#A5F3FC'],
  },
  'sunset-gradient': {
    id: 'sunset-gradient',
    name: 'Sunset Gradient',
    emoji: '🌅',
    description: 'Warm twilight violet, coral pink, magenta & golden horizon glow.',
    mode: 'dark',
    bgGradient: 'linear-gradient(135deg, #1A0B26 0%, #2A1132 50%, #31132B 100%)',
    orb1: 'radial-gradient(circle, rgba(244,114,182,0.30) 0%, transparent 70%)',
    orb2: 'radial-gradient(circle, rgba(251,146,60,0.24) 0%, transparent 70%)',
    orb3: 'radial-gradient(circle, rgba(168,85,247,0.26) 0%, transparent 70%)',
    particleColors: ['#F472B6', '#FB923C', '#FBBF24', '#C084FC', '#FDA4AF'],
  },
  'minimal-light': {
    id: 'minimal-light',
    name: 'Minimal Light Mode',
    emoji: '☀️',
    description: 'Crisp daylight glass with soft lavender, cream & sky-blue highlights.',
    mode: 'light',
    bgGradient: 'linear-gradient(135deg, #FFFDF9 0%, #F4EEFF 50%, #ECF8FF 100%)',
    orb1: 'radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 70%)',
    orb2: 'radial-gradient(circle, rgba(34,211,238,0.16) 0%, transparent 70%)',
    orb3: 'radial-gradient(circle, rgba(244,114,182,0.15) 0%, transparent 70%)',
    particleColors: ['#8B5CF6', '#06B6D4', '#EC4899', '#10B981', '#6366F1'],
  },
};

export const BACKGROUND_THEME_LIST: BackgroundThemePreset[] = [
  BACKGROUND_THEME_PRESETS['aurora-galaxy'],
  BACKGROUND_THEME_PRESETS['deep-space'],
  BACKGROUND_THEME_PRESETS['neon-cyberpunk'],
  BACKGROUND_THEME_PRESETS['ocean-dreams'],
  BACKGROUND_THEME_PRESETS['sunset-gradient'],
  BACKGROUND_THEME_PRESETS['minimal-light'],
];

export const THEME_CONFIGS: Record<ThemeMode, ThemeTokens> = {
  dark: {
    mode: 'dark',
    label: 'MyVoice Plush Intelligence',
    backgroundPrimary: '#090914',
    backgroundSecondary: '#101124',
    sidebarSurface: '#111426',
    cardSurface: '#191B30',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#F8FAFC',
    textSecondary: '#A1A1B8',
    textMuted: '#72758E',
    accentPurple: '#8B5CF6',
    accentViolet: '#A855F7',
    accentCyan: '#22D3EE',
    accentPink: '#F472B6',
    accentMint: '#34D399',
  },
  light: {
    mode: 'light',
    label: 'Minimal Light Mode',
    backgroundPrimary: '#FFFDF9',
    backgroundSecondary: '#F5F0FF',
    sidebarSurface: '#F5F0FF',
    cardSurface: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(139, 92, 246, 0.16)',
    textPrimary: '#1E1B4B',
    textSecondary: '#475569',
    textMuted: '#64748B',
    accentPurple: '#8B5CF6',
    accentViolet: '#A855F7',
    accentCyan: '#22D3EE',
    accentPink: '#F472B6',
    accentMint: '#34D399',
  },
};

export const THEME_STORAGE_KEY = 'plush.theme_mode';
export const BG_THEME_STORAGE_KEY = 'myvoice.background_theme';
