"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Target, TrendingUp } from "lucide-react";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { ProgressOut, GapOut } from "@/services/api/gsLmsService";
import { useApiConfig } from "@/lib/hooks/useApi";

/**
 * LMS Progress Card — shown at top of the Reports page.
 * Fetches real backend data (getProgress + getGaps) and displays
 * overall completion, per-mega-topic progress, and weak areas.
 *
 * Additive: placed above existing localStorage-based reports.
 * Falls back gracefully if backend unreachable.
 */
export function LmsProgressCard() {
  const { isLoaded, isSignedIn } = useApiConfig();
  const [progress, setProgress] = useState<ProgressOut | null>(null);
  const [gaps, setGaps] = useState<GapOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    Promise.all([
      gsLmsService.getProgress("geography").catch(() => null),
      gsLmsService.getGaps("geography").catch(() => null),
    ])
      .then(([prog, gap]) => {
        setProgress(prog);
        setGaps(gap);
      })
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn]);

  if (loading || (!progress && !gaps)) return null;

  return (
    <section className="mb-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-br from-[#e7f5ee] to-[#fffdf8] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#1d9e75]" />
          <h2 className="text-lg font-black text-[#1a3a2a]">Geography LMS Progress</h2>
        </div>
        <Link
          href="/upsc/geography/lms/gaps"
          className="text-xs font-bold text-[#1d9e75] hover:underline"
        >
          Full gap analysis →
        </Link>
      </div>

      {/* Overall Progress */}
      {progress && (
        <div className="grid gap-3 sm:grid-cols-3 mb-4">
          <div className="rounded-xl border border-[#dcd5c7] bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-[#1d9e75]">Overall</p>
            <p className="mt-1 text-2xl font-black text-[#1a3a2a]">{Math.round(progress.overall_percent)}%</p>
            <p className="text-xs text-[#536259]">{progress.completed_topics}/{progress.total_topics} topics</p>
          </div>
          <div className="rounded-xl border border-[#dcd5c7] bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-[#1d9e75]">Completed</p>
            <p className="mt-1 text-2xl font-black text-[#1a3a2a]">{progress.completed_topics}</p>
            <p className="text-xs text-[#536259]">topics finished</p>
          </div>
          <div className="rounded-xl border border-[#dcd5c7] bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-[#1d9e75]">Remaining</p>
            <p className="mt-1 text-2xl font-black text-[#1a3a2a]">{progress.total_topics - progress.completed_topics}</p>
            <p className="text-xs text-[#536259]">topics to go</p>
          </div>
        </div>
      )}

      {/* Per-Mega-Topic Progress */}
      {progress && progress.mega_topics.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-[#536259] mb-2">Per-section progress:</p>
          <div className="space-y-2">
            {progress.mega_topics.map((mt) => (
              <div key={mt.node_id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#1a3a2a] w-40 truncate">{mt.title}</span>
                <div className="flex-1 h-2 bg-[#dcd5c7] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1d9e75] rounded-full transition-all"
                    style={{ width: `${mt.completion_percent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[#536259] w-10 text-right">
                  {Math.round(mt.completion_percent)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak Areas Summary */}
      {gaps && gaps.weak_topics.length > 0 && (
        <div className="rounded-xl border border-[#ef9f27]/30 bg-[#fff8e8] p-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-[#ef9f27]" />
            <p className="text-xs font-bold text-[#6f4a12]">
              {gaps.weak_topics.length} weak area{gaps.weak_topics.length > 1 ? "s" : ""} detected
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {gaps.weak_topics.slice(0, 5).map((wt) => (
              <span
                key={wt.node_id}
                className="text-[11px] font-bold text-[#6f4a12] bg-white border border-[#ef9f27]/30 rounded-md px-2 py-0.5"
              >
                {wt.title} ({Math.round(wt.accuracy * 100)}%)
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
