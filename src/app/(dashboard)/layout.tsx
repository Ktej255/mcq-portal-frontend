"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { UpscLoader } from "@/components/upsc/UpscLoader";
import { UpgradePrompt } from "@/components/shared/UpgradePrompt";
import { GsAccessBoundary } from "@/components/gs-lms/GsAccessBoundary";
import { examBrandName } from "@/lib/exams/examRoutes";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded } = useApiConfig();
  const { role } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAdminShell = role === "ADMIN";

  if (!isLoaded) return (
    <div className="flex h-screen items-center justify-center bg-[#f7f4ee]">
      <UpscLoader message={`Initializing ${examBrandName(pathname)}...`} />
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-[#f7f4ee]">
        {/* Sidebar for Desktop & Mobile */}
        <DashboardSidebar 
          isAdmin={isAdminShell}
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Header */}
          <DashboardHeader onMenuClick={() => setIsSidebarOpen(true)} />

          {/* Main Content */}
          <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
              <GsAccessBoundary>{children}</GsAccessBoundary>
            </div>
          </main>
        </div>
      </div>
      <UpgradePrompt />
    </ProtectedRoute>
  );
}
