import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Play,
  Sparkles,
  Volume2,
  Wand2,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  ALL_COMPANION_LIST,
  getCharacterVoicePreview,
  getCharacterWelcome,
  PLUSH_CHARACTERS,
  type PlushCharacterId,
} from '../../config/characters';
import type {
  CompanionExpression,
  SupportedLanguage,
  VoiceState,
} from '../../types';
import { cn } from '../../utils/formatters';
import { PlushCharacter } from './PlushCharacter';

export interface CharacterGalleryProps {
  selectedCharacterId: PlushCharacterId;
  language: SupportedLanguage;
  onSelectCharacter: (id: PlushCharacterId) => void;
  onPreviewVoice?: (text: string, lang: SupportedLanguage) => void;
  onStartTalkingWithCharacter?: (id: PlushCharacterId) => void;
}

const PREVIEW_STATES: Array<{
  state: VoiceState;
  expression: CompanionExpression;
  label: string;
}> = [
  { state: 'idle', expression: 'happy', label: 'Happy' },
  { state: 'listening', expression: 'listening', label: 'Listening' },
  { state: 'processing', expression: 'thinking', label: 'Thinking' },
  { state: 'speaking', expression: 'speaking', label: 'Speaking' },
  { state: 'idle', expression: 'excited', label: 'Excited' },
  { state: 'idle', expression: 'confused', label: 'Confused' },
  { state: 'idle', expression: 'sad', label: 'Sad' },
  { state: 'idle', expression: 'sleeping', label: 'Sleeping' },
  { state: 'idle', expression: 'celebrating', label: 'Celebrating' },
];

