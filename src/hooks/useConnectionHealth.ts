import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchBackendHealth } from '../services/chatService';
import type { ConnectionState, HealthResponse } from '../types';

export interface UseConnectionHealthReturn {
  connectionState: ConnectionState;
  isChecking: boolean;
  health: HealthResponse | null;
  lastCheckedAt: string | null;
  retryConnection: () => Promise<boolean>;
}

export function useConnectionHealth(): UseConnectionHealthReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const mountedRef = useRef<boolean>(true);

  const checkHealthWithBackoff = useCallback(async (maxRetries = 2): Promise<boolean> => {
    if (!mountedRef.current) return false;

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setConnectionState('offline');
      setIsChecking(false);
      return false;
    }

    setIsChecking(true);
    setConnectionState('connecting');

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const result = await fetchBackendHealth();
      if (!mountedRef.current) return false;

      if (result) {
        setHealth(result);
        setConnectionState('online');
        setLastCheckedAt(new Date().toISOString());
        setIsChecking(false);
        return true;
      }

      if (attempt < maxRetries) {
        const delayMs = 350 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    if (mountedRef.current) {
      // If navigator is online (e.g. static preview or resilient client fallback active),
      // still mark online if local companion fallback is ready, or offline if browser is offline
      const browserOnline = typeof navigator === 'undefined' || navigator.onLine !== false;
      setConnectionState(browserOnline ? 'online' : 'offline');
      setLastCheckedAt(new Date().toISOString());
      setIsChecking(false);
    }
    return false;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void checkHealthWithBackoff(1);

    const handleOnline = () => {
      void checkHealthWithBackoff(1);
    };
    const handleOffline = () => {
      if (mountedRef.current) {
        setConnectionState('offline');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      mountedRef.current = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [checkHealthWithBackoff]);

  return {
    connectionState,
    isChecking,
    health,
    lastCheckedAt,
    retryConnection: () => checkHealthWithBackoff(2),
  };
}
