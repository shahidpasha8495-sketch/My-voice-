import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Globe,
  LogOut,
  Mail,
  Mic,
  Palette,
  Settings,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  ALL_COMPANION_LIST,
  type PlushCharacterId,
} from '../../config/characters';
import { BACKGROUND_THEME_LIST } from '../../config/theme';
import { useTheme } from '../../hooks/useTheme';
import type { SupportedLanguage } from '../../types';
import { LANGUAGE_LIST } from '../../utils/language';

export interface SettingsPanelProps {
  isOpen: boolean;
  displayName: string;
  userEmail?: string;
  preferredLanguage: SupportedLanguage;
  autoDetectLanguage: boolean;
  autoSpeakResponses: boolean;
  isRecognitionSupported: boolean;
  isSynthesisSupported: boolean;
  availableVoicesCount: number;
  availableVoices?: SpeechSynthesisVoice[];
  selectedVoiceURI?: string | null;
  volume?: number;
  selectedCharacterId?: PlushCharacterId;
  onSelectVoiceURI?: (uri: string | null) => void;
  onVolumeChange?: (volume: number) => void;
  onSelectCharacter?: (id: PlushCharacterId) => void;
  onClose: () => void;
  onSaveProfile: (updates: {
    displayName: string;
    preferredLanguage: SupportedLanguage;
  }) => Promise<boolean>;
  onChangeAutoDetect: (enabled: boolean) => void;
  onChangeAutoSpeak: (enabled: boolean) => void;
  onSignOut?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  displayName,
  userEmail,
  preferredLanguage,
  autoDetectLanguage,
  autoSpeakResponses,
  isRecognitionSupported,
  isSynthesisSupported,
  availableVoicesCount,
  availableVoices = [],
  selectedVoiceURI = '',
  volume = 1,
  selectedCharacterId = 'mellow',
  onSelectVoiceURI,
  onVolumeChange,
  onSelectCharacter,
  onClose,
  onSaveProfile,
  onChangeAutoDetect,
  onChangeAutoSpeak,
  onSignOut,
}) => {
  const { backgroundTheme, setBackgroundTheme } = useTheme();
  const [nameInput, setNameInput] = useState(displayName);
  const [selectedLang, setSelectedLang] =
    useState<SupportedLanguage>(preferredLanguage);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setNameInput(displayName);
    setSelectedLang(preferredLanguage);
  }, [displayName, preferredLanguage, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(false);
    const ok = await onSaveProfile({
      displayName: nameInput.trim() || 'User',
      preferredLanguage: selectedLang,
    });
    setSaving(false);
    if (ok) {
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2200);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-panel-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            className="relative z-10 w-full max-w-lg rounded-3xl bg-[#191B30] border border-white/[0.08] p-6 shadow-plush-float max-h-[90vh] overflow-y-auto text-[#F8FAFC]"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8B5CF6]/20 text-[#22D3EE]">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="settings-panel-title"
                    className="font-display text-base font-bold text-[#F8FAFC]"
                  >
                    Preferences &amp; Voice Settings
                  </h2>
                  <p className="text-xs text-[#A1A1B8]">
                    MyVoice Plush Intelligence · Account &amp; Speech Configuration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close settings"
                className="rounded-lg p-1.5 text-[#A1A1B8] hover:bg-white/5 hover:text-[#F8FAFC]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-5">
              {/* Account Information & Display Name */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="settings-display-name"
                    className="block text-xs font-semibold text-[#F8FAFC] mb-1.5"
                  >
                    Display Name
                  </label>
                  <input
                    id="settings-display-name"
                    type="text"
                    maxLength={60}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#090914] px-3.5 py-2.5 text-sm text-[#F8FAFC] focus:border-[#8B5CF6] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5">
                    Account Email
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#090914]/60 px-3.5 py-2.5 text-sm text-[#A1A1B8]">
                    <Mail className="h-4 w-4 shrink-0 text-[#22D3EE]" />
                    <span className="truncate">{userEmail || 'Signed in user'}</span>
                  </div>
                </div>
              </div>

              {/* 6 Animated Background Themes */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#F8FAFC] mb-2">
                  <Palette className="h-3.5 w-3.5 text-[#22D3EE]" />
                  <span>Dynamic Animated Background Theme</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BACKGROUND_THEME_LIST.map((themeItem) => {
                    const active = backgroundTheme === themeItem.id;
                    return (
                      <button
                        key={themeItem.id}
                        type="button"
                        onClick={() => setBackgroundTheme(themeItem.id)}
                        data-testid={`select-theme-${themeItem.id}`}
                        className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                          active
                            ? 'border-[#22D3EE] bg-[#22D3EE]/15 text-[#F8FAFC] shadow-glow-secondary'
                            : 'border-white/[0.08] bg-[#090914]/60 text-[#A1A1B8] hover:text-[#F8FAFC]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{themeItem.emoji}</span>
                          <span className="text-xs font-bold">{themeItem.name}</span>
                        </div>
                        <span className="mt-0.5 text-[10px] opacity-80 line-clamp-1">
                          {themeItem.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Companion Character Selection */}
              {onSelectCharacter && (
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[#F8FAFC] mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-[#A855F7]" />
                    <span>Active AI Companion (10 Characters)</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {ALL_COMPANION_LIST.map((char) => {
                      const active = selectedCharacterId === char.id;
                      return (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => onSelectCharacter(char.id)}
                          className={`rounded-xl border px-2.5 py-2 text-center transition-all ${
                            active
                              ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#F8FAFC]'
                              : 'border-white/[0.08] bg-[#090914]/60 text-[#A1A1B8] hover:text-[#F8FAFC]'
                          }`}
                        >
                          <span className="block text-xs font-bold">{char.name}</span>
                          <span className="block text-[9px] opacity-75 truncate">
                            {char.personality}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Preferred Language (All 11 Languages) */}
              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-2">
                  Preferred Language (11 Multilingual Voices &amp; Scripts)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                  {LANGUAGE_LIST.map((lang) => {
                    const active = selectedLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setSelectedLang(lang.code)}
                        className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                          active
                            ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#F8FAFC] shadow-glow-primary'
                            : 'border-white/[0.08] bg-[#090914]/60 text-[#A1A1B8] hover:text-[#F8FAFC]'
                        }`}
                      >
                        <span className="text-xs font-semibold">{lang.nativeName}</span>
                        <span className="text-[10px] opacity-80">{lang.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Voice Selection & Volume Control */}
              {(onSelectVoiceURI || onVolumeChange) && (
                <div className="space-y-3 rounded-xl bg-[#090914]/60 p-3.5 border border-white/[0.08]">
                  {onVolumeChange && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-[#F8FAFC]">
                        Speech Synthesis Volume ({Math.round(volume * 100)}%)
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        onChange={(e) => onVolumeChange(Number(e.target.value))}
                        aria-label="Speech synthesis volume"
                        className="w-32 accent-[#22D3EE] cursor-pointer"
                      />
                    </div>
                  )}
                  {onSelectVoiceURI && availableVoices.length > 0 && (
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.06]">
                      <label
                        htmlFor="settings-voice-select"
                        className="text-xs font-medium text-[#F8FAFC]"
                      >
                        Preferred System / Neural Voice
                      </label>
                      <select
                        id="settings-voice-select"
                        value={selectedVoiceURI || ''}
                        onChange={(e) => onSelectVoiceURI(e.target.value || null)}
                        className="w-full rounded-xl border border-white/10 bg-[#191B30] px-3 py-2 text-xs text-[#F8FAFC]"
                      >
                        <option value="">Auto (Highest-Quality Neural Voice)</option>
                        {availableVoices.map((v) => (
                          <option key={v.voiceURI} value={v.voiceURI}>
                            {v.name} ({v.lang})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-3 rounded-xl bg-[#090914]/60 p-3.5 border border-white/[0.08]">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-[#22D3EE]" />
                    <div>
                      <span className="block text-xs font-medium text-[#F8FAFC]">
                        Automatic Language Detection
                      </span>
                      <span className="block text-[11px] text-[#A1A1B8]">
                        Detect all 11 supported languages automatically from your input
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoDetectLanguage}
                    onChange={(e) => onChangeAutoDetect(e.target.checked)}
                    className="h-4 w-4 accent-[#8B5CF6] rounded"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 cursor-pointer pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="h-4 w-4 text-[#A855F7]" />
                    <div>
                      <span className="block text-xs font-medium text-[#F8FAFC]">
                        Speak AI Responses Automatically
                      </span>
                      <span className="block text-[11px] text-[#A1A1B8]">
                        Read AI responses aloud using browser speech synthesis
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSpeakResponses}
                    onChange={(e) => onChangeAutoSpeak(e.target.checked)}
                    className="h-4 w-4 accent-[#8B5CF6] rounded"
                  />
                </label>
              </div>

              {/* Device Speech Capabilities */}
              <div className="rounded-xl bg-[#090914]/60 p-3.5 border border-white/[0.08] space-y-2">
                <p className="text-xs font-semibold text-[#F8FAFC]">
                  Browser Voice Capabilities
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[#A1A1B8]">
                    <Mic className="h-3.5 w-3.5" /> Speech Recognition API
                  </span>
                  <span
                    className={
                      isRecognitionSupported
                        ? 'text-[#34D399] font-medium'
                        : 'text-[#F87171] font-medium'
                    }
                  >
                    {isRecognitionSupported ? 'Supported' : 'Unsupported'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[#A1A1B8]">
                    <Volume2 className="h-3.5 w-3.5" /> Speech Synthesis API
                  </span>
                  <span
                    className={
                      isSynthesisSupported
                        ? 'text-[#34D399] font-medium'
                        : 'text-[#F87171] font-medium'
                    }
                  >
                    {isSynthesisSupported
                      ? `Supported (${availableVoicesCount} system voices)`
                      : 'Unsupported'}
                  </span>
                </div>
                <p className="text-[11px] text-[#72758E] pt-1">
                  Note: Voice availability and speech quality depend on your browser and
                  installed operating-system voices.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.08]">
                <div className="flex items-center gap-3">
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSignOut();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#F87171]/30 bg-[#F87171]/10 px-3 py-2 text-xs font-semibold text-[#F87171] hover:bg-[#F87171]/20 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  )}

                  {savedNotice && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#34D399]">
                      <Check className="h-4 w-4" /> Preferences saved
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl px-4 py-2 text-xs font-medium text-[#A1A1B8] hover:bg-white/5 hover:text-[#F8FAFC]"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE] px-4 py-2 text-xs font-bold text-[#F8FAFC] shadow-glow-primary hover:opacity-95 disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
