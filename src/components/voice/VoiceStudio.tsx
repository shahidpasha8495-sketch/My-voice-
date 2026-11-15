import { motion } from 'framer-motion';
import {
  History,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  ALL_COMPANION_LIST,
  getCharacterWelcome,
  PLUSH_CHARACTERS,
  type PlushCharacterId,
} from '../../config/characters';
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer';
import type { Message, SupportedLanguage, VoiceState } from '../../types';
import { cn, formatMessageTimestamp } from '../../utils/formatters';
import { PlushCharacter } from '../character/PlushCharacter';
import { VoiceVisualizer } from './VoiceVisualizer';

export interface VoiceStudioProps {
  characterId: PlushCharacterId;
  voiceState: VoiceState;
  statusLabel: string;
  language: SupportedLanguage;
  liveTranscript: string;
  messages: Message[];
  autoSpeak: boolean;
  isRecognitionSupported: boolean;
  isSynthesisSupported: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  isSending: boolean;
  volume?: number;
  isMuted?: boolean;
  availableVoices?: SpeechSynthesisVoice[];
  selectedVoiceURI?: string | null;
  onVolumeChange?: (v: number) => void;
  onToggleMute?: () => void;
  onSelectVoiceURI?: (uri: string | null) => void;
  onSelectCharacter: (id: PlushCharacterId) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onCancelListening: () => void;
  onToggleAutoSpeak: () => void;
  onPauseSpeaking: () => void;
  onResumeSpeaking: () => void;
  onStopSpeaking: () => void;
  onReplayResponse: () => void;
  onSpeakMessage: (text: string, lang: SupportedLanguage, messageId: string) => void;
}

