"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { GapOut, ProgressOut } from "@/services/api/gsLmsService";
import { LmsLoadingSkeleton } from "./LmsLoadingSkeleton";
import { LmsEmptyState } from "./LmsEmptyState";
import { useApiConfig } from "@/lib/hooks/useApi";

export function GapDashboard() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useApiConfig();
  const [gaps, setGaps] = useState<GapOut | null>(null);
  const [progress, setProgress] = useState<ProgressOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([gsLmsService.getGaps("geography"), gsLmsService.getProgress("geography")])
      .then(([gapData, progressData]) => {
        setGaps(gapData);
        setProgress(progressData);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load gap data")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetchData();
  }, [isLoaded, isSignedIn, fetchData]);

  if (loading) return <LmsLoadingSkeleton variant="list" />;

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  if (!gaps || !progress) return null;

  const hasWeakAreas =
    gaps.weak_topics.length > 0 || gaps.weak_question_types.length > 0;

  if (!hasWeakAreas) {
    return (
      <LmsEmptyState
        title="No weak areas found"
        description="Great work! All your topics and question types are above the threshold. Keep it up."
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header summary */}
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 p-4 md:p-5 rounded-xl border border-[#dcd5c7] bg-[#fffdf8]">
        <div className="text-center">
          <p className="text-3xl font-bold text-[#1d9e75]">
            {Math.round(progress.overall_percent)}%
          </p>
          <p className="text-xs text-[#13251d]/60 mt-1">Coverage</p>
        </div>
        <div className="h-10 w-px bg-[#dcd5c7]" />
        <div>
          <p className="text-sm text-[#13251d]">
            <strong>{progress.completed_topics}</strong> / {progress.total_topics} topics completed
          </p>
          <p className="text-xs text-[#13251d]/50 mt-0.5">
            Overall accuracy: {Math.round(gaps.overall_accuracy * 100)}%
          </p>
        </div>
      </div>

      {/* Weak topics */}
      {gaps.weak_topics.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#1a3a2a] uppercase tracking-wide">
            Weak Topics
          </h3>
          <div className="space-y-2">
            {gaps.weak_topics
              .sort((a, b) => a.accuracy - b.accuracy)
              .map((topic) => {
                const pct = Math.round(topic.accuracy * 100);
                return (
                  <button
                    key={topic.node_id}
                    onClick={() =>
                      router.push(`/upsc/geography/lms/topic/${topic.node_id}`)
                    }
                    className="w-full text-left flex items-center justify-between p-3 md:p-4 rounded-lg border border-[#dcd5c7] bg-white hover:border-red-200 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1a3a2a]">
                        {topic.title}
                      </p>
                      <p className="text-xs text-[#13251d]/50">
                        {topic.attempt_count} attempts
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-red-600">
                      {pct}%
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Weak question types */}
      {gaps.weak_question_types.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#1a3a2a] uppercase tracking-wide">
            Weak Question Types
          </h3>
          <div className="space-y-2">
            {gaps.weak_question_types.map((qt) => {
              const pct = Math.round(qt.accuracy * 100);
              return (
                <div
                  key={qt.question_type}
                  className="p-3 md:p-4 rounded-lg border border-[#dcd5c7] bg-white"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#13251d]/70">
                      {qt.question_type.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-medium text-[#1a3a2a]">
                      {pct}% ({qt.attempt_count} attempts)
                    </span>
                  </div>
                  <div className="h-2 bg-[#dcd5c7] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
