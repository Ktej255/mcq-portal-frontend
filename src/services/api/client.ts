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

import { getAuth } from 'firebase/auth';

// Add the interceptor immediately upon creation
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
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
