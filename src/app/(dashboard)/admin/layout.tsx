"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

// Content management screens sit under the student dashboard shell, so the
// shell's sign-in check alone would let any student open them.
export default function DashboardAdminLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole="ADMIN">{children}</ProtectedRoute>;
}
