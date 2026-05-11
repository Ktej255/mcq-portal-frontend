"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="flex min-h-screen">
        <DashboardSidebar isAdmin />
        <main className="flex-1 p-8 bg-zinc-50 dark:bg-zinc-950 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 p-4 bg-yellow-100 border border-yellow-200 text-yellow-800 rounded-lg">
              <strong>Admin Mode:</strong> You are in the administrative management console.
            </div>
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
