import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090914',
        'background-secondary': '#101124',
        sidebar: '#111426',
        card: '#191B30',
        primary: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          glow: 'rgba(139, 92, 246, 0.35)',
        },
        violet: {
          DEFAULT: '#A855F7',
          glow: 'rgba(168, 85, 247, 0.35)',
        },
        secondary: {
          DEFAULT: '#22D3EE',
          hover: '#06B6D4',
          glow: 'rgba(34, 211, 238, 0.35)',
        },
        cyan: {
          DEFAULT: '#22D3EE',
        },
        pink: {
          DEFAULT: '#F472B6',
        },
        mint: {
          DEFAULT: '#34D399',
        },
        foreground: '#F8FAFC',
        'secondary-text': '#A1A1B8',
        muted: '#72758E',
        success: '#34D399',
        error: '#F87171',
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Noto Sans Kannada',
          'Noto Sans Devanagari',
          'sans-serif',
        ],
        display: [
          'Outfit',
          'Plus Jakarta Sans',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        'glow-primary': '0 0 28px -4px rgba(139, 92, 246, 0.45)',
        'glow-violet': '0 0 32px -4px rgba(168, 85, 247, 0.42)',
        'glow-secondary': '0 0 28px -4px rgba(34, 211, 238, 0.45)',
        'glow-error': '0 0 25px -4px rgba(248, 113, 113, 0.45)',
        'card-subtle': '0 12px 36px -4px rgba(5, 5, 15, 0.55)',
        'plush-float': '0 20px 50px -10px rgba(139, 92, 246, 0.28)',
      },
    },
  },
  plugins: [],
} satisfies Config;
