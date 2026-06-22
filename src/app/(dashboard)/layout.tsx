"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useApiConfig } from "@/lib/hooks/useApi";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { UpscLoader } from "@/components/upsc/UpscLoader";
import { isOperatorRoute } from "@/lib/navigation/studentNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded } = useApiConfig();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAdminShell = isOperatorRoute(pathname);

  if (!isLoaded) return (
    <div className="flex h-screen items-center justify-center bg-[#f7f4ee]">
      <UpscLoader message="Initializing UPSC Command..." />
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
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
