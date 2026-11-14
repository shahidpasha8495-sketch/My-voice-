import { motion, useReducedMotion } from 'framer-motion';
import { AudioWaveform, Globe, Mic, Sparkles } from 'lucide-react';
import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { SignupForm } from '../components/auth/SignupForm';
import { PlushCharacter } from '../components/character/PlushCharacter';
import { useAuth } from '../hooks/useAuth';
import type { SupportedLanguage } from '../types';

export const SignupPage: React.FC = () => {
  const { signUp, error, clearError, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSignup = async (params: {
    displayName: string;
    email: string;
    password: string;
    preferredLanguage: SupportedLanguage;
  }): Promise<boolean> => {
    const ok = await signUp(params);
    if (ok) {
      navigate('/', { replace: true });
    }
    return ok;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#090914] via-[#101124] to-[#090914] text-[#F8FAFC] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Ambient Top Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-36 left-1/2 -translate-x-1/2 h-[420px] w-[520px] rounded-full bg-gradient-to-br from-[#8B5CF6]/35 via-[#A855F7]/20 to-transparent blur-3xl"
      />
      {/* Ambient Bottom Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 h-[360px] w-[480px] rounded-full bg-gradient-to-tr from-[#22D3EE]/25 via-[#34D399]/15 to-transparent blur-3xl"
      />

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex flex-col items-center text-center mb-5">
          {/* 3D Plush Companion Showcase */}
          <div className="relative flex items-end justify-center gap-2 mb-3">
            <div className="-rotate-6 translate-y-1">
              <PlushCharacter characterId="geni" size="xs" interactive={false} />
            </div>
            <div className="-translate-y-1 scale-105">
              <PlushCharacter characterId="mellow" size="xs" interactive={false} />
            </div>
            <div className="rotate-6 translate-y-1">
              <PlushCharacter characterId="cloudy" size="xs" interactive={false} />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 via-[#A855F7]/15 to-[#22D3EE]/20 border border-[#8B5CF6]/35 px-3.5 py-1 text-[11px] font-bold tracking-wide text-[#22D3EE] shadow-glow-primary mb-2.5">
            <AudioWaveform className="h-3.5 w-3.5 text-[#A855F7]" />
            <span>PLUSH AI · Meet your little intelligent companion</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
            Create Your MyVoice Account
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#A1A1B8]">
            Your AI, Your Little Companion · Converse in English, Hindi, and Kannada
          </p>
        </div>

        <div className="rounded-3xl border border-white/[0.08] bg-[#191B30]/90 p-6 sm:p-7 shadow-plush-float backdrop-blur-2xl">
          <SignupForm
            onSubmit={handleSignup}
            error={error}
            onClearError={clearError}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5 text-center text-[11px] font-semibold text-[#A1A1B8]">
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#191B30]/75 p-2.5 border border-white/[0.08]">
            <Mic className="h-3.5 w-3.5 text-[#22D3EE]" />
            <span className="text-[#F8FAFC]/90">Voice &amp; Text</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#191B30]/75 p-2.5 border border-white/[0.08]">
            <Globe className="h-3.5 w-3.5 text-[#A855F7]" />
            <span className="text-[#F8FAFC]/90">EN · हिन्दी · ಕನ್ನಡ</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#191B30]/75 p-2.5 border border-white/[0.08]">
            <Sparkles className="h-3.5 w-3.5 text-[#34D399]" />
            <span className="text-[#F8FAFC]/90">5 Plush Pals</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
