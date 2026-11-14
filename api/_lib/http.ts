import type { IncomingMessage, ServerResponse } from 'node:http';

export interface VercelRequest extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface VercelResponse extends ServerResponse {
  status?: (code: number) => VercelResponse;
  json?: (data: unknown) => VercelResponse;
}

export const MAX_REQUEST_BODY_BYTES = 32 * 1024; // 32 KB

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, message: string, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function applySecurityHeaders(res: ServerResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
}

export function sendJson(res: VercelResponse, statusCode: number, payload: unknown): void {
  applySecurityHeaders(res);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export function sendError(
  res: VercelResponse,
  statusCode: number,
  message: string,
  code = 'ERROR'
): void {
  sendJson(res, statusCode, {
    success: false,
    error: message,
    code,
  });
}

export async function parseJsonBody<T = unknown>(req: VercelRequest): Promise<T> {
  // If already parsed by Vercel runtime
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body, 'utf8') > MAX_REQUEST_BODY_BYTES) {
        throw new ApiError(413, 'Request payload is too large.', 'PAYLOAD_TOO_LARGE');
      }
      try {
        return JSON.parse(req.body) as T;
      } catch {
        throw new ApiError(400, 'Invalid JSON request body.', 'INVALID_JSON');
      }
    }
    if (typeof req.body === 'object') {
      const serialized = JSON.stringify(req.body);
      if (Buffer.byteLength(serialized, 'utf8') > MAX_REQUEST_BODY_BYTES) {
        throw new ApiError(413, 'Request payload is too large.', 'PAYLOAD_TOO_LARGE');
      }
      return req.body as T;
    }
  }

  return new Promise<T>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    req.on('data', (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buf.length;
      if (totalBytes > MAX_REQUEST_BODY_BYTES) {
        reject(new ApiError(413, 'Request payload is too large.', 'PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(buf);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        reject(new ApiError(400, 'Request body cannot be empty.', 'EMPTY_BODY'));
        return;
      }
      try {
        resolve(JSON.parse(raw) as T);
      } catch {
        reject(new ApiError(400, 'Invalid JSON request body.', 'INVALID_JSON'));
      }
    });

    req.on('error', () => {
      reject(new ApiError(400, 'Failed to read request body.', 'READ_ERROR'));
    });
  });
}

export function getClientIdentifier(req: IncomingMessage, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.socket?.remoteAddress || 'unknown';
  return `ip:${ip}`;
}
