"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import { dashboardService, HistoryItem } from "@/services/api/dashboardService";
import { useRouter } from "next/navigation";
import { useApiConfig } from "@/lib/hooks/useApi";
import { DebugPanel } from "@/components/shared/DebugPanel";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const { isLoaded, isSignedIn } = useApiConfig();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isLoaded || !isSignedIn) return;
      
      try {
        setLoading(true);
        const data = await dashboardService.getHistory();
        setHistory(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch history:", err);
        setError(err); // Save full error object
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isLoaded, isSignedIn]);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
    </div>
  );

  if (error) return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/50 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium mb-4">Critical Error: History fetch failed.</p>
        <Button onClick={() => window.location.reload()}>Retry Request</Button>
      </div>
      
      <DebugPanel error={error} context="History API (/attempts/history)" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Attempt History</h1>
      
      <div className="bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-950 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">Test Name</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Score</th>
              <th className="px-6 py-4 font-medium">Accuracy</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {history.map((item) => (
              <tr key={item.attemptId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-6 py-4 font-medium">{item.title}</td>
                <td className="px-6 py-4 text-muted-foreground">{item.date}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">{item.score !== null ? `${item.score}/${item.maxScore}` : '-'}</td>
                <td className="px-6 py-4">{item.accuracy}</td>
                <td className="px-6 py-4 text-right">
                  {item.status === 'COMPLETED' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push(`/reports?attemptId=${item.attemptId}`)}
                    >
                      View Report
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
