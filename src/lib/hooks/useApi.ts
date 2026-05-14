import { useAuth } from '@/lib/contexts/AuthContext';
import { apiClient } from '@/services/api/client';

export const useApiConfig = () => {
  const { loading, user } = useAuth();
  
  return { isLoaded: !loading, isSignedIn: !!user, api: apiClient };
};
