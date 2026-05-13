"use client";

import { useEffect, useState } from "react";
import { dashboardService, DashboardSummary } from "@/services/api/dashboardService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BookOpen, CheckCircle, Clock, Sparkles, TrendingUp, History as HistoryIcon, ChevronRight, Trophy, BrainCircuit, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApiConfig } from "@/lib/hooks/useApi";
import { DebugPanel } from "@/components/shared/DebugPanel";

export default function DashboardHome() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [evolution, setEvolution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const { isLoaded, isSignedIn } = useApiConfig();

  useEffect(() => {
    const fetchSummary = async () => {
      if (!isLoaded || !isSignedIn) return;
      
      try {
        setLoading(true);
        const [summaryData, recsData, evoData] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getRecommendations(),
          dashboardService.getEvolution()
        ]);
        setSummary(summaryData);
        setRecommendations(recsData);
        setEvolution(evoData);
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
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse p-4 md:p-8">
      <div className="h-12 w-80 bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-[2.5rem]"></div>
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 h-[600px] bg-zinc-200 dark:bg-zinc-800 rounded-[3rem]"></div>
        <div className="h-[600px] bg-zinc-200 dark:bg-zinc-800 rounded-[3rem]"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col items-center justify-center p-12 bg-red-50 dark:bg-red-950/20 rounded-[3rem] border border-red-200 dark:border-red-800/50 text-center">
        <p className="text-red-600 dark:text-red-400 font-black text-2xl mb-4">Intelligence Sync Failed</p>
        <p className="text-muted-foreground mb-8 max-w-md">We couldn't reconstruct your dashboard profile. This might be due to a temporary network disruption.</p>
        <Button 
          onClick={() => window.location.reload()}
          className="rounded-2xl px-10 h-14 font-black text-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
        >
          Retry Intelligence Sync
        </Button>
      </div>
      <DebugPanel error={error} context="Dashboard API (/dashboard/summary)" />
    </div>
  );

  if (!summary) return null;

  const velocity = evolution?.learning_velocity?.accuracy_slope || 0;
  const stability = evolution?.behavioral_stability?.consistency_score || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-12 p-4 md:p-8 pb-32">
      <div className="space-y-2">
        <Badge variant="outline" className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] border-primary/20 text-primary">
          Intelligence Dashboard v4.0
        </Badge>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter">Welcome Back.</h1>
      </div>
      
      {/* KPI GRID — PREMIUM CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {[
          { label: 'Attempts', value: summary.totalTestsTaken, icon: <BookOpen className="text-blue-600" />, bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Avg Score', value: summary.averageScore.toFixed(0), suffix: '%', icon: <CheckCircle className="text-emerald-600" />, bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Velocity', value: (velocity > 0 ? '+' : '') + velocity.toFixed(1), icon: <TrendingUp className="text-purple-600" />, bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Stability', value: (stability * 100).toFixed(0), suffix: '%', icon: <Activity className="text-amber-600" />, bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map((stat, i) => (
          <div key={i} className="p-8 md:p-10 rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 ${stat.bg} rounded-2xl group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl md:text-5xl font-black tracking-tighter">{stat.value}</p>
              {stat.suffix && <span className="text-muted-foreground text-sm font-bold">{stat.suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* RECENT ACTIVITY */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-8 md:p-12 rounded-[3rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                <HistoryIcon className="w-8 h-8 text-primary" />
                Recent Attempts
              </h2>
              <Button variant="ghost" className="font-bold text-primary rounded-full px-6" onClick={() => window.location.href='/history'}>
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {summary.recentTests.map((test) => (
                <div 
                  key={test.attemptId} 
                  className="group flex items-center justify-between p-6 md:p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all cursor-pointer"
                  onClick={() => window.location.href=`/reports?attemptId=${test.attemptId}`}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                      {test.score >= (test.maxScore * 0.6) ? <Trophy className="w-6 h-6 text-yellow-500" /> : <Activity className="w-6 h-6 text-zinc-400" />}
                    </div>
                    <div>
                      <p className="font-black text-xl tracking-tight mb-1">{test.testTitle}</p>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{new Date(test.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-3xl tracking-tighter text-primary">{test.score}<span className="text-sm text-muted-foreground opacity-50"> / {test.maxScore}</span></p>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Points Secured</p>
                  </div>
                </div>
              ))}
              {summary.recentTests.length === 0 && (
                <div className="py-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="w-10 h-10 text-zinc-300" />
                  </div>
                  <p className="text-muted-foreground font-bold italic">No intelligence history found. Complete your first batch to start tracking.</p>
                  <Button size="lg" className="rounded-2xl px-10 h-14 font-black text-lg shadow-xl" onClick={() => window.location.href='/tests'}>
                    Begin UPSC Batch #1
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* QUICK START / SUBJECT OVERVIEW (Simplified) */}
          <div className="p-8 md:p-12 rounded-[3rem] bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <BrainCircuit className="w-64 h-64" />
            </div>
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl font-black tracking-tighter">Ready for the next challenge?</h2>
              <p className="text-lg font-bold opacity-70 max-w-lg">Your cognitive profile suggests focusing on **Environment & Ecology** today to stabilize your recent accuracy dip.</p>
              <Button size="lg" className="rounded-[1.5rem] px-10 h-16 font-black text-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white hover:opacity-90 shadow-2xl transition-all active:scale-95" onClick={() => window.location.href='/tests'}>
                Launch Recommended Batch
              </Button>
            </div>
          </div>
        </div>

        {/* SIDEBAR: AI LEARNING PATH */}
        <div className="space-y-8">
          <div className="p-10 rounded-[3.5rem] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-yellow-400/20 rounded-[1.5rem]">
                <Sparkles className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">AI Roadmap</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adaptive Mastery Path</p>
              </div>
            </div>

            <div className="space-y-6">
              {recommendations?.recommendations?.map((rec: any, i: number) => (
                <div key={i} className="p-8 bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={rec.priority === 'HIGH' ? 'destructive' : 'secondary'} className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full">
                      {rec.priority} PRIORITY
                    </Badge>
                  </div>
                  <h3 className="font-black text-lg tracking-tight mb-2 group-hover:text-primary transition-colors">{rec.topic}</h3>
                  <p className="text-sm font-bold text-muted-foreground leading-relaxed">{rec.reason}</p>
                  <Button variant="outline" className="w-full mt-6 rounded-2xl h-12 font-black text-xs uppercase tracking-widest border-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
                    Resolve Gap
                  </Button>
                </div>
              ))}
              {(!recommendations?.recommendations || recommendations.recommendations.length === 0) && (
                <div className="p-12 text-center bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                  <p className="text-sm font-bold text-muted-foreground italic leading-relaxed">Insufficient cognitive telemetry. Complete more batches to unlock your personalized AI roadmap.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-10 rounded-[3.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-black tracking-tight">Governance Status</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sovereignty Protected</p>
            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full animate-pulse"></div>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium italic">Telemetry reconstruction is locally encrypted and student-sovereign.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
