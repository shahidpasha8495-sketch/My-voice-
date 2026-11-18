import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { SupportedLanguage } from '../../types';
import { LANGUAGE_LIST } from '../../utils/language';
import { normalizeError } from '../../utils/normalizeError';
import { signupSchema } from '../../utils/validation';

export interface SignupFormProps {
  onSubmit: (params: {
    displayName: string;
    email: string;
    password: string;
    preferredLanguage: SupportedLanguage;
  }) => Promise<boolean>;
  error: string | null;
  onClearError: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSubmit,
  error,
  onClearError,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPasscode, setVerifyPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [preferredLanguage, setPreferredLanguage] =
    useState<SupportedLanguage>('en-US');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearError();
    setValidationError(null);

    if (verifyPasscode.length > 0 && verifyPasscode !== password) {
      setValidationError('Passcodes do not match. Please re-enter carefully.');
      return;
    }

    const parsed = signupSchema.safeParse({
      displayName,
      email,
      password,
      preferredLanguage,
    });

    if (!parsed.success) {
      setValidationError(
        parsed.error.issues[0]?.message || 'Please check your registration details.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
    } finally {
      setSubmitting(false);
    }
  };

  const rawDisplayError = validationError || error;
  const displayError = rawDisplayError
    ? normalizeError(rawDisplayError, 'Registration failed. Please try again.')
    : null;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-3.5"
      data-testid="signup-form"
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
          htmlFor="signup-name"
          className="block text-xs font-semibold tracking-wide text-[#F8FAFC] mb-1.5"
        >
          Display Name
        </label>
        <div className="relative group">
          <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#72758E] group-focus-within:text-[#22D3EE] transition-colors" />
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            required
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="Aarav Sharma"
            className="w-full rounded-2xl border border-white/[0.08] bg-[#090914]/90 pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#72758E] transition-all focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#22D3EE]/25 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="signup-email"
          className="block text-xs font-semibold tracking-wide text-[#F8FAFC] mb-1.5"
        >
          Email Address
        </label>
        <div className="relative group">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#72758E] group-focus-within:text-[#22D3EE] transition-colors" />
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-white/[0.08] bg-[#090914]/90 pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#72758E] transition-all focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#22D3EE]/25 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="signup-password"
          className="block text-xs font-semibold tracking-wide text-[#F8FAFC] mb-1.5"
        >
          Password
        </label>
        <div className="relative group">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#72758E] group-focus-within:text-[#A855F7] transition-colors" />
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="At least 6 characters"
            className="w-full rounded-2xl border border-white/[0.08] bg-[#090914]/90 pl-10 pr-11 py-2.5 text-sm text-[#F8FAFC] placeholder-[#72758E] transition-all focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#22D3EE]/25 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
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

      <div>
        <label
          htmlFor="signup-verify-passcode"
          className="block text-xs font-semibold tracking-wide text-[#F8FAFC] mb-1.5"
        >
          Verify Passcode
        </label>
        <div className="relative group">
          <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#72758E] group-focus-within:text-[#34D399] transition-colors" />
          <input
            id="signup-verify-passcode"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={verifyPasscode}
            onChange={(e) => {
              setVerifyPasscode(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="Re-enter to confirm"
            className="w-full rounded-2xl border border-white/[0.08] bg-[#090914]/90 pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#72758E] transition-all focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#22D3EE]/25 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="signup-language"
          className="block text-xs font-semibold tracking-wide text-[#F8FAFC] mb-1.5"
        >
          Preferred Language
        </label>
        <div className="relative">
          <Globe className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#22D3EE]" />
          <select
            id="signup-language"
            value={preferredLanguage}
            onChange={(e) =>
              setPreferredLanguage(e.target.value as SupportedLanguage)
            }
            className="w-full rounded-2xl border border-white/[0.08] bg-[#090914]/90 pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#22D3EE]/25 focus:outline-none"
          >
            {LANGUAGE_LIST.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE] px-5 py-3 text-sm font-bold text-[#F8FAFC] shadow-glow-primary hover:shadow-glow-secondary hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Creating account…</span>
          </>
        ) : (
          <>
            <span>Create Account</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-[#A1A1B8] pt-1.5">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-bold text-[#22D3EE] hover:text-[#A855F7] hover:underline transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
};
