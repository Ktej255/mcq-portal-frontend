"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'STUDENT' | 'ADMIN';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Mock role for now - in production this comes from user metadata or backend
  const userRole = user?.email?.endsWith('@admin.com') ? 'ADMIN' : 'STUDENT';

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(`/login?redirect=${pathname}`);
      } else if (requiredRole && userRole !== requiredRole) {
        router.push('/dashboard'); // Unauthorized
      }
    }
  }, [user, loading, router, pathname, requiredRole, userRole]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading session...</div>;
  }

  if (!user || (requiredRole && userRole !== requiredRole)) {
    return null; // Will redirect
  }

  return <>{children}</>;
};
