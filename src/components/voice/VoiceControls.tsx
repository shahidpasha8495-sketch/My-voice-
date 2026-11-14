import {
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Square,
  VolumeX,
  XCircle,
} from 'lucide-react';
import React from 'react';
import type { VoiceState } from '../../types';
import { cn } from '../../utils/formatters';

export interface VoiceControlsProps {
  voiceState: VoiceState;
  isRecognitionSupported: boolean;
  isSynthesisSupported: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  hasReplayableResponse: boolean;
  disabled?: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onCancelListening: () => void;
  onReplayResponse: () => void;
  onStopSpeaking: () => void;
  onPauseSpeaking?: () => void;
  onResumeSpeaking?: () => void;
  className?: string;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isRecognitionSupported,
  isSynthesisSupported,
  isListening,
  isSpeaking,
  isPaused,
  hasReplayableResponse,
  disabled = false,
  onStartListening,
  onStopListening,
  onCancelListening,
  onReplayResponse,
  onStopSpeaking,
  onPauseSpeaking,
  onResumeSpeaking,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-2',
        className
      )}
      role="toolbar"
      aria-label="Voice interaction controls"
    >
      {/* Start / Stop Microphone */}
      {!isListening ? (
        <button
          type="button"
          disabled={disabled || !isRecognitionSupported}
          onClick={onStartListening}
          aria-label={
            isRecognitionSupported
              ? 'Start microphone'
              : 'Voice recognition unsupported in this browser'
          }
          title={
            isRecognitionSupported
              ? 'Start speaking with your microphone'
              : 'Speech recognition is not supported by this browser'
          }
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200',
            isRecognitionSupported
              ? 'bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-[#F8FAFC] shadow-glow-primary hover:opacity-95'
              : 'bg-[#171B2B] text-[#94A3B8] border border-white/10 opacity-60 cursor-not-allowed',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isRecognitionSupported ? (
            <Mic className="w-4 h-4" />
          ) : (
            <MicOff className="w-4 h-4" />
          )}
          <span>Start Mic</span>
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={onStopListening}
            aria-label="Stop microphone and submit speech"
            className="inline-flex items-center gap-2 rounded-xl bg-[#22D3EE] px-3.5 py-2 text-xs font-semibold text-[#090B14] shadow-glow-secondary hover:bg-[#22D3EE]/90 transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Mic</span>
          </button>

          <button
            type="button"
            onClick={onCancelListening}
            aria-label="Cancel listening"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#171B2B] border border-[#F87171]/40 px-3 py-2 text-xs font-medium text-[#F87171] hover:bg-[#F87171]/10 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </>
      )}

      {/* Speech Synthesis Playback Controls */}
      {isSynthesisSupported && (isSpeaking || isPaused) && (
        <>
          {isPaused ? (
            <button
              type="button"
              onClick={onResumeSpeaking}
              aria-label="Resume speaking"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#171B2B] border border-[#22D3EE]/40 px-3 py-2 text-xs font-medium text-[#22D3EE] hover:bg-[#22D3EE]/10 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onPauseSpeaking}
              aria-label="Pause speaking"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#171B2B] border border-white/15 px-3 py-2 text-xs font-medium text-[#F8FAFC] hover:bg-white/5 transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          <button
            type="button"
            onClick={onStopSpeaking}
            aria-label="Stop speaking"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#171B2B] border border-[#F87171]/40 px-3 py-2 text-xs font-medium text-[#F87171] hover:bg-[#F87171]/10 transition-colors"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Stop Speaking</span>
          </button>
        </>
      )}

      {/* Replay Last AI Response */}
      {isSynthesisSupported && hasReplayableResponse && !isSpeaking && (
        <button
          type="button"
          onClick={onReplayResponse}
          aria-label="Replay AI response"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#171B2B] border border-white/10 px-3 py-2 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#8B5CF6]/40 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>Replay Response</span>
        </button>
      )}
    </div>
  );
};
