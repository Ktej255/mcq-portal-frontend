"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, BarChart3, RefreshCw, Target } from "lucide-react";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { ProgressOut, ReadinessOut } from "@/services/api/gsLmsService";
import { useApiConfig } from "@/lib/hooks/useApi";

/**
 * LMS Progress Card — shown at top of the Reports page.
 * Fetches real backend data (getProgress + getReadiness) and displays
 * overall completion, per-mega-topic progress, and the demand-weighted
 * readiness summary. It never turns missing evidence into a weak-area claim.
 *
 * Additive: placed above existing localStorage-based reports.
 * Falls back gracefully if backend unreachable.
 */
export function LmsProgressCard() {
  const { isLoaded, isSignedIn } = useApiConfig();
  const [progress, setProgress] = useState<ProgressOut | null>(null);
  const [readiness, setReadiness] = useState<ReadinessOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchLmsData = useCallback(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(null);
    Promise.all([
      gsLmsService.getProgress("geography").catch((err) => {
        throw err;
      }),
      gsLmsService.getReadiness("geography", { persist: false }).catch((err) => {
        throw err;
      }),
    ])
      .then(([prog, ready]) => {
        setProgress(prog);
        setReadiness(ready);
      })
      .catch((err) => {
        setFetchError(err instanceof Error ? err.message : "Unable to reach LMS server");
      })
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    const requestTimer = window.setTimeout(() => {
      fetchLmsData();
    }, 0);
    return () => window.clearTimeout(requestTimer);
  }, [fetchLmsData]);

  if (loading && !progress && !readiness) return null;

  if (fetchError && !progress && !readiness) {
    return (
      <section className="mb-6 rounded-2xl border border-[#e8b061] bg-[#fff8ed] p-4 text-[#6f4a12]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[#9b6517]" />
            <p className="text-sm font-bold">Unable to load Geography LMS progress ({fetchError})</p>
          </div>
          <button
            type="button"
            onClick={fetchLmsData}
            className="inline-flex min-h-11 items-center rounded-md bg-[#1a3a2a] px-4 text-xs font-black text-white hover:bg-[#10291d]"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry LMS Progress
          </button>
        </div>
      </section>
    );
  }

  if (!progress && !readiness) return null;

  return (
    <section className="mb-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-br from-[#e7f5ee] to-[#fffdf8] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#1d9e75]" />
          <h2 className="text-lg font-black text-[#1a3a2a]">Geography LMS Progress</h2>
        </div>
        <Link
          href="/upsc/geography/lms/gaps"
          className="inline-flex min-h-11 items-center text-xs font-bold text-[#1d9e75] hover:underline"
        >
          Full readiness analysis →
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

      {/* Readiness Summary */}
      {readiness && (
        <div
          className={`rounded-xl border p-3 ${
            readiness.summary.band_suppressed
              ? "border-[#ef9f27]/30 bg-[#fff8e8]"
              : "border-[#b9d9cd] bg-[#e7f5ee]"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target
                className={`h-4 w-4 ${
                  readiness.summary.band_suppressed
                    ? "text-[#ef9f27]"
                    : "text-[#0f6b4f]"
                }`}
              />
              <p
                className={`text-xs font-bold ${
                  readiness.summary.band_suppressed
                    ? "text-[#6f4a12]"
                    : "text-[#0f6b4f]"
                }`}
              >
                {readiness.summary.band_suppressed
                  ? "Readiness band withheld"
                  : `Readiness band: ${readiness.summary.band.replace(/_/g, " ").toLowerCase()}`}
              </p>
            </div>
            <p
              className={`text-[11px] font-semibold ${
                readiness.summary.band_suppressed
                  ? "text-[#6f4a12]/80"
                  : "text-[#0f6b4f]/80"
              }`}
            >
              {Math.round(readiness.evidence.assessed_demand_pct)}% of demand assessed
            </p>
          </div>

          {readiness.summary.band_suppressed ? (
            <p className="mt-1.5 text-[11px] leading-snug text-[#6f4a12]/80">
              Not enough tested demand for a band. Unassessed topics are not
              treated as weak; they need a diagnostic first.
            </p>
          ) : null}

          {readiness.next_actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {readiness.next_actions.slice(0, 3).map((action) => (
                <Link
                  key={action.node_id}
                  href={`/upsc/geography/lms/topic/${action.node_id}`}
                  className="inline-flex min-h-11 items-center rounded-md border border-[#dcd5c7] bg-white px-3 py-1 text-xs font-bold text-[#1a3a2a] hover:border-[#1d9e75]"
                >
                  {action.title} · {action.marks_at_stake.toFixed(1)} marks
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
