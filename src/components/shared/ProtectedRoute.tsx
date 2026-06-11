"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { isLocalMockMasterSession, isMasterEmail } from "@/lib/auth/master-access";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'STUDENT' | 'ADMIN';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Mock role for now - in production this comes from user metadata or backend
  const isAdmin = isMasterEmail(user?.email) || isLocalMockMasterSession();
  const userRole = isAdmin ? 'ADMIN' : 'STUDENT';

  useEffect(() => {
    if (!loading) {
      let timeoutId: number | undefined;
      if (!user) {
        const search = window.location.search;
        const redirectTarget = `${pathname}${search}`;
        timeoutId = window.setTimeout(() => {
          router.push(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
        }, 0);
      } else if (requiredRole && userRole !== requiredRole) {
        timeoutId = window.setTimeout(() => {
          router.push('/dashboard'); // Unauthorized
        }, 0);
      }

      return () => {
        if (timeoutId) window.clearTimeout(timeoutId);
      };
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
