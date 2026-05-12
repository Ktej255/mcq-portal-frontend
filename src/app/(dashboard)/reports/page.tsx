"use client";

import { useEffect, useState } from "react";
import { dashboardService, PerformanceReport } from "@/services/api/dashboardService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useApiConfig } from "@/lib/hooks/useApi";
import { DebugPanel } from "@/components/shared/DebugPanel";

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const { isLoaded, isSignedIn } = useApiConfig();

  useEffect(() => {
    const fetchReport = async () => {
      if (!isLoaded || !isSignedIn) return;
      
      try {
        setLoading(true);
        const data = await dashboardService.getReport(attemptId || undefined);
        setReport(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch report:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [attemptId, isLoaded, isSignedIn]);

  if (loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      <div className="grid gap-8 lg:grid-cols-2">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-80 bg-zinc-200 dark:bg-zinc-800 rounded-xl ${i === 3 ? 'lg:col-span-2' : ''}`}></div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/50 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium mb-4">Critical Error: Reports data fetch failed.</p>
        <Button onClick={() => window.location.reload()}>Retry Request</Button>
      </div>
      
      <DebugPanel error={error} context="Reports API (/dashboard/report)" />
    </div>
  );

  if (!report) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
      
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Subject Performance */}
        <div className="border rounded-xl p-6 bg-white dark:bg-zinc-900 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Subject Performance</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.subjectScores}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#8884d8" name="Score Obtained" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Trends */}
        <div className="border rounded-xl p-6 bg-white dark:bg-zinc-900 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Score Trends</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.scoreTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#82ca9d" name="Score %" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Analytics */}
        <div className="border rounded-xl p-6 bg-white dark:bg-zinc-900 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-semibold mb-6">Confidence vs Accuracy</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.confidenceAnalytics} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="level" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="accuracy" fill="#00C49F" name="Accuracy %" />
                <Bar dataKey="count" fill="#FFBB28" name="Questions Answered" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
