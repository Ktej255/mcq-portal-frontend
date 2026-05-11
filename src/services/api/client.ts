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
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Use the singleton auth instance
      if (!auth) return config;
      
      // Definitively wait for auth to be ready
      if (typeof auth.authStateReady === 'function') {
        await auth.authStateReady();
      }
      
      let user = auth.currentUser;
      
      // Intensive retry loop for intermittent null states (up to 2 seconds)
      if (!user) {
        for (let i = 0; i < 20; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          user = auth.currentUser;
          if (user) break;
        }
      }

      if (user) {
        const token = await user.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          // console.log(`[API Client] Attached token for ${config.url}`);
        }
      } else {
        console.warn(`[API Client] No user found for ${config.url} after intensive retries - request may fail with 403`);
      }
    } catch (error) {
      console.error("Error fetching Firebase token for request", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
