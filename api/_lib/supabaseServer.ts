import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { IncomingMessage } from 'node:http';
import { ApiError } from './http';

export interface AuthenticatedIdentity {
  userId: string;
  email?: string;
  accessToken: string;
}

export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
} {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  return { url, anonKey, serviceRoleKey };
}

export function isSupabaseServerConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

/**
 * Creates a Supabase client scoped to the user's JWT access token (enforces RLS).
 */
export function createUserSupabaseClient(accessToken: string): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new ApiError(
      500,
      'Database configuration is missing on the server.',
      'SUPABASE_NOT_CONFIGURED'
    );
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Creates a privileged server-side Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Must ONLY be used after verifying user authentication and conversation ownership,
 * specifically for persisting assistant messages (which RLS forbids normal clients from inserting).
 */
export function createPrivilegedSupabaseClient(): SupabaseClient {
  const { url, serviceRoleKey } = getSupabaseConfig();
  if (!url || !serviceRoleKey) {
    throw new ApiError(
      500,
      'Server-side database credentials are not configured.',
      'SERVICE_ROLE_NOT_CONFIGURED'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function extractBearerToken(req: IncomingMessage): string {
  const header = req.headers.authorization || req.headers.Authorization;
  const authValue = Array.isArray(header) ? header[0] : header;

  if (!authValue || typeof authValue !== 'string') {
    throw new ApiError(401, 'Authentication required. Please sign in.', 'UNAUTHORIZED');
  }

  const parts = authValue.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
    throw new ApiError(401, 'Invalid authorization header format.', 'INVALID_AUTH_HEADER');
  }

  return parts[1];
}

/**
 * Verifies the user's access token directly with Supabase Auth.
 * Never trusts a user_id supplied by the frontend.
 */
export async function verifyRequestAuth(req: IncomingMessage): Promise<AuthenticatedIdentity> {
  const accessToken = extractBearerToken(req);
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    throw new ApiError(
      503,
      'Authentication service is not configured on the server.',
      'SUPABASE_NOT_CONFIGURED'
    );
  }

  const supabase = createUserSupabaseClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data?.user?.id) {
    throw new ApiError(401, 'Your session has expired. Please sign in again.', 'SESSION_EXPIRED');
  }

  return {
    userId: data.user.id,
    email: data.user.email,
    accessToken,
  };
}
