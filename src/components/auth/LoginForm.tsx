import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { loginSchema } from '../../utils/validation';

export interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<boolean>;
  error: string | null;
  onClearError: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  error,
  onClearError,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearError();
    setValidationError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setValidationError(
        parsed.error.issues[0]?.message || 'Please check your login details.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data.email, parsed.data.password);
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = validationError || error;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4"
      data-testid="login-form"
    >
      {displayError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-2xl border border-[#F87171]/40 bg-[#F87171]/10 px-4 py-3 text-xs font-medium text-[#F87171]"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="login-email"
          className="block text-xs font-semibold tracking-wide text-[#F8FAFC] mb-1.5"
        >
          Email Address
        </label>
        <div className="relative group">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#72758E] group-focus-within:text-[#22D3EE] transition-colors" />
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-white/[0.08] bg-[#090914]/90 pl-10 pr-4 py-3 text-sm text-[#F8FAFC] placeholder-[#72758E] transition-all focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#22D3EE]/25 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="block text-xs font-semibold tracking-wide text-[#F8FAFC] mb-1.5"
        >
          Password
        </label>
        <div className="relative group">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#72758E] group-focus-within:text-[#A855F7] transition-colors" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="••••••••"
            className="w-full rounded-2xl border border-white/[0.08] bg-[#090914]/90 pl-10 pr-11 py-3 text-sm text-[#F8FAFC] placeholder-[#72758E] transition-all focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#22D3EE]/25 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#72758E] hover:text-[#F8FAFC] hover:bg-white/5 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-[#22D3EE]" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE] px-5 py-3 text-sm font-bold text-[#F8FAFC] shadow-glow-primary hover:shadow-glow-secondary hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Signing in…</span>
          </>
        ) : (
          <>
            <span>Sign In to MyVoice</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-[#A1A1B8] pt-2">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="font-bold text-[#22D3EE] hover:text-[#A855F7] hover:underline transition-colors"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
};
