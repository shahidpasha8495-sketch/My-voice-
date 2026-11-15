import { Check, MessageSquare, Pencil, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import type { Conversation } from '../../types';
import { cn, formatRelativeTime } from '../../utils/formatters';
import { getLanguageMetadata } from '../../utils/language';

export interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRequestDelete: (conversation: Conversation) => void;
  onRename?: (conversationId: string, newTitle: string) => Promise<boolean> | void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
  onRequestDelete,
  onRename,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conversation.title);
  const langMeta = getLanguageMetadata(conversation.language);

  const handleRenameSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const cleaned = draftTitle.trim();
    if (!cleaned || cleaned === conversation.title) {
      setIsEditing(false);
      setDraftTitle(conversation.title);
      return;
    }
    await onRename?.(conversation.id, cleaned);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'group relative flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-all cursor-pointer border',
        isActive
          ? 'bg-[#171B2B] border-[#8B5CF6]/50 text-[#F8FAFC] shadow-glow-primary'
          : 'border-transparent text-[#94A3B8] hover:bg-[#171B2B]/60 hover:text-[#F8FAFC]'
      )}
      onClick={() => {
        if (!isEditing) onSelect(conversation.id);
      }}
      role="button"
      tabIndex={0}
      aria-current={isActive ? 'page' : undefined}
      onKeyDown={(e) => {
        if (isEditing) return;
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
          {isEditing ? (
            <form
              onSubmit={handleRenameSubmit}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1"
            >
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                maxLength={120}
                autoFocus
                aria-label="Rename conversation title"
                className="w-full rounded-lg border border-[#8B5CF6] bg-[#090B14] px-2 py-0.5 text-xs text-[#F8FAFC] focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Save conversation title"
                className="rounded p-1 text-[#34D399] hover:bg-[#34D399]/15"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Cancel renaming"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                  setDraftTitle(conversation.title);
                }}
                className="rounded p-1 text-[#94A3B8] hover:bg-white/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <>
              <p className="truncate text-xs sm:text-sm font-medium leading-snug">
                {conversation.title}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-[#94A3B8]">
                <span className="rounded bg-white/5 px-1.5 py-0.2 font-medium text-[#22D3EE]/90">
                  {langMeta.shortLabel}
                </span>
                <span>{formatRelativeTime(conversation.updated_at)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="flex items-center gap-0.5 shrink-0">
          {onRename && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDraftTitle(conversation.title);
                setIsEditing(true);
              }}
              aria-label={`Rename conversation "${conversation.title}"`}
              title="Rename conversation"
              className="opacity-70 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-lg p-1.5 text-[#94A3B8] hover:bg-white/10 hover:text-[#22D3EE] transition-all"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete(conversation);
            }}
            aria-label={`Delete conversation "${conversation.title}"`}
            title="Delete conversation"
            className="opacity-70 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#F87171]/15 hover:text-[#F87171] transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
