import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import React, { useEffect } from 'react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onCancel}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-[#171B2B] border border-white/10 p-6 shadow-card-subtle"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={
                    isDestructive
                      ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F87171]/15 text-[#F87171]'
                      : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6]'
                  }
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h2
                  id="confirm-dialog-title"
                  className="text-lg font-semibold text-[#F8FAFC]"
                >
                  {title}
                </h2>
              </div>
              <button
                type="button"
                disabled={isLoading}
                onClick={onCancel}
                aria-label="Close confirmation dialog"
                className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-white/5 hover:text-[#F8FAFC] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p
              id="confirm-dialog-description"
              className="mt-3 text-sm leading-relaxed text-[#94A3B8]"
            >
              {description}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={onCancel}
                className="rounded-xl px-4 py-2 text-sm font-medium text-[#94A3B8] hover:bg-white/5 hover:text-[#F8FAFC] transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={onConfirm}
                className={
                  isDestructive
                    ? 'rounded-xl bg-[#F87171] px-4 py-2 text-sm font-semibold text-[#090B14] hover:bg-[#F87171]/90 transition-colors disabled:opacity-50'
                    : 'rounded-xl bg-[#8B5CF6] px-4 py-2 text-sm font-semibold text-[#F8FAFC] hover:bg-[#7C3AED] transition-colors disabled:opacity-50'
                }
              >
                {isLoading ? 'Processing…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
