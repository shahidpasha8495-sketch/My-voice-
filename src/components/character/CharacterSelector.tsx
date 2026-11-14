import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import React from 'react';
import {
  PLUSH_CHARACTER_LIST,
  type PlushCharacterConfig,
  type PlushCharacterId,
} from '../../config/characters';
import { cn } from '../../utils/formatters';
import { PlushCharacter } from './PlushCharacter';

export interface CharacterSelectorProps {
  selectedId: PlushCharacterId;
  onSelect: (id: PlushCharacterId) => void;
  onOpenGallery?: () => void;
  compact?: boolean;
  className?: string;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  selectedId,
  onSelect,
  onOpenGallery,
  compact = false,
  className,
}) => {
  return (
    <div
      className={cn('w-full', className)}
      role="region"
      aria-label="Choose your Plush AI companion"
      data-testid="character-selector-carousel"
    >
      {!compact && (
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#A78BFA]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
              Choose Your Companion
            </span>
          </div>
          {onOpenGallery && (
            <button
              type="button"
              onClick={onOpenGallery}
              className="text-xs font-semibold text-[#8B5CF6] dark:text-[#22D3EE] hover:underline"
            >
              Explore Character Gallery →
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {PLUSH_CHARACTER_LIST.map((char: PlushCharacterConfig) => {
          const isSelected = char.id === selectedId;
          return (
            <motion.button
              key={char.id}
              type="button"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(char.id)}
              aria-pressed={isSelected}
              aria-label={`Select ${char.name} - ${char.personality}`}
              data-testid={`select-character-${char.id}`}
              className={cn(
                'group relative flex flex-col items-center rounded-2xl border p-3 text-center transition-all backdrop-blur-xl',
                isSelected
                  ? 'border-[#8B5CF6] bg-white/90 dark:bg-[#171B2B]/95 shadow-glow-primary'
                  : 'border-purple-200/60 dark:border-white/10 bg-white/65 dark:bg-[#171B2B]/55 hover:border-[#8B5CF6]/50'
              )}
            >
              {isSelected && (
                <span
                  className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-white shadow-sm"
                  aria-hidden="true"
                >
                  <Check className="h-3 w-3" />
                </span>
              )}

              <PlushCharacter
                characterId={char.id}
                voiceState={isSelected ? 'listening' : 'idle'}
                size="xs"
                interactive={false}
              />

              <span className="mt-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                {char.name}
              </span>
              <span className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-[#94A3B8] line-clamp-1">
                {char.personality}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
