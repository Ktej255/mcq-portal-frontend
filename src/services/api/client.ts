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

// We will use a custom hook to inject the Firebase ID token into this client for authenticated requests
export const setupAxiosInterceptors = (getToken: () => Promise<string | null>) => {
  apiClient.interceptors.request.use(
    async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};
