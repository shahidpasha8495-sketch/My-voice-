import { motion, useReducedMotion } from 'framer-motion';
import { AudioWaveform, Globe, Mic, Sparkles } from 'lucide-react';
import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { PlushCharacter } from '../components/character/PlushCharacter';
import { useAuth } from '../hooks/useAuth';

const AMBIENT_PARTICLES = [
  { id: 1, top: '14%', left: '18%', size: 4, color: '#8B5CF6', delay: 0 },
  { id: 2, top: '22%', left: '82%', size: 5, color: '#22D3EE', delay: 0.8 },
  { id: 3, top: '68%', left: '12%', size: 4, color: '#F472B6', delay: 1.5 },
  { id: 4, top: '76%', left: '86%', size: 5, color: '#34D399', delay: 2.1 },
  { id: 5, top: '42%', left: '8%', size: 3, color: '#A855F7', delay: 1.2 },
  { id: 6, top: '48%', left: '91%', size: 3.5, color: '#22D3EE', delay: 0.4 },
];

export const LoginPage: React.FC = () => {
  const { signIn, error, clearError, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const ok = await signIn(email, password);
    if (ok) {
      navigate('/', { replace: true });
    }
    return ok;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#090914] via-[#101124] to-[#090914] text-[#F8FAFC] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Large blurred purple ambient glow near the top */}
      <motion.div
        aria-hidden="true"
        animate={
          prefersReducedMotion
            ? undefined
            : { scale: [1, 1.06, 1], opacity: [0.28, 0.36, 0.28] }
        }
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -top-36 left-1/2 -translate-x-1/2 h-[420px] w-[520px] rounded-full bg-gradient-to-br from-[#8B5CF6]/35 via-[#A855F7]/25 to-transparent blur-3xl"
      />

      {/* Subtle cyan ambient glow near the bottom */}
      <motion.div
        aria-hidden="true"
        animate={
          prefersReducedMotion
            ? undefined
            : { scale: [1, 1.08, 1], opacity: [0.18, 0.26, 0.18] }
        }
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 h-[360px] w-[480px] rounded-full bg-gradient-to-tr from-[#22D3EE]/25 via-[#8B5CF6]/15 to-transparent blur-3xl"
      />

      {/* Extremely subtle floating atmospheric particles */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {AMBIENT_PARTICLES.map((p) => (
          <motion.span
            key={p.id}
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, -14, 0], opacity: [0.25, 0.65, 0.25] }
            }
            transition={{
              duration: 5.5,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: `0 0 12px ${p.color}`,
            }}
            className="absolute rounded-full"
          />
        ))}
      </div>

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Top 3D Plush Character Showcase (Three Prominent Companions) */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="relative flex items-end justify-center gap-1 sm:gap-3 mb-4 pt-2"
            aria-label="MyVoice 3D Plush Companion Showcase"
          >
            {/* Ambient Stage Halo Under Characters */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 h-8 w-56 rounded-full bg-gradient-to-r from-[#F472B6]/25 via-[#8B5CF6]/35 to-[#22D3EE]/25 blur-xl"
            />

            {/* Left Companion: Pink Bunny */}
            <div className="-rotate-6 translate-y-1 opacity-95 transition-transform hover:scale-105">
              <PlushCharacter characterId="bunny" size="xs" interactive={false} />
            </div>

            {/* Center Hero Companion: Cream Mellow */}
            <div className="relative z-10 -translate-y-1 scale-110 transition-transform hover:scale-115">
              <PlushCharacter characterId="mellow" size="sm" interactive={false} />
            </div>

            {/* Right Companion: Purple Hearty */}
            <div className="rotate-6 translate-y-1 opacity-95 transition-transform hover:scale-105">
              <PlushCharacter characterId="hearty" size="xs" interactive={false} />
            </div>
          </div>

          {/* Glowing Pill-Shaped Brand Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 via-[#A855F7]/15 to-[#22D3EE]/20 border border-[#8B5CF6]/35 px-3.5 py-1 text-[11px] font-bold tracking-wide text-[#22D3EE] shadow-glow-primary mb-3">
            <AudioWaveform className="h-3.5 w-3.5 text-[#A855F7] animate-pulse" />
            <span>PLUSH AI · Meet your little intelligent companion</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
            Welcome back to MyVoice
          </h1>
          <span className="sr-only">Welcome back to PLUSH AI</span>
          <p className="mt-1.5 text-xs sm:text-sm text-[#A1A1B8] max-w-sm leading-relaxed">
            Your AI, Your Little Companion · A little personality. A lot of intelligence.
          </p>
        </div>

        {/* Floating Glassmorphism Login Card */}
        <div className="rounded-3xl border border-white/[0.08] bg-[#191B30]/90 p-6 sm:p-7 shadow-plush-float backdrop-blur-2xl transition-all hover:border-[#8B5CF6]/30">
          <LoginForm
            onSubmit={handleLogin}
            error={error}
            onClearError={clearError}
          />
        </div>

        {/* Three Bottom Informational Feature Cards */}
        <div className="mt-6 grid grid-cols-3 gap-2.5 text-center text-[11px] font-semibold text-[#A1A1B8]">
          <div className="group flex flex-col items-center gap-1.5 rounded-2xl bg-[#191B30]/75 p-3 border border-white/[0.08] hover:border-[#22D3EE]/40 hover:-translate-y-0.5 transition-all">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-[#22D3EE]/15 text-[#22D3EE]">
              <Mic className="h-3.5 w-3.5" />
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
            </div>
            <span className="text-[#F8FAFC]/90">Voice &amp; Text</span>
          </div>

          <div className="group flex flex-col items-center gap-1.5 rounded-2xl bg-[#191B30]/75 p-3 border border-white/[0.08] hover:border-[#8B5CF6]/40 hover:-translate-y-0.5 transition-all">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#A855F7]">
              <Globe className="h-3.5 w-3.5" />
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#A855F7]" />
            </div>
            <span className="text-[#F8FAFC]/90">EN · हिन्दी · ಕನ್ನಡ</span>
          </div>

          <div className="group flex flex-col items-center gap-1.5 rounded-2xl bg-[#191B30]/75 p-3 border border-white/[0.08] hover:border-[#34D399]/40 hover:-translate-y-0.5 transition-all">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-[#34D399]/15 text-[#34D399]">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#34D399]" />
            </div>
            <span className="text-[#F8FAFC]/90">5 Plush Pals</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