export const CharacterGallery: React.FC<CharacterGalleryProps> = ({
  selectedCharacterId,
  language,
  onSelectCharacter,
  onPreviewVoice,
  onStartTalkingWithCharacter,
}) => {
  const [focusedId, setFocusedId] =
    useState<PlushCharacterId>(selectedCharacterId);
  const [previewState, setPreviewState] = useState<VoiceState>('idle');
  const [previewExpression, setPreviewExpression] =
    useState<CompanionExpression>('happy');

  const activeChar = PLUSH_CHARACTERS[focusedId] || PLUSH_CHARACTERS.mellow;

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-6 sm:px-8"
      data-testid="character-gallery-view"
    >
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Gallery Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-3.5 py-1 text-xs font-semibold text-[#8B5CF6] dark:text-[#22D3EE] mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Original 3D Plush & AI Companions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
              Meet the Plush AI Family
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-[#94A3B8]">
              Explore all 10 intelligent companions, preview their 9 live voice-reactive expressions, and choose your favorite partner.
            </p>
          </div>
        </div>

        {/* Interactive Spotlight Stage for Focused Character */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChar.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-3xl border border-purple-200/70 dark:border-white/10 bg-white/80 dark:bg-[#171B2B]/85 p-6 sm:p-8 shadow-card-subtle backdrop-blur-xl"
          >
            {/* Left: Large 3D Plush Preview & Animation State Tester */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100/70 via-pink-50/50 to-sky-100/70 dark:from-[#101321] dark:via-[#1D1836] dark:to-[#112233] p-6 border border-purple-200/50 dark:border-white/10">
              <PlushCharacter
                characterId={activeChar.id}
                voiceState={previewState}
                expression={previewExpression}
                amplitude={previewState === 'speaking' ? 0.65 : 0.2}
                size="lg"
              />

              {/* State Animation Preview Selector */}
              <div className="mt-5 w-full">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-center text-slate-500 dark:text-[#94A3B8] mb-2 flex items-center justify-center gap-1">
                  <Wand2 className="h-3 w-3 text-[#8B5CF6]" />
                  <span>Preview Expression State</span>
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {PREVIEW_STATES.map((item) => (
                    <button
                      key={item.expression}
                      type="button"
                      onClick={() => {
                        setPreviewState(item.state);
                        setPreviewExpression(item.expression);
                      }}
                      className={cn(
                        'rounded-xl px-2.5 py-1 text-xs font-medium transition-all',
                        previewExpression === item.expression
                          ? 'bg-[#8B5CF6] text-white shadow-sm'
                          : 'bg-white/70 dark:bg-white/5 text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Character Details, Personality, & Actions */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8B5CF6] dark:text-[#22D3EE]">
                      {activeChar.role}
                    </span>
                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                      {activeChar.name}
                    </h3>
                  </div>

                  {selectedCharacterId === activeChar.id && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34D399]/15 border border-[#34D399]/40 px-3 py-1 text-xs font-semibold text-[#10B981] dark:text-[#34D399]">
                      <Check className="h-3.5 w-3.5" />
                      Active Companion
                    </span>
                  )}
                </div>

                <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-[#F8FAFC]/90">
                  {activeChar.description}
                </p>

                <div className="rounded-2xl bg-purple-50/80 dark:bg-[#090B14]/70 border border-purple-200/50 dark:border-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-1">
                    Signature Greeting ({language})
                  </p>
                  <p className="text-sm italic text-slate-800 dark:text-[#F8FAFC]">
                    &ldquo;{getCharacterWelcome(activeChar, language)}&rdquo;
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 border border-purple-100 dark:border-white/10">
                    <span className="block font-semibold text-slate-500 dark:text-[#94A3B8]">
                      Knowledge Specialty
                    </span>
                    <span className="mt-0.5 block font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {activeChar.knowledgeLevel} · {activeChar.expertiseField}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 border border-purple-100 dark:border-white/10">
                    <span className="block font-semibold text-slate-500 dark:text-[#94A3B8]">
                      Signature Accessory
                    </span>
                    <span className="mt-0.5 block font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {activeChar.accessory}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeChar.specialtyBadges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-[#8B5CF6]/15 px-3 py-1 text-xs font-semibold text-[#8B5CF6] dark:text-[#C4B5FD]"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-purple-200/50 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    onSelectCharacter(activeChar.id);
                    onStartTalkingWithCharacter?.(activeChar.id);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] px-5 py-3 text-sm font-bold text-white shadow-glow-primary hover:opacity-95 transition-all"
                >
                  <Check className="h-4 w-4" />
                  <span>
                    {selectedCharacterId === activeChar.id
                      ? `Talk with ${activeChar.name}`
                      : `Select ${activeChar.name}`}
                  </span>
                </button>

                {onPreviewVoice && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewState('speaking');
                      setPreviewExpression('speaking');
                      onPreviewVoice(
                        getCharacterVoicePreview(activeChar, language),
                        language
                      );
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-purple-300 dark:border-white/15 bg-white/80 dark:bg-[#101321] px-4 py-3 text-sm font-semibold text-slate-800 dark:text-[#F8FAFC] hover:border-[#8B5CF6] transition-all"
                  >
                    <Volume2 className="h-4 w-4 text-[#8B5CF6]" />
                    <span>Preview Voice</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* All 10 Companions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {ALL_COMPANION_LIST.map((char) => {
            const isSelected = char.id === selectedCharacterId;
            const isFocused = char.id === focusedId;
            return (
              <motion.div
                key={char.id}
                whileHover={{ y: -4 }}
                onClick={() => setFocusedId(char.id)}
                className={cn(
                  'cursor-pointer rounded-3xl border p-4 flex flex-col items-center text-center transition-all backdrop-blur-xl',
                  isFocused
                    ? 'border-[#8B5CF6] bg-white/95 dark:bg-[#171B2B] shadow-glow-primary'
                    : 'border-purple-200/60 dark:border-white/10 bg-white/70 dark:bg-[#171B2B]/60 hover:border-[#8B5CF6]/50'
                )}
              >
                <PlushCharacter
                  characterId={char.id}
                  voiceState={isFocused ? previewState : 'idle'}
                  expression={isFocused ? previewExpression : 'happy'}
                  size="sm"
                  interactive={false}
                />

                <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {char.name}
                </h4>
                <p className="text-xs font-semibold text-[#8B5CF6] dark:text-[#22D3EE]">
                  {char.personality}
                </p>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-[#94A3B8] line-clamp-2">
                  {char.description}
                </p>

                <div className="mt-4 flex w-full items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFocusedId(char.id);
                      onSelectCharacter(char.id);
                    }}
                    className={cn(
                      'flex-1 rounded-xl py-2 text-xs font-bold transition-all',
                      isSelected
                        ? 'bg-[#34D399]/20 text-[#10B981] dark:text-[#34D399] border border-[#34D399]/40'
                        : 'bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-white shadow-sm hover:opacity-95'
                    )}
                  >
                    {isSelected ? 'Selected ✓' : 'Select'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFocusedId(char.id);
                      setPreviewState('speaking');
                      setPreviewExpression('speaking');
                      onPreviewVoice?.(
                        getCharacterVoicePreview(char, language),
                        language
                      );
                    }}
                    aria-label={`Preview ${char.name}`}
                    title="Preview Voice & Animation"
                    className="rounded-xl border border-purple-200 dark:border-white/10 p-2 text-slate-700 dark:text-[#F8FAFC] hover:bg-purple-100/50 dark:hover:bg-white/10"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
