"use client";

import { useEffect, useState, useMemo } from "react";
import { examService, TestMetadata } from "@/services/api/examService";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useApiConfig } from "@/lib/hooks/useApi";
import { DebugPanel } from "@/components/shared/DebugPanel";
import { CheckCircle2, Circle, Clock, PlayCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<TestMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const { isLoaded, isSignedIn } = useApiConfig();

  useEffect(() => {
    const fetchTests = async () => {
      if (!isLoaded || !isSignedIn) return;
      
      try {
        setLoading(true);
        const data = await examService.getAvailableTests();
        setTests(data);
        if (data.length > 0 && !activeSubject) {
          // Set initial active subject
          setActiveSubject(data[0].subject);
        }
        setError(null);
      } catch (err) {
        console.error("Failed to fetch tests:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [isLoaded, isSignedIn]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    tests.forEach(t => set.add(t.subject));
    return Array.from(set);
  }, [tests]);

  const filteredTests = useMemo(() => {
    if (!activeSubject) return [];
    return tests.filter(t => t.subject === activeSubject);
  }, [tests, activeSubject]);

  const handleStartTest = async (testId: string) => {
    try {
      const attempt = await examService.startAttempt(testId);
      router.push(`/exam/${testId}?attemptId=${attempt.attemptId}`);
    } catch (err) {
      console.error("Failed to start attempt:", err);
      setError(err);
    }
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      <div className="flex gap-4 mb-8">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>)}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/50 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium mb-4">Failed to load content batches.</p>
        <Button onClick={() => window.location.reload()}>Retry Connection</Button>
      </div>
      <DebugPanel error={error} context="Production Ingestion Check" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">Practice Batches</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Select a subject and start your daily practice.</p>
        </div>
      </div>

      {/* Subject Navigation */}
      <div className="flex flex-wrap gap-2 mb-12 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        {subjects.map(subject => (
          <button
            key={subject}
            onClick={() => setActiveSubject(subject)}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap",
              activeSubject === subject 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20" 
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
            )}
          >
            {subject}
          </button>
        ))}
      </div>

      {/* Batch Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {filteredTests.map((test) => {
          const isAttempted = test.attemptCount > 0;
          const isCompleted = test.lastAttemptStatus === 'SUBMITTED';
          const isInProgress = test.lastAttemptStatus === 'IN_PROGRESS';
          const isComingSoon = test.totalQuestions === 0;

          return (
            <div 
              key={test.id} 
              className={cn(
                "group relative overflow-hidden rounded-3xl border transition-all duration-300",
                isComingSoon
                  ? "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800/50 opacity-60"
                  : isCompleted 
                    ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 hover:shadow-xl hover:-translate-y-1" 
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:shadow-xl hover:-translate-y-1"
              )}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    isComingSoon
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                      : isCompleted 
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
                        : isInProgress
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  )}>
                    {isComingSoon ? <Circle className="w-6 h-6 opacity-20" /> : isCompleted ? <CheckCircle2 className="w-6 h-6" /> : isInProgress ? <Clock className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </div>
                  
                  {!isComingSoon && isAttempted && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500 block mb-1">Attempts</span>
                      <span className="text-lg font-black text-zinc-900 dark:text-white leading-none">{test.attemptCount}</span>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 leading-tight">
                  {test.title}
                </h3>
                
                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-8">
                  <span className="flex items-center gap-1.5">
                    <span className={cn("w-1.5 h-1.5 rounded-full", isComingSoon ? "bg-zinc-300" : "bg-indigo-500")} />
                    {isComingSoon ? "Content will be available shortly" : `${test.totalQuestions} Questions`}
                  </span>
                  {!isComingSoon && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {test.durationMinutes} Mins
                    </span>
                  )}
                </div>

                <Button 
                  onClick={() => !isComingSoon && handleStartTest(test.id)} 
                  disabled={isComingSoon}
                  variant={isComingSoon ? "secondary" : (isCompleted ? "outline" : "default")}
                  className={cn(
                    "w-full rounded-2xl h-12 font-bold transition-all group",
                    isComingSoon
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border-transparent"
                      : isCompleted 
                        ? "hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
                  )}
                >
                  {isComingSoon ? (
                    "Coming Soon"
                  ) : isCompleted ? (
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" /> Re-Attempt
                    </span>
                  ) : isInProgress ? (
                    <span className="flex items-center gap-2">
                      Resume Test
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4" /> Start Now
                    </span>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
