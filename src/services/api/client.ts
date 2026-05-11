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

// Add the interceptor immediately upon creation
// Request interceptor: Attach tokens
apiClient.interceptors.request.use(
  async (config) => {
    try {
      if (!auth) return config;
      
      // Wait for auth to be ready
      if (typeof auth.authStateReady === 'function') {
        await auth.authStateReady();
      }
      
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error("Error attaching token", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Retry on 401/403
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      await new Promise(resolve => setTimeout(resolve, 800));
      try {
        if (auth?.currentUser) {
          const token = await auth.currentUser.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (retryError) {
        console.error("Retry failed", retryError);
      }
    }
    return Promise.reject(error);
  }
);
