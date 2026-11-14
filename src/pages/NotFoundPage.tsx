import { ArrowLeft, Compass } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#090B14] text-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#171B2B] border border-[#8B5CF6]/40 text-[#22D3EE] shadow-glow-primary mb-5">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">404 – Page Not Found</h1>
      <p className="mt-2 max-w-md text-sm text-[#94A3B8]">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] px-5 py-2.5 text-sm font-semibold text-[#F8FAFC] shadow-glow-primary hover:opacity-95 transition-all"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to MyVoice Dashboard</span>
      </Link>
    </div>
  );
};
