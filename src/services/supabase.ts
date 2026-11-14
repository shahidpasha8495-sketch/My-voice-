import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(
    rawSupabaseUrl &&
      rawSupabaseAnonKey &&
      !rawSupabaseUrl.includes('your-project-id.supabase.co') &&
      rawSupabaseAnonKey !== 'your-supabase-anon-key'
  );
}

// Use valid fallback URL so createClient does not throw during module import in unit tests
const effectiveUrl = rawSupabaseUrl || 'https://placeholder-project.supabase.co';
const effectiveAnonKey = rawSupabaseAnonKey || 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(effectiveUrl, effectiveAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'myvoice.supabase.auth.token',
  },
});

export async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    return null;
  }
  return data.session.access_token;
}
