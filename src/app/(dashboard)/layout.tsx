"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useApiConfig } from "@/lib/hooks/useApi";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

const adminShellRoutes = new Set([
  "/upsc/content-command",
  "/upsc/current-affairs",
  "/upsc/mcq-command",
  "/upsc/prelims-2026-audit",
  "/upsc/prelims-2026-audit-v2",
  "/upsc/prelims-2026-showcase",
  "/upsc/prelims-review-command",
  "/upsc/prelims-2027-strategy",
  "/upsc/readiness-audit",
  "/upsc/revision-command",
  "/upsc/yearly-planner",
]);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded } = useApiConfig();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAdminShell = adminShellRoutes.has(pathname);

  if (!isLoaded) return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">Initializing UPSC Command...</p>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        {/* Sidebar for Desktop & Mobile */}
        <DashboardSidebar 
          isAdmin={isAdminShell}
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <DashboardHeader onMenuClick={() => setIsSidebarOpen(true)} />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
