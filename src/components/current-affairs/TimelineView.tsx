"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ArrowRight, CheckCircle2, type LucideIcon } from 'lucide-react';
import { caService, ThreadSummaryOut } from '@/services/api/caService';

/**
 * TimelineView — Chronological branch visualization showing threads
 * as horizontal timelines with subject-colored tracks.
 *
 * Requirements: 4.7
 */

const SUBJECT_COLORS: Record<string, string> = {
  geography: 'bg-green-500',
  economy: 'bg-amber-500',
  polity: 'bg-blue-500',
  environment: 'bg-teal-500',
  'science-tech': 'bg-purple-500',
  history: 'bg-red-500',
  'disaster-mgmt': 'bg-orange-500',
  'internal-security': 'bg-indigo-500',
};

const DIRECTION_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  escalating: { icon: TrendingUp, label: '↑' },
  'de-escalating': { icon: TrendingDown, label: '↓' },
  evolving: { icon: ArrowRight, label: '→' },
  concluded: { icon: CheckCircle2, label: '●' },
};

export function TimelineView() {
  const [threads, setThreads] = useState<ThreadSummaryOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    caService.getThreadsOverview()
      .then((nextThreads) => {
        if (cancelled) return;
        setThreads(nextThreads);
        setLoadFailed(false);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse bg-[#e7f5ee] rounded-xl" />
        ))}
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-xl border border-[#ef9f27]/50 bg-[#fff4df] p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold leading-5 text-[#7a5410]">
          Threads could not be loaded, so this is not an empty timeline.
        </p>
        <button
          type="button"
          onClick={() => {
            setLoadFailed(false);
            setLoading(true);
            setAttempt((count) => count + 1);
          }}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-[#9a6a16] px-3 text-xs font-black text-white transition hover:bg-[#7a5410]"
        >
          Retry load
        </button>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-8 text-center">
        <p className="text-sm text-[#5d675f]">No threads available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-black text-[#13251d]">News Threads Timeline</h2>
      <p className="text-xs text-[#5d675f]">Track how stories evolve over time</p>

      <div className="space-y-3">
        {threads.map((thread, idx) => {
          const color = SUBJECT_COLORS[thread.primary_subject] || 'bg-gray-500';
          const direction = DIRECTION_ICONS[thread.direction || 'evolving'];
          const DirectionIcon = direction?.icon || ArrowRight;

          return (
            <motion.div
              key={thread.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link href={`/upsc/current-affairs/threads/${thread.id}`}>
                <div className="rounded-xl border border-[#dcd5c7] bg-white p-4 hover:border-[#1d9e75] hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    {/* Subject color bar */}
                    <div className={`w-1 h-12 rounded-full ${color}`} />

                    {/* Thread info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-[#13251d] truncate">{thread.title}</h3>
                        <span className="text-[10px] text-[#5d675f] flex items-center gap-0.5">
                          <DirectionIcon className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-[#1d9e75]">{thread.primary_subject}</span>
                        <span className="text-[10px] text-[#5d675f]">{thread.item_count} items</span>
                        <span className="text-[10px] text-[#5d675f]">Since {new Date(thread.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Timeline dots preview */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(thread.item_count, 8) }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i < thread.item_count ? color : 'bg-gray-200'}`} />
                      ))}
                      {thread.item_count > 8 && <span className="text-[9px] text-[#5d675f]">+{thread.item_count - 8}</span>}
                    </div>

                    {/* Status badge */}
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      thread.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {thread.status}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default TimelineView;
