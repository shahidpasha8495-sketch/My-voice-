import { motion, useReducedMotion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import {
  PLUSH_CHARACTERS,
  type PlushCharacterId,
} from '../../config/characters';
import type { CompanionExpression, VoiceState } from '../../types';
import { cn } from '../../utils/formatters';

export interface PlushCharacterProps {
  characterId: PlushCharacterId;
  voiceState?: VoiceState;
  expression?: CompanionExpression;
  amplitude?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

const SIZE_MAP: Record<NonNullable<PlushCharacterProps['size']>, number> = {
  xs: 64,
  sm: 96,
  md: 156,
  lg: 220,
  xl: 280,
};

export const PlushCharacter: React.FC<PlushCharacterProps> = ({
  characterId,
  voiceState = 'idle',
  expression,
  amplitude = 0,
  size = 'lg',
  interactive = true,
  onClick,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const config = PLUSH_CHARACTERS[characterId] || PLUSH_CHARACTERS.mellow;
  const pixelSize = SIZE_MAP[size];

  const [isBlinking, setIsBlinking] = useState(false);
  const [isExcited, setIsExcited] = useState(false);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Natural eye-blinking cycle every ~3.4 seconds
  useEffect(() => {
    if (prefersReducedMotion) return;
    let blinkTimeout: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      setIsBlinking(true);
      blinkTimeout = setTimeout(() => setIsBlinking(false), 150);
    }, 3400);

    return () => {
      clearInterval(interval);
      if (blinkTimeout) clearTimeout(blinkTimeout);
    };
  }, [prefersReducedMotion]);

  const isListening =
    expression === 'listening' ||
    voiceState === 'listening' ||
    voiceState === 'speech_detected' ||
    voiceState === 'recording' ||
    voiceState === 'requesting_permission';
  const isThinking =
    expression === 'thinking' ||
    voiceState === 'transcribing' ||
    voiceState === 'processing' ||
    voiceState === 'generating_response';
  const isSpeaking = expression === 'speaking' || voiceState === 'speaking';
  const isError = voiceState === 'error';
  const isConfused = expression === 'confused';
  const isSad = expression === 'sad';
  const isSleeping = expression === 'sleeping';
  const isCelebrating = expression === 'celebrating';
  const isExcitedState = isExcited || expression === 'excited' || isCelebrating;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: relX * 14, y: -relY * 14 });
  };

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleCharacterClick = () => {
    if (!prefersReducedMotion) {
      setIsExcited(true);
      setTimeout(() => setIsExcited(false), 650);
    }
    onClick?.();
  };

  // Dynamic mouth openness driven by speaking state & real audio amplitude
  const mouthOpenHeight = isSpeaking
    ? Math.max(8, Math.min(20, 9 + amplitude * 16))
    : isListening
      ? 6
      : 4;

  // Eye pupil offset for thinking/listening/interactive states
  const pupilOffsetX = isThinking ? 3.5 : isConfused ? -3 : tilt.x * 0.35;
  const pupilOffsetY = isThinking ? -3.5 : isListening ? -1 : -tilt.y * 0.35;

  return (
    <motion.div
      data-testid={`plush-character-${characterId}`}
      data-character-state={voiceState}
      data-character-expression={expression || 'happy'}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleCharacterClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${config.name} plush companion (${config.personality}) - ${voiceState}`}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCharacterClick();
              }
            }
          : undefined
      }
      animate={
        prefersReducedMotion
          ? { y: 0, rotate: 0, scaleX: 1, scaleY: 1 }
          : isExcitedState
            ? {
                y: [0, -18, 2, -8, 0],
                scaleX: [1, 0.92, 1.08, 0.97, 1],
                scaleY: [1, 1.1, 0.9, 1.04, 1],
                rotate: [0, -6, 6, -3, 0],
              }
            : isSpeaking
              ? {
                  y: [0, -10, 0, -6, 0],
                  scaleX: [1, 1.05, 0.96, 1.04, 1],
                  scaleY: [1, 0.95, 1.06, 0.97, 1],
                  rotate: [0, -2.5, 2.5, -1.5, 0],
                }
              : isListening
                ? {
                    y: [0, -5, 0],
                    scaleX: [1, 1.03, 1],
                    scaleY: [1, 1.03, 1],
                    rotate: [0, 2, -2, 0],
                  }
                : isThinking || isConfused
                  ? {
                      y: [0, -7, 0],
                      rotate: isConfused ? [-8, 8, -8] : [-5, 6, -5],
                    }
                  : isSleeping
                    ? {
                        y: [0, 3, 0],
                        scaleX: [1, 1.03, 1],
                        scaleY: [1, 0.97, 1],
                        rotate: [-2, 2, -2],
                      }
                    : isError
                      ? {
                          x: [0, -4, 4, -2, 2, 0],
                          rotate: [-2, 2, 0],
                        }
                      : {
                          // IDLE: gentle floating & breathing
                          y: [0, -8, 0],
                          scaleX: [1, 1.018, 1],
                          scaleY: [1, 1.022, 1],
                          rotate: [-1.2, 1.2, -1.2],
                        }
      }
      transition={{
        duration: isExcitedState
          ? 0.65
          : isSpeaking
            ? 0.72
            : isListening
              ? 1.35
              : isThinking || isConfused
                ? 1.9
                : isSleeping
                  ? 4.2
                  : isError
                    ? 0.5
                    : 3.2,
        repeat: isError || isExcited ? 0 : Infinity,
        ease: 'easeInOut',
      }}
      style={{
        width: pixelSize,
        height: pixelSize,
        transform: interactive
          ? `perspective(600px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`
          : undefined,
      }}
      className={cn(
        'relative flex items-center justify-center select-none',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <svg
        viewBox="0 0 240 240"
        width="100%"
        height="100%"
        className="overflow-visible drop-shadow-[0_18px_28px_rgba(15,23,42,0.32)]"
      >
        <defs>
          {/* Soft fuzzy plush fabric filter */}
          <filter
            id={`plushFuzz-${characterId}`}
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="3"
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.055 0"
              in="noise"
              result="softGrain"
            />
            <feComposite in="SourceGraphic" in2="softGrain" operator="over" />
          </filter>

          {/* 3D Key-Light Radial Gradients per Character */}
          {/* MELLOW */}
          <radialGradient id="mellowHoodGrad" cx="35%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#FFFDF9" />
            <stop offset="45%" stopColor="#F3DFC8" />
            <stop offset="85%" stopColor="#D6B999" />
            <stop offset="100%" stopColor="#B89772" />
          </radialGradient>
          <radialGradient id="mellowFaceGrad" cx="40%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#FFF6E9" />
            <stop offset="100%" stopColor="#EBD5BC" />
          </radialGradient>

          {/* GENI */}
          <radialGradient id="geniBodyGrad" cx="35%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="40%" stopColor="#FDE047" />
            <stop offset="82%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </radialGradient>

          {/* CLOUDY */}
          <radialGradient id="cloudyBodyGrad" cx="35%" cy="26%" r="72%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="42%" stopColor="#BAE6FD" />
            <stop offset="80%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </radialGradient>

          {/* BUNNY */}
          <radialGradient id="bunnyBodyGrad" cx="35%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#FFF1F2" />
            <stop offset="45%" stopColor="#F9A8D4" />
            <stop offset="85%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#BE185D" />
          </radialGradient>
          <linearGradient id="bunnyInnerEarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE4E6" />
            <stop offset="100%" stopColor="#FDA4AF" />
          </linearGradient>

          {/* HEARTY */}
          <radialGradient id="heartyBodyGrad" cx="34%" cy="26%" r="72%">
            <stop offset="0%" stopColor="#FAF5FF" />
            <stop offset="42%" stopColor="#C084FC" />
            <stop offset="82%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#6B21A8" />
          </radialGradient>
          <linearGradient id="heartyGlassesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF80B5" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>

          {/* Shared 3D Matte Black Headphone & Beret Gradient */}
          <linearGradient id="darkPlushAccessory" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="45%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Soft ground contact shadow */}
          <radialGradient id="groundShadowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(15, 23, 42, 0.38)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
          </radialGradient>
        </defs>

        {/* Ground contact shadow */}
        <ellipse cx="120" cy="220" rx="64" ry="12" fill="url(#groundShadowGrad)" />

        {/* ===============================================================
            CHARACTER 1: MELLOW (Beige fuzzy hooded mascot, black headphones, rosy cheeks)
           =============================================================== */}
        {characterId === 'mellow' && (
          <g filter={`url(#plushFuzz-${characterId})`}>
            {/* Headphone Top Band */}
            <path
              d="M 48 118 A 74 74 0 0 1 192 118"
              fill="none"
              stroke="url(#darkPlushAccessory)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M 56 112 A 66 66 0 0 1 184 112"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              opacity="0.4"
            />

            {/* Little Plush Feet */}
            <ellipse cx="92" cy="202" rx="18" ry="12" fill="url(#mellowHoodGrad)" />
            <ellipse cx="148" cy="202" rx="18" ry="12" fill="url(#mellowHoodGrad)" />

            {/* Cozy Fuzzy Beige Hood & Body */}
            <path
              d="M 120 40 C 172 40 200 78 196 134 C 193 178 168 204 120 204 C 72 204 47 178 44 134 C 40 78 68 40 120 40 Z"
              fill="url(#mellowHoodGrad)"
            />

            {/* Stitched Plush Seam on Hood */}
            <path
              d="M 120 42 L 120 64"
              stroke="#B89772"
              strokeWidth="2.2"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
            <path
              d="M 60 142 C 66 184 92 198 120 198 C 148 198 174 184 180 142"
              fill="none"
              stroke="#FFFDF9"
              strokeWidth="2"
              strokeDasharray="5 5"
              opacity="0.55"
            />

            {/* Inner Soft Cream Plush Face */}
            <ellipse cx="120" cy="126" rx="54" ry="46" fill="url(#mellowFaceGrad)" />
            <ellipse
              cx="120"
              cy="126"
              rx="55"
              ry="47"
              fill="none"
              stroke="#C8AD8D"
              strokeWidth="2.5"
              strokeDasharray="5 4"
            />

            {/* Cute Cozy Hood Drawstrings & Pom-Poms */}
            <path
              d="M 96 168 Q 92 184 94 192"
              stroke="#FFF8EE"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 144 168 Q 148 184 146 192"
              stroke="#FFF8EE"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="94" cy="194" r="6.5" fill="#FFFDF9" />
            <circle cx="146" cy="194" r="6.5" fill="#FFFDF9" />

            {/* Matte Black Over-Ear Studio Headphones (react to listening/speaking) */}
            <g
              transform={
                isListening || isSpeaking ? 'translate(0, -3) scale(1.02)' : undefined
              }
            >
              <rect
                x="26"
                y="98"
                width="24"
                height="50"
                rx="12"
                fill="url(#darkPlushAccessory)"
              />
              <rect
                x="190"
                y="98"
                width="24"
                height="50"
                rx="12"
                fill="url(#darkPlushAccessory)"
              />
              {/* Glowing LED Accent Rings on Earcups */}
              <ellipse
                cx="36"
                cy="123"
                rx="5"
                ry="14"
                fill="none"
                stroke={isListening ? '#22D3EE' : '#A78BFA'}
                strokeWidth="2.5"
              />
              <ellipse
                cx="204"
                cy="123"
                rx="5"
                ry="14"
                fill="none"
                stroke={isListening ? '#22D3EE' : '#A78BFA'}
                strokeWidth="2.5"
              />
            </g>
          </g>
        )}

        {/* ===============================================================
            CHARACTER 2: GENI (Yellow triangular plush mascot, round glasses, bow tie)
           =============================================================== */}
        {characterId === 'geni' && (
          <g filter={`url(#plushFuzz-${characterId})`}>
            {/* Top Fluffy Plush Tuft */}
            <path
              d="M 120 26 C 112 14 102 22 110 34 C 115 20 128 16 126 32 C 134 22 140 30 128 38 Z"
              fill="#FACC15"
            />

            {/* Little Plush Feet */}
            <ellipse cx="90" cy="204" rx="18" ry="11" fill="#EAB308" />
            <ellipse cx="150" cy="204" rx="18" ry="11" fill="#EAB308" />

            {/* Rounded Triangular Pyramid 3D Plush Body */}
            <path
              d="M 120 34 C 142 34 198 142 194 176 C 190 202 158 204 120 204 C 82 204 50 202 46 176 C 42 142 98 34 120 34 Z"
              fill="url(#geniBodyGrad)"
            />

            {/* Plush Edge Stitching */}
            <path
              d="M 120 44 C 138 44 184 140 182 170 C 179 190 152 194 120 194 C 88 194 61 190 58 170 C 56 140 102 44 120 44 Z"
              fill="none"
              stroke="#FEF9C3"
              strokeWidth="2"
              strokeDasharray="6 5"
              opacity="0.65"
            />

            {/* Cute Little Plush Side Arms */}
            <ellipse
              cx="54"
              cy="148"
              rx="14"
              ry="10"
              transform="rotate(-25 54 148)"
              fill="url(#geniBodyGrad)"
            />
            <ellipse
              cx="186"
              cy="148"
              rx="14"
              ry="10"
              transform="rotate(25 186 148)"
              fill="url(#geniBodyGrad)"
            />

            {/* Dapper Plush Bow Tie */}
            <g transform="translate(120, 182)">
              <path
                d="M -26 -12 L -4 -3 L -4 3 L -26 12 C -30 6 -30 -6 -26 -12 Z"
                fill="#EC4899"
              />
              <path
                d="M 26 -12 L 4 -3 L 4 3 L 26 12 C 30 6 30 -6 26 -12 Z"
                fill="#8B5CF6"
              />
              <rect x="-7" y="-7" width="14" height="14" rx="5" fill="#F43F5E" />
              <circle cx="-2" cy="-2" r="2" fill="#FFE4E6" opacity="0.8" />
            </g>
          </g>
        )}

        {/* ===============================================================
            CHARACTER 3: CLOUDY (Fluffy blue cloud character, black beret)
           =============================================================== */}
        {characterId === 'cloudy' && (
          <g filter={`url(#plushFuzz-${characterId})`}>
            {/* Soft Floating Cloud Puffs */}
            <path
              d="M 66 178
                 C 40 178 26 156 34 132
                 C 24 110 42 84 66 84
                 C 76 58 108 50 132 62
                 C 156 50 186 64 190 92
                 C 210 102 214 132 198 150
                 C 204 170 186 186 164 184
                 C 150 196 126 196 112 186
                 C 96 196 76 190 66 178 Z"
              fill="url(#cloudyBodyGrad)"
            />

            {/* Inner Fluffy Cloud Dimension Contours */}
            <path
              d="M 54 108 A 24 24 0 0 1 82 88"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              d="M 146 76 A 22 22 0 0 1 176 92"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.65"
            />

            {/* Classic Tilted Black French Artist Beret */}
            <g transform="rotate(-11 118 60)">
              {/* Beret stem */}
              <path
                d="M 118 32 Q 122 23 128 26"
                stroke="#0F172A"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Beret crown */}
              <ellipse
                cx="118"
                cy="52"
                rx="52"
                ry="20"
                fill="url(#darkPlushAccessory)"
              />
              {/* Beret rim headband */}
              <rect
                x="78"
                y="62"
                width="80"
                height="9"
                rx="4.5"
                fill="#0F172A"
              />
              {/* Specular plush highlight on beret */}
              <path
                d="M 82 48 Q 112 36 146 44"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.45"
              />
            </g>
          </g>
        )}

        {/* ===============================================================
            CHARACTER 4: BUNNY (Pink plush bunny with headphones and expressive ears)
           =============================================================== */}
        {characterId === 'bunny' && (
          <g filter={`url(#plushFuzz-${characterId})`}>
            {/* Left Expressive Bunny Ear */}
            <g
              transform={
                isListening
                  ? 'rotate(-14 88 76) translate(0, -4)'
                  : isSpeaking
                    ? 'rotate(-8 88 76)'
                    : 'rotate(-5 88 76)'
              }
            >
              <ellipse cx="86" cy="48" rx="19" ry="42" fill="url(#bunnyBodyGrad)" />
              <ellipse cx="86" cy="50" rx="10" ry="28" fill="url(#bunnyInnerEarGrad)" />
            </g>

            {/* Right Expressive Bunny Ear */}
            <g
              transform={
                isListening
                  ? 'rotate(14 152 76) translate(0, -4)'
                  : isSpeaking
                    ? 'rotate(8 152 76)'
                    : 'rotate(5 152 76)'
              }
            >
              <ellipse cx="154" cy="48" rx="19" ry="42" fill="url(#bunnyBodyGrad)" />
              <ellipse cx="154" cy="50" rx="10" ry="28" fill="url(#bunnyInnerEarGrad)" />
            </g>

            {/* Headphone Band */}
            <path
              d="M 48 130 A 74 70 0 0 1 192 130"
              fill="none"
              stroke="#FFF1F2"
              strokeWidth="10"
              strokeLinecap="round"
            />

            {/* Little Plush Bunny Paws/Feet */}
            <ellipse cx="88" cy="204" rx="19" ry="12" fill="url(#bunnyBodyGrad)" />
            <ellipse cx="152" cy="204" rx="19" ry="12" fill="url(#bunnyBodyGrad)" />

            {/* Plump Baby-Pink Bunny Plush Body */}
            <ellipse cx="120" cy="138" rx="68" ry="64" fill="url(#bunnyBodyGrad)" />

            {/* Soft Cream-Pink Belly Patch */}
            <ellipse
              cx="120"
              cy="168"
              rx="36"
              ry="26"
              fill="#FFE4E6"
              opacity="0.7"
            />

            {/* Rose-Pearl Studio Headphones on Sides */}
            <g>
              <rect
                x="34"
                y="112"
                width="22"
                height="46"
                rx="11"
                fill="#FFF1F2"
                stroke="#F472B6"
                strokeWidth="3"
              />
              <rect
                x="184"
                y="112"
                width="22"
                height="46"
                rx="11"
                fill="#FFF1F2"
                stroke="#F472B6"
                strokeWidth="3"
              />
              <circle cx="45" cy="135" r="5" fill="#EC4899" />
              <circle cx="195" cy="135" r="5" fill="#EC4899" />
            </g>
          </g>
        )}

        {/* ===============================================================
            CHARACTER 5: HEARTY (Purple plush heart character with heart-shaped sunglasses)
           =============================================================== */}
        {characterId === 'hearty' && (
          <g filter={`url(#plushFuzz-${characterId})`}>
            {/* Little Plush Feet */}
            <ellipse cx="98" cy="204" rx="16" ry="10" fill="#7E22CE" />
            <ellipse cx="142" cy="204" rx="16" ry="10" fill="#7E22CE" />

            {/* Sculpted Plump 3D Heart Plush Silhouette */}
            <path
              d="M 120 74
                 C 104 42 52 44 42 84
                 C 30 132 76 172 120 202
                 C 164 172 210 132 198 84
                 C 188 44 136 42 120 74 Z"
              fill="url(#heartyBodyGrad)"
            />

            {/* Plush Stitching Contour Inside Heart */}
            <path
              d="M 120 82
                 C 106 54 62 56 54 88
                 C 44 128 84 162 120 188
                 C 156 162 196 128 186 88
                 C 178 56 134 54 120 82 Z"
              fill="none"
              stroke="#FAF5FF"
              strokeWidth="2"
              strokeDasharray="5 5"
              opacity="0.55"
            />

            {/* Specular 3D Left Lobe Highlight */}
            <path
              d="M 62 84 A 26 22 0 0 1 94 66"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="4.5"
              strokeLinecap="round"
              opacity="0.5"
            />
          </g>
        )}

        {/* ===============================================================
            CHARACTERS 6-10: NOVA, LUNA, SPARK, ATLAS, ZEN
           =============================================================== */}
        {(characterId === 'nova' ||
          characterId === 'luna' ||
          characterId === 'spark' ||
          characterId === 'atlas' ||
          characterId === 'zen') && (
          <g filter={`url(#plushFuzz-${characterId})`}>
            {/* Little Plush Feet */}
            <ellipse
              cx="92"
              cy="204"
              rx="18"
              ry="11"
              fill={config.colors.secondary}
            />
            <ellipse
              cx="148"
              cy="204"
              rx="18"
              ry="11"
              fill={config.colors.secondary}
            />

            {/* Crown / Halo / Lightning / Compass / Lotus Top Accent */}
            {characterId === 'nova' && (
              <ellipse
                cx="120"
                cy="38"
                rx="42"
                ry="9"
                fill="none"
                stroke="#22D3EE"
                strokeWidth="3.5"
                strokeDasharray="8 4"
              />
            )}
            {characterId === 'luna' && (
              <path
                d="M 118 22 A 16 16 0 1 0 134 38 A 12 12 0 1 1 118 22 Z"
                fill="#FDE047"
              />
            )}
            {characterId === 'spark' && (
              <polygon
                points="124,16 110,38 121,38 115,54 134,32 122,32"
                fill="#FEF08A"
              />
            )}
            {characterId === 'atlas' && (
              <polygon
                points="120,18 124,30 136,34 124,38 120,50 116,38 104,34 116,30"
                fill="#FBBF24"
              />
            )}
            {characterId === 'zen' && (
              <path
                d="M 120 22 C 112 30 112 40 120 46 C 128 40 128 30 120 22 Z"
                fill="#6EE7B7"
              />
            )}

            {/* Rounded Plush Body */}
            <ellipse
              cx="120"
              cy="132"
              rx="68"
              ry="66"
              fill={config.colors.primary}
            />
            <ellipse
              cx="120"
              cy="128"
              rx="52"
              ry="46"
              fill="#FFFFFF"
              opacity="0.24"
            />
            <ellipse
              cx="120"
              cy="132"
              rx="62"
              ry="60"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeDasharray="5 5"
              opacity="0.5"
            />
          </g>
        )}

        {/* ===============================================================
            SHARED EXPRESSIVE FACIAL FEATURES (Eyes, Cheeks, Mouth, Accessories)
           =============================================================== */}
        <g
          transform={`translate(0, ${
            characterId === 'bunny'
              ? 8
              : characterId === 'geni'
                ? 10
                : characterId === 'hearty'
                  ? -4
                  : 0
          })`}
        >
          {/* Warm Rosy Plush Cheeks */}
          <ellipse
            cx="84"
            cy="136"
            rx="11"
            ry="6.5"
            fill={config.colors.cheeks}
            opacity={isListening || isSpeaking || isCelebrating ? 0.85 : 0.65}
          />
          <ellipse
            cx="156"
            cy="136"
            rx="11"
            ry="6.5"
            fill={config.colors.cheeks}
            opacity={isListening || isSpeaking || isCelebrating ? 0.85 : 0.65}
          />

          {/* Expressive Eyes (Blink + Sleeping + Celebrating + Pupil Tracking) */}
          {isSleeping || isBlinking ? (
            <g stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" fill="none">
              <path d="M 88 120 Q 96 126 104 120" />
              <path d="M 136 120 Q 144 126 152 120" />
            </g>
          ) : isCelebrating ? (
            <g stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" fill="none">
              <path d="M 88 122 Q 96 112 104 122" />
              <path d="M 136 122 Q 144 112 152 122" />
            </g>
          ) : (
            <g>
              {/* Left Eye */}
              <ellipse
                cx="96"
                cy="118"
                rx={isListening || isExcitedState ? 9.5 : 8.5}
                ry={isListening || isExcitedState ? 11 : 10}
                fill="#1E1B4B"
              />
              {/* Left Eye Dual Catchlights */}
              <circle
                cx={93.5 + pupilOffsetX}
                cy={114 + pupilOffsetY}
                r="3.2"
                fill="#FFFFFF"
              />
              <circle
                cx={98.5 + pupilOffsetX * 0.5}
                cy={121 + pupilOffsetY * 0.5}
                r="1.5"
                fill="#FFFFFF"
                opacity="0.85"
              />

              {/* Right Eye */}
              <ellipse
                cx="144"
                cy="118"
                rx={isListening || isExcitedState ? 9.5 : 8.5}
                ry={isListening || isExcitedState ? 11 : 10}
                fill="#1E1B4B"
              />
              {/* Right Eye Dual Catchlights */}
              <circle
                cx={141.5 + pupilOffsetX}
                cy={114 + pupilOffsetY}
                r="3.2"
                fill="#FFFFFF"
              />
              <circle
                cx={146.5 + pupilOffsetX * 0.5}
                cy={121 + pupilOffsetY * 0.5}
                r="1.5"
                fill="#FFFFFF"
                opacity="0.85"
              />
            </g>
          )}

          {/* Friendly Concerned / Sad / Confused Eyebrows */}
          {(isError || isSad) && (
            <g stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round">
              <line x1="86" y1="104" x2="102" y2="100" />
              <line x1="154" y1="104" x2="138" y2="100" />
            </g>
          )}
          {isConfused && (
            <g stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round">
              <line x1="86" y1="100" x2="102" y2="103" />
              <line x1="138" y1="98" x2="154" y2="104" />
            </g>
          )}

          {/* Bunny's Cute Heart-Shaped Plush Nose */}
          {characterId === 'bunny' && (
            <path
              d="M 120 129 C 117 125 113 126 114 130 C 115 133 120 136 120 136 C 120 136 125 133 126 130 C 127 126 123 125 120 129 Z"
              fill="#EC4899"
            />
          )}

          {/* GENI's Round Scholar Glasses & ATLAS's Titanium Executive Frames */}
          {(characterId === 'geni' || characterId === 'atlas') && (
            <g>
              {characterId === 'atlas' ? (
                <>
                  <rect
                    x="77"
                    y="102"
                    width="38"
                    height="30"
                    rx="8"
                    fill="rgba(224,242,254,0.22)"
                    stroke="#0F172A"
                    strokeWidth="3.2"
                  />
                  <rect
                    x="125"
                    y="102"
                    width="38"
                    height="30"
                    rx="8"
                    fill="rgba(224,242,254,0.22)"
                    stroke="#0F172A"
                    strokeWidth="3.2"
                  />
                  <line
                    x1="115"
                    y1="115"
                    x2="125"
                    y2="115"
                    stroke="#0F172A"
                    strokeWidth="3.2"
                  />
                </>
              ) : (
                <>
                  <circle
                    cx="96"
                    cy="118"
                    r="17"
                    fill="rgba(255,255,255,0.18)"
                    stroke="#1E293B"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="144"
                    cy="118"
                    r="17"
                    fill="rgba(255,255,255,0.18)"
                    stroke="#1E293B"
                    strokeWidth="3.5"
                  />
                  {/* Bridge of glasses */}
                  <path
                    d="M 113 118 Q 120 113 127 118"
                    fill="none"
                    stroke="#1E293B"
                    strokeWidth="3.5"
                  />
                </>
              )}
              {/* Lens Glint */}
              <line
                x1="86"
                y1="108"
                x2="92"
                y2="114"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.75"
              />
              <line
                x1="134"
                y1="108"
                x2="140"
                y2="114"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.75"
              />
            </g>
          )}

          {/* NOVA's Cyber Quantum Holographic Visor */}
          {characterId === 'nova' && (
            <g>
              <rect
                x="72"
                y="102"
                width="96"
                height="30"
                rx="15"
                fill="rgba(14, 165, 233, 0.22)"
                stroke="#22D3EE"
                strokeWidth="2.5"
              />
              <line
                x1="82"
                y1="108"
                x2="108"
                y2="108"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.65"
              />
            </g>
          )}

          {/* HEARTY's Iconic Heart-Shaped Sunglasses */}
          {characterId === 'hearty' && (
            <g
              transform={
                isListening || isThinking ? 'translate(0, -4)' : undefined
              }
            >
              {/* Left Heart Lens */}
              <path
                d="M 94 110
                   C 88 100 72 101 70 112
                   C 68 124 82 134 94 141
                   C 106 134 120 124 118 112
                   C 116 101 100 100 94 110 Z"
                fill="url(#heartyGlassesGrad)"
                fillOpacity="0.82"
                stroke="#FFFFFF"
                strokeWidth="3.2"
              />
              {/* Right Heart Lens */}
              <path
                d="M 146 110
                   C 140 100 124 101 122 112
                   C 120 124 134 134 146 141
                   C 158 134 172 124 170 112
                   C 168 101 152 100 146 110 Z"
                fill="url(#heartyGlassesGrad)"
                fillOpacity="0.82"
                stroke="#FFFFFF"
                strokeWidth="3.2"
              />
              {/* Sunglasses Bridge */}
              <path
                d="M 116 114 Q 120 110 124 114"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.2"
              />
              {/* Sunglasses Shimmer */}
              <line
                x1="80"
                y1="112"
                x2="87"
                y2="120"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.8"
              />
              <line
                x1="132"
                y1="112"
                x2="139"
                y2="120"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.8"
              />
            </g>
          )}

          {/* Expressive Voice-Reactive & Emotion-Reactive Mouth */}
          {isSpeaking ? (
            <g>
              <rect
                x="110"
                y="135"
                width="20"
                height={mouthOpenHeight}
                rx="10"
                fill="#9F1239"
              />
              {/* Little pink tongue inside open speaking mouth */}
              <ellipse
                cx="120"
                cy={135 + mouthOpenHeight - 3}
                rx="6.5"
                ry="3.5"
                fill="#FDA4AF"
              />
            </g>
          ) : isListening ? (
            /* Attentive cute "o" / smile when listening */
            <ellipse cx="120" cy="139" rx="6" ry="5" fill="#9F1239" />
          ) : isThinking || isConfused ? (
            /* Thoughtful wavy pondering mouth */
            <path
              d="M 112 139 Q 117 136 121 139 Q 125 142 129 138"
              fill="none"
              stroke="#1E1B4B"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ) : isSad ? (
            /* Gentle sympathetic sad curve */
            <path
              d="M 111 143 Q 120 135 129 143"
              fill="none"
              stroke="#1E1B4B"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ) : isSleeping ? (
            /* Peaceful tiny sleeping breath o */
            <circle cx="120" cy="139" r="3.5" fill="#1E1B4B" opacity="0.65" />
          ) : isError ? (
            /* Friendly apologetic "oops" mouth */
            <ellipse
              cx="120"
              cy="140"
              rx="5"
              ry="5"
              fill="none"
              stroke="#1E1B4B"
              strokeWidth="3"
            />
          ) : (
            /* Cheerful Plush Smile */
            <path
              d="M 111 136 Q 120 145 129 136"
              fill="none"
              stroke="#1E1B4B"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          )}
        </g>

        {/* ===============================================================
            CREATIVE CHARACTER-SPECIFIC REACTIVE AMBIENT PARTICLES
           =============================================================== */}
        {isSleeping && (
          <g fill="#A78BFA" fontWeight="bold" fontFamily="sans-serif">
            <text x="172" y="68" fontSize="14" opacity="0.75">
              z
            </text>
            <text x="184" y="52" fontSize="18" opacity="0.9">
              Z
            </text>
            <text x="198" y="34" fontSize="22">
              Z
            </text>
          </g>
        )}

        {isConfused && (
          <g fill="#FBBF24" fontWeight="bold" fontFamily="sans-serif">
            <text x="178" y="54" fontSize="26">
              ?
            </text>
          </g>
        )}

        {isCelebrating && (
          <g>
            <circle cx="46" cy="46" r="5" fill="#F472B6" />
            <circle cx="194" cy="42" r="5" fill="#22D3EE" />
            <rect x="64" y="24" width="8" height="8" rx="2" fill="#FACC15" transform="rotate(20 64 24)" />
            <rect x="168" y="24" width="8" height="8" rx="2" fill="#34D399" transform="rotate(-25 168 24)" />
          </g>
        )}

        {(isThinking || isListening || isSpeaking || isExcitedState) && (
          <g opacity="0.92">
            {/* Sparkle Star Left */}
            <path
              d="M 40 48 L 43 55 L 50 58 L 43 61 L 40 68 L 37 61 L 30 58 L 37 55 Z"
              fill={isListening ? '#22D3EE' : isSpeaking ? '#34D399' : '#C084FC'}
            />
            {/* Sparkle Star Right */}
            <path
              d="M 198 44 L 200.5 50 L 206.5 52.5 L 200.5 55 L 198 61 L 195.5 55 L 189.5 52.5 L 195.5 50 Z"
              fill={config.colors.accent}
            />
            {/* Floating Mini Heart / Music Note / Eureka Sparkle */}
            {characterId === 'hearty' || characterId === 'bunny' ? (
              <path
                d="M 182 28 C 179 23 172 24 172 29 C 172 34 182 40 182 40 C 182 40 192 34 192 29 C 192 24 185 23 182 28 Z"
                fill="#F472B6"
              />
            ) : characterId === 'geni' ? (
              <polygon
                points="120,10 123,18 131,18 125,23 127,31 120,26 113,31 115,23 109,18 117,18"
                fill="#FDE047"
              />
            ) : (
              <circle cx="182" cy="30" r="4.5" fill="#22D3EE" />
            )}
          </g>
        )}
      </svg>
    </motion.div>
  );
};
