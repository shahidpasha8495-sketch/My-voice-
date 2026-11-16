import { motion } from 'framer-motion';
import {
  AlertCircle,
  Brain,
  CalendarClock,
  CloudSun,
  Gauge,
  GraduationCap,
  Loader2,
  PhoneCall,
  Radio,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  PLUSH_CHARACTERS,
  getCharacterWelcome,
  getDailyGreeting,
  type PlushCharacterId,
} from '../../config/characters';
import type {
  ConversationStyleMode,
  Message,
  SoundscapeType,
  SupportedLanguage,
  VoiceState,
} from '../../types';
import { cn } from '../../utils/formatters';
import { FOLLOW_UP_QUICK_ACTIONS, getLanguageMetadata } from '../../utils/language';
import { CharacterSelector } from '../character/CharacterSelector';
import { VoiceControls } from '../voice/VoiceControls';
import { VoiceOrb } from '../voice/VoiceOrb';
import { WeatherUvWidget } from '../weather/WeatherUvWidget';
import { MessageBubble } from './MessageBubble';
import { QuickModesDock } from './QuickModesDock';
import { TypingIndicator } from './TypingIndicator';
import { VoiceAnalyticsWidget } from './VoiceAnalyticsWidget';

export interface ChatWindowProps {
  messages: Message[];
  language: SupportedLanguage;
  voiceState: VoiceState;
  voiceStatusLabel: string;
  liveTranscriptPreview: string;
  isLoadingHistory: boolean;
  isSending: boolean;
  streamingMessageId?: string | null;
  chatError: string | null;
  voiceError: string | null;
  isRecognitionSupported: boolean;
  isSynthesisSupported: boolean;
  isListening: boolean;
  isPushToTalk?: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  isMuted?: boolean;
  volume?: number;
  activeSpeakingMessageId: string | null;
  hasReplayableResponse: boolean;
  selectedCharacterId?: PlushCharacterId;
  userDisplayName?: string | null;
  styleMode?: ConversationStyleMode;
  handsFreeLoop?: boolean;
  soundscape?: SoundscapeType;
  sttLatencyMs?: number | null;
  firstTokenMs?: number | null;
  llmLatencyMs?: number | null;
  ttsLatencyMs?: number | null;
  isCachedResponse?: boolean;
  onChangeStyleMode?: (mode: ConversationStyleMode) => void;
  onToggleHandsFreeLoop?: () => void;
  onChangeSoundscape?: (soundscape: SoundscapeType) => void;
  onOpenImmersiveCall?: () => void;
  onRetryConnection?: () => void;
  onToggleMute?: () => void;
  onVolumeChange?: (volume: number) => void;
  onSelectCharacter?: (id: PlushCharacterId) => void;
  onOpenVoiceStudio?: () => void;
  onOpenCharacterGallery?: () => void;
  onSelectSuggestedPrompt: (prompt: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onStartPushToTalk?: () => void;
  onStopPushToTalk?: () => void;
  onCancelListening: () => void;
  onSpeakMessage: (text: string, lang: SupportedLanguage, messageId: string) => void;
  onStopSpeaking: () => void;
  onPauseSpeaking: () => void;
  onResumeSpeaking: () => void;
  onReplayResponse: () => void;
  onDismissChatError: () => void;
  onDismissVoiceError: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  language,
  voiceState,
  voiceStatusLabel,
  liveTranscriptPreview,
  isLoadingHistory,
  isSending,
  streamingMessageId = null,
  chatError,
  voiceError,
  isRecognitionSupported,
  isSynthesisSupported,
  isListening,
  isPushToTalk = false,
  isSpeaking,
  isPaused,
  isMuted = false,
  volume = 1,
  activeSpeakingMessageId,
  hasReplayableResponse,
  selectedCharacterId = 'mellow',
  userDisplayName,
  styleMode = 'turbo',
  handsFreeLoop = false,
  soundscape = 'off',
  sttLatencyMs = null,
  firstTokenMs = null,
  llmLatencyMs = null,
  ttsLatencyMs = null,
  isCachedResponse = false,
  onChangeStyleMode,
  onToggleHandsFreeLoop,
  onChangeSoundscape,
  onOpenImmersiveCall,
  onRetryConnection,
  onToggleMute,
  onVolumeChange,
  onSelectCharacter,
  onOpenVoiceStudio,
  onOpenCharacterGallery,
  onSelectSuggestedPrompt,
  onStartListening,
  onStopListening,
  onStartPushToTalk,
  onStopPushToTalk,
  onCancelListening,
  onSpeakMessage,
  onStopSpeaking,
  onPauseSpeaking,
  onResumeSpeaking,
  onReplayResponse,
  onDismissChatError,
  onDismissVoiceError,
}) => {
  const [homeHubTab, setHomeHubTab] = useState<'dolls' | 'speed' | 'weather'>('dolls');
  const [showActiveChatControls, setShowActiveChatControls] = useState(false);

  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const langMeta = getLanguageMetadata(language);
  const character =
    PLUSH_CHARACTERS[selectedCharacterId] || PLUSH_CHARACTERS.mellow;
  const dailyGreeting = getDailyGreeting(userDisplayName);
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isSending, liveTranscriptPreview]);

  const handleOrbToggle = () => {
    if (isListening) {
      onStopListening();
    } else if (isSpeaking) {
      onStopSpeaking();
    } else {
      onStartListening();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 md:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        {/* Error Notifications */}
        {(chatError || voiceError) && (
          <div className="flex flex-col gap-2" role="alert">
            {chatError && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#F87171]/40 bg-[#F87171]/10 px-4 py-3 text-xs sm:text-sm text-[#EF4444] dark:text-[#F87171]">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{chatError}</span>
                </div>
                <div className="flex items-center gap-2">
                  {onRetryConnection && (
                    <button
                      type="button"
                      onClick={() => {
                        onDismissChatError();
                        onRetryConnection();
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#F87171]/40 bg-[#F87171]/20 px-2.5 py-1 text-xs font-bold hover:bg-[#F87171]/30 transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Retry Connection</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onDismissChatError}
                    aria-label="Dismiss chat error"
                    className="rounded-lg p-1 hover:bg-[#F87171]/20 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {voiceError && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#F87171]/40 bg-[#F87171]/10 px-4 py-3 text-xs sm:text-sm text-[#EF4444] dark:text-[#F87171]">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{voiceError}</span>
                </div>
                <button
                  type="button"
                  onClick={onDismissVoiceError}
                  aria-label="Dismiss voice error"
                  className="rounded-lg p-1 hover:bg-[#F87171]/20 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading Conversation History */}
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-[#A1A1B8]">
            <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
            <p className="mt-3 text-sm font-medium">
              Loading conversation history…
            </p>
          </div>
        ) : messages.length === 0 ? (
          /* =============================================================
             CLEAN, CLARITY-FIRST PLUSH COMPANION DASHBOARD (Empty State)
             ============================================================= */
          <div
            className="flex flex-col items-center justify-center py-2 sm:py-4 text-center"
            data-testid="empty-conversation-state"
          >
            {/* Personalized Greeting & Date Pill */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-purple-300/60 dark:border-[#8B5CF6]/35 bg-white/85 dark:bg-[#191B30]/90 px-4 py-1 text-xs font-semibold text-[#8B5CF6] dark:text-[#22D3EE] shadow-sm mb-3 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#F472B6]" />
              <span>👋 {dailyGreeting}</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-[#A1A1B8]">
                <CalendarClock className="h-3 w-3" />
                {formattedToday}
              </span>
            </div>

            {/* Crisp Doll Identity Hero Headline */}
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-[#7C3AED] to-[#EC4899] dark:from-[#F8FAFC] dark:via-[#C4B5FD] dark:to-[#22D3EE] bg-clip-text text-transparent">
              Talk with {character.name}
            </h2>
            <p className="mt-2 max-w-2xl text-sm sm:text-base font-medium text-slate-600 dark:text-[#A1A1B8] flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8B5CF6]/12 border border-[#8B5CF6]/25 px-3 py-0.5 text-xs font-bold text-[#7C3AED] dark:text-[#22D3EE]">
                <GraduationCap className="h-3.5 w-3.5" />
                {character.knowledgeLevel} · {character.expertiseField}
              </span>
            </p>

            {/* Centerpiece Interactive 3D Animated Doll */}
            <div className="my-4">
              <VoiceOrb
                state={voiceState}
                characterId={selectedCharacterId}
                statusText={voiceStatusLabel}
                transcriptPreview={liveTranscriptPreview}
                size="lg"
                onClick={handleOrbToggle}
              />
            </div>

            {/* Clean Doll Bio & Greeting Bubble */}
            <div className="mb-4 max-w-2xl w-full rounded-2xl border border-purple-200/70 dark:border-white/[0.08] bg-white/85 dark:bg-[#191B30]/90 px-5 py-3 shadow-card-subtle backdrop-blur-xl">
              <p className="text-xs sm:text-sm italic text-slate-700 dark:text-[#F8FAFC]/90">
                &ldquo;{getCharacterWelcome(character, language)}&rdquo;
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                {character.specialtyBadges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-purple-100/80 dark:bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-bold text-[#7C3AED] dark:text-[#C4B5FD]"
                  >
                    ✦ {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Focused Primary Action Controls */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
              <VoiceControls
                voiceState={voiceState}
                isRecognitionSupported={isRecognitionSupported}
                isSynthesisSupported={isSynthesisSupported}
                isListening={isListening}
                isPushToTalk={isPushToTalk}
                isSpeaking={isSpeaking}
                isPaused={isPaused}
                hasReplayableResponse={hasReplayableResponse}
                disabled={isSending}
                isMuted={isMuted}
                volume={volume}
                onToggleMute={onToggleMute}
                onVolumeChange={onVolumeChange}
                onStartListening={onStartListening}
                onStopListening={onStopListening}
                onStartPushToTalk={onStartPushToTalk}
                onStopPushToTalk={onStopPushToTalk}
                onCancelListening={onCancelListening}
                onReplayResponse={onReplayResponse}
                onStopSpeaking={onStopSpeaking}
                onPauseSpeaking={onPauseSpeaking}
                onResumeSpeaking={onResumeSpeaking}
              />

              {onOpenImmersiveCall && (
                <button
                  type="button"
                  onClick={onOpenImmersiveCall}
                  data-testid="hero-live-call-button"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#22D3EE] px-3.5 py-2 text-xs font-bold text-white shadow-glow-primary hover:opacity-95 transition-all"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>Live Call</span>
                </button>
              )}

              {onOpenVoiceStudio && (
                <button
                  type="button"
                  onClick={onOpenVoiceStudio}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300/70 dark:border-white/[0.08] bg-white/85 dark:bg-[#191B30] px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-[#F8FAFC] hover:border-[#8B5CF6] transition-all"
                >
                  <Radio className="h-3.5 w-3.5 text-[#F472B6]" />
                  <span>Studio</span>
                </button>
              )}
            </div>

            {/* Clean 3-Tab Dashboard Hub Navigation (Zero Vertical Clutter) */}
            <div className="w-full max-w-4xl">
              <div
                role="tablist"
                aria-label="Dashboard sections"
                className="mx-auto mb-5 inline-flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-purple-200/70 dark:border-white/[0.08] bg-white/80 dark:bg-[#131528]/90 p-1.5 backdrop-blur-xl shadow-sm"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={homeHubTab === 'dolls'}
                  data-testid="dashboard-tab-dolls"
                  onClick={() => setHomeHubTab('dolls')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                    homeHubTab === 'dolls'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-white shadow-sm'
                      : 'text-slate-600 dark:text-[#A1A1B8] hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <Brain className="h-3.5 w-3.5" />
                  <span>Dolls &amp; Expert Topics</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={homeHubTab === 'speed'}
                  data-testid="dashboard-tab-speed"
                  onClick={() => setHomeHubTab('speed')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                    homeHubTab === 'speed'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-white shadow-sm'
                      : 'text-slate-600 dark:text-[#A1A1B8] hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <Gauge className="h-3.5 w-3.5" />
                  <span>Speed Modes &amp; Telemetry</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={homeHubTab === 'weather'}
                  data-testid="dashboard-tab-weather"
                  onClick={() => setHomeHubTab('weather')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                    homeHubTab === 'weather'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-white shadow-sm'
                      : 'text-slate-600 dark:text-[#A1A1B8] hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <CloudSun className="h-3.5 w-3.5" />
                  <span>Live Weather &amp; UV</span>
                </button>
              </div>

              {/* HUB TAB 1: Dolls & Doll-Specific Expert Knowledge Prompts */}
              {homeHubTab === 'dolls' && (
                <div className="space-y-6">
                  {onSelectCharacter && (
                    <CharacterSelector
                      selectedId={selectedCharacterId}
                      onSelect={onSelectCharacter}
                      onOpenGallery={onOpenCharacterGallery}
                    />
                  )}

                  {/* Curated Expert Knowledge Topics for the Selected Animated Doll */}
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#72758E]">
                      Ask {character.name} About {character.expertiseField}
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {character.expertPrompts.map((item, idx) => (
                        <motion.button
                          key={`${character.id}-${idx}`}
                          type="button"
                          disabled={isSending}
                          whileHover={{ y: -3, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSelectSuggestedPrompt(item.prompt)}
                          className="group flex flex-col items-start justify-between rounded-2xl border border-purple-200/70 dark:border-white/[0.08] bg-white/85 dark:bg-[#191B30]/90 p-4 text-left transition-all hover:border-[#22D3EE]/60 hover:shadow-glow-primary backdrop-blur-md"
                        >
                          <span className="rounded-md bg-[#22D3EE]/15 px-2 py-0.5 text-[10px] font-bold text-[#0284C7] dark:text-[#22D3EE]">
                            {character.name} · {item.topic}
                          </span>
                          <span className="mt-2.5 text-sm font-bold text-slate-900 dark:text-[#F8FAFC] group-hover:text-[#8B5CF6] dark:group-hover:text-[#22D3EE] transition-colors">
                            {item.label}
                          </span>
                          <span className="mt-1 text-xs text-slate-600 dark:text-[#A1A1B8] line-clamp-2">
                            {item.prompt}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Everyday Language Quick Actions */}
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#72758E]">
                      Quick Actions ({langMeta.nativeName})
                    </p>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                      {langMeta.suggestedPrompts.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={isSending}
                          onClick={() => onSelectSuggestedPrompt(item.prompt)}
                          className="group flex flex-col items-start rounded-2xl border border-purple-200/60 dark:border-white/[0.07] bg-white/75 dark:bg-[#191B30]/75 p-3.5 text-left transition-all hover:border-[#8B5CF6]/60"
                        >
                          <span className="text-[10px] font-bold uppercase text-[#8B5CF6] dark:text-[#22D3EE]">
                            {item.category}
                          </span>
                          <span className="mt-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC] group-hover:text-[#8B5CF6] dark:group-hover:text-[#22D3EE]">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* HUB TAB 2: Speed Modes, Soundscape & Real-Time Pipeline Telemetry */}
              {homeHubTab === 'speed' && (
                <div className="space-y-4">
                  {onChangeStyleMode &&
                    onToggleHandsFreeLoop &&
                    onChangeSoundscape &&
                    onOpenImmersiveCall && (
                      <QuickModesDock
                        styleMode={styleMode}
                        handsFreeLoop={handsFreeLoop}
                        soundscape={soundscape}
                        firstTokenMs={firstTokenMs}
                        onChangeStyleMode={onChangeStyleMode}
                        onToggleHandsFreeLoop={onToggleHandsFreeLoop}
                        onChangeSoundscape={onChangeSoundscape}
                        onOpenImmersiveCall={onOpenImmersiveCall}
                      />
                    )}
                  <VoiceAnalyticsWidget
                    messages={messages}
                    language={language}
                    sttLatencyMs={sttLatencyMs}
                    firstTokenMs={firstTokenMs}
                    llmLatencyMs={llmLatencyMs}
                    ttsLatencyMs={ttsLatencyMs}
                    isCachedResponse={isCachedResponse}
                  />
                </div>
              )}

              {/* HUB TAB 3: Live Weather & UV Index */}
              {homeHubTab === 'weather' && <WeatherUvWidget />}
            </div>
          </div>
        ) : (
          /* =============================================================
             SPACIOUS, CLEAN ACTIVE CONVERSATION STAGE
             ============================================================= */
          <>
            <div className="sticky top-2 z-10 mx-auto w-full max-w-4xl rounded-2xl border border-purple-200/70 dark:border-white/[0.08] bg-white/90 dark:bg-[#101124]/92 px-3.5 py-2.5 backdrop-blur-xl shadow-card-subtle">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <VoiceOrb
                    state={voiceState}
                    characterId={selectedCharacterId}
                    statusText={voiceStatusLabel}
                    transcriptPreview={liveTranscriptPreview}
                    size="sm"
                    onClick={handleOrbToggle}
                  />
                  <VoiceControls
                    voiceState={voiceState}
                    isRecognitionSupported={isRecognitionSupported}
                    isSynthesisSupported={isSynthesisSupported}
                    isListening={isListening}
                    isPushToTalk={isPushToTalk}
                    isSpeaking={isSpeaking}
                    isPaused={isPaused}
                    hasReplayableResponse={hasReplayableResponse}
                    disabled={isSending}
                    isMuted={isMuted}
                    volume={volume}
                    onToggleMute={onToggleMute}
                    onVolumeChange={onVolumeChange}
                    onStartListening={onStartListening}
                    onStopListening={onStopListening}
                    onStartPushToTalk={onStartPushToTalk}
                    onStopPushToTalk={onStopPushToTalk}
                    onCancelListening={onCancelListening}
                    onReplayResponse={onReplayResponse}
                    onStopSpeaking={onStopSpeaking}
                    onPauseSpeaking={onPauseSpeaking}
                    onResumeSpeaking={onResumeSpeaking}
                  />
                </div>

                {/* Compact Speed & Controls Drawer Toggle */}
                <div className="flex items-center gap-2">
                  {firstTokenMs !== null && (
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-[#34D399]/15 border border-[#34D399]/35 px-2.5 py-1 text-[11px] font-mono font-bold text-[#059669] dark:text-[#34D399]">
                      <Zap className="h-3 w-3" />
                      {firstTokenMs}ms
                    </span>
                  )}

                  {onOpenImmersiveCall && (
                    <button
                      type="button"
                      onClick={onOpenImmersiveCall}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#22D3EE] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95"
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Live Call</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowActiveChatControls((prev) => !prev)}
                    aria-expanded={showActiveChatControls}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors',
                      showActiveChatControls
                        ? 'border-[#22D3EE]/60 bg-[#22D3EE]/15 text-[#0284C7] dark:text-[#22D3EE]'
                        : 'border-purple-200/70 dark:border-white/10 bg-white/80 dark:bg-[#171B2B] text-slate-600 dark:text-[#A1A1B8] hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Modes</span>
                  </button>
                </div>
              </div>

              {/* On-Demand Expandable Quick Modes & Speed Analytics Drawer */}
              {showActiveChatControls && (
                <div className="mt-3 space-y-3 border-t border-purple-200/50 dark:border-white/[0.07] pt-3">
                  {onChangeStyleMode &&
                    onToggleHandsFreeLoop &&
                    onChangeSoundscape &&
                    onOpenImmersiveCall && (
                      <QuickModesDock
                        styleMode={styleMode}
                        handsFreeLoop={handsFreeLoop}
                        soundscape={soundscape}
                        firstTokenMs={firstTokenMs}
                        onChangeStyleMode={onChangeStyleMode}
                        onToggleHandsFreeLoop={onToggleHandsFreeLoop}
                        onChangeSoundscape={onChangeSoundscape}
                        onOpenImmersiveCall={onOpenImmersiveCall}
                      />
                    )}
                  <VoiceAnalyticsWidget
                    messages={messages}
                    language={language}
                    sttLatencyMs={sttLatencyMs}
                    firstTokenMs={firstTokenMs}
                    llmLatencyMs={llmLatencyMs}
                    ttsLatencyMs={ttsLatencyMs}
                    isCachedResponse={isCachedResponse}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 pt-2" data-testid="message-list">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  characterId={selectedCharacterId}
                  isStreaming={streamingMessageId === msg.id}
                  isSpeakingThisMessage={
                    isSpeaking && activeSpeakingMessageId === msg.id
                  }
                  isSynthesisSupported={isSynthesisSupported}
                  onSpeak={onSpeakMessage}
                  onStopSpeaking={onStopSpeaking}
                />
              ))}

              {isSending && !streamingMessageId && <TypingIndicator />}

              {/* Smart 1-Click Follow-Up Actions after Assistant Response */}
              {!isSending &&
                messages.length > 0 &&
                messages[messages.length - 1]?.role === 'assistant' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-wrap items-center gap-2 pl-12 pt-1"
                    data-testid="smart-followup-chips"
                  >
                    {(FOLLOW_UP_QUICK_ACTIONS[language] || FOLLOW_UP_QUICK_ACTIONS['en-US']).map(
                      (action, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onSelectSuggestedPrompt(action.prompt)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/70 dark:border-white/[0.09] bg-white/85 dark:bg-[#191B30]/90 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-[#F8FAFC] hover:border-[#8B5CF6] hover:text-[#8B5CF6] dark:hover:border-[#22D3EE] dark:hover:text-[#22D3EE] transition-all shadow-sm"
                        >
                          <span>{action.label}</span>
                        </button>
                      )
                    )}
                  </motion.div>
                )}
            </div>
          </>
        )}

        <div ref={bottomAnchorRef} />
      </div>
    </div>
  );
};
