import { AnimatePresence, motion } from 'framer-motion';
import {
  Hand,
  Mic,
  PhoneOff,
  Repeat,
  Square,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import React from 'react';
import { PLUSH_CHARACTERS, type PlushCharacterId } from '../../config/characters';
import type { Message, SupportedLanguage, VoiceState } from '../../types';
import { cn } from '../../utils/formatters';
import { getLanguageMetadata } from '../../utils/language';
import { VoiceOrb } from '../voice/VoiceOrb';

export interface ImmersiveCallOverlayProps {
  isOpen: boolean;
  characterId: PlushCharacterId;
  language: SupportedLanguage;
  voiceState: VoiceState;
  voiceStatusLabel: string;
  liveTranscript: string;
  latestAssistantMessage?: Message;
  isListening: boolean;
  isPushToTalk: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  handsFreeLoop: boolean;
  firstTokenMs: number | null;
  ttsLatencyMs: number | null;
  onStartListening: () => void;
  onStopListening: () => void;
  onStartPushToTalk: () => void;
  onStopPushToTalk: () => void;
  onStopSpeaking: () => void;
  onToggleMute: () => void;
  onToggleHandsFreeLoop: () => void;
  onClose: () => void;
}

export const ImmersiveCallOverlay: React.FC<ImmersiveCallOverlayProps> = ({
  isOpen,
  characterId,
  language,
  voiceState,
  voiceStatusLabel,
  liveTranscript,
  latestAssistantMessage,
  isListening,
  isPushToTalk,
  isSpeaking,
  isMuted,
  handsFreeLoop,
  firstTokenMs,
  ttsLatencyMs,
  onStartListening,
  onStopListening,
  onStartPushToTalk,
  onStopPushToTalk,
  onStopSpeaking,
  onToggleMute,
  onToggleHandsFreeLoop,
  onClose,
}) => {
  const character =
    PLUSH_CHARACTERS[characterId] || PLUSH_CHARACTERS.mellow;
  const langMeta = getLanguageMetadata(language);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          data-testid="immersive-call-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Live voice call with ${character.name}`}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#070913]/95 backdrop-blur-2xl px-4 py-6 sm:px-8 sm:py-8 text-[#F8FAFC]"
        >
          {/* Ambient radial aura matching the active plush companion */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[30rem] w-[30rem] rounded-full blur-3xl opacity-30"
            style={{
              background: `radial-gradient(circle, ${character.colors.auraFrom}, ${character.colors.auraTo})`,
            }}
          />

          {/* Top Bar: Companion Identity + Real-Time Speed Telemetry */}
          <div className="relative z-10 flex w-full max-w-4xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#34D399]/40 bg-[#34D399]/15 px-3 py-1 text-xs font-bold text-[#34D399]">
                <span className="h-2 w-2 rounded-full bg-[#34D399] animate-pulse" />
                LIVE VOICE CALL
              </span>
              <span className="text-sm font-bold text-[#F8FAFC]">
                {character.name}
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-[#A1A1B8]">
                {langMeta.nativeName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {firstTokenMs !== null && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#22D3EE]/35 bg-[#22D3EE]/10 px-3 py-1 text-xs font-mono font-bold text-[#22D3EE]">
                  <Zap className="h-3.5 w-3.5" />
                  TTFT {firstTokenMs}ms
                </span>
              )}
              {ttsLatencyMs !== null && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#8B5CF6]/35 bg-[#8B5CF6]/15 px-3 py-1 text-xs font-mono font-bold text-[#C4B5FD]">
                  Voice {ttsLatencyMs}ms
                </span>
              )}
            </div>
          </div>

          {/* Center Stage: Oversized Plush Orb + Live Karaoke Subtitles */}
          <div className="relative z-10 flex flex-col items-center justify-center max-w-3xl w-full text-center my-auto">
            <VoiceOrb
              state={voiceState}
              characterId={characterId}
              statusText={voiceStatusLabel}
              transcriptPreview=""
              size="lg"
              onClick={
                isListening
                  ? onStopListening
                  : isSpeaking
                    ? onStopSpeaking
                    : onStartListening
              }
            />

            {/* Real-Time Streaming Captions */}
            <div className="mt-6 w-full max-w-2xl space-y-3">
              {liveTranscript && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-[#22D3EE]/40 bg-[#22D3EE]/10 px-5 py-3 text-sm sm:text-base font-medium text-[#E0F2FE]"
                >
                  <span className="mr-2 text-[11px] font-bold uppercase tracking-wider text-[#22D3EE]">
                    You:
                  </span>
                  &ldquo;{liveTranscript}&rdquo;
                </motion.div>
              )}

              {latestAssistantMessage && (
                <motion.div
                  key={latestAssistantMessage.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-white/10 bg-[#14172C]/90 px-6 py-4 text-base sm:text-lg font-medium leading-relaxed text-[#F8FAFC] shadow-glow-primary"
                >
                  <span className="block mb-1 text-[11px] font-bold uppercase tracking-wider text-[#C4B5FD]">
                    {character.name}
                  </span>
                  {latestAssistantMessage.content}
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom Control Deck */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 rounded-3xl border border-white/10 bg-[#14172C]/90 px-5 py-3.5 backdrop-blur-xl">
            <button
              type="button"
              onClick={isListening ? onStopListening : onStartListening}
              className={cn(
                'inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold transition-all',
                isListening
                  ? 'bg-[#22D3EE] text-[#070913] shadow-glow-secondary'
                  : 'bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-white shadow-glow-primary'
              )}
            >
              {isListening ? (
                <>
                  <Square className="h-4 w-4 fill-current" />
                  <span>Send Speech</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>{isSpeaking ? 'Interrupt & Speak' : 'Start Mic'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                onStartPushToTalk();
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                if (isPushToTalk || isListening) {
                  onStopPushToTalk();
                }
              }}
              onPointerLeave={() => {
                if (isPushToTalk) {
                  onStopPushToTalk();
                }
              }}
              className={cn(
                'select-none inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs sm:text-sm font-bold transition-all',
                isPushToTalk
                  ? 'border-[#34D399] bg-[#34D399]/20 text-[#34D399]'
                  : 'border-white/15 bg-white/5 text-[#F8FAFC] hover:border-[#22D3EE]/50'
              )}
            >
              <Hand className="h-4 w-4 text-[#22D3EE]" />
              <span>{isPushToTalk ? 'Release to Send…' : 'Hold to Talk'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleHandsFreeLoop}
              className={cn(
                'inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs sm:text-sm font-bold transition-all',
                handsFreeLoop
                  ? 'border-[#34D399]/60 bg-[#34D399]/15 text-[#34D399]'
                  : 'border-white/15 bg-white/5 text-[#A1A1B8] hover:text-white'
              )}
            >
              <Repeat className={cn('h-4 w-4', handsFreeLoop && 'animate-spin')} />
              <span>{handsFreeLoop ? 'Auto Loop: ON' : 'Auto Loop'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute call audio' : 'Mute call audio'}
              className={cn(
                'rounded-2xl border p-3 transition-colors',
                isMuted
                  ? 'border-[#F87171]/50 bg-[#F87171]/15 text-[#F87171]'
                  : 'border-white/15 bg-white/5 text-[#22D3EE]'
              )}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="End live voice call"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#EF4444] px-5 py-3 text-xs sm:text-sm font-bold text-white hover:bg-[#DC2626] transition-colors"
            >
              <PhoneOff className="h-4 w-4" />
              <span>End Call</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
