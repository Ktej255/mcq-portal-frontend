"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import { apiErrorMessage } from "@/services/api/error";
import type { DailyPlanOut, PlanItemOut } from "@/services/api/gsLmsService";
import { LmsLoadingSkeleton } from "./LmsLoadingSkeleton";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useSubjectLms } from "./SubjectLmsContext";

const REVISIT_LABELS: Record<string, string> = {
  day_3: "Day 3 recall",
  day_7: "Day 7 recall",
  day_21: "Day 21 recall",
  day_start: "Start-of-day recall",
};

function revisitLabel(revisitType: string | null): string {
  return (revisitType && REVISIT_LABELS[revisitType]) || "Spaced recall";
}

function stripRevisitPrefix(title: string): string {
  return title.replace(/^🔄\s*/, "");
}

function planItemContext(item: PlanItemOut): string | null {
  if (item.item_type !== "section") return null;
  if (!item.sequence_position || !item.sequence_total) return null;
  const prelims = item.prelims_pyq_count ?? 0;
  const mains = item.mains_pyq_count ?? 0;
  const counts = [
    prelims ? `${prelims} Prelims` : "",
    mains ? `${mains} Mains` : "",
  ]
    .filter(Boolean)
    .join(" + ");
  const demand =
    prelims + mains > 0
      ? `${counts} PYQ${prelims + mains === 1 ? "" : "s"} mapped`
      : "no reviewed PYQ yet";
  return `Topic ${item.sequence_position} of ${item.sequence_total} · ${demand}`;
}

