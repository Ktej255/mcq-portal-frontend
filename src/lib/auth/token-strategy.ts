import { activeAuthProvider, env } from '@/env';
import { supabase } from '@/lib/supabase/client';
import { readLocalMockToken } from '@/lib/auth/local-testing';

const authDebug = env.NEXT_PUBLIC_DEBUG_API === 'true';

interface ClerkSession {
  getToken(options: { skipCache: boolean }): Promise<string | null | undefined>;
}

interface ClerkWindow {
  Clerk?: {
    session?: ClerkSession;
  };
}

/**
 * Unified token resolution strategy for the UPSC Command portal.
 * Keeps each provider's credential authoritative for its configured mode.
 */
export async function resolveToken(forceRefresh = false): Promise<string | null> {
  if (activeAuthProvider === 'mock') {
    const mockToken = readLocalMockToken();
    if (mockToken && authDebug) {
      console.info("AUTH | TOKEN_STRATEGY | Using gated local mock authentication");
    }
    return mockToken;
  }

  if (activeAuthProvider === 'supabase') {
    try {
      if (!supabase) return null;
      if (forceRefresh) await supabase.auth.refreshSession();
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      console.error("AUTH | TOKEN_STRATEGY | Supabase token retrieval failed");
    }
  }

  if (activeAuthProvider === 'clerk') {
    try {
      if (typeof window !== 'undefined') {
        const clerkObj = (window as unknown as ClerkWindow).Clerk;
        if (clerkObj?.session) {
          const token = await clerkObj.session.getToken({ skipCache: forceRefresh });
          return token ?? null;
        }
      }
    } catch {
      console.error("AUTH | TOKEN_STRATEGY | Clerk token retrieval failed");
    }
  }

  return null;
}

/**
 * Polling version of token resolution for use in request interceptors
 * where a provider session may still be hydrating in the browser.
 */
export async function waitForToken(maxRetries = 50): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    const token = await resolveToken();
    if (token) return token;
    
    // If not found, wait 100ms
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return null;
}
