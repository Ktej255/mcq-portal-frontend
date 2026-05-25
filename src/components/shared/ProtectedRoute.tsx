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
  const isLocalMockAdmin =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
    localStorage.getItem("MOCK_TOKEN")?.startsWith("MOCK_TOKEN");
  const isAdmin = user?.email?.endsWith('@admin.com') || user?.email === 'sarit.kumar.dev@gmail.com' || isLocalMockAdmin;
  const userRole = isAdmin ? 'ADMIN' : 'STUDENT';

  useEffect(() => {
    if (!loading) {
      if (!user) {
        const search = window.location.search;
        const redirectTarget = `${pathname}${search}`;
        router.push(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
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
