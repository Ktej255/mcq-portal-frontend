import { useAuth } from '@/lib/contexts/AuthContext';

export const useApiConfig = () => {
  const { loading, user } = useAuth();
  
  return { isLoaded: !loading, isSignedIn: !!user };
};
