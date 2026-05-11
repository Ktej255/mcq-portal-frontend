import axios from 'axios';
import { env } from '@/env';

// Base Axios instance
export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
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
