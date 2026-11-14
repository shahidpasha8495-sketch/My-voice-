import { Mic, MicOff, Send, Square } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import type { SupportedLanguage } from '../../types';
import { cn } from '../../utils/formatters';
import { getLanguageMetadata } from '../../utils/language';
import { MAX_MESSAGE_LENGTH, validateMessageInput } from '../../utils/validation';

export interface MessageInputProps {
  language: SupportedLanguage;
  isSending: boolean;
  isListening: boolean;
  isRecognitionSupported: boolean;
  liveTranscript?: string;
  onSendMessage: (message: string) => Promise<void> | void;
  onStartVoice: () => void;
  onStopVoice: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  language,
  isSending,
  isListening,
  isRecognitionSupported,
  liveTranscript,
  onSendMessage,
  onStartVoice,
  onStopVoice,
}) => {
  const [text, setText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const langMeta = getLanguageMetadata(language);

  // Auto-resize textarea height based on content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, 160);
    el.style.height = `${nextHeight}px`;
  }, [text]);

  const handleSend = async () => {
    if (isSending) return;
    const validation = validateMessageInput(text);
    if (!validation.valid) {
      setValidationError(validation.error || 'Please enter a valid message.');
      return;
    }

    setValidationError(null);
    const toSend = validation.sanitized;
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(toSend);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (text.trim() && !isSending) {
        void handleSend();
      }
    }
  };

  const charCount = text.length;
  const isNearLimit = charCount > MAX_MESSAGE_LENGTH * 0.85;
  const isOverLimit = charCount > MAX_MESSAGE_LENGTH;

  return (
    <div className="border-t border-purple-200/60 dark:border-white/[0.08] bg-white/80 dark:bg-[#090914]/90 px-3 py-3 sm:px-6 backdrop-blur-2xl">
      <div className="mx-auto max-w-4xl">
        {validationError && (
          <p
            role="alert"
            className="mb-2 text-xs text-[#F87171] px-1"
            data-testid="input-validation-error"
          >
            {validationError}
          </p>
        )}

        {/* Premium Floating Message Composer */}
        <div
          className={cn(
            'flex items-end gap-2.5 rounded-2xl border bg-white/95 dark:bg-[#191B30]/95 p-2.5 transition-all shadow-card-subtle backdrop-blur-xl',
            isListening
              ? 'border-[#22D3EE]/80 shadow-glow-secondary'
              : isOverLimit
                ? 'border-[#F87171]/70'
                : 'border-purple-200/80 dark:border-[#8B5CF6]/25 focus-within:border-[#22D3EE]/70 focus-within:shadow-glow-primary'
          )}
        >
          {/* Prominent Microphone Button */}
          <button
            type="button"
            disabled={isSending || !isRecognitionSupported}
            onClick={isListening ? onStopVoice : onStartVoice}
            aria-label={
              !isRecognitionSupported
                ? 'Speech recognition not supported in this browser'
                : isListening
                  ? 'Stop microphone listening'
                  : 'Start voice input'
            }
            title={
              !isRecognitionSupported
                ? 'Voice recognition is not supported in this browser'
                : isListening
                  ? 'Stop listening'
                  : `Speak in ${langMeta.name} (${langMeta.nativeName})`
            }
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all',
              !isRecognitionSupported
                ? 'bg-white/5 text-[#72758E]/50 cursor-not-allowed'
                : isListening
                  ? 'bg-[#22D3EE] text-[#090914] shadow-glow-secondary animate-pulse'
                  : 'bg-purple-100/80 dark:bg-[#101124] text-[#8B5CF6] dark:text-[#22D3EE] hover:bg-[#8B5CF6]/20 hover:text-[#F8FAFC] border border-purple-200/60 dark:border-white/[0.08]'
            )}
          >
            {!isRecognitionSupported ? (
              <MicOff className="h-5 w-5" />
            ) : isListening ? (
              <Square className="h-4 w-4 fill-current" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>

          {/* Auto-resizing Message Textarea */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              rows={1}
              value={isListening && liveTranscript ? liveTranscript : text}
              disabled={isSending || isListening}
              onChange={(e) => {
                setText(e.target.value);
                if (validationError) setValidationError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? "I'm listening..."
                  : 'Talk to your little AI companion...'
              }
              aria-label="Message input"
              data-testid="message-textarea"
              className="w-full resize-none bg-transparent px-2 py-2 text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#72758E] focus:outline-none disabled:opacity-60 max-h-40"
            />
          </div>

          {/* Send Button */}
          <button
            type="button"
            disabled={isSending || isListening || !text.trim() || isOverLimit}
            onClick={() => void handleSend()}
            aria-label="Send message"
            data-testid="send-message-button"
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all',
              text.trim() && !isSending && !isListening && !isOverLimit
                ? 'bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE] text-[#F8FAFC] shadow-glow-primary hover:opacity-95'
                : 'bg-slate-200/70 dark:bg-white/5 text-slate-400 dark:text-[#72758E]/50 cursor-not-allowed'
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* Helper Footer */}
        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-[#72758E]">
          <span>
            Press <kbd className="rounded bg-white/10 px-1 py-0.5 text-[10px]">Enter</kbd> to
            send, <kbd className="rounded bg-white/10 px-1 py-0.5 text-[10px]">Shift+Enter</kbd>{' '}
            for new line · {langMeta.nativeName}
          </span>
          {isNearLimit && (
            <span
              className={cn(
                'font-medium',
                isOverLimit ? 'text-[#F87171]' : 'text-[#22D3EE]'
              )}
            >
              {charCount.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
