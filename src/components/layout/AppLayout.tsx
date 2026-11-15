import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../hooks/useTheme';

export interface AppLayoutProps {
  sidebar: React.ReactNode;
  mobileSidebar: React.ReactNode;
  rightPanel?: React.ReactNode;
  isMobileSidebarOpen: boolean;
  onCloseMobileSidebar: () => void;
  children: React.ReactNode;
}

const STARFIELD_PARTICLES = [
  { top: '12%', left: '18%', size: 4, delay: 0, duration: 5.5 },
  { top: '24%', left: '72%', size: 5, delay: 0.8, duration: 6.2 },
  { top: '42%', left: '14%', size: 3.5, delay: 1.4, duration: 4.8 },
  { top: '65%', left: '84%', size: 4.5, delay: 0.4, duration: 5.8 },
  { top: '78%', left: '34%', size: 4, delay: 1.9, duration: 6.5 },
  { top: '18%', left: '48%', size: 3, delay: 2.3, duration: 5.1 },
  { top: '54%', left: '62%', size: 4, delay: 1.1, duration: 5.9 },
  { top: '86%', left: '76%', size: 3.5, delay: 0.6, duration: 4.9 },
];

export const AppLayout: React.FC<AppLayoutProps> = ({
  sidebar,
  mobileSidebar,
  rightPanel,
  isMobileSidebarOpen,
  onCloseMobileSidebar,
  children,
}) => {
  const { backgroundPreset } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      style={{ background: backgroundPreset.bgGradient }}
      data-testid="app-layout-root"
      data-bg-theme={backgroundPreset.id}
      className="relative flex h-screen w-screen overflow-hidden text-slate-900 dark:text-[#F8FAFC] transition-colors duration-500"
    >
      {/* Dynamic Animated Blurred Light Orbs */}
      <motion.div
        aria-hidden="true"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                x: [0, 28, -18, 0],
                y: [0, -22, 16, 0],
                scale: [1, 1.08, 0.96, 1],
              }
        }
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: backgroundPreset.orb1 }}
        className="pointer-events-none fixed -top-28 left-1/4 h-[28rem] w-[28rem] rounded-full blur-3xl"
      />
      <motion.div
        aria-hidden="true"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                x: [0, -30, 20, 0],
                y: [0, 24, -18, 0],
                scale: [1, 1.06, 0.95, 1],
              }
        }
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: backgroundPreset.orb2 }}
        className="pointer-events-none fixed bottom-[-6rem] right-1/4 h-[26rem] w-[26rem] rounded-full blur-3xl"
      />
      <motion.div
        aria-hidden="true"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                x: [0, 18, -22, 0],
                y: [0, -16, 20, 0],
              }
        }
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: backgroundPreset.orb3 }}
        className="pointer-events-none fixed top-1/3 right-12 h-80 w-80 rounded-full blur-3xl"
      />

      {/* Subtle Moving Stars & Floating Glowing Particles */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        {STARFIELD_PARTICLES.map((p, idx) => {
          const color =
            backgroundPreset.particleColors[
              idx % backgroundPreset.particleColors.length
            ];
          return (
            <motion.span
              key={idx}
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      y: [0, -14, 0],
                      opacity: [0.22, 0.78, 0.22],
                      scale: [0.9, 1.25, 0.9],
                    }
              }
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                backgroundColor: color,
                boxShadow: `0 0 12px ${color}`,
              }}
              className="absolute rounded-full"
            />
          );
        })}
      </div>

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
