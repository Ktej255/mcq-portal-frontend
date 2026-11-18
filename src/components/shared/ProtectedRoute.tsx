"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'STUDENT' | 'ADMIN';
  /** Where a signed-in user without the required role is sent. */
  fallbackHref?: string;
}

export const ProtectedRoute = ({ children, requiredRole, fallbackHref = '/dashboard' }: ProtectedRouteProps) => {
  const { user, loading, role, roleLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // The role is assigned by the backend (/api/v1/auth/me). Email domains and
  // local mock flags never elevate a session.
  const rolePending = Boolean(requiredRole) && Boolean(user) && roleLoading;

  useEffect(() => {
    if (loading || rolePending) return;

    let timeoutId: number | undefined;
    if (!user) {
      const search = window.location.search;
      const redirectTarget = `${pathname}${search}`;
      timeoutId = window.setTimeout(() => {
        router.push(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
      }, 0);
    } else if (requiredRole && role !== requiredRole) {
      timeoutId = window.setTimeout(() => {
        router.replace(fallbackHref); // Unauthorized
      }, 0);
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [user, loading, role, rolePending, router, pathname, requiredRole, fallbackHref]);

  if (loading || rolePending) {
    return <div className="flex h-screen items-center justify-center">Loading session...</div>;
  }

  if (!user || (requiredRole && role !== requiredRole)) {
    return null; // Will redirect
  }

  return <>{children}</>;
};
