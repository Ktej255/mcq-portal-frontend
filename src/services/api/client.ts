import axios from 'axios';
import { env } from '@/env';

const rawBaseUrl = env.NEXT_PUBLIC_API_BASE_URL || '';
// Ensure baseURL ends with /api/v1/ if it's pointing to the root domain
let normalizedBaseUrl = rawBaseUrl;
if (normalizedBaseUrl && !normalizedBaseUrl.includes('/api/v1')) {
  normalizedBaseUrl = normalizedBaseUrl.endsWith('/') ? `${normalizedBaseUrl}api/v1/` : `${normalizedBaseUrl}/api/v1/`;
} else if (!normalizedBaseUrl) {
  normalizedBaseUrl = '/api/v1/';
} else if (!normalizedBaseUrl.endsWith('/')) {
  normalizedBaseUrl = `${normalizedBaseUrl}/`;
}

// Base Axios instance
export const apiClient = axios.create({
  baseURL: normalizedBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

const apiDebug = env.NEXT_PUBLIC_DEBUG_API === 'true';

// Initialize debug object
if (typeof window !== 'undefined') {
  const debugWindow = window as Window & { MCQ_DEBUG?: Record<string, unknown> };
  debugWindow.MCQ_DEBUG = {
    lastRequest: null,
    lastResponse: null,
    authState: 'INITIALIZING',
    tokenPresent: false,
    user: null,
    errors: []
  };
}

import { waitForToken, resolveToken } from '@/lib/auth/token-strategy';

// Add the interceptor immediately upon creation
// Request interceptor: Attach tokens
apiClient.interceptors.request.use(
  async (config) => {
    const debug = typeof window !== 'undefined' ? (window as Window & { MCQ_DEBUG?: Record<string, unknown> }).MCQ_DEBUG : null;
    if (debug) {
      debug.lastRequest = {
        url: config.url,
        method: config.method,
        headers: { ...config.headers },
        timestamp: new Date().toISOString()
      };
    }

    try {
      // HARD GATE: Wait for token before any request
      const token = await waitForToken();

      if (debug) {
        const clerkUser = typeof window !== 'undefined' ? (window as any).Clerk?.user : null;
        debug.user = clerkUser ? { uid: clerkUser.id, email: clerkUser.primaryEmailAddress?.emailAddress } : null;
        debug.authState = clerkUser ? 'SIGNED_IN' : 'SIGNED_OUT';
        debug.tokenPresent = !!token;
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (apiDebug) {
          console.info(`[MCQ_DEBUG] Request Authorized: ${config.url}`);
          console.info(`[MCQ_DEBUG] HEADER VERIFICATION | Authorization: Bearer ${token.substring(0, 10)}...[len:${token.length}]`);
        }
      } else {
        console.error(`[MCQ_DEBUG] Request BLOCKED - No Token: ${config.url}`);
        // Optionally throw error to prevent request without token
        return Promise.reject(new Error("Authentication required: Token unavailable"));
      }
    } catch (error) {
      console.error("[MCQ_DEBUG] Request interceptor failed:", error);
      return Promise.reject(error);
    }
    return config;
  },
  (error) => {
    console.error("[MCQ_DEBUG] Request configuration error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor: Log and Retry
apiClient.interceptors.response.use(
  (response) => {
    const debug = typeof window !== 'undefined' ? (window as Window & { MCQ_DEBUG?: Record<string, unknown> }).MCQ_DEBUG : null;
    if (debug) {
      debug.lastResponse = {
        status: response.status,
        data: response.data,
        headers: response.headers
      };
      if (apiDebug) console.info(`[MCQ_DEBUG] Response 200: ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    const debug = typeof window !== 'undefined' ? (window as Window & { MCQ_DEBUG?: Record<string, unknown> }).MCQ_DEBUG : null;
    const originalRequest = error.config;

    if (debug) {
      debug.lastResponse = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      };
      if (apiDebug) {
        console.error(`[MCQ_DEBUG] API Error: ${originalRequest?.url}`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
    }

    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      if (apiDebug) console.warn(`[MCQ_DEBUG] Triggering 401/403 retry for ${originalRequest.url}`);
      originalRequest._retry = true;
      await new Promise(resolve => setTimeout(resolve, 800));
      try {
        const token = await resolveToken(true);
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          if (apiDebug) console.info("[MCQ_DEBUG] Retrying with fresh token...");
          return apiClient(originalRequest);
        }
      } catch (retryError) {
        console.error("[MCQ_DEBUG] Token refresh retry failed:", retryError);
      }
    }
    return Promise.reject(error);
  }
);
