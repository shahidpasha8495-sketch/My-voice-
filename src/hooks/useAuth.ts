import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import React from 'react';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import type { SupportedLanguage, UserProfile } from '../types';
import { normalizeError } from '../utils/normalizeError';
import { isSupportedLanguage, loginSchema, signupSchema } from '../utils/validation';

export const GUEST_ACCESS_TOKEN = 'guest-session-token';
export const GUEST_USER_ID = '00000000-0000-4000-8000-000000000000';
const GUEST_STORAGE_KEY = 'myvoice.guest_session';

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInAsGuest: () => void;
  signUp: (params: {
    displayName: string;
    email: string;
    password: string;
    preferredLanguage?: SupportedLanguage;
  }) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (updates: {
    display_name?: string;
    preferred_language?: SupportedLanguage;
  }) => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function buildGuestAuthObjects(savedProfile?: Partial<UserProfile>): {
  user: User;
  session: Session;
  profile: UserProfile;
} {
  const nowIso = new Date().toISOString();
  const displayName = savedProfile?.display_name || 'Guest Explorer';
  const preferredLanguage: SupportedLanguage = isSupportedLanguage(
    savedProfile?.preferred_language
  )
    ? savedProfile.preferred_language
    : 'en-US';

  const guestUser: User = {
    id: GUEST_USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'guest@myvoice.app',
    user_metadata: {
      display_name: displayName,
      preferred_language: preferredLanguage,
      is_guest: true,
    },
    app_metadata: { provider: 'guest' },
    created_at: nowIso,
  };

  const guestSession: Session = {
    access_token: GUEST_ACCESS_TOKEN,
    refresh_token: 'guest-refresh-token',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    token_type: 'bearer',
    user: guestUser,
  };

  const guestProfile: UserProfile = {
    id: GUEST_USER_ID,
    email: 'guest@myvoice.app',
    display_name: displayName,
    preferred_language: preferredLanguage,
    created_at: savedProfile?.created_at || nowIso,
    updated_at: nowIso,
  };

  return { user: guestUser, session: guestSession, profile: guestProfile };
}

function loadSavedGuestProfile(): Partial<UserProfile> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage?.getItem(GUEST_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<UserProfile>;
  } catch {
    return null;
  }
}

function saveGuestProfile(profile: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!profile) {
      window.sessionStorage?.removeItem(GUEST_STORAGE_KEY);
    } else {
      window.sessionStorage?.setItem(GUEST_STORAGE_KEY, JSON.stringify(profile));
    }
  } catch {
    // ignore storage errors
  }
}

