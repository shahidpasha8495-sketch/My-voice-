import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div
      className="flex items-start gap-3 max-w-3xl"
      role="status"
      aria-label="MyVoice AI is generating a response"
      data-testid="typing-indicator"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#22D3EE] text-[#F8FAFC] shadow-glow-primary">
        <Sparkles className="h-4 w-4" />
      </div>

      <div className="rounded-2xl rounded-tl-sm bg-[#171B2B] border border-white/10 px-4 py-3 shadow-sm flex items-center gap-2">
        <span className="text-xs font-medium text-[#94A3B8] mr-1">
          MyVoice is thinking
        </span>
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: dot * 0.16,
              ease: 'easeInOut',
            }}
            className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]"
          />
        ))}
      </div>
    </div>
  );
};
