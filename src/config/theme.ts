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
    label: 'Pastel Daylight',
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
