import { motion } from 'framer-motion';
import {
  AlertCircle,
  CalendarClock,
  Loader2,
  Radio,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import {
  PLUSH_CHARACTERS,
  getCharacterWelcome,
  getDailyGreeting,
  type PlushCharacterId,
} from '../../config/characters';
import type { Message, SupportedLanguage, VoiceState } from '../../types';
import { FOLLOW_UP_QUICK_ACTIONS, getLanguageMetadata } from '../../utils/language';
import { CharacterSelector } from '../character/CharacterSelector';
import { VoiceControls } from '../voice/VoiceControls';
import { VoiceOrb } from '../voice/VoiceOrb';
import { WeatherUvWidget } from '../weather/WeatherUvWidget';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export interface ChatWindowProps {
  messages: Message[];
  language: SupportedLanguage;
  voiceState: VoiceState;
  voiceStatusLabel: string;
  liveTranscriptPreview: string;
  isLoadingHistory: boolean;
  isSending: boolean;
  chatError: string | null;
  voiceError: string | null;
  isRecognitionSupported: boolean;
  isSynthesisSupported: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  isMuted?: boolean;
  volume?: number;
  activeSpeakingMessageId: string | null;
  hasReplayableResponse: boolean;
  selectedCharacterId?: PlushCharacterId;
  userDisplayName?: string | null;
  onRetryConnection?: () => void;
  onToggleMute?: () => void;
  onVolumeChange?: (volume: number) => void;
  onSelectCharacter?: (id: PlushCharacterId) => void;
  onOpenVoiceStudio?: () => void;
  onOpenCharacterGallery?: () => void;
  onSelectSuggestedPrompt: (prompt: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
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
  chatError,
  voiceError,
  isRecognitionSupported,
  isSynthesisSupported,
  isListening,
  isSpeaking,
  isPaused,
  isMuted = false,
  volume = 1,
  activeSpeakingMessageId,
  hasReplayableResponse,
  selectedCharacterId = 'mellow',
  userDisplayName,
  onRetryConnection,
  onToggleMute,
  onVolumeChange,
  onSelectCharacter,
  onOpenVoiceStudio,
  onOpenCharacterGallery,
  onSelectSuggestedPrompt,
  onStartListening,
  onStopListening,
  onCancelListening,
  onSpeakMessage,
  onStopSpeaking,
  onPauseSpeaking,
  onResumeSpeaking,
  onReplayResponse,
  onDismissChatError,
  onDismissVoiceError,
}) => {
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
             MYVOICE PLUSH COMPANION WELCOME EXPERIENCE (Empty State)
             ============================================================= */
          <div
            className="flex flex-col items-center justify-center py-2 sm:py-4 text-center"
            data-testid="empty-conversation-state"
          >
            {/* Personalized Greeting, Date & Tagline Pill */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-purple-300/60 dark:border-[#8B5CF6]/35 bg-white/80 dark:bg-[#191B30]/90 px-4 py-1 text-xs font-semibold text-[#8B5CF6] dark:text-[#22D3EE] shadow-sm mb-3 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#F472B6]" />
              <span>
                👋 {dailyGreeting} · Your AI, Your Little Companion.
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-[#A1A1B8]">
                <CalendarClock className="h-3 w-3" />
                {formattedToday}
              </span>
            </div>

            {/* Welcome Greeting & Supporting Text */}
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-[#7C3AED] to-[#EC4899] dark:from-[#F8FAFC] dark:via-[#C4B5FD] dark:to-[#22D3EE] bg-clip-text text-transparent">
              Hey there! Ready to talk?
            </h2>
            <p className="mt-2 max-w-xl text-sm sm:text-base font-medium text-slate-600 dark:text-[#A1A1B8]">
              Your little AI companion is always ready to listen.{' '}
              <span className="text-slate-500 dark:text-[#72758E]">
                A little personality. A lot of intelligence.
              </span>
            </p>

            {/* Center 3D Plush Character inside Glowing VoiceOrb */}
            <div className="my-5">
              <VoiceOrb
                state={voiceState}
                characterId={selectedCharacterId}
                statusText={voiceStatusLabel}
                transcriptPreview={liveTranscriptPreview}
                size="lg"
                onClick={handleOrbToggle}
              />
            </div>

            {/* Character Personality Card */}
            <div className="mb-5 max-w-xl w-full rounded-2xl border border-purple-200/70 dark:border-white/[0.08] bg-white/80 dark:bg-[#191B30]/90 px-5 py-3.5 shadow-card-subtle backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
                <span className="text-slate-900 dark:text-[#F8FAFC] text-sm">
                  {character.name}
                </span>
                <span className="rounded-full bg-[#8B5CF6]/15 px-2.5 py-0.5 text-[#8B5CF6] dark:text-[#22D3EE]">
                  {character.personality}
                </span>
                <span className="text-slate-500 dark:text-[#A1A1B8]">
                  · {character.accessory}
                </span>
              </div>
              <p className="mt-1.5 text-xs sm:text-sm italic text-slate-700 dark:text-[#F8FAFC]/90">
                &ldquo;{getCharacterWelcome(character, language)}&rdquo;
              </p>
            </div>

            {/* Voice Controls & Open Voice Studio Action */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-7">
              <VoiceControls
                voiceState={voiceState}
                isRecognitionSupported={isRecognitionSupported}
                isSynthesisSupported={isSynthesisSupported}
                isListening={isListening}
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
                onCancelListening={onCancelListening}
                onReplayResponse={onReplayResponse}
                onStopSpeaking={onStopSpeaking}
                onPauseSpeaking={onPauseSpeaking}
                onResumeSpeaking={onResumeSpeaking}
              />

              {onOpenVoiceStudio && (
                <button
                  type="button"
                  onClick={onOpenVoiceStudio}
                  className="inline-flex items-center gap-2 rounded-xl border border-purple-300/70 dark:border-white/[0.08] bg-white/85 dark:bg-[#191B30] px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-[#F8FAFC] hover:border-[#8B5CF6] transition-all"
                >
                  <Radio className="h-3.5 w-3.5 text-[#F472B6]" />
                  <span>Open Voice Studio</span>
                </button>
              )}
            </div>

            {/* Live Weather & UV Index Environmental Widget */}
            <div className="w-full max-w-4xl mb-7">
              <WeatherUvWidget />
            </div>

            {/* 5-Character Interactive Selection Carousel */}
            {onSelectCharacter && (
              <div className="w-full max-w-4xl mb-7">
                <CharacterSelector
                  selectedId={selectedCharacterId}
                  onSelect={onSelectCharacter}
                  onOpenGallery={onOpenCharacterGallery}
                />
              </div>
            )}

            {/* Everyday Superpowers / Quick Actions */}
            <div className="w-full max-w-4xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#72758E]">
                Everyday Quick Actions ({langMeta.nativeName})
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {langMeta.suggestedPrompts.map((item, idx) => (
                  <motion.button
                    key={idx}
                    type="button"
                    disabled={isSending}
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectSuggestedPrompt(item.prompt)}
                    className="group flex flex-col items-start justify-between rounded-2xl border border-purple-200/70 dark:border-white/[0.08] bg-white/80 dark:bg-[#191B30]/90 p-4 text-left transition-all hover:border-[#8B5CF6]/60 hover:shadow-glow-primary backdrop-blur-md"
                  >
                    <span className="rounded-md bg-[#8B5CF6]/15 px-2 py-0.5 text-[10px] font-bold text-[#8B5CF6] dark:text-[#22D3EE]">
                      {item.category}
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
          </div>
        ) : (
          /* =============================================================
             ACTIVE CONVERSATION MESSAGES + COMPACT PLUSH COMPANION STAGE
             ============================================================= */
          <>
            <div className="sticky top-2 z-10 mx-auto flex flex-col items-center justify-center rounded-2xl border border-purple-200/70 dark:border-white/[0.08] bg-white/85 dark:bg-[#101124]/90 px-4 py-3 backdrop-blur-xl shadow-card-subtle">
              <div className="flex flex-wrap items-center justify-center gap-4">
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
                  onCancelListening={onCancelListening}
                  onReplayResponse={onReplayResponse}
                  onStopSpeaking={onStopSpeaking}
                  onPauseSpeaking={onPauseSpeaking}
                  onResumeSpeaking={onResumeSpeaking}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-2" data-testid="message-list">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  characterId={selectedCharacterId}
                  isSpeakingThisMessage={
                    isSpeaking && activeSpeakingMessageId === msg.id
                  }
                  isSynthesisSupported={isSynthesisSupported}
                  onSpeak={onSpeakMessage}
                  onStopSpeaking={onStopSpeaking}
                />
              ))}

              {isSending && <TypingIndicator />}

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
