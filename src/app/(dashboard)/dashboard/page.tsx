"use client";

import { useEffect, useState } from "react";
import { dashboardService, DashboardSummary } from "@/services/api/dashboardService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BookOpen, CheckCircle, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApiConfig } from "@/lib/hooks/useApi";
import { DebugPanel } from "@/components/shared/DebugPanel";

export default function DashboardHome() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const { isLoaded, isSignedIn } = useApiConfig();

  useEffect(() => {
    const fetchSummary = async () => {
      if (!isLoaded || !isSignedIn) return;
      
      try {
        setLoading(true);
        const [summaryData, recsData] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getRecommendations()
        ]);
        setSummary(summaryData);
        setRecommendations(recsData);
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
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/50 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium mb-4">Critical Error: Dashboard data fetch failed.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-md text-sm font-medium"
        >
          Retry Request
        </button>
      </div>
      
      <DebugPanel error={error} context="Dashboard API (/dashboard/summary)" />
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

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            AI Learning Path
          </h2>
          <div className="space-y-3">
            {recommendations?.recommendations?.map((rec: any, i: number) => (
              <div key={i} className="p-4 bg-white dark:bg-zinc-900 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={rec.priority === 'HIGH' ? 'destructive' : 'secondary'} className="text-[10px]">
                    {rec.priority}
                  </Badge>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">{rec.type}</span>
                </div>
                <h3 className="font-bold text-sm">{rec.topic}</h3>
                <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                <Button variant="ghost" size="sm" className="w-full mt-3 text-xs h-8 text-primary hover:bg-primary/5">
                  Start Revision
                </Button>
              </div>
            ))}
            {(!recommendations?.recommendations || recommendations.recommendations.length === 0) && (
              <div className="p-8 text-center border rounded-xl bg-muted/30">
                <p className="text-sm text-muted-foreground">Take a test to unlock your AI roadmap.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Tests</h2>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border shadow-sm divide-y">
            {summary?.recentTests.map(test => (
              <div key={test.attemptId} className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-semibold text-sm">{test.testTitle}</p>
                  <p className="text-xs text-muted-foreground">{new Date(test.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg text-primary">{test.score} / {test.maxScore}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
