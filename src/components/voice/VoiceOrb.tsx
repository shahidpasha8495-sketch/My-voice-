import { motion, useReducedMotion } from 'framer-motion';
import { Mic, Volume2 } from 'lucide-react';
import React from 'react';
import { PLUSH_CHARACTERS, type PlushCharacterId } from '../../config/characters';
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer';
import { useCharacter } from '../../hooks/useCharacter';
import { VOICE_STATE_LABELS } from '../../hooks/useVoiceState';
import type { VoiceState } from '../../types';
import { cn } from '../../utils/formatters';
import { PlushCharacter } from '../character/PlushCharacter';
import { VoiceVisualizer } from './VoiceVisualizer';

export interface VoiceOrbProps {
  state: VoiceState;
  characterId?: PlushCharacterId;
  statusText?: string;
  transcriptPreview?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export const FRIENDLY_VOICE_PROMPTS: Record<VoiceState, string> = {
  idle: 'Tap to talk',
  requesting_permission: 'Requesting microphone...',
  listening: "I'm listening...",
  speech_detected: "I'm listening...",
  processing: 'Thinking...',
  generating_response: 'Thinking...',
  speaking: 'Talking to you...',
  paused: 'Paused',
  error: "Let's try that again.",
};

const ORB_PARTICLES = [
  { angle: 25, distance: 0.48, color: '#8B5CF6', size: 5, delay: 0 },
  { angle: 95, distance: 0.5, color: '#22D3EE', size: 4, delay: 0.6 },
  { angle: 165, distance: 0.47, color: '#F472B6', size: 4.5, delay: 1.2 },
  { angle: 235, distance: 0.5, color: '#34D399', size: 4, delay: 1.8 },
  { angle: 310, distance: 0.48, color: '#A855F7', size: 5, delay: 0.9 },
];

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  characterId,
  statusText,
  transcriptPreview,
  size = 'lg',
  onClick,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { characterId: contextCharacterId } = useCharacter();
  const activeCharacterId = characterId || contextCharacterId || 'mellow';
  const charConfig =
    PLUSH_CHARACTERS[activeCharacterId] || PLUSH_CHARACTERS.mellow;

  const { amplitude, bands } = useAudioAnalyzer(state);

  const isListening = state === 'listening' || state === 'speech_detected';
  const isProcessing =
    state === 'requesting_permission' ||
    state === 'processing' ||
    state === 'generating_response';
  const isSpeaking = state === 'speaking';
  const isError = state === 'error';

  const orbPixelSize = {
    sm: 112,
    md: 176,
    lg: 256,
  }[size];

  const plushSize = {
    sm: 'xs' as const,
    md: 'md' as const,
    lg: 'lg' as const,
  }[size];

