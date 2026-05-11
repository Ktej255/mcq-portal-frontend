import axios from 'axios';
import { env } from '@/env';

const rawBaseUrl = env.NEXT_PUBLIC_API_BASE_URL || '';
const normalizedBaseUrl = rawBaseUrl ? (rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`) : '/api/v1/';

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
