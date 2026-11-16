import { motion, useReducedMotion } from 'framer-motion';
import {
  Check,
  Copy,
  Mic,
  RotateCcw,
  User as UserIcon,
  Volume2,
  VolumeX,
} from 'lucide-react';
import React, { useState } from 'react';
import { PLUSH_CHARACTERS, type PlushCharacterId } from '../../config/characters';
import { useCharacter } from '../../hooks/useCharacter';
import type { Message, SupportedLanguage } from '../../types';
import { cn, formatMessageTimestamp } from '../../utils/formatters';
import { getLanguageMetadata } from '../../utils/language';
import { PlushCharacter } from '../character/PlushCharacter';

export interface MessageBubbleProps {
  message: Message;
  characterId?: PlushCharacterId;
  isStreaming?: boolean;
  isSpeakingThisMessage?: boolean;
  isSynthesisSupported?: boolean;
  onSpeak?: (text: string, lang: SupportedLanguage, messageId: string) => void;
  onStopSpeaking?: () => void;
}

/**
  * Safely formats plain text into structured paragraphs and code blocks
  * using React elements only (never dangerouslySetInnerHTML).
  */
function renderSafeFormattedContent(content: string): React.ReactNode {
  const segments = content.split(/(```[\s\S]*?```)/g);

  return segments.map((segment, index) => {
    if (segment.startsWith('```') && segment.endsWith('```')) {
      const lines = segment.slice(3, -3).trim().split('\n');
      const firstLine = lines[0]?.trim() || '';
      const hasLangTag = /^[a-zA-Z0-9_-]+$/.test(firstLine) && lines.length > 1;
      const codeBody = hasLangTag ? lines.slice(1).join('\n') : lines.join('\n');

      return (
        <pre
          key={index}
          className="my-2.5 overflow-x-auto rounded-xl bg-[#090914] border border-white/[0.08] p-3.5 text-xs font-mono text-[#22D3EE]"
        >
          <code>{codeBody}</code>
        </pre>
      );
    }

    const paragraphs = segment.split(/\n{2,}/);
    return (
      <React.Fragment key={index}>
        {paragraphs.map((para, pIdx) => {
          const trimmedPara = para.trim();
          if (!trimmedPara) return null;

          return (
            <p
              key={pIdx}
              className="whitespace-pre-wrap leading-relaxed mb-2 last:mb-0 break-words"
            >
              {trimmedPara}
            </p>
          );
        })}
      </React.Fragment>
    );
  });
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  characterId,
  isStreaming = false,
  isSpeakingThisMessage = false,
  isSynthesisSupported = true,
  onSpeak,
  onStopSpeaking,
}) => {
  const [copied, setCopied] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { characterId: contextCharId } = useCharacter();
  const activeCharacterId = characterId || contextCharId || 'mellow';
  const companion =
    PLUSH_CHARACTERS[activeCharacterId] || PLUSH_CHARACTERS.mellow;

  const isUser = message.role === 'user';
  const langMeta = getLanguageMetadata(message.language);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleVoiceAction = () => {
    if (isSpeakingThisMessage) {
      onStopSpeaking?.();
    } else {
      onSpeak?.(
        message.content,
        (message.language as SupportedLanguage) || 'en-US',
        message.id
      );
    }
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'flex w-full gap-3 items-start',
        isUser ? 'justify-end' : 'justify-start'
      )}
      data-testid={`message-bubble-${message.role}`}
    >
      {/* Small Plush Companion Avatar on AI Messages */}
      {!isUser && (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#191B30] border border-white/[0.08] shadow-glow-primary mt-0.5 overflow-hidden"
          title={`${companion.name} (${companion.personality})`}
        >
          <div className="scale-[0.58]">
            <PlushCharacter
              characterId={activeCharacterId}
              voiceState={isSpeakingThisMessage ? 'speaking' : 'idle'}
              size="xs"
              interactive={false}
            />
          </div>
        </div>
      )}

      <div
        className={cn(
          'group relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm transition-all',
          isUser
            ? 'rounded-tr-sm bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#A855F7] text-[#F8FAFC] shadow-glow-primary border border-white/15'
            : 'rounded-tl-sm bg-white/90 dark:bg-[#191B30]/95 border border-purple-200/70 dark:border-white/[0.08] text-slate-900 dark:text-[#F8FAFC] shadow-card-subtle backdrop-blur-xl'
        )}
      >
        {/* Companion Header on AI Messages */}
        {!isUser && (
          <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold text-[#8B5CF6] dark:text-[#22D3EE]">
            <div className="flex items-center gap-1.5">
              <span>{companion.name}</span>
              <span className="text-slate-400 dark:text-[#72758E] font-normal">
                · {companion.role}
              </span>
            </div>
            {isStreaming && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#22D3EE]/15 px-2 py-0.5 text-[9px] font-extrabold text-[#22D3EE] animate-pulse">
                STREAMING LIVE
              </span>
            )}
          </div>
        )}

        {/* Message Content */}
        <div className="text-[14px]">
          {renderSafeFormattedContent(message.content)}
          {isStreaming && (
            <span
              aria-hidden="true"
              className="ml-1 inline-block h-4 w-1.5 align-middle rounded-sm bg-[#22D3EE] animate-pulse"
            />
          )}
        </div>

        {/* Footer Metadata & Action Controls */}
        <div
          className={cn(
            'mt-2 flex flex-wrap items-center justify-between gap-2 pt-1.5 text-[11px] border-t',
            isUser
              ? 'border-white/15 text-[#F8FAFC]/80'
              : 'border-purple-200/50 dark:border-white/[0.06] text-slate-500 dark:text-[#A1A1B8]'
          )}
        >
          <div className="flex items-center gap-2">
            {message.input_mode === 'voice' && (
              <span
                className="inline-flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium"
                title="Sent via voice recognition"
              >
                <Mic className="h-2.5 w-2.5" />
                Voice
              </span>
            )}
            <span className="rounded-md bg-purple-100/60 dark:bg-white/5 px-1.5 py-0.5 text-[10px]">
              {langMeta.nativeName}
            </span>
            <span>{formatMessageTimestamp(message.created_at)}</span>
          </div>

          <div className="flex items-center gap-1">
            {!isUser && isSynthesisSupported && (
              <>
                <button
                  type="button"
                  onClick={handleVoiceAction}
                  aria-label={
                    isSpeakingThisMessage ? 'Stop reading message' : 'Listen to AI response'
                  }
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors',
                    isSpeakingThisMessage
                      ? 'bg-[#22D3EE]/20 text-[#22D3EE]'
                      : 'hover:bg-white/10 text-slate-600 dark:text-[#A1A1B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                  )}
                >
                  {isSpeakingThisMessage ? (
                    <>
                      <VolumeX className="h-3.5 w-3.5" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Listen</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onSpeak?.(
                      message.content,
                      (message.language as SupportedLanguage) || 'en-US',
                      message.id
                    )
                  }
                  aria-label="Replay AI response"
                  title="Replay response"
                  className="inline-flex items-center rounded-lg p-1 text-slate-600 dark:text-[#A1A1B8] hover:bg-white/10 hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy message text"
              title="Copy text"
              className="inline-flex items-center rounded-lg p-1 hover:bg-white/10 transition-colors"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-[#34D399]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isUser && (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#191B30] border border-white/[0.08] text-[#22D3EE] mt-0.5"
          aria-hidden="true"
        >
          <UserIcon className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  );
};
