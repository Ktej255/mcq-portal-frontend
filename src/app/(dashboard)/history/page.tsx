"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import { dashboardService, HistoryItem } from "@/services/api/dashboardService";
import { useRouter } from "next/navigation";
import { useApiConfig } from "@/lib/hooks/useApi";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { isLoaded, isSignedIn } = useApiConfig();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isLoaded || !isSignedIn) return;
      
      try {
        setLoading(true);
        const data = await dashboardService.getHistory();
        setHistory(data);
      } catch (err) {
        console.info("History is not available yet; showing the first-attempt state.", err);
        setHistory([]);
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Attempt History</h1>
      {history.length === 0 ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">No attempt yet</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Your test history will appear after your first MCQ practice.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-6 text-zinc-500">
            For now, start from Geography. It keeps the class day, MCQ room, tracking and revision connected.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => router.push("/upsc/geography")} className="rounded-xl bg-zinc-900 px-5 font-bold text-white">
              Open Geography
            </Button>
            <Button onClick={() => router.push("/upsc/geography/mcq-readiness")} variant="outline" className="rounded-xl px-5 font-bold">
              Open MCQ Room
            </Button>
          </div>
        </div>
      ) : (
      
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
      )}
    </div>
  );
}
