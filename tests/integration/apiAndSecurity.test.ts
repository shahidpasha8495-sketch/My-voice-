import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '../../api/_lib/http';
import { resetRateLimitStore } from '../../api/_lib/rateLimit';

// Mock @google/genai Interactions API
const mockInteractionsCreate = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    interactions: {
      create: (...args: unknown[]) => mockInteractionsCreate(...args),
    },
  })),
}));

// Mock server-side Supabase helpers for deterministic integration testing
const mockVerifyRequestAuth = vi.fn();
const mockUserSupabaseFrom = vi.fn();
const mockPrivilegedSupabaseFrom = vi.fn();

vi.mock('../../api/_lib/supabaseServer', () => ({
  isSupabaseServerConfigured: () => true,
  verifyRequestAuth: (...args: unknown[]) => mockVerifyRequestAuth(...args),
  createUserSupabaseClient: () => ({
    from: (...args: unknown[]) => mockUserSupabaseFrom(...args),
  }),
  createPrivilegedSupabaseClient: () => ({
    from: (...args: unknown[]) => mockPrivilegedSupabaseFrom(...args),
  }),
}));

import chatHandler from '../../api/chat';
import conversationByIdHandler from '../../api/conversations/[id]';
import conversationsIndexHandler from '../../api/conversations/index';
import healthHandler from '../../api/health';
import { ApiError } from '../../api/_lib/http';

function createMockReqRes(options: {
  method: string;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
}) {
  const headersMap: Record<string, string> = {};
  let statusCode = 200;
  let rawBody = '';

  const req = {
    method: options.method,
    url: options.url || '/api/test',
    headers: options.headers || {},
    body: options.body,
    query: options.query || {},
    socket: { remoteAddress: '127.0.0.1' },
    on: vi.fn(),
  } as unknown as VercelRequest;

  const res = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(code: number) {
      statusCode = code;
    },
    setHeader(name: string, value: string) {
      headersMap[name.toLowerCase()] = value;
    },
    getHeader(name: string) {
      return headersMap[name.toLowerCase()];
    },
    end(chunk?: string) {
      if (chunk) rawBody += chunk;
    },
  } as unknown as VercelResponse;

  return {
    req,
    res,
    getStatus: () => statusCode,
    getHeaders: () => headersMap,
    getJson: () => (rawBody ? JSON.parse(rawBody) : null),
  };
}

