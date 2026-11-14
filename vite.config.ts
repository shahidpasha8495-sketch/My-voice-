import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, loadEnv, type Plugin } from 'vite';

import chatHandler from './api/chat';
import conversationByIdHandler from './api/conversations/[id]';
import conversationsIndexHandler from './api/conversations/index';
import healthHandler from './api/health';
import type { VercelRequest, VercelResponse } from './api/_lib/http';

function vercelApiLocalPlugin(): Plugin {
  const createMiddleware = () => {
    return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
      const url = req.url || '';
      if (!url.startsWith('/api/')) {
        next();
        return;
      }

      const [pathname, search = ''] = url.split('?');
      const params = new URLSearchParams(search);
      const query: Record<string, string> = {};
      params.forEach((value, key) => {
        query[key] = value;
      });

      const vercelReq = req as VercelRequest;
      vercelReq.query = query;
      const vercelRes = res as VercelResponse;

      try {
        if (pathname === '/api/health') {
          await healthHandler(vercelReq, vercelRes);
          return;
        }
        if (pathname === '/api/chat') {
          await chatHandler(vercelReq, vercelRes);
          return;
        }
        if (pathname === '/api/conversations' || pathname === '/api/conversations/') {
          await conversationsIndexHandler(vercelReq, vercelRes);
          return;
        }
        const convMatch = pathname.match(/^\/api\/conversations\/([^/]+)$/);
        if (convMatch) {
          vercelReq.query = { ...query, id: decodeURIComponent(convMatch[1]) };
          await conversationByIdHandler(vercelReq, vercelRes);
          return;
        }

        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'API endpoint not found.' }));
      } catch {
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Internal server error.' }));
        }
      }
    };
  };

  return {
    name: 'myvoice-vercel-api-middleware',
    configureServer(server) {
      server.middlewares.use(createMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createMiddleware());
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, val] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }

  return {
    plugins: [react(), vercelApiLocalPlugin()],
    server: {
      port: 5173,
      host: '127.0.0.1',
    },
    preview: {
      port: 4173,
      host: '127.0.0.1',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-motion': ['framer-motion'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: [
        'tests/unit/**/*.test.{ts,tsx}',
        'tests/integration/**/*.test.{ts,tsx}',
      ],
    },
  };
});
