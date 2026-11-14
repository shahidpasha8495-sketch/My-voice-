import { Loader2, MessageSquareDashed } from 'lucide-react';
import React from 'react';
import type { Conversation } from '../../types';
import { ConversationItem } from './ConversationItem';

export interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  loading: boolean;
  onSelectConversation: (id: string) => void;
  onRequestDeleteConversation: (conversation: Conversation) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  loading,
  onSelectConversation,
  onRequestDeleteConversation,
}) => {
  if (loading && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-[#94A3B8]">
        <Loader2 className="h-5 w-5 animate-spin text-[#8B5CF6]" />
        <span className="mt-2 text-xs">Loading conversations…</span>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#171B2B]/40 px-4 py-8 text-center"
        data-testid="empty-conversation-list"
      >
        <MessageSquareDashed className="h-6 w-6 text-[#94A3B8]" />
        <p className="mt-2 text-xs font-medium text-[#F8FAFC]">
          No saved conversations yet
        </p>
        <p className="mt-1 text-[11px] text-[#94A3B8]">
          Start speaking or typing to save your first conversation.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-1"
      role="list"
      aria-label="Saved conversations"
      data-testid="conversation-list"
    >
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={conv.id === activeConversationId}
          onSelect={onSelectConversation}
          onRequestDelete={onRequestDeleteConversation}
        />
      ))}
    </div>
  );
};
