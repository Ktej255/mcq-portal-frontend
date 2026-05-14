"use client";

import { useEffect, useState } from "react";
import { dashboardService, DashboardSummary } from "@/services/api/dashboardService";
import { useApiConfig } from "@/lib/hooks/useApi";
import { DebugPanel } from "@/components/shared/DebugPanel";
import { DailyWorkspace } from "@/components/dashboard/DailyWorkspace";
import { Button } from "@/components/ui/button";

export default function DashboardHome() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const { isLoaded, isSignedIn } = useApiConfig();

  useEffect(() => {
    const fetchSummary = async () => {
      if (!isLoaded || !isSignedIn) return;
      
      try {
        setLoading(true);
        const summaryData = await dashboardService.getSummary();
        setSummary(summaryData);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch dashboard summary:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [isLoaded, isSignedIn]);

  if (loading) return (
    <div className="max-w-5xl mx-auto p-10 space-y-10 animate-pulse">
      <div className="h-12 w-64 bg-zinc-100 rounded-2xl"></div>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-[400px] bg-zinc-100 rounded-[2.5rem]"></div>
        <div className="h-[400px] bg-zinc-100 rounded-[2.5rem]"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-5xl mx-auto p-10">
      <div className="flex flex-col items-center justify-center p-12 bg-rose-50 rounded-[3rem] border border-rose-100 text-center">
        <p className="text-rose-900 font-black text-2xl mb-4">Command Sync Failed</p>
        <p className="text-rose-800/60 mb-8 max-w-md">We couldn't synchronize your daily workspace. Please check your institutional access.</p>
        <Button 
          onClick={() => window.location.reload()}
          className="rounded-2xl px-10 h-14 bg-zinc-900 text-white font-black"
        >
          RETRY SYNC
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <DailyWorkspace />
    </div>
  );
}
