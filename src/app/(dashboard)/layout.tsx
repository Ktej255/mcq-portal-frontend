"use client";

import { useState } from "react";
import { useApiConfig } from "@/lib/hooks/useApi";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded } = useApiConfig();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isLoaded) return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">Initializing exam portal...</p>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        {/* Sidebar for Desktop & Mobile */}
        <DashboardSidebar 
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
