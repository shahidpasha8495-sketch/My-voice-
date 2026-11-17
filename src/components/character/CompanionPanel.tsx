import { Globe, Mic, Radio, Sparkles, Volume2 } from 'lucide-react';
import React, { useState } from 'react';
import {
  ALL_COMPANION_LIST,
  PLUSH_CHARACTERS,
  type PlushCharacterId,
} from '../../config/characters';
import type {
  CompanionExpression,
  SupportedLanguage,
  VoiceState,
} from '../../types';
import { cn } from '../../utils/formatters';
import { getLanguageMetadata } from '../../utils/language';
import { PlushCharacter } from './PlushCharacter';

export interface CompanionPanelProps {
  selectedCharacterId: PlushCharacterId;
  voiceState: VoiceState;
  language: SupportedLanguage;
  autoSpeak: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  onSelectCharacter: (id: PlushCharacterId) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onOpenStudio: () => void;
  onOpenGallery: () => void;
}

const COMPANION_VOICE_PROMPT: Record<VoiceState, string> = {
  idle: 'Tap to talk',
  requesting_permission: 'Requesting mic access...',
  listening: "I'm listening...",
  speech_detected: "I'm listening...",
  recording: 'Recording audio...',
  transcribing: 'Transcribing audio...',
  processing: 'Thinking...',
  generating_response: 'Thinking...',
  speaking: 'Talking to you...',
  paused: 'Speech paused',
  completed: 'Completed',
  error: "Let's try that again.",
};

const EXPRESSION_OPTIONS: Array<{
  id: CompanionExpression;
  emoji: string;
  label: string;
}> = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'excited', emoji: '🤩', label: 'Excited' },
  { id: 'thinking', emoji: '🤔', label: 'Thinking' },
  { id: 'confused', emoji: '🧐', label: 'Confused' },
  { id: 'sad', emoji: '🥺', label: 'Sad' },
  { id: 'sleeping', emoji: '😴', label: 'Sleeping' },
  { id: 'celebrating', emoji: '🎉', label: 'Celebrate' },
];

