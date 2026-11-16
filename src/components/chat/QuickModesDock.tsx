import {
  Brain,
  CloudRain,
  Code2,
  GraduationCap,
  HeartHandshake,
  PhoneCall,
  Repeat,
  Sparkles,
  VolumeX,
  Zap,
} from 'lucide-react';
import React from 'react';
import type { ConversationStyleMode, SoundscapeType } from '../../types';
import { cn } from '../../utils/formatters';
import { playModeSwitchChime } from '../../utils/soundEffects';

export interface QuickModesDockProps {
  styleMode: ConversationStyleMode;
  handsFreeLoop: boolean;
  soundscape: SoundscapeType;
  firstTokenMs?: number | null;
  onChangeStyleMode: (mode: ConversationStyleMode) => void;
  onToggleHandsFreeLoop: () => void;
  onChangeSoundscape: (soundscape: SoundscapeType) => void;
  onOpenImmersiveCall: () => void;
  className?: string;
}

const STYLE_MODES: Array<{
  id: ConversationStyleMode;
  label: string;
  badge: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'turbo', label: 'Turbo', badge: '<0.5s', icon: Zap },
  { id: 'tutor', label: 'Tutor', badge: 'Clear', icon: GraduationCap },
  { id: 'brainstorm', label: 'Ideas', badge: 'Spark', icon: Brain },
  { id: 'calm', label: 'Calm', badge: 'Cozy', icon: HeartHandshake },
  { id: 'coder', label: 'Code', badge: 'Dev', icon: Code2 },
];

export const QuickModesDock: React.FC<QuickModesDockProps> = ({
  styleMode,
  handsFreeLoop,
  soundscape,
  firstTokenMs,
  onChangeStyleMode,
  onToggleHandsFreeLoop,
  onChangeSoundscape,
  onOpenImmersiveCall,
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-purple-200/70 dark:border-white/[0.08] bg-white/80 dark:bg-[#131528]/85 px-3 py-2.5 shadow-card-subtle backdrop-blur-xl',
        className
      )}
      data-testid="quick-modes-dock"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left: Style & Speed Mode Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STYLE_MODES.map((item) => {
            const Icon = item.icon;
            const active = styleMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  playModeSwitchChime();
                  onChangeStyleMode(item.id);
                }}
                aria-pressed={active}
                data-testid={`style-mode-${item.id}`}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition-all border',
                  active
                    ? 'border-[#22D3EE]/60 bg-gradient-to-r from-[#8B5CF6]/25 to-[#22D3EE]/20 text-slate-900 dark:text-[#F8FAFC] shadow-sm'
                    : 'border-transparent bg-slate-100/80 dark:bg-white/[0.04] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:border-white/15'
                )}
              >
                <Icon
                  className={cn(
                    'h-3.5 w-3.5',
                    active ? 'text-[#22D3EE]' : 'text-[#8B5CF6]'
                  )}
                />
                <span>{item.label}</span>
                <span
                  className={cn(
                    'rounded px-1 py-0.2 text-[9px] font-extrabold',
                    active
                      ? 'bg-[#22D3EE]/20 text-[#0284C7] dark:text-[#22D3EE]'
                      : 'bg-white/50 dark:bg-white/5 text-slate-500 dark:text-[#72758E]'
                  )}
                >
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Hands-Free Auto Give & Take + Ambient Soundscape + Live Call */}
        <div className="flex flex-wrap items-center gap-1.5">
          {firstTokenMs !== null && firstTokenMs !== undefined && (
            <span
              className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-[#34D399]/15 border border-[#34D399]/35 px-2 py-1 text-[10px] font-mono font-bold text-[#059669] dark:text-[#34D399]"
              title="Time to First Token / First Audio Chunk"
            >
              <Zap className="h-2.5 w-2.5" />
              {firstTokenMs}ms first token
            </span>
          )}

          {/* Auto Give & Take Continuous Loop */}
          <button
            type="button"
            onClick={() => {
              playModeSwitchChime();
              onToggleHandsFreeLoop();
            }}
            aria-pressed={handsFreeLoop}
            data-testid="hands-free-loop-toggle"
            title="Auto Give & Take: Automatically reopen mic right after AI finishes speaking"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition-all',
              handsFreeLoop
                ? 'border-[#34D399]/60 bg-[#34D399]/15 text-[#059669] dark:text-[#34D399]'
                : 'border-purple-200/60 dark:border-white/10 bg-white/70 dark:bg-[#191B30] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Repeat className={cn('h-3.5 w-3.5', handsFreeLoop && 'animate-spin')} />
            <span>{handsFreeLoop ? 'Auto Loop: ON' : 'Auto Loop'}</span>
          </button>

          {/* Cozy Soundscape Switcher */}
          <div className="inline-flex items-center rounded-xl border border-purple-200/60 dark:border-white/10 bg-white/70 dark:bg-[#191B30] p-0.5">
            <button
              type="button"
              onClick={() => onChangeSoundscape('off')}
              title="Quiet ambient background"
              aria-label="Ambient soundscape off"
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                soundscape === 'off'
                  ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] dark:text-[#C4B5FD]'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              )}
            >
              <VolumeX className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeSoundscape('rain')}
              title="Cozy Soft Rain soundscape"
              aria-label="Soft rain soundscape"
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                soundscape === 'rain'
                  ? 'bg-[#22D3EE]/20 text-[#0284C7] dark:text-[#22D3EE]'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              )}
            >
              <CloudRain className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeSoundscape('aurora')}
              title="Dreamy Aurora Hum soundscape"
              aria-label="Aurora hum soundscape"
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                soundscape === 'aurora'
                  ? 'bg-[#A855F7]/20 text-[#9333EA] dark:text-[#C084FC]'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Live Call Mode Launch Button */}
          <button
            type="button"
            onClick={onOpenImmersiveCall}
            data-testid="launch-immersive-call-button"
            title="Enter full-screen holographic voice call with live captions"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#22D3EE] px-3 py-1.5 text-[11px] font-bold text-white shadow-glow-primary hover:opacity-95 transition-all"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span>Live Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
