"use client";

import { useEffect, useState } from "react";
import { dashboardService, DashboardSummary } from "@/services/api/dashboardService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BookOpen, CheckCircle, Clock } from "lucide-react";
import { useApiConfig } from "@/lib/hooks/useApi";

export default function DashboardHome() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded, isSignedIn } = useApiConfig();

  useEffect(() => {
    const fetchSummary = async () => {
      if (!isLoaded || !isSignedIn) return;
      
      try {
        setLoading(true);
        const data = await dashboardService.getSummary();
        setSummary(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch dashboard summary:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [isLoaded, isSignedIn]);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
        ))}
      </div>
      <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="text-red-500 mb-4">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-md text-sm font-medium"
      >
        Retry
      </button>
    </div>
  );

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalTestsTaken}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.averageScore}%</div>
          </CardContent>
        </Card>

        {/* Placeholder cards for consistency */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14h 20m</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82%</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">Recent Tests</h2>
      <div className="bg-white dark:bg-zinc-900 rounded-lg border shadow-sm">
        <div className="p-4 grid gap-4">
          {summary?.recentTests.map(test => (
            <div key={test.attemptId} className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <p className="font-medium">{test.testTitle}</p>
                <p className="text-sm text-muted-foreground">{test.date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{test.score} / {test.maxScore}</p>
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