describe('Integration & Security: Backend API Routes & Database RLS Policies', () => {
  beforeEach(() => {
    resetRateLimitStore();
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-server-gemini-key-secret';
    process.env.GEMINI_MODEL = 'gemini-4-hydrogen';
  });

  it('GET /api/health returns health status without exposing any secrets', async () => {
    const { req, res, getStatus, getJson } = createMockReqRes({
      method: 'GET',
      url: '/api/health',
    });

    await healthHandler(req, res);
    expect(getStatus()).toBe(200);
    const json = getJson();
    expect(json.status).toBe('ok');
    expect(json.capabilities.supportedLanguages).toEqual([
      'en-US',
      'hi-IN',
      'kn-IN',
      'ta-IN',
      'te-IN',
      'ml-IN',
      'bn-IN',
      'es-ES',
      'fr-FR',
      'de-DE',
      'ar-SA',
    ]);
    expect(JSON.stringify(json)).not.toContain('test-server-gemini-key-secret');
  });

  it('rejects unauthorized requests to /api/chat and /api/conversations with 401', async () => {
    mockVerifyRequestAuth.mockRejectedValueOnce(
      new ApiError(401, 'Authentication required. Please sign in.', 'UNAUTHORIZED')
    );

    const chatCall = createMockReqRes({
      method: 'POST',
      url: '/api/chat',
      body: {
        conversationId: '550e8400-e29b-41d4-a716-446655440000',
        message: 'Hello',
        language: 'en-US',
        inputMode: 'text',
      },
    });

    await chatHandler(chatCall.req, chatCall.res);
    expect(chatCall.getStatus()).toBe(401);
    expect(chatCall.getJson().success).toBe(false);

    mockVerifyRequestAuth.mockRejectedValueOnce(
      new ApiError(401, 'Authentication required. Please sign in.', 'UNAUTHORIZED')
    );

    const listCall = createMockReqRes({
      method: 'GET',
      url: '/api/conversations',
    });
    await conversationsIndexHandler(listCall.req, listCall.res);
    expect(listCall.getStatus()).toBe(401);
  });

  it('enforces conversation ownership and blocks cross-user access with 403/404', async () => {
    mockVerifyRequestAuth.mockResolvedValueOnce({
      userId: 'user-attacker',
      email: 'attacker@example.com',
      accessToken: 'valid-token',
    });

    // Simulate conversation belonging to a different user (maybeSingle returns null for user-attacker)
    mockUserSupabaseFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    });

    const { req, res, getStatus, getJson } = createMockReqRes({
      method: 'POST',
      url: '/api/chat',
      body: {
        conversationId: '550e8400-e29b-41d4-a716-446655440000',
        message: 'Attempt to hijack another user conversation',
        language: 'en-US',
        inputMode: 'text',
      },
    });

    await chatHandler(req, res);
    expect(getStatus()).toBe(403);
    expect(getJson().error).toMatch(/access denied/i);
    expect(mockInteractionsCreate).not.toHaveBeenCalled();
  });

  it('processes valid POST /api/chat, calls Gemini Interactions API, and persists user + assistant messages', async () => {
    const userId = 'user-123';
    const convId = '550e8400-e29b-41d4-a716-446655440000';

    mockVerifyRequestAuth.mockResolvedValueOnce({
      userId,
      email: 'user@example.com',
      accessToken: 'token-123',
    });

    // 1. Conversation ownership check
    const convSelectChain = {
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: convId,
                user_id: userId,
                title: 'AI Discussion',
                language: 'kn-IN',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    // 2. Context retrieval
    const messagesContextChain = {
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({
              data: [
                {
                  id: 'prev-1',
                  conversation_id: convId,
                  role: 'user',
                  content: 'ನಮಸ್ಕಾರ',
                  input_mode: 'voice',
                  language: 'kn-IN',
                  created_at: new Date(Date.now() - 5000).toISOString(),
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    };

    // 3. User message insert
    const userInsertChain = {
      insert: (payload: Record<string, unknown>) => ({
        select: () => ({
          single: async () => ({
            data: {
              id: 'user-msg-1',
              ...payload,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      }),
    };

    mockUserSupabaseFrom
      .mockReturnValueOnce(convSelectChain)
      .mockReturnValueOnce(messagesContextChain)
      .mockReturnValueOnce(userInsertChain);

    // 4. Gemini Interactions API response
    mockInteractionsCreate.mockResolvedValueOnce({
      id: 'interaction-1',
      status: 'completed',
      output_text: 'ನಮಸ್ಕಾರ! ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (AI) ಒಂದು ಆಧುನಿಕ ತಂತ್ರಜ್ಞಾನವಾಗಿದೆ.',
      steps: [],
    });

    // 5. Privileged assistant message insert & conversation timestamp update
    mockPrivilegedSupabaseFrom
      .mockReturnValueOnce({
        insert: (payload: Record<string, unknown>) => ({
          select: () => ({
            single: async () => ({
              data: {
                id: 'assistant-msg-1',
                ...payload,
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        update: () => ({
          eq: () => ({
            eq: async () => ({ error: null }),
          }),
        }),
      });

    const { req, res, getStatus, getJson } = createMockReqRes({
      method: 'POST',
      url: '/api/chat',
      body: {
        conversationId: convId,
        message: 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಎಂದರೇನು?',
        language: 'en-US', // auto-detection should detect Kannada script kn-IN!
        inputMode: 'voice',
      },
    });

    await chatHandler(req, res);
    expect(getStatus()).toBe(200);
    const body = getJson();
    expect(body.success).toBe(true);
    expect(body.detectedLanguage).toBe('kn-IN');
    expect(body.userMessage.role).toBe('user');
    expect(body.userMessage.input_mode).toBe('voice');
    expect(body.assistantMessage.role).toBe('assistant');
    expect(body.assistantMessage.content).toContain('ನಮಸ್ಕಾರ');

    // Verify Gemini Interactions API was called with history + current message
    expect(mockInteractionsCreate).toHaveBeenCalledTimes(1);
    const callArg = mockInteractionsCreate.mock.calls[0][0];
    expect(callArg.model).toBe('gemini-4-hydrogen');
    expect(callArg.input).toHaveLength(2);
  });

  it('supports GET and DELETE on /api/conversations/[id] for owned conversations', async () => {
    const userId = 'user-123';
    const convId = '550e8400-e29b-41d4-a716-446655440000';

    mockVerifyRequestAuth.mockResolvedValue({
      userId,
      email: 'user@example.com',
      accessToken: 'token-123',
    });

    // Ownership check + messages fetch for GET
    mockUserSupabaseFrom
      .mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: convId,
                  user_id: userId,
                  title: 'Saved Chat',
                  language: 'en-US',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            order: async () => ({
              data: [
                {
                  id: 'm1',
                  conversation_id: convId,
                  role: 'user',
                  content: 'Hello',
                  input_mode: 'text',
                  language: 'en-US',
                  created_at: new Date().toISOString(),
                },
              ],
              error: null,
            }),
          }),
        }),
      });

    const getCall = createMockReqRes({
      method: 'GET',
      url: `/api/conversations/${convId}`,
      query: { id: convId },
    });
    await conversationByIdHandler(getCall.req, getCall.res);
    expect(getCall.getStatus()).toBe(200);
    expect(getCall.getJson().messages).toHaveLength(1);

    // Ownership check + delete for DELETE
    mockUserSupabaseFrom
      .mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: convId,
                  user_id: userId,
                  title: 'Saved Chat',
                  language: 'en-US',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        delete: () => ({
          eq: () => ({
            eq: async () => ({ error: null }),
          }),
        }),
      });

    const delCall = createMockReqRes({
      method: 'DELETE',
      url: `/api/conversations/${convId}`,
      query: { id: convId },
    });
    await conversationByIdHandler(delCall.req, delCall.res);
    expect(delCall.getStatus()).toBe(200);
    expect(delCall.getJson().deletedId).toBe(convId);
  });

  it('verifies Supabase SQL migration enforces RLS and blocks client assistant-message insertion', () => {
    const sqlPath = path.resolve(
      process.cwd(),
      'supabase/migrations/001_initial_schema.sql'
    );
    const sql = fs.readFileSync(sqlPath, 'utf8');

    expect(sql).toContain('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('CREATE TRIGGER on_auth_user_created');
    expect(sql).toContain("role = 'user'");
    expect(sql).toContain('REFERENCES public.conversations(id) ON DELETE CASCADE');
  });
});
