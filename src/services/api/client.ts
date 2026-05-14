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

// Forensic Token Retrieval with Polling
async function waitForToken(maxRetries = 50): Promise<string | null> {
  // DEV BYPASS
  if (typeof window !== 'undefined') {
    const mockToken = (window as any).MOCK_TOKEN || localStorage.getItem("MOCK_TOKEN");
    if (mockToken) {
      console.log("[MCQ_DEBUG] Using MOCK_TOKEN bypass from " + ((window as any).MOCK_TOKEN ? "window" : "localStorage"));
      return mockToken;
    }
  }
  
  console.log("[MCQ_DEBUG] Starting token retrieval polling...");
  
  for (let i = 0; i < maxRetries; i++) {
    const user = auth?.currentUser;
    
    if (user) {
      try {
        const token = await user.getIdToken();
        if (token) {
          console.log(`[MCQ_DEBUG] Token acquired on attempt ${i + 1}. Length: ${token.length}`);
          return token;
        }
      } catch (err) {
        console.warn(`[MCQ_DEBUG] Token retrieval error on attempt ${i + 1}:`, err);
      }
    }
    
    if (i % 10 === 0 && i > 0) {
      console.log(`[MCQ_DEBUG] Still waiting for token... (Attempt ${i}) User state: ${user ? 'exists' : 'null'}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.error("[MCQ_DEBUG] Token retrieval timed out after 5 seconds.");
  return null;
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
    }

    try {
      // HARD GATE: Wait for token before any request
      const token = await waitForToken();

      if (!token && !auth) {
        console.error("[MCQ_DEBUG] FATAL: Auth instance missing and no MOCK_TOKEN available");
        return config;
      }
      
      if (debug) {
        debug.user = auth?.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email } : null;
        debug.authState = auth?.currentUser ? 'SIGNED_IN' : 'SIGNED_OUT';
        debug.tokenPresent = !!token;
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`[MCQ_DEBUG] Request Authorized: ${config.url}`);
        console.log(`[MCQ_DEBUG] HEADER VERIFICATION | Authorization: Bearer ${token.substring(0, 10)}...[len:${token.length}]`);
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
