"use client";

import { useEffect, useState, useMemo } from "react";
import { examService, TestMetadata } from "@/services/api/examService";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { 
  CheckCircle2, Circle, Clock, PlayCircle, RotateCcw, 
  Leaf, Scale, Library, Beaker, TrendingUp, Globe,
  AlertCircle, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const subjectIconMap: Record<string, any> = {
  "Environment": Leaf,
  "Polity": Scale,
  "History": Library,
  "Science": Beaker,
  "Economy": TrendingUp,
  "Geography": Globe
};

export default function TestsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tests, setTests] = useState<TestMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to settle
    if (authLoading) return;

    const fetchTests = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await examService.getAvailableTests();
        setTests(data);
        // Auto-select first subject
        if (data.length > 0) {
          const firstSubject = data[0].subject;
          setActiveSubject(prev => prev ?? firstSubject);
        }
      } catch (err: any) {
        console.error("Failed to fetch tests:", err);
        setError(err?.message || "Failed to connect to the server. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [authLoading, user]);

  const subjects = useMemo(() => {
    const seen = new Set<string>();
    tests.forEach(t => seen.add(t.subject));
    return Array.from(seen);
  }, [tests]);

  const filteredTests = useMemo(() => {
    if (!activeSubject) return [];
    return tests.filter(t => t.subject === activeSubject);
  }, [tests, activeSubject]);

  const handleStartTest = async (testId: string) => {
    try {
      const attempt = await examService.startAttempt(testId);
      router.push(`/exam/${testId}?attemptId=${attempt.attemptId}`);
    } catch (err: any) {
      console.error("Failed to start attempt:", err);
      setError(err?.message || "Failed to start test.");
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="animate-pulse space-y-2">
          <div className="h-10 w-56 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-5 w-72 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg" />
        </div>
        <div className="flex gap-3 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse h-12 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="animate-pulse h-52 bg-zinc-100 dark:bg-zinc-800 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center gap-6">
        <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Could not load batches</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">{error}</p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 h-12"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────
  if (tests.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center gap-4">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Circle className="w-8 h-8 text-zinc-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No batches available yet</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Content is being prepared. Please check back shortly.</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" className="rounded-2xl">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">
          Practice Batches
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Select a subject and start your daily practice.
        </p>
      </motion.div>

      {/* Subject Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 mb-10 pb-6 border-b border-zinc-100 dark:border-zinc-800/50"
      >
        {subjects.map((subject) => {
          const Icon = subjectIconMap[subject] || Circle;
          const isActive = activeSubject === subject;
          return (
            <motion.button
              key={subject}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveSubject(subject)}
              className={cn(
                "flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 border",
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 border-indigo-500"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-zinc-400")} />
              {subject}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Batch Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubject}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.25 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {filteredTests.map((test, index) => {
            const isAttempted = test.attemptCount > 0;
            const isCompleted = test.lastAttemptStatus === "SUBMITTED";
            const isInProgress = test.lastAttemptStatus === "IN_PROGRESS";
            const isComingSoon = test.totalQuestions === 0;

            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border transition-all duration-300",
                  isComingSoon
                    ? "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800/50 opacity-60"
                    : isCompleted
                    ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 hover:shadow-2xl hover:-translate-y-1.5"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:shadow-2xl hover:-translate-y-1.5"
                )}
              >
                <div className="p-6">
                  {/* Top row: icon + attempt count */}
                  <div className="flex justify-between items-start mb-5">
                    <div
                      className={cn(
                        "p-3 rounded-2xl transition-colors",
                        isComingSoon
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                          : isCompleted
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                          : isInProgress
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isInProgress ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <Circle className={cn("w-5 h-5", isComingSoon && "opacity-25")} />
                      )}
                    </div>

                    {!isComingSoon && isAttempted && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block mb-0.5">
                          Attempts
                        </span>
                        <span className="text-lg font-black text-zinc-900 dark:text-white leading-none">
                          {test.attemptCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 leading-snug">
                    {test.title}
                  </h3>

                  {/* Description + meta */}
                  <div className="space-y-3 mb-6">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {isComingSoon
                        ? "Being prepared by expert educators. Coming soon."
                        : test.description || `${test.subject} practice batch.`}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <span className={cn("w-1 h-1 rounded-full", isComingSoon ? "bg-zinc-300" : "bg-indigo-500")} />
                        {isComingSoon ? "Pending" : `${test.totalQuestions} Qs`}
                      </span>
                      {!isComingSoon && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          {test.durationMinutes} Min
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => !isComingSoon && handleStartTest(test.id)}
                    disabled={isComingSoon}
                    variant={isComingSoon ? "secondary" : isCompleted ? "outline" : "default"}
                    className={cn(
                      "w-full rounded-2xl h-11 font-bold transition-all duration-200 text-sm",
                      isComingSoon
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border-transparent"
                        : isCompleted
                        ? "hover:bg-emerald-600 hover:text-white border-emerald-200 text-emerald-700"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30"
                    )}
                  >
                    {isComingSoon ? (
                      "Coming Soon"
                    ) : isCompleted ? (
                      <span className="flex items-center gap-2">
                        <RotateCcw className="w-3.5 h-3.5" /> Re-Attempt
                      </span>
                    ) : isInProgress ? (
                      "Resume Practice"
                    ) : (
                      <span className="flex items-center gap-2">
                        <PlayCircle className="w-3.5 h-3.5" /> Start Batch
                      </span>
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
