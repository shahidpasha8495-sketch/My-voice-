import {
  Home,
  Menu,
  MessageSquarePlus,
  Mic,
  Moon,
  Palette,
  Radio,
  RefreshCw,
  Settings,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react';
import React from 'react';
import { PLUSH_CHARACTERS, type PlushCharacterId } from '../../config/characters';
import { BACKGROUND_THEME_LIST } from '../../config/theme';
import { useTheme } from '../../hooks/useTheme';
import type { ConnectionState, SupportedLanguage } from '../../types';
import { cn } from '../../utils/formatters';
import { LanguageSelector } from '../common/LanguageSelector';
import type { DashboardViewMode } from '../sidebar/Sidebar';

export interface ChatHeaderProps {
  conversationTitle: string;
  language: SupportedLanguage;
  autoSpeak: boolean;
  isListening?: boolean;
  activeView?: DashboardViewMode;
  selectedCharacterId?: PlushCharacterId;
  connectionState?: ConnectionState;
  isCheckingConnection?: boolean;
  onRetryConnection?: () => void;
  onChangeView?: (view: DashboardViewMode) => void;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onToggleAutoSpeak: () => void;
  onNewConversation: () => void;
  onOpenMobileSidebar: () => void;
  onOpenSettings: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversationTitle,
  language,
  autoSpeak,
  isListening = false,
  activeView = 'chat',
  selectedCharacterId = 'mellow',
  connectionState = 'online',
  isCheckingConnection = false,
  onRetryConnection,
  onChangeView,
  onLanguageChange,
  onToggleAutoSpeak,
  onNewConversation,
  onOpenMobileSidebar,
  onOpenSettings,
}) => {
  const { isDark, toggleTheme, backgroundTheme, setBackgroundTheme } = useTheme();
  const character =
    PLUSH_CHARACTERS[selectedCharacterId] || PLUSH_CHARACTERS.mellow;

  const cycleBackgroundTheme = () => {
    const idx = BACKGROUND_THEME_LIST.findIndex((t) => t.id === backgroundTheme);
    const next =
      BACKGROUND_THEME_LIST[(idx + 1) % BACKGROUND_THEME_LIST.length];
    if (next) {
      setBackgroundTheme(next.id);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-purple-200/60 dark:border-white/10 bg-white/75 dark:bg-[#090B14]/85 px-3 py-3 sm:px-6 backdrop-blur-xl transition-colors duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden rounded-xl bg-white/80 dark:bg-[#171B2B] p-2 text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] border border-purple-200/60 dark:border-white/10 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6]/25 via-[#EC4899]/20 to-[#22D3EE]/25 border border-[#8B5CF6]/40 text-[#8B5CF6] dark:text-[#22D3EE]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="truncate text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC]"
                title={conversationTitle}
              >
                {conversationTitle}
              </h1>
              {/* Live Microphone Indicator */}
              <span
                className={cn(
                  'hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border',
                  isListening
                    ? 'bg-[#22D3EE]/15 border-[#22D3EE]/50 text-[#0284C7] dark:text-[#22D3EE]'
                    : 'bg-purple-100/70 dark:bg-white/5 border-purple-200/50 dark:border-white/10 text-slate-600 dark:text-[#94A3B8]'
                )}
              >
                <Mic className="h-2.5 w-2.5" />
                {isListening ? 'Mic Live' : `${character.name} Ready`}
              </span>

              {/* Connection Status Indicator & Retry Button */}
              <div
                data-testid="connection-status-badge"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-all',
                  connectionState === 'online'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-[#34D399]'
                    : connectionState === 'connecting' || isCheckingConnection
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400'
                )}
              >
                {connectionState === 'offline' ? (
                  <WifiOff className="h-2.5 w-2.5" />
                ) : (
                  <Wifi className="h-2.5 w-2.5" />
                )}
                <span>
                  {connectionState === 'online'
                    ? 'AI Online'
                    : connectionState === 'connecting' || isCheckingConnection
                      ? 'Connecting...'
                      : 'Offline'}
                </span>
                {onRetryConnection && (
                  <button
                    type="button"
                    onClick={onRetryConnection}
                    title="Retry AI Connection"
                    aria-label="Retry Connection"
                    data-testid="retry-connection-button"
                    className="ml-0.5 rounded p-0.5 hover:bg-white/15 transition-colors"
                  >
                    <RefreshCw
                      className={cn(
                        'h-2.5 w-2.5',
                        (connectionState === 'connecting' ||
                          isCheckingConnection) &&
                          'animate-spin'
                      )}
                    />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] hidden sm:block">
              PLUSH AI • Meet your little intelligent companion ({character.name})
            </p>
          </div>
        </div>
      </div>

      {/* Center View Tabs on Desktop */}
      {onChangeView && (
        <div className="hidden xl:flex items-center gap-1 rounded-2xl bg-purple-100/70 dark:bg-[#171B2B] p-1 border border-purple-200/60 dark:border-white/10">
          <button
            type="button"
            onClick={() => onChangeView('chat')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
              activeView === 'chat'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-white shadow-sm'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Home className="h-3.5 w-3.5" />
            <span>Companion</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeView('studio')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
              activeView === 'studio'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-white shadow-sm'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Voice Studio</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeView('gallery')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
              activeView === 'gallery'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-white shadow-sm'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Character Gallery</span>
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <LanguageSelector
          value={language}
          onChange={onLanguageChange}
          compact={false}
          className="hidden md:inline-flex"
        />
        <LanguageSelector
          value={language}
          onChange={onLanguageChange}
          compact={true}
          className="md:hidden"
        />

        {/* Animated Background Theme Cycle Button */}
        <button
          type="button"
          onClick={cycleBackgroundTheme}
          aria-label="Cycle animated background theme"
          title={`Background Theme: ${backgroundTheme} (Click to switch)`}
          data-testid="cycle-background-theme-button"
          className="hidden sm:inline-flex rounded-xl p-2 border border-purple-200/70 dark:border-white/10 bg-white/80 dark:bg-[#171B2B] text-slate-700 dark:text-[#F8FAFC] hover:border-[#22D3EE]/50 transition-colors"
        >
          <Palette className="h-4 w-4 text-[#22D3EE]" />
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          data-testid="theme-toggle-button"
          className="rounded-xl p-2 border border-purple-200/70 dark:border-white/10 bg-white/80 dark:bg-[#171B2B] text-slate-700 dark:text-[#F8FAFC] hover:border-[#8B5CF6]/50 transition-colors"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-[#8B5CF6]" />
          )}
        </button>

        <button
          type="button"
          onClick={onToggleAutoSpeak}
          aria-pressed={autoSpeak}
          aria-label={
            autoSpeak
              ? 'Disable automatic voice playback'
              : 'Enable automatic voice playback'
          }
          title={
            autoSpeak
              ? 'Auto-speak AI responses is ON'
              : 'Auto-speak AI responses is OFF'
          }
          className={`rounded-xl p-2 border transition-colors ${
            autoSpeak
              ? 'bg-[#22D3EE]/15 border-[#22D3EE]/40 text-[#0284C7] dark:text-[#22D3EE]'
              : 'bg-white/80 dark:bg-[#171B2B] border-purple-200/70 dark:border-white/10 text-slate-600 dark:text-[#94A3B8]'
          }`}
        >
          {autoSpeak ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={onNewConversation}
          aria-label="Start new conversation"
          title="New Conversation"
          className="sm:hidden rounded-xl bg-white/80 dark:bg-[#171B2B] p-2 text-slate-600 dark:text-[#94A3B8] border border-purple-200/70 dark:border-white/10 transition-colors"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open language and voice settings"
          title="Settings"
          className="rounded-xl bg-white/80 dark:bg-[#171B2B] p-2 text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] border border-purple-200/70 dark:border-white/10 transition-colors"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