async function fetchOrCreateUserProfile(authUser: User): Promise<UserProfile> {
  const metaName =
    (authUser.user_metadata?.display_name as string | undefined) ||
    (authUser.user_metadata?.full_name as string | undefined) ||
    authUser.email?.split('@')[0] ||
    'User';

  const metaLangRaw = authUser.user_metadata?.preferred_language;
  const metaLang: SupportedLanguage = isSupportedLanguage(metaLangRaw)
    ? metaLangRaw
    : 'en-US';

  const fallbackProfile: UserProfile = {
    id: authUser.id,
    email: authUser.email,
    display_name: metaName,
    preferred_language: metaLang,
    created_at: authUser.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    return fallbackProfile;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, preferred_language, created_at, updated_at')
      .eq('id', authUser.id)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        email: authUser.email,
        display_name: data.display_name || metaName,
        preferred_language: isSupportedLanguage(data.preferred_language)
          ? data.preferred_language
          : metaLang,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }

    // Create profile if database trigger hasn't populated it yet
    const { data: inserted } = await supabase
      .from('profiles')
      .upsert(
        {
          id: authUser.id,
          display_name: metaName,
          preferred_language: metaLang,
        },
        { onConflict: 'id' }
      )
      .select('id, display_name, preferred_language, created_at, updated_at')
      .maybeSingle();

    if (inserted) {
      return {
        id: inserted.id,
        email: authUser.email,
        display_name: inserted.display_name || metaName,
        preferred_language: isSupportedLanguage(inserted.preferred_language)
          ? inserted.preferred_language
          : metaLang,
        created_at: inserted.created_at,
        updated_at: inserted.updated_at,
      };
    }
  } catch {
    // Return fallback profile if network error occurs
  }

  return fallbackProfile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      // Check if an active Guest session exists in sessionStorage
      const savedGuest = loadSavedGuestProfile();
      if (savedGuest) {
        const guestAuth = buildGuestAuthObjects(savedGuest);
        if (mounted) {
          setIsGuest(true);
          setSession(guestAuth.session);
          setUser(guestAuth.user);
          setProfile(guestAuth.profile);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (!mounted) return;

        if (sessionError || !data.session?.user) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setIsGuest(false);
        setSession(data.session);
        setUser(data.session.user);
        const loadedProfile = await fetchOrCreateUserProfile(data.session.user);
        if (mounted) {
          setProfile(loadedProfile);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!mounted) return;
        if (!nextSession && loadSavedGuestProfile()) {
          return;
        }
        setIsGuest(false);
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          const loadedProfile = await fetchOrCreateUserProfile(nextSession.user);
          if (mounted) {
            setProfile(loadedProfile);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(
        normalizeError(validation.error.issues[0]?.message, 'Invalid credentials.')
      );
      return false;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (signInError || !data.user || !data.session) {
        setError(
          normalizeError(
            signInError,
            'Invalid email or password. Please try again.'
          )
        );
        return false;
      }

      saveGuestProfile(null);
      setIsGuest(false);
      setSession(data.session);
      setUser(data.user);
      const userProfile = await fetchOrCreateUserProfile(data.user);
      setProfile(userProfile);
      return true;
    } catch (err) {
      setError(normalizeError(err, 'Unable to connect. Please try again.'));
      return false;
    }
  }, []);

  const signInAsGuest = useCallback(() => {
    setError(null);
    const guestAuth = buildGuestAuthObjects();
    saveGuestProfile(guestAuth.profile);
    setIsGuest(true);
    setSession(guestAuth.session);
    setUser(guestAuth.user);
    setProfile(guestAuth.profile);
  }, []);

  const signUp = useCallback(
    async (params: {
      displayName: string;
      email: string;
      password: string;
      preferredLanguage?: SupportedLanguage;
    }): Promise<boolean> => {
      setError(null);
      const validation = signupSchema.safeParse({
        displayName: params.displayName,
        email: params.email,
        password: params.password,
        preferredLanguage: params.preferredLanguage || 'en-US',
      });

      if (!validation.success) {
        setError(
          normalizeError(
            validation.error.issues[0]?.message,
            'Invalid registration details.'
          )
        );
        return false;
      }

      const { displayName, email, password, preferredLanguage } = validation.data;

      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              preferred_language: preferredLanguage,
            },
          },
        });

        if (signUpError || !data.user) {
          setError(
            normalizeError(signUpError, 'Registration failed. Please try again.')
          );
          return false;
        }

        saveGuestProfile(null);
        setIsGuest(false);

        if (data.session) {
          setSession(data.session);
          setUser(data.user);
          const userProfile = await fetchOrCreateUserProfile(data.user);
          setProfile(userProfile);
        } else {
          // If email confirmation is disabled or auto-login is needed, try signing in immediately
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInData?.session && signInData.user) {
            setSession(signInData.session);
            setUser(signInData.user);
            const userProfile = await fetchOrCreateUserProfile(signInData.user);
            setProfile(userProfile);
          }
        }

        return true;
      } catch {
        setError('Unable to connect. Please try again.');
        return false;
      }
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    setError(null);
    saveGuestProfile(null);
    setIsGuest(false);
    try {
      await supabase.auth.signOut();
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  }, []);

  const updateProfile = useCallback(
    async (updates: {
      display_name?: string;
      preferred_language?: SupportedLanguage;
    }): Promise<boolean> => {
      if (!user) return false;

      const nextProfile: UserProfile = {
        id: user.id,
        email: user.email,
        display_name: updates.display_name ?? profile?.display_name ?? null,
        preferred_language:
          updates.preferred_language ?? profile?.preferred_language ?? 'en-US',
        created_at: profile?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setProfile(nextProfile);

      if (isGuest || user.id === GUEST_USER_ID || !isSupabaseConfigured()) {
        if (isGuest || user.id === GUEST_USER_ID) {
          saveGuestProfile(nextProfile);
        }
        return true;
      }

      try {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({
            ...(updates.display_name !== undefined
              ? { display_name: updates.display_name }
              : {}),
            ...(updates.preferred_language !== undefined
              ? { preferred_language: updates.preferred_language }
              : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        return !updateErr;
      } catch {
        return false;
      }
    },
    [user, profile, isGuest]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      accessToken: session?.access_token ?? null,
      loading,
      error,
      isAuthenticated: Boolean(user && session),
      isGuest,
      signIn,
      signInAsGuest,
      signUp,
      signOut,
      updateProfile,
      clearError,
    }),
    [
      user,
      session,
      profile,
      loading,
      error,
      isGuest,
      signIn,
      signInAsGuest,
      signUp,
      signOut,
      updateProfile,
      clearError,
    ]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
