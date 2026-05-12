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

import { auth } from '@/lib/firebase/config';

// Initialize debug object
if (typeof window !== 'undefined') {
  (window as any).MCQ_DEBUG = {
    lastRequest: null,
    lastResponse: null,
    authState: 'INITIALIZING',
    tokenPresent: false,
    user: null,
    errors: []
  };
}

// Add the interceptor immediately upon creation
// Request interceptor: Attach tokens
apiClient.interceptors.request.use(
  async (config) => {
    const debug = (window as any).MCQ_DEBUG;
    if (debug) {
      debug.lastRequest = {
        url: config.url,
        method: config.method,
        headers: { ...config.headers },
        timestamp: new Date().toISOString()
      };
      console.log(`[MCQ_DEBUG] Request: ${config.method?.toUpperCase()} ${config.url}`, config);
    }

    try {
      if (!auth) {
        console.warn("[MCQ_DEBUG] Firebase Auth instance not found");
        return config;
      }
      
      // Wait for auth to be ready
      if (typeof auth.authStateReady === 'function') {
        await auth.authStateReady();
      }
      
      const user = auth.currentUser;
      if (debug) {
        debug.user = user ? { uid: user.uid, email: user.email } : null;
        debug.authState = user ? 'SIGNED_IN' : 'SIGNED_OUT';
      }

      if (user) {
        const token = await user.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          if (debug) debug.tokenPresent = true;
          console.log("[MCQ_DEBUG] Token attached successfully");
        } else {
          console.warn("[MCQ_DEBUG] User found but failed to get ID token");
        }
      } else {
        console.warn("[MCQ_DEBUG] No current user found in Firebase singleton");
      }
    } catch (error) {
      console.error("[MCQ_DEBUG] Error in request interceptor:", error);
      if (debug) debug.errors.push({ type: 'REQUEST_INTERCEPTOR', error });
    }
    return config;
  },
  (error) => {
    console.error("[MCQ_DEBUG] Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor: Log and Retry
apiClient.interceptors.response.use(
  (response) => {
    const debug = (window as any).MCQ_DEBUG;
    if (debug) {
      debug.lastResponse = {
        status: response.status,
        data: response.data,
        headers: response.headers
      };
      console.log(`[MCQ_DEBUG] Response 200: ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    const debug = (window as any).MCQ_DEBUG;
    const originalRequest = error.config;

    if (debug) {
      debug.lastResponse = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      };
      console.error(`[MCQ_DEBUG] API Error: ${originalRequest?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }

    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      console.warn(`[MCQ_DEBUG] Triggering 401/403 retry for ${originalRequest.url}`);
      originalRequest._retry = true;
      await new Promise(resolve => setTimeout(resolve, 800));
      try {
        if (auth?.currentUser) {
          const token = await auth.currentUser.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          console.log("[MCQ_DEBUG] Retrying with fresh token...");
          return apiClient(originalRequest);
        }
      } catch (retryError) {
        console.error("[MCQ_DEBUG] Token refresh retry failed:", retryError);
      }
    }
    return Promise.reject(error);
  }
);
