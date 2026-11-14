import {
  AudioWaveform,
  Home,
  LogOut,
  MessageSquarePlus,
  Moon,
  Radio,
  Settings,
  Sparkles,
  Sun,
  User as UserIcon,
  X,
} from 'lucide-react';
import React from 'react';
import { PLUSH_CHARACTERS, type PlushCharacterId } from '../../config/characters';
import { useTheme } from '../../hooks/useTheme';
import type { Conversation, UserProfile } from '../../types';
import { cn } from '../../utils/formatters';
import { getLanguageMetadata } from '../../utils/language';
import { PlushCharacter } from '../character/PlushCharacter';
import { ConversationList } from './ConversationList';

export type DashboardViewMode = 'chat' | 'studio' | 'gallery';

export interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  loadingConversations: boolean;
  userProfile: UserProfile | null;
  userEmail?: string;
  activeView?: DashboardViewMode;
  selectedCharacterId?: PlushCharacterId;
  onChangeView?: (view: DashboardViewMode) => void;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onRequestDeleteConversation: (conversation: Conversation) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  loadingConversations,
  userProfile,
  userEmail,
  activeView = 'chat',
  selectedCharacterId = 'mellow',
  onChangeView,
  onNewConversation,
  onSelectConversation,
  onRequestDeleteConversation,
  onOpenSettings,
  onSignOut,
  onCloseMobile,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const displayName =
    userProfile?.display_name || userEmail?.split('@')[0] || 'Authenticated User';
  const langMeta = getLanguageMetadata(userProfile?.preferred_language);
  const activeCompanion =
    PLUSH_CHARACTERS[selectedCharacterId] || PLUSH_CHARACTERS.mellow;

  return (
    <aside
      className="flex h-full w-72 flex-col bg-white/85 dark:bg-[#111426]/95 border-r border-purple-200/60 dark:border-white/[0.08] backdrop-blur-2xl select-none transition-colors duration-300"
      aria-label="MyVoice Plush Intelligence navigation and conversation history sidebar"
    >
      {/* Top MyVoice · Plush Intelligence Brand Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-purple-200/60 dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] via-[#A855F7] to-[#22D3EE] text-white shadow-glow-primary">
            <AudioWaveform className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-extrabold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
                MyVoice
              </span>
              <span className="rounded-md bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-1.5 py-0.5 text-[9px] font-bold text-[#8B5CF6] dark:text-[#22D3EE]">
                PLUSH AI
              </span>
            </div>
            <span className="block text-[10px] font-medium text-slate-500 dark:text-[#A1A1B8]">
              Plush Intelligence Platform
            </span>
          </div>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="lg:hidden rounded-lg p-1.5 text-slate-500 dark:text-[#A1A1B8] hover:bg-white/10 hover:text-slate-900 dark:hover:text-[#F8FAFC]"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Active Plush Companion Mini Card */}
      <div className="px-3.5 pt-3.5">
        <div
          onClick={() => {
            onChangeView?.('gallery');
            onCloseMobile?.();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onChangeView?.('gallery');
              onCloseMobile?.();
            }
          }}
          className="flex items-center gap-3 rounded-2xl border border-purple-200/70 dark:border-white/[0.08] bg-gradient-to-r from-purple-100/70 via-pink-50/60 to-sky-100/70 dark:from-[#191B30] dark:to-[#101124] p-2.5 cursor-pointer hover:border-[#8B5CF6]/60 transition-all"
        >
          <PlushCharacter
            characterId={selectedCharacterId}
            voiceState="idle"
            size="xs"
            interactive={false}
          />
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6] dark:text-[#22D3EE]">
              Active Companion
            </span>
            <p className="truncate text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
              {activeCompanion.name}
            </p>
            <p className="truncate text-[11px] text-slate-600 dark:text-[#A1A1B8]">
              {activeCompanion.personality}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Mode Switcher */}
      {onChangeView && (
        <nav
          className="px-3.5 pt-3 grid grid-cols-3 gap-1.5"
          aria-label="Primary workspace views"
        >
          <button
            type="button"
            onClick={() => {
              onChangeView('chat');
              onCloseMobile?.();
            }}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-[11px] font-semibold transition-all border',
              activeView === 'chat'
                ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#F8FAFC]'
                : 'border-transparent text-slate-600 dark:text-[#A1A1B8] hover:bg-purple-100/50 dark:hover:bg-[#191B30]'
            )}
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onChangeView('studio');
              onCloseMobile?.();
            }}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-[11px] font-semibold transition-all border',
              activeView === 'studio'
                ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#F8FAFC]'
                : 'border-transparent text-slate-600 dark:text-[#A1A1B8] hover:bg-purple-100/50 dark:hover:bg-[#191B30]'
            )}
          >
            <Radio className="h-3.5 w-3.5 text-[#F472B6]" />
            <span>Studio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onChangeView('gallery');
              onCloseMobile?.();
            }}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-[11px] font-semibold transition-all border',
              activeView === 'gallery'
                ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#F8FAFC]'
                : 'border-transparent text-slate-600 dark:text-[#A1A1B8] hover:bg-purple-100/50 dark:hover:bg-[#191B30]'
            )}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#22D3EE]" />
            <span>Plushies</span>
          </button>
        </nav>
      )}

      {/* New Conversation Button */}
      <div className="p-3.5">
        <button
          type="button"
          onClick={() => {
            onChangeView?.('chat');
            onNewConversation();
            onCloseMobile?.();
          }}
          data-testid="new-conversation-button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE] px-4 py-2.5 text-sm font-bold text-white shadow-glow-primary hover:opacity-95 transition-all"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Conversation History List */}
      <div className="flex-1 overflow-y-auto px-3 py-1">
        <div className="mb-2 flex items-center justify-between px-2">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#72758E]">
            Conversation History
          </h2>
          <span className="rounded-full bg-purple-100 dark:bg-[#191B30] px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-[#A1A1B8]">
            {conversations.length}
          </span>
        </div>

        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          loading={loadingConversations}
          onSelectConversation={(id) => {
            onChangeView?.('chat');
            onSelectConversation(id);
            onCloseMobile?.();
          }}
          onRequestDeleteConversation={onRequestDeleteConversation}
        />
      </div>

      {/* Bottom Theme, Settings & User Profile */}
      <div className="border-t border-purple-200/60 dark:border-white/[0.08] p-3 space-y-2 bg-purple-50/50 dark:bg-[#090914]/50">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              onCloseMobile?.();
            }}
            className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 dark:text-[#A1A1B8] hover:bg-white/80 dark:hover:bg-[#191B30] hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors"
          >
            <Settings className="h-4 w-4 text-[#8B5CF6] dark:text-[#22D3EE]" />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex items-center gap-1.5 rounded-xl border border-purple-200/70 dark:border-white/[0.08] bg-white/80 dark:bg-[#191B30] px-3 py-2 text-xs font-semibold text-slate-700 dark:text-[#F8FAFC] transition-colors"
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-[#8B5CF6]" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/85 dark:bg-[#191B30] p-2.5 border border-purple-200/60 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/20 text-[#A855F7]">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                {displayName}
              </p>
              <p className="truncate text-[10px] text-slate-500 dark:text-[#A1A1B8]">
                {langMeta.nativeName} · {userEmail || 'Signed in'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out"
            data-testid="signout-button"
            className="rounded-lg p-1.5 text-slate-500 dark:text-[#A1A1B8] hover:bg-[#F87171]/15 hover:text-[#F87171] transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
