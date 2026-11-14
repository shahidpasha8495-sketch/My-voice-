import { MessageSquare, Trash2 } from 'lucide-react';
import React from 'react';
import type { Conversation } from '../../types';
import { cn, formatRelativeTime } from '../../utils/formatters';
import { getLanguageMetadata } from '../../utils/language';

export interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRequestDelete: (conversation: Conversation) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
  onRequestDelete,
}) => {
  const langMeta = getLanguageMetadata(conversation.language);

  return (
    <div
      className={cn(
        'group relative flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-all cursor-pointer border',
        isActive
          ? 'bg-[#171B2B] border-[#8B5CF6]/50 text-[#F8FAFC] shadow-glow-primary'
          : 'border-transparent text-[#94A3B8] hover:bg-[#171B2B]/60 hover:text-[#F8FAFC]'
      )}
      onClick={() => onSelect(conversation.id)}
      role="button"
      tabIndex={0}
      aria-current={isActive ? 'page' : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(conversation.id);
        }
      }}
      data-testid={`conversation-item-${conversation.id}`}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <MessageSquare
          className={cn(
            'h-4 w-4 shrink-0 mt-0.5 transition-colors',
            isActive ? 'text-[#22D3EE]' : 'text-[#94A3B8] group-hover:text-[#8B5CF6]'
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs sm:text-sm font-medium leading-snug">
            {conversation.title}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-[#94A3B8]">
            <span className="rounded bg-white/5 px-1.5 py-0.2 font-medium text-[#22D3EE]/90">
              {langMeta.shortLabel}
            </span>
            <span>{formatRelativeTime(conversation.updated_at)}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRequestDelete(conversation);
        }}
        aria-label={`Delete conversation "${conversation.title}"`}
        title="Delete conversation"
        className="opacity-70 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#F87171]/15 hover:text-[#F87171] transition-all shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
