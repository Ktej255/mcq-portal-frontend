import { useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { setupAxiosInterceptors } from '@/services/api/client';

export const useApiConfig = () => {
  const { getToken, loading, user } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      setupAxiosInterceptors(async () => {
        try {
          return await getToken();
        } catch (error) {
          console.error("Error fetching Firebase token", error);
          return null;
        }
      });
    }
  }, [getToken, loading, user]);
  
  return { isLoaded: !loading, isSignedIn: !!user };
};