export const VoiceStudio: React.FC<VoiceStudioProps> = ({
  characterId,
  voiceState,
  statusLabel,
  language,
  liveTranscript,
  messages,
  autoSpeak,
  isRecognitionSupported,
  isSynthesisSupported,
  isListening,
  isSpeaking,
  isPaused,
  isSending,
  volume = 1,
  isMuted = false,
  availableVoices = [],
  selectedVoiceURI = '',
  onVolumeChange,
  onToggleMute,
  onSelectVoiceURI,
  onSelectCharacter,
  onStartListening,
  onStopListening,
  onCancelListening,
  onToggleAutoSpeak,
  onPauseSpeaking,
  onResumeSpeaking,
  onStopSpeaking,
  onReplayResponse,
  onSpeakMessage,
}) => {
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(true);
  const character = PLUSH_CHARACTERS[characterId] || PLUSH_CHARACTERS.mellow;
  const { amplitude, bands } = useAudioAnalyzer(voiceState);

  const latestUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === 'user');
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant');

  return (
    <div
      className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-8"
      data-testid="voice-studio-screen"
    >
      {/* Ambient Background Aura Blobs */}
      <div
        aria-hidden="true"
        style={{
          background: `radial-gradient(circle, ${character.colors.auraFrom}28 0%, transparent 70%)`,
        }}
        className="pointer-events-none absolute -top-16 left-1/4 h-96 w-96 rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        style={{
          background: `radial-gradient(circle, ${character.colors.auraTo}28 0%, transparent 70%)`,
        }}
        className="pointer-events-none absolute bottom-0 right-1/4 h-96 w-96 rounded-full blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Studio Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-3.5 py-1 text-xs font-semibold text-[#8B5CF6] dark:text-[#22D3EE]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Plush AI • Dedicated Voice Studio</span>
            </div>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
              Live Session with {character.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8]">
              {character.personality} • {character.accessory}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Companion Switcher Pills */}
            <div className="flex flex-wrap items-center gap-1 rounded-2xl bg-white/75 dark:bg-[#171B2B]/85 p-1.5 border border-purple-200/60 dark:border-white/10 backdrop-blur-xl">
              {ALL_COMPANION_LIST.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectCharacter(c.id)}
                  className={cn(
                    'rounded-xl px-2.5 py-1 text-xs font-bold transition-all',
                    c.id === characterId
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-white shadow-sm'
                      : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowHistoryDrawer((prev) => !prev)}
              aria-pressed={showHistoryDrawer}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-purple-200/70 dark:border-white/10 bg-white/80 dark:bg-[#171B2B]/85 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-[#F8FAFC]"
            >
              <History className="h-4 w-4 text-[#8B5CF6]" />
              <span className="hidden sm:inline">Transcript History</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Center Stage: 3D Plush Companion + Circular Audio Visualizer + Studio Controls */}
          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-3xl border border-purple-200/70 dark:border-white/10 bg-white/80 dark:bg-[#171B2B]/80 p-6 sm:p-8 shadow-card-subtle backdrop-blur-xl',
              showHistoryDrawer ? 'lg:col-span-7' : 'lg:col-span-12'
            )}
          >
            {/* Large Centered 3D Character + Circular Audio Visualizer */}
            <div className="relative flex items-center justify-center w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
              <VoiceVisualizer
                voiceState={voiceState}
                bands={bands}
                amplitude={amplitude}
                primaryColor={character.colors.auraFrom}
                secondaryColor={character.colors.auraTo}
                variant="circular"
                size={300}
                className="absolute inset-0 m-auto"
              />

              <PlushCharacter
                characterId={characterId}
                voiceState={voiceState}
                amplitude={amplitude}
                size="xl"
                onClick={isListening ? onStopListening : onStartListening}
                className="relative z-10"
              />
            </div>

            {/* Real-Time Bar Visualizer & Status Badge */}
            <div className="mt-2 flex flex-col items-center gap-2">
              <VoiceVisualizer
                voiceState={voiceState}
                bands={bands}
                amplitude={amplitude}
                primaryColor={character.colors.auraFrom}
                secondaryColor={character.colors.auraTo}
                variant="bars"
              />

              <div
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-2 rounded-full bg-purple-100/80 dark:bg-[#101321] border border-purple-300/60 dark:border-white/10 px-4 py-1.5 text-xs font-bold text-slate-800 dark:text-[#F8FAFC]"
              >
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    isListening
                      ? 'bg-[#22D3EE] animate-ping'
                      : isSpeaking
                        ? 'bg-[#34D399] animate-pulse'
                        : isSending
                          ? 'bg-[#8B5CF6] animate-pulse'
                          : 'bg-[#8B5CF6]'
                  )}
                />
                <span>{statusLabel}</span>
              </div>
            </div>

            {/* Live Speech Transcript & Assistant Response Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="rounded-2xl border border-purple-200/60 dark:border-white/10 bg-purple-50/60 dark:bg-[#101321]/80 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B5CF6] dark:text-[#22D3EE]">
                  Live Speech Transcript
                </span>
                <p className="mt-1.5 text-sm text-slate-800 dark:text-[#F8FAFC] min-h-[3rem]">
                  {liveTranscript ? (
                    <span className="italic">&ldquo;{liveTranscript}&rdquo;</span>
                  ) : latestUserMessage ? (
                    latestUserMessage.content
                  ) : (
                    <span className="text-slate-400 dark:text-[#94A3B8]">
                      Tap &ldquo;Start Talking&rdquo; and speak naturally…
                    </span>
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-purple-200/60 dark:border-white/10 bg-sky-50/60 dark:bg-[#101321]/80 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-500 dark:text-[#F472B6]">
                  {character.name}&apos;s Response
                </span>
                <p className="mt-1.5 text-sm text-slate-800 dark:text-[#F8FAFC] line-clamp-4 min-h-[3rem]">
                  {latestAssistantMessage ? (
                    latestAssistantMessage.content
                  ) : (
                    <span className="text-slate-400 dark:text-[#94A3B8]">
                      {getCharacterWelcome(character, language)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Primary Studio Controls */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {!isListening ? (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={isSending || !isRecognitionSupported}
                  onClick={onStartListening}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#22D3EE] px-6 py-3.5 text-sm font-bold text-white shadow-glow-primary disabled:opacity-50"
                >
                  {isRecognitionSupported ? (
                    <Mic className="h-5 w-5" />
                  ) : (
                    <MicOff className="h-5 w-5" />
                  )}
                  <span>Start Talking</span>
                </motion.button>
              ) : (
                <>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={onStopListening}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#22D3EE] px-6 py-3.5 text-sm font-bold text-[#090B14] shadow-glow-secondary"
                  >
                    <Square className="h-4 w-4 fill-current" />
                    <span>Stop &amp; Send</span>
                  </motion.button>

                  <button
                    type="button"
                    onClick={onCancelListening}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-[#F87171]/50 bg-[#F87171]/10 px-4 py-3.5 text-xs font-bold text-[#F87171]"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </>
              )}

              {/* Mute / Unmute Auto-Speak */}
              <button
                type="button"
                onClick={onToggleAutoSpeak}
                aria-pressed={autoSpeak}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl border px-4 py-3.5 text-xs font-bold transition-all',
                  autoSpeak
                    ? 'border-[#34D399]/50 bg-[#34D399]/15 text-[#059669] dark:text-[#34D399]'
                    : 'border-purple-200 dark:border-white/10 bg-white/70 dark:bg-[#101321] text-slate-600 dark:text-[#94A3B8]'
                )}
              >
                {autoSpeak ? (
                  <>
                    <Volume2 className="h-4 w-4" />
                    <span>Voice Output ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4" />
                    <span>Muted</span>
                  </>
                )}
              </button>

              {/* Pause / Resume / Stop / Replay Speech */}
              {isSynthesisSupported && (isSpeaking || isPaused) && (
                <>
                  <button
                    type="button"
                    onClick={isPaused ? onResumeSpeaking : onPauseSpeaking}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-purple-200 dark:border-white/15 bg-white/80 dark:bg-[#101321] px-4 py-3.5 text-xs font-bold text-slate-800 dark:text-[#F8FAFC]"
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-4 w-4 text-[#22D3EE]" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4 text-[#8B5CF6]" />
                        <span>Pause</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onStopSpeaking}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-[#F87171]/40 bg-[#F87171]/10 px-4 py-3.5 text-xs font-bold text-[#F87171]"
                  >
                    <VolumeX className="h-4 w-4" />
                    <span>Stop Audio</span>
                  </button>
                </>
              )}

              {isSynthesisSupported && latestAssistantMessage && !isSpeaking && (
                <button
                  type="button"
                  onClick={onReplayResponse}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-purple-200 dark:border-white/10 bg-white/75 dark:bg-[#101321] px-4 py-3.5 text-xs font-bold text-slate-700 dark:text-[#F8FAFC]"
                >
                  <RotateCcw className="h-4 w-4 text-[#8B5CF6]" />
                  <span>Replay</span>
                </button>
              )}
            </div>

            {/* Studio Volume & Voice Selection Bar */}
            {isSynthesisSupported && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-purple-200/60 dark:border-white/10 bg-white/60 dark:bg-[#101321]/75 px-4 py-2.5 text-xs w-full">
                {onToggleMute && onVolumeChange && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onToggleMute}
                      aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                      className="text-[#8B5CF6] dark:text-[#22D3EE]"
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4 text-[#F87171]" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </button>
                    <span className="font-semibold text-slate-700 dark:text-[#A1A1B8]">
                      Volume: {isMuted ? 0 : Math.round(volume * 100)}%
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => onVolumeChange(Number(e.target.value))}
                      aria-label="Studio voice volume"
                      className="w-24 accent-[#22D3EE] cursor-pointer"
                    />
                  </div>
                )}

                {onSelectVoiceURI && availableVoices.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-[#A1A1B8]">
                      Voice:
                    </span>
                    <select
                      value={selectedVoiceURI || ''}
                      onChange={(e) => onSelectVoiceURI(e.target.value || null)}
                      aria-label="Select AI speech voice"
                      className="rounded-xl border border-purple-200 dark:border-white/10 bg-white dark:bg-[#171B2B] px-2.5 py-1 text-xs text-slate-800 dark:text-[#F8FAFC] max-w-[200px]"
                    >
                      <option value="">Auto (Best Neural Voice)</option>
                      {availableVoices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Live Session Conversation History */}
          {showHistoryDrawer && (
            <div className="lg:col-span-5 flex flex-col rounded-3xl border border-purple-200/70 dark:border-white/10 bg-white/80 dark:bg-[#171B2B]/80 p-5 shadow-card-subtle backdrop-blur-xl max-h-[620px]">
              <div className="flex items-center justify-between border-b border-purple-200/50 dark:border-white/10 pb-3 mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Session Conversation Log
                </h3>
                <span className="rounded-full bg-[#8B5CF6]/15 px-2.5 py-0.5 text-xs font-semibold text-[#8B5CF6] dark:text-[#22D3EE]">
                  {messages.length} messages
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 dark:text-[#94A3B8]">
                    <p className="text-xs font-medium">
                      No messages in this session yet.
                    </p>
                    <p className="mt-1 text-[11px]">
                      Click &ldquo;Start Talking&rdquo; to speak with {character.name}!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'rounded-2xl p-3.5 text-xs leading-relaxed border',
                          isUser
                            ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white border-transparent ml-6'
                            : 'bg-white/90 dark:bg-[#101321] text-slate-800 dark:text-[#F8FAFC] border-purple-200/60 dark:border-white/10 mr-6'
                        )}
                      >
                        <div className="flex items-center justify-between text-[10px] opacity-75 mb-1">
                          <span className="font-bold">
                            {isUser ? 'You' : character.name}
                          </span>
                          <span>{formatMessageTimestamp(msg.created_at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {!isUser && isSynthesisSupported && (
                          <button
                            type="button"
                            onClick={() =>
                              onSpeakMessage(
                                msg.content,
                                (msg.language as SupportedLanguage) || language,
                                msg.id
                              )
                            }
                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#8B5CF6] dark:text-[#22D3EE] hover:underline"
                          >
                            <Volume2 className="h-3 w-3" />
                            <span>Listen</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