  const friendlyPrompt = FRIENDLY_VOICE_PROMPTS[state];
  const displayLabel = statusText || VOICE_STATE_LABELS[state];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center select-none',
        className
      )}
      data-testid="voice-orb-container"
      data-voice-state={state}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: orbPixelSize, height: orbPixelSize }}
      >
        {/* Outer Ambient Glowing Rings (Purple & Cyan Gradients) */}
        <motion.div
          aria-hidden="true"
          animate={
            prefersReducedMotion
              ? undefined
              : isListening || isSpeaking
                ? { scale: [1, 1.12, 1], opacity: [0.35, 0.65, 0.35] }
                : { scale: [1, 1.05, 1], opacity: [0.22, 0.38, 0.22] }
          }
          transition={{
            duration: isListening || isSpeaking ? 1.8 : 3.6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: orbPixelSize * 0.96,
            height: orbPixelSize * 0.96,
          }}
          className={cn(
            'pointer-events-none absolute rounded-full blur-xl',
            isError
              ? 'bg-gradient-to-tr from-[#F87171]/35 to-rose-500/20'
              : isListening
                ? 'bg-gradient-to-tr from-[#22D3EE]/40 via-[#8B5CF6]/35 to-[#A855F7]/30'
                : isSpeaking
                  ? 'bg-gradient-to-tr from-[#34D399]/35 via-[#22D3EE]/35 to-[#8B5CF6]/30'
                  : 'bg-gradient-to-tr from-[#8B5CF6]/30 via-[#A855F7]/25 to-[#22D3EE]/25'
          )}
        />

        {/* Secondary Concentric Glowing Ring */}
        <motion.div
          aria-hidden="true"
          animate={
            prefersReducedMotion
              ? undefined
              : { rotate: 360 }
          }
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          style={{
            width: orbPixelSize * 0.86,
            height: orbPixelSize * 0.86,
          }}
          className="pointer-events-none absolute rounded-full border border-dashed border-[#8B5CF6]/30 dark:border-[#22D3EE]/25"
        />

        {/* Subtle Floating Orbital Particles */}
        {size === 'lg' &&
          ORB_PARTICLES.map((p, idx) => {
            const rad = (p.angle * Math.PI) / 180;
            const radius = orbPixelSize * p.distance;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            return (
              <motion.span
                key={idx}
                aria-hidden="true"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        y: [y - 4, y + 4, y - 4],
                        opacity: [0.35, 0.85, 0.35],
                      }
                }
                transition={{
                  duration: 3.2,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  boxShadow: `0 0 10px ${p.color}`,
                  transform: `translate(${x}px, ${y}px)`,
                }}
                className="pointer-events-none absolute rounded-full"
              />
            );
          })}

        {/* 360-degree Circular Audio Visualizer around the Plush Companion */}
        <VoiceVisualizer
          voiceState={state}
          bands={bands}
          amplitude={amplitude}
          primaryColor={charConfig.colors.auraFrom}
          secondaryColor={charConfig.colors.auraTo}
          variant="circular"
          size={orbPixelSize}
          className="absolute inset-0"
        />

        {/* Glassmorphic Pedestal Halo */}
        <motion.button
          type="button"
          onClick={onClick}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
          aria-label={`Voice assistant (${charConfig.name}) state: ${displayLabel}. ${friendlyPrompt}. Click to toggle voice interaction.`}
          style={{
            width: orbPixelSize * 0.78,
            height: orbPixelSize * 0.78,
          }}
          className={cn(
            'relative z-10 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-xl',
            isError
              ? 'bg-gradient-to-br from-rose-500/15 to-red-900/25 border-[#F87171]/60 shadow-glow-error'
              : isListening
                ? 'bg-gradient-to-br from-white/75 via-sky-100/60 to-purple-100/70 dark:from-[#191B30]/95 dark:via-[#12263A]/90 dark:to-[#22173E]/95 border-[#22D3EE]/70 shadow-glow-secondary'
                : isSpeaking
                  ? 'bg-gradient-to-br from-white/75 via-emerald-50/60 to-purple-100/70 dark:from-[#191B30]/95 dark:via-[#122D35]/90 dark:to-[#1E193B]/95 border-[#34D399]/60 shadow-glow-secondary'
                  : 'bg-gradient-to-br from-white/80 via-purple-50/70 to-pink-50/70 dark:from-[#191B30]/90 dark:via-[#16152D]/90 dark:to-[#101A2E]/90 border-purple-300/60 dark:border-[#8B5CF6]/45 shadow-glow-primary'
          )}
        >
          <PlushCharacter
            characterId={activeCharacterId}
            voiceState={state}
            amplitude={amplitude}
            size={plushSize}
            interactive={size === 'lg'}
          />
        </motion.button>
      </div>

      {/* Interactive Voice Prompt Badge & Status Pill */}
      <div className="mt-3 flex flex-col items-center text-center max-w-md px-3 gap-1">
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold border backdrop-blur-md shadow-sm transition-all',
            isError
              ? 'bg-[#F87171]/15 border-[#F87171]/40 text-[#EF4444] dark:text-[#F87171]'
              : isListening
                ? 'bg-[#22D3EE]/15 border-[#22D3EE]/40 text-[#0284C7] dark:text-[#22D3EE]'
                : isSpeaking
                  ? 'bg-[#34D399]/15 border-[#34D399]/40 text-[#059669] dark:text-[#34D399]'
                  : isProcessing
                    ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/40 text-[#7C3AED] dark:text-[#F8FAFC]'
                    : 'bg-white/85 dark:bg-[#191B30] border-purple-200/60 dark:border-white/[0.08] text-slate-700 dark:text-[#F8FAFC]'
          )}
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              isError
                ? 'bg-[#F87171]'
                : isListening
                  ? 'bg-[#22D3EE] animate-ping'
                  : isSpeaking
                    ? 'bg-[#34D399] animate-pulse'
                    : isProcessing
                      ? 'bg-[#A855F7] animate-pulse'
                      : 'bg-[#8B5CF6]'
            )}
          />
          <span data-testid="voice-orb-friendly-prompt">{friendlyPrompt}</span>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
          <span className="text-[11px] font-medium opacity-80">
            {displayLabel}
          </span>
          {isSpeaking ? (
            <Volume2 className="w-3.5 h-3.5 text-[#34D399]" />
          ) : (
            <Mic className="w-3.5 h-3.5 text-[#22D3EE]" />
          )}
        </div>

        {transcriptPreview && (
          <p className="mt-2 text-sm text-slate-800 dark:text-[#F8FAFC]/90 italic line-clamp-2 bg-white/85 dark:bg-[#191B30]/90 px-3.5 py-1.5 rounded-xl border border-purple-200/60 dark:border-white/[0.08] shadow-sm">
            &ldquo;{transcriptPreview}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
};
