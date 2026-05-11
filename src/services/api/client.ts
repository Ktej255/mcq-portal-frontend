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
      
      let user = auth.currentUser;
      
      // If user is null, wait briefly to see if it's an initialization race condition
      if (!user) {
        await new Promise(resolve => setTimeout(resolve, 50));
        user = auth.currentUser;
      }

      if (user) {
        const token = await user.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          // console.log(`[API Client] Attached token for ${config.url}`);
        }
      } else {
        console.warn(`[API Client] No user found for ${config.url} - request may fail with 403`);
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
