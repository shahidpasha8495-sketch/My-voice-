import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

export interface AppLayoutProps {
  sidebar: React.ReactNode;
  mobileSidebar: React.ReactNode;
  rightPanel?: React.ReactNode;
  isMobileSidebarOpen: boolean;
  onCloseMobileSidebar: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  sidebar,
  mobileSidebar,
  rightPanel,
  isMobileSidebarOpen,
  onCloseMobileSidebar,
  children,
}) => {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-gradient-to-br from-[#FFFDF9] via-[#F7F2FF] to-[#EFF8FF] dark:from-[#090914] dark:via-[#101124] dark:to-[#090914] text-slate-900 dark:text-[#F8FAFC] transition-colors duration-300">
      {/* Ambient Animated Background Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-32 left-1/3 h-96 w-96 rounded-full bg-purple-300/30 dark:bg-[#8B5CF6]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 right-1/4 h-96 w-96 rounded-full bg-pink-200/35 dark:bg-[#22D3EE]/12 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/2 right-10 h-72 w-72 rounded-full bg-sky-200/30 dark:bg-[#A855F7]/10 blur-3xl"
      />

      {/* Zone 1 (LEFT): Persistent Desktop Navigation & Conversation History Sidebar */}
      <div className="relative z-20 hidden lg:block h-full shrink-0">
        {sidebar}
      </div>

      {/* Mobile Slide-Out Drawer */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden flex"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation drawer"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobileSidebar}
              className="fixed inset-0 bg-black/65 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="relative z-10 h-full w-72 max-w-[85vw]"
            >
              {mobileSidebar}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zone 2 (CENTER): Main Conversational & Voice Companion Experience */}
      <main className="relative z-10 flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {children}
      </main>

      {/* Zone 3 (RIGHT): Contextual Plush Companion Panel on Wide Screens */}
      {rightPanel && (
        <div className="relative z-20 hidden 2xl:block h-full shrink-0">
          {rightPanel}
        </div>
      )}
    </div>
  );
};