export const CompanionPanel: React.FC<CompanionPanelProps> = ({
  selectedCharacterId,
  voiceState,
  language,
  autoSpeak,
  isListening,
  isSpeaking,
  onSelectCharacter,
  onStartListening,
  onStopListening,
  onOpenStudio,
  onOpenGallery,
}) => {
  const [manualExpression, setManualExpression] =
    useState<CompanionExpression>('happy');
  const companion =
    PLUSH_CHARACTERS[selectedCharacterId] || PLUSH_CHARACTERS.mellow;
  const langMeta = getLanguageMetadata(language);
  const voiceStatusText = COMPANION_VOICE_PROMPT[voiceState];

  return (
    <aside
      aria-label="Contextual AI Plush Companion Panel"
      data-testid="contextual-companion-panel"
      className="hidden 2xl:flex h-full w-80 shrink-0 flex-col border-l border-white/[0.08] bg-[#111426]/90 backdrop-blur-2xl select-none overflow-y-auto p-4 gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#A855F7]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#A1A1B8]">
            Companion Dock
          </span>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border',
            isListening
              ? 'bg-[#22D3EE]/15 border-[#22D3EE]/40 text-[#22D3EE]'
              : isSpeaking
                ? 'bg-[#34D399]/15 border-[#34D399]/40 text-[#34D399]'
                : 'bg-[#191B30] border-white/[0.08] text-[#A1A1B8]'
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isListening
                ? 'bg-[#22D3EE] animate-ping'
                : isSpeaking
                  ? 'bg-[#34D399] animate-pulse'
                  : 'bg-[#8B5CF6]'
            )}
          />
          {voiceStatusText}
        </span>
      </div>

      {/* Live 3D Plush Companion Stage Card */}
      <div className="relative flex flex-col items-center rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#191B30] to-[#101124] p-5 text-center shadow-card-subtle overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-36 w-36 rounded-full blur-2xl opacity-30"
          style={{
            background: `radial-gradient(circle, ${companion.colors.auraFrom}, ${companion.colors.auraTo})`,
          }}
        />

        <PlushCharacter
          characterId={selectedCharacterId}
          voiceState={voiceState}
          expression={voiceState === 'idle' ? manualExpression : undefined}
          size="md"
          interactive={true}
          onClick={isListening ? onStopListening : onStartListening}
        />

        <h3 className="mt-2 font-display text-lg font-extrabold text-[#F8FAFC]">
          {companion.name}
        </h3>
        <p className="text-xs font-semibold text-[#22D3EE]">{companion.role}</p>
        <p className="mt-0.5 text-[10px] font-medium text-[#C4B5FD]">
          {companion.expertiseField}
        </p>
        <p className="mt-1 text-[11px] text-[#A1A1B8] leading-relaxed">
          {companion.shortTrait}
        </p>

        {/* Live Expression Mood Switcher */}
        <div className="mt-3 flex flex-wrap justify-center gap-1">
          {EXPRESSION_OPTIONS.map((expr) => (
            <button
              key={expr.id}
              type="button"
              onClick={() => setManualExpression(expr.id)}
              title={`${expr.label} expression`}
              className={cn(
                'rounded-lg px-2 py-1 text-[10px] font-medium transition-all border',
                manualExpression === expr.id && voiceState === 'idle'
                  ? 'border-[#22D3EE]/60 bg-[#22D3EE]/15 text-[#F8FAFC]'
                  : 'border-white/[0.08] bg-[#090914]/60 text-[#A1A1B8] hover:text-white'
              )}
            >
              <span>{expr.emoji}</span>
            </button>
          ))}
        </div>

        {/* Specialty Badges */}
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {companion.specialtyBadges.map((badge) => (
            <span
              key={badge}
              className="rounded-lg border border-white/[0.08] bg-[#090914]/60 px-2 py-0.5 text-[10px] font-medium text-[#A1A1B8]"
            >
              {badge}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={isListening ? onStopListening : onStartListening}
          className={cn(
            'mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all',
            isListening
              ? 'bg-[#22D3EE] text-[#090914] shadow-glow-secondary'
              : 'bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE] text-[#F8FAFC] shadow-glow-primary hover:opacity-95'
          )}
        >
          <Mic className="h-3.5 w-3.5" />
          <span>{isListening ? "I'm listening..." : 'Tap to talk'}</span>
        </button>
      </div>

      {/* Quick 10-Companion Switcher */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#191B30]/80 p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1B8]">
            Switch Companion
          </span>
          <button
            type="button"
            onClick={onOpenGallery}
            className="text-[11px] font-semibold text-[#22D3EE] hover:underline"
          >
            Explore All →
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {ALL_COMPANION_LIST.map((char) => {
            const active = char.id === selectedCharacterId;
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => onSelectCharacter(char.id)}
                title={`${char.name} (${char.personality})`}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl p-1.5 border transition-all',
                  active
                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 shadow-glow-primary'
                    : 'border-white/[0.06] bg-[#101124]/70 hover:border-white/20'
                )}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: char.colors.primary }}
                />
                <span className="text-[9px] font-bold text-[#F8FAFC] truncate w-full text-center">
                  {char.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Intelligence & Language Info */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#191B30]/75 p-3.5 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[#A1A1B8]">
            <Globe className="h-3.5 w-3.5 text-[#22D3EE]" />
            Active Language
          </span>
          <span className="font-bold text-[#F8FAFC]">{langMeta.nativeName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[#A1A1B8]">
            <Volume2 className="h-3.5 w-3.5 text-[#A855F7]" />
            Spoken Replies
          </span>
          <span
            className={cn(
              'font-bold',
              autoSpeak ? 'text-[#34D399]' : 'text-[#72758E]'
            )}
          >
            {autoSpeak ? 'Enabled' : 'Muted'}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenStudio}
          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#101124] py-2 text-xs font-semibold text-[#F8FAFC] hover:border-[#22D3EE]/50 transition-colors"
        >
          <Radio className="h-3.5 w-3.5 text-[#F472B6]" />
          <span>Enter Full Voice Studio</span>
        </button>
      </div>
    </aside>
  );
};
