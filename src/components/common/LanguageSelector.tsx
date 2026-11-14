import { Globe } from 'lucide-react';
import React from 'react';
import type { SupportedLanguage } from '../../types';
import { cn } from '../../utils/formatters';
import { LANGUAGE_LIST } from '../../utils/language';

export interface LanguageSelectorProps {
  value: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  compact = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xl bg-[#171B2B] p-1 border border-white/10 shadow-sm',
        className
      )}
      role="group"
      aria-label="Select conversation language"
    >
      {!compact && (
        <span className="pl-2 pr-1 text-[#94A3B8] flex items-center" aria-hidden="true">
          <Globe className="w-4 h-4 text-[#22D3EE]" />
        </span>
      )}
      {LANGUAGE_LIST.map((lang) => {
        const isActive = value === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            disabled={disabled}
            onClick={() => onChange(lang.code)}
            aria-pressed={isActive}
            aria-label={`Switch language to ${lang.name} (${lang.nativeName})`}
            className={cn(
              'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5',
              isActive
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]/90 text-[#F8FAFC] shadow-glow-primary'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span>{compact ? lang.shortLabel : lang.nativeName}</span>
            {!compact && lang.code !== 'en-US' && (
              <span className="text-[10px] opacity-80 hidden sm:inline">
                ({lang.name})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
