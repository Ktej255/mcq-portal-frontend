"use client";

import { useEffect, useState } from "react";
import { examService, TestMetadata } from "@/services/api/examService";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  CheckCircle2, Circle, Clock, PlayCircle, RotateCcw,
  Leaf, Scale, Library, Beaker, TrendingUp, Globe, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ── Static subject list — always visible immediately ──────────
const SUBJECTS = [
  { name: "Environment", icon: Leaf },
  { name: "Polity",      icon: Scale },
  { name: "History",     icon: Library },
  { name: "Science",     icon: Beaker },
  { name: "Economy",     icon: TrendingUp },
  { name: "Geography",   icon: Globe },
];

export default function TestsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeSubject, setActiveSubject] = useState("Environment");
  const [allTests, setAllTests] = useState<TestMetadata[]>([]);
  const [batchLoading, setBatchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch once auth is settled
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    setBatchLoading(true);
    setFetchError(null);

    examService.getAvailableTests()
      .then((data) => {
        if (!cancelled) setAllTests(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setFetchError(err?.message ?? "Failed to load batches.");
      })
      .finally(() => {
        if (!cancelled) setBatchLoading(false);
      });

    return () => { cancelled = true; };
  }, [authLoading, user?.uid]);   // user.uid is stable; avoids repeated fires

  const filteredTests = allTests
    .filter(t => t.subject === activeSubject)
    .sort((a, b) => {
      const getBatchNum = (s: string) => {
        const m = s.match(/Batch\s+(\d+)/i);
        return m ? parseInt(m[1], 10) : 0;
      };
      const batchA = getBatchNum(a.title);
      const batchB = getBatchNum(b.title);
      if (batchA !== batchB) return batchA - batchB;
      return a.title.localeCompare(b.title, undefined, { numeric: true });
    });

  const handleStart = async (testId: string) => {
    try {
      const attempt = await examService.startAttempt(testId);
      router.push(`/exam/${testId}?attemptId=${attempt.attemptId}`);
    } catch (err: any) {
      setFetchError(err?.message ?? "Could not start test.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-1">
          Practice Batches
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Select a subject and start your daily practice.
        </p>
      </motion.div>

      {/* ── Subject Tabs — always visible ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-3 mb-10 pb-6 border-b border-zinc-100 dark:border-zinc-800"
      >
        {SUBJECTS.map(({ name, icon: Icon }) => {
          const isActive = activeSubject === name;
          return (
            <motion.button
              key={name}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveSubject(name)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold border transition-all duration-200",
                isActive
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-zinc-400")} />
              {name}
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── Error banner ── */}
      {fetchError && (
        <div className="mb-6 flex items-center justify-between gap-4 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <p className="text-sm text-red-600 dark:text-red-400">{fetchError}</p>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="shrink-0 rounded-xl">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* ── Batch Grid ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubject}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.2 }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {batchLoading
            ? /* Skeleton cards */
              [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="animate-pulse h-52 bg-zinc-100 dark:bg-zinc-800 rounded-3xl" />
              ))
            : filteredTests.length > 0
            ? /* Real batch cards */
              filteredTests.map((test, i) => {
                const done    = test.lastAttemptStatus === "SUBMITTED";
                const inprog  = test.lastAttemptStatus === "IN_PROGRESS";
                const empty   = test.totalQuestions === 0;

                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={cn(
                      "group rounded-3xl border p-6 flex flex-col transition-all duration-300",
                      empty   ? "opacity-60 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800"
                      : done  ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 hover:shadow-2xl hover:-translate-y-1"
                              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:shadow-2xl hover:-translate-y-1"
                    )}
                  >
                    {/* Icon + Attempts */}
                    <div className="flex justify-between items-start mb-4">
                      <div className={cn("p-2.5 rounded-2xl transition-colors",
                        empty  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                        : done ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                        : inprog ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                                 : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                      )}>
                        {done ? <CheckCircle2 className="w-5 h-5" />
                          : inprog ? <Clock className="w-5 h-5" />
                          : <Circle className={cn("w-5 h-5", empty && "opacity-25")} />}
                      </div>
                      {!empty && test.attemptCount > 0 && (
                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block">Attempts</span>
                          <span className="text-lg font-black text-zinc-900 dark:text-white">{test.attemptCount}</span>
                        </div>
                      )}
                    </div>

                    {/* Title + desc */}
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1 leading-snug">{test.title}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3 leading-relaxed flex-1">
                      {empty ? "Being prepared. Coming soon." : (test.description || `${test.subject} practice batch.`)}
                    </p>

                    {/* Meta */}
                    <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-4">
                      <span className="flex items-center gap-1"><span className={cn("w-1 h-1 rounded-full", empty ? "bg-zinc-300" : "bg-indigo-500")} />{empty ? "Pending" : `${test.totalQuestions} Qs`}</span>
                      {!empty && <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-amber-500" />{test.durationMinutes} Min</span>}
                    </div>

                    {/* CTA */}
                    <Button
                      disabled={empty}
                      onClick={() => !empty && handleStart(test.id)}
                      variant={empty ? "secondary" : done ? "outline" : "default"}
                      className={cn(
                        "w-full rounded-2xl h-10 font-bold text-sm transition-all",
                        empty   ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border-transparent"
                        : done  ? "hover:bg-emerald-600 hover:text-white border-emerald-200 text-emerald-700"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30"
                      )}
                    >
                      {empty ? "Coming Soon"
                        : done   ? <span className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" />Re-Attempt</span>
                        : inprog ? "Resume"
                                 : <span className="flex items-center gap-1.5"><PlayCircle className="w-3.5 h-3.5" />Start Batch</span>}
                    </Button>
                  </motion.div>
                );
              })
            : /* Empty state for this subject */
              [1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6 opacity-50 flex flex-col gap-3">
                  <div className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 w-fit"><Circle className="w-5 h-5 text-zinc-300 opacity-30" /></div>
                  <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                  <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="mt-auto h-10 w-full bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                  <span className="text-[11px] text-center text-zinc-400 font-medium">Coming Soon</span>
                </div>
              ))
          }
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