export function PlannerUI() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useApiConfig();
  const { subject, lmsBase } = useSubjectLms();
  const [plan, setPlan] = useState<DailyPlanOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [bandwidth, setBandwidthVal] = useState<number>(3);
  const [updating, setUpdating] = useState(false);
  const [replanning, setReplanning] = useState(false);
  const [completingRevisitId, setCompletingRevisitId] = useState<number | null>(null);

  const fetchPlan = useCallback(() => {
    setLoading(true);
    setError(null);
    gsLmsService
      .getTodayPlan(subject)
      .then((data) => {
        setPlan(data);
        setBandwidthVal(data.bandwidth);
      })
      .catch((err) => setError(apiErrorMessage(err, "Failed to load plan")))
      .finally(() => setLoading(false));
  }, [subject]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    queueMicrotask(() => fetchPlan());
  }, [isLoaded, isSignedIn, fetchPlan]);

  const handleUpdateBandwidth = async () => {
    setUpdating(true);
    setOperationError(null);
    try {
      const updated = await gsLmsService.setBandwidth(subject, bandwidth);
      setPlan(updated);
    } catch {
      setOperationError("Unable to update bandwidth. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleReplan = async () => {
    setReplanning(true);
    setOperationError(null);
    try {
      await gsLmsService.replan(subject);
      const refreshed = await gsLmsService.getTodayPlan(subject);
      setPlan(refreshed);
    } catch {
      setOperationError("Unable to replan. Please try again.");
    } finally {
      setReplanning(false);
    }
  };

  const handleCompleteRevisit = async (revisitId: number) => {
    setCompletingRevisitId(revisitId);
    setOperationError(null);
    try {
      await gsLmsService.completeRevisit(subject, revisitId);
      const refreshed = await gsLmsService.getTodayPlan(subject);
      setPlan(refreshed);
      setBandwidthVal(refreshed.bandwidth);
    } catch {
      setOperationError("Unable to record that revisit. Please try again.");
    } finally {
      setCompletingRevisitId(null);
    }
  };

  if (loading) return <LmsLoadingSkeleton variant="list" />;
  if (error) {
    return (
      <div>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button onClick={() => fetchPlan()} className="text-sm text-[#1d9e75] hover:underline">
          Retry
        </button>
      </div>
    );
  }
  if (!plan) {
    return (
      <div>
        <p className="text-sm text-[#13251d]/70 mb-4">No plan is available for today.</p>
        <button onClick={() => fetchPlan()} className="text-sm text-[#1d9e75] hover:underline">
          Retry
        </button>
      </div>
    );
  }

  const revisitItems = plan.planned_items.filter(
    (item) => item.item_type === "revisit"
  );
  const dayItems = plan.planned_items.filter(
    (item) => item.item_type !== "revisit"
  );
  const completedDayItems = dayItems.filter((item) => item.completed).length;
  const allDayItemsDone = dayItems.length > 0 && completedDayItems === dayItems.length;

  return (
    <div className="space-y-6">
      {operationError && (
        <p role="alert" className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
          {operationError}
        </p>
      )}

      {/* Header with date and streak */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-xl border border-[#dcd5c7] bg-[#fffdf8] shadow-sm">
        <div>
          <p className="text-base sm:text-lg font-bold text-[#1a3a2a]">
            {new Date(plan.plan_date).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          {plan.projected_completion_date && (
            <p className="text-xs sm:text-sm text-[#13251d]/60 mt-1 max-w-xl">
              Pacing estimate:{" "}
              <span className="font-semibold text-[#1a3a2a]">
                {new Date(plan.projected_completion_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>{" "}
              if every slot finishes its topic. Treat this as a pacing floor, not a rigid deadline.
            </p>
          )}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-orange-600 self-start sm:self-auto shrink-0 shadow-sm">
          <span className="text-base" aria-hidden="true">🔥</span>
          <span className="text-xs sm:text-sm font-bold">{plan.streak_days} day streak</span>
        </div>
      </div>

      {/* Bandwidth selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-xl border border-[#dcd5c7] bg-white shadow-sm">
        <div className="space-y-0.5">
          <label htmlFor="daily-bandwidth-input" className="text-sm font-bold text-[#1a3a2a]">
            Daily topic slots:
          </label>
          <p className="text-xs text-[#13251d]/55">
            Topics per day · 1–4 slots recommended for balanced daily retention
          </p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center border border-[#dcd5c7] rounded-lg overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setBandwidthVal((prev) => Math.max(1, prev - 1))}
              disabled={bandwidth <= 1 || updating}
              className="min-h-11 min-w-11 flex items-center justify-center text-sm font-bold text-[#13251d] hover:bg-gray-100 disabled:opacity-30 transition-colors"
              aria-label="Decrease slots"
            >
              −
            </button>
            <input
              id="daily-bandwidth-input"
              type="number"
              min={1}
              max={20}
              value={bandwidth}
              onChange={(e) => setBandwidthVal(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              className="w-12 h-11 text-center font-bold text-base sm:text-sm text-[#1a3a2a] outline-none border-x border-[#dcd5c7]"
            />
            <button
              type="button"
              onClick={() => setBandwidthVal((prev) => Math.min(20, prev + 1))}
              disabled={bandwidth >= 20 || updating}
              className="min-h-11 min-w-11 flex items-center justify-center text-sm font-bold text-[#13251d] hover:bg-gray-100 disabled:opacity-30 transition-colors"
              aria-label="Increase slots"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={handleUpdateBandwidth}
            disabled={updating || bandwidth === plan.bandwidth}
            className="min-h-11 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#1d9e75] hover:bg-[#178a65] rounded-lg disabled:opacity-40 transition-colors shadow-sm"
          >
            {updating ? "Saving…" : "Update"}
          </button>
        </div>
      </div>

      {/* Due spaced recalls: completed topics returning for review */}
      {revisitItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-[#6f4a12] uppercase tracking-wider">
              Topic Revisits Due ({revisitItems.length})
            </h3>
          </div>
          <p className="text-xs text-[#13251d]/60">
            Completed topics return here on Day 3, 7, and 21 spaced intervals.
            Recall the core concepts from memory, then mark reviewed.
          </p>
          <div className="space-y-2.5">
            {revisitItems.map((item) => (
              <div
                key={`revisit-${item.revisit_id ?? item.node_id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#ef9f27]/40 bg-[#fff4df] p-3.5 sm:p-4 shadow-sm"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/80 text-sm shadow-2xs" aria-hidden="true">
                    🔁
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-bold text-[#6f4a12] truncate">
                      {stripRevisitPrefix(item.title)}
                    </p>
                    <p className="text-xs text-[#6f4a12]/75 mt-0.5">
                      {revisitLabel(item.revisit_type)}
                      {item.overdue && (
                        <span className="font-bold text-[#b56b0c]"> · Overdue</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <Link
                    href={`${lmsBase}/topic/${item.node_id}`}
                    className="min-h-11 flex-1 sm:flex-initial inline-flex items-center justify-center rounded-lg border border-[#ef9f27]/60 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-[#6f4a12] transition-colors hover:bg-[#ef9f27]/10"
                  >
                    Open topic
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      item.revisit_id && handleCompleteRevisit(item.revisit_id)
                    }
                    disabled={!item.revisit_id || completingRevisitId === item.revisit_id}
                    className="min-h-11 flex-1 sm:flex-initial inline-flex items-center justify-center rounded-lg bg-[#ef9f27] px-4 py-2 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-[#d98c1e] disabled:opacity-50 shadow-sm"
                  >
                    {completingRevisitId === item.revisit_id ? "Recording…" : "Mark reviewed"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planned items checklist */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xs sm:text-sm font-bold text-[#1a3a2a] uppercase tracking-wider">
            Today&apos;s Plan
          </h3>
          {dayItems.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e7f5ee] text-[#085041]">
              {completedDayItems} of {dayItems.length} completed
            </span>
          )}
        </div>
        <p className="text-xs text-[#13251d]/60">
          Each item is a full topic with its sequence position and PYQ demand.
          Tapping an item opens its 14-step study flow; progress updates automatically as you complete each step.
        </p>

        {dayItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#dcd5c7] bg-white p-6 text-center space-y-3">
            <p className="text-sm text-[#13251d]/70 font-medium">No items scheduled for today.</p>
            <Link
              href={`${lmsBase}/syllabus`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1d9e75] px-4 py-2 text-xs sm:text-sm font-bold text-white transition hover:bg-[#178a65]"
            >
              Open Syllabus Tree to queue a topic →
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dayItems.map((item, idx) => {
              const dest =
                item.item_type === "retro"
                  ? `${lmsBase}/retro`
                  : item.item_type === "practice"
                    ? `${lmsBase}/practice`
                    : `${lmsBase}/topic/${item.node_id}`;
              const typeLabel =
                item.item_type === "retro"
                  ? "Weekly Retrospective"
                  : item.item_type === "practice"
                    ? "Practice Lab"
                    : "Topic";
              const context = planItemContext(item);
              return (
                <button
                  key={`${item.node_id}-${item.item_type}-${idx}`}
                  type="button"
                  onClick={() => router.push(dest)}
                  className={`w-full text-left flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border min-h-[58px] transition-all active:scale-[0.99] cursor-pointer shadow-xs ${
                    item.item_type === "retro"
                      ? "border-[#1d9e75]/40 bg-[#e7f5ee] hover:border-[#1d9e75]"
                      : item.completed
                        ? "border-[#dcd5c7]/60 bg-gray-50/70 hover:bg-gray-50"
                        : "border-[#dcd5c7] bg-white hover:border-[#1d9e75]/50 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                        item.completed
                          ? "bg-[#1d9e75] border-[#1d9e75] text-white"
                          : item.item_type === "retro"
                            ? "border-[#1d9e75] text-[#1d9e75]"
                            : "border-[#dcd5c7] bg-white"
                      }`}
                    >
                      {item.completed ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : item.item_type === "retro" ? (
                        <span className="text-xs">📝</span>
                      ) : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm sm:text-base font-bold truncate ${item.completed ? "text-[#13251d]/50 line-through" : "text-[#1a3a2a]"}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-[#13251d]/55 mt-0.5">
                        <span className="font-semibold text-[#1a3a2a]/70">{typeLabel}</span>
                        {context ? ` · ${context}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-[#13251d]/40 font-bold text-lg sm:text-xl shrink-0 ml-1" aria-hidden="true">
                    ›
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {allDayItemsDone && (
          <div className="rounded-xl border border-[#b9d9cd] bg-[#f3faf6] p-4 sm:p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5" aria-hidden="true">🎉</span>
              <div className="flex-1">
                <h4 className="text-sm sm:text-base font-bold text-[#085041]">
                  All planned topics for today are completed!
                </h4>
                <p className="text-xs sm:text-sm text-[#13251d]/75 mt-1">
                  Your daily progress is saved. New topics will open tomorrow. Keep your retention sharp:
                </p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  <Link
                    href={`${lmsBase}/practice`}
                    className="min-h-11 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#1d9e75] text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#178a65] transition-colors"
                  >
                    Practice Lab (MCQs) →
                  </Link>
                  <Link
                    href={`${lmsBase}/syllabus`}
                    className="min-h-11 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[#1d9e75]/40 bg-white text-xs sm:text-sm font-bold text-[#085041] hover:bg-[#e7f5ee] transition-colors"
                  >
                    Browse Syllabus Map →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weekly review + replan */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
        <button
          type="button"
          onClick={handleReplan}
          disabled={replanning}
          className="min-h-11 px-5 py-2.5 text-xs sm:text-sm font-bold text-[#1a3a2a] border border-[#dcd5c7] hover:border-[#1d9e75] bg-white rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 shadow-xs"
        >
          {replanning ? "Replanning…" : "⚡ Replan Schedule"}
        </button>
        <Link
          href={`${lmsBase}/retro`}
          className="min-h-11 inline-flex items-center justify-center px-4 py-2.5 text-xs sm:text-sm font-bold border border-[#1d9e75]/30 bg-[#e7f5ee] text-[#085041] rounded-lg transition-all hover:bg-[#1d9e75] hover:text-white"
        >
          Open Weekly Retrospective →
        </Link>
      </div>
    </div>
  );
}
