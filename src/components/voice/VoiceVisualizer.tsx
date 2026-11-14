import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';
import type { VoiceState } from '../../types';
import { cn } from '../../utils/formatters';

export interface VoiceVisualizerProps {
  voiceState: VoiceState;
  bands: number[];
  amplitude: number;
  primaryColor?: string;
  secondaryColor?: string;
  variant?: 'circular' | 'bars';
  size?: number;
  className?: string;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  voiceState,
  bands,
  amplitude,
  primaryColor = '#8B5CF6',
  secondaryColor = '#22D3EE',
  variant = 'circular',
  size = 300,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const isActive =
    voiceState === 'listening' ||
    voiceState === 'speech_detected' ||
    voiceState === 'speaking';
  const isThinking =
    voiceState === 'processing' ||
    voiceState === 'generating_response' ||
    voiceState === 'requesting_permission';
  const isError = voiceState === 'error';

  if (variant === 'bars') {
    return (
      <div
        className={cn('flex items-center justify-center gap-1.5 h-12', className)}
        aria-hidden="true"
        data-testid="voice-visualizer-bars"
      >
        {bands.slice(0, 12).map((bandValue, idx) => {
          const heightPx = prefersReducedMotion
            ? 14
            : isActive
              ? Math.round(10 + bandValue * 34)
              : isThinking
                ? Math.round(12 + Math.sin(idx) * 6)
                : 8;

          return (
            <motion.span
              key={idx}
              animate={{ height: heightPx }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{
                background: isError
                  ? '#F87171'
                  : `linear-gradient(to top, ${primaryColor}, ${secondaryColor})`,
              }}
              className="w-1.5 rounded-full opacity-90"
            />
          );
        })}
      </div>
    );
  }

  // Circular 360-degree radial visualizer
  const spokeCount = 24;
  const center = size / 2;
  const baseRadius = size * 0.36;

  return (
    <div
      className={cn(
        'pointer-events-none relative flex items-center justify-center',
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
      data-testid="voice-visualizer-circular"
    >
      {/* Ambient pulsing halo */}
      <motion.div
        animate={
          prefersReducedMotion
            ? { scale: 1, opacity: 0.25 }
            : isActive
              ? {
                  scale: [1, 1.06 + amplitude * 0.14, 1],
                  opacity: [0.3, 0.55, 0.3],
                }
              : isThinking
                ? { rotate: 360, scale: [1, 1.05, 1] }
                : { scale: [1, 1.03, 1], opacity: [0.18, 0.28, 0.18] }
        }
        transition={{
          duration: isActive ? 0.8 : isThinking ? 4 : 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: isError
            ? 'radial-gradient(circle, rgba(248,113,113,0.35) 0%, transparent 70%)'
            : `radial-gradient(circle, ${primaryColor}44 0%, ${secondaryColor}22 50%, transparent 72%)`,
        }}
        className="absolute inset-0 rounded-full blur-xl"
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative z-10 overflow-visible"
      >
        <defs>
          <linearGradient id="plushVisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isError ? '#F87171' : primaryColor} />
            <stop offset="100%" stopColor={isError ? '#FB7185' : secondaryColor} />
          </linearGradient>
        </defs>

        {/* Soft orbital guide ring */}
        <circle
          cx={center}
          cy={center}
          r={baseRadius - 4}
          fill="none"
          stroke="url(#plushVisGrad)"
          strokeWidth="1.5"
          strokeDasharray={isThinking ? '6 6' : undefined}
          opacity={isActive ? 0.55 : 0.25}
        />

        {/* Radial audio spokes */}
        {Array.from({ length: spokeCount }).map((_, i) => {
          const angle = (i / spokeCount) * Math.PI * 2 - Math.PI / 2;
          const bandVal = bands[i % bands.length] ?? 0.1;
          const spokeLen = prefersReducedMotion
            ? 8
            : isActive
              ? 8 + bandVal * (size * 0.11)
              : isThinking
                ? 6 + ((i % 3) * 4)
                : 5;

          const x1 = center + Math.cos(angle) * baseRadius;
          const y1 = center + Math.sin(angle) * baseRadius;
          const x2 = center + Math.cos(angle) * (baseRadius + spokeLen);
          const y2 = center + Math.sin(angle) * (baseRadius + spokeLen);

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#plushVisGrad)"
              strokeWidth={isActive ? 3.2 : 2}
              strokeLinecap="round"
              opacity={isActive ? 0.85 : 0.35}
            />
          );
        })}
      </svg>
    </div>
  );
};
