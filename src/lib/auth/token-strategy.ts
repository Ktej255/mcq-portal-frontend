import { auth } from '@/lib/firebase/config';
import { activeAuthProvider, env } from '@/env';
import { supabase } from '@/lib/supabase/client';
import { readLocalMockToken } from '@/lib/auth/local-testing';

const authDebug = env.NEXT_PUBLIC_DEBUG_API === 'true';

/**
 * Unified token resolution strategy for the UPSC Command portal.
 * Handles Firebase tokens and MOCK_TOKEN bypass for dev/mock sessions.
 */
export async function resolveToken(forceRefresh = false): Promise<string | null> {
  // 1. Check for MOCK_TOKEN bypass (Priority for dev/validator scenarios)
  const mockToken = readLocalMockToken();
  if (mockToken) {
    if (authDebug) console.info("AUTH | TOKEN_STRATEGY | Using local MOCK_TOKEN bypass");
    return mockToken;
  }

  // 2. Clerk Authentication
  if (activeAuthProvider === 'clerk') {
    try {
      if (typeof window !== 'undefined') {
        const clerkObj = (window as any).Clerk;
        if (clerkObj && clerkObj.session) {
          const token = await clerkObj.session.getToken();
          return token ?? null;
        }
      }
    } catch (err) {
      console.error("FORENSIC | TOKEN_STRATEGY | Clerk token retrieval failed:", err);
    }
  }

  // 2. Check Firebase Authentication
  if (auth && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken(forceRefresh);
      if (token) {
        return token;
      }
    } catch (err) {
      console.error("FORENSIC | TOKEN_STRATEGY | Firebase token retrieval failed:", err);
    }
  }

  return null;
}

/**
 * Polling version of token resolution for use in request interceptors
 * where we might need to wait for Firebase to initialize.
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
