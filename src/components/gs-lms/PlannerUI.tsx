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
        <p role="alert" className="text-sm text-red-600">
          {operationError}
        </p>
      )}

      {/* Header with date and streak */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-[#dcd5c7] bg-[#fffdf8]">
        <div>
          <p className="text-sm font-medium text-[#1a3a2a]">
            {new Date(plan.plan_date).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          {plan.projected_completion_date && (
            <p className="text-xs text-[#13251d]/50 mt-0.5">
              Pacing estimate:{" "}
              {new Date(plan.projected_completion_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}
              if every slot finishes its topic. A topic often needs more than one
              sitting, so treat this as a floor, not a deadline.
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-orange-500">
          <span className="text-lg">🔥</span>
          <span className="text-sm font-semibold">{plan.streak_days} day streak</span>
        </div>
      </div>

      {/* Bandwidth selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4 rounded-lg border border-[#dcd5c7] bg-white">
        <label className="text-sm text-[#13251d]/70">Daily topic slots:</label>
        <input
          type="number"
          min={1}
          max={20}
          value={bandwidth}
          onChange={(e) => setBandwidthVal(Number(e.target.value))}
          className="w-16 px-2 py-1.5 text-sm border border-[#dcd5c7] rounded-lg text-center focus:border-[#1d9e75] outline-none"
        />
        <span className="text-xs text-[#13251d]/50">
          topics/day · a full topic spans several sittings
        </span>
        <button
          onClick={handleUpdateBandwidth}
          disabled={updating || bandwidth === plan.bandwidth}
          className="ml-auto px-3 py-1.5 text-xs font-medium text-white bg-[#1d9e75] hover:bg-[#178a65] rounded-lg disabled:opacity-50 transition-colors"
        >
          {updating ? "Saving…" : "Update"}
        </button>
      </div>

      {/* Due spaced recalls: completed topics returning for review */}
      {revisitItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#1a3a2a] uppercase tracking-wide">
            Topic revisits due
          </h3>
          <p className="text-xs text-[#13251d]/55">
            Completed topics return here on their Day 3, Day 7, and Day 21
            revisit dates. Open the topic, recall it from memory, then mark it
            reviewed so it leaves today&apos;s queue. Section recall scheduled
            inside a topic&apos;s growth report is a separate track.
          </p>
          {revisitItems.map((item) => (
            <div
              key={`revisit-${item.revisit_id ?? item.node_id}`}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-[#ef9f27]/40 bg-[#fff4df] p-2.5 md:p-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/70 text-xs" aria-hidden="true">
                🔁
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#6f4a12]">
                  {stripRevisitPrefix(item.title)}
                </p>
                <p className="text-xs text-[#6f4a12]/60">
                  {revisitLabel(item.revisit_type)}
                  {item.overdue && (
                    <span className="font-semibold text-[#b56b0c]"> · Overdue</span>
                  )}
                </p>
              </div>
              <Link
                href={`${lmsBase}/topic/${item.node_id}`}
                className="rounded-lg border border-[#ef9f27]/50 bg-white px-3 py-1.5 text-xs font-semibold text-[#6f4a12] transition-colors hover:bg-[#ef9f27]/10"
              >
                Open topic
              </Link>
              <button
                type="button"
                onClick={() =>
                  item.revisit_id && handleCompleteRevisit(item.revisit_id)
                }
                disabled={!item.revisit_id || completingRevisitId === item.revisit_id}
                className="rounded-lg bg-[#ef9f27] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#d98c1e] disabled:opacity-50"
              >
                {completingRevisitId === item.revisit_id ? "Recording…" : "Mark reviewed"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Planned items checklist */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#1a3a2a] uppercase tracking-wide">
            Today&apos;s Plan
          </h3>
          {dayItems.length > 0 && (
            <span className="text-xs font-medium text-[#13251d]/55">
              {completedDayItems} of {dayItems.length} done
            </span>
          )}
        </div>
        <p className="text-xs text-[#13251d]/55">
          Each item is a full topic, shown with its place in the beta sequence
          and the reviewed PYQs mapped to it. Open it to read, recall,
          practise, and finish the report; the tick here follows your recorded
          progress, not a manual checkbox.
        </p>
        {dayItems.length === 0 ? (
          <div className="space-y-2 py-4">
            <p className="text-sm text-[#13251d]/60">No items planned for today.</p>
            <Link
              href={`${lmsBase}/syllabus`}
              className="text-sm font-medium text-[#1d9e75] hover:underline"
            >
              Open the syllabus to see what is next →
            </Link>
          </div>
        ) : (
          dayItems.map((item, idx) => {
            const dest =
              item.item_type === "retro"
                ? `${lmsBase}/retro`
                : item.item_type === "practice"
                  ? `${lmsBase}/practice`
                  : `${lmsBase}/topic/${item.node_id}`;
            const typeLabel =
              item.item_type === "retro"
                ? "Weekly retrospective"
                : item.item_type === "practice"
                  ? "Practice"
                  : "Topic";
            const context = planItemContext(item);
            return (
              <button
                key={`${item.node_id}-${item.item_type}-${idx}`}
                onClick={() => router.push(dest)}
                className={`w-full text-left flex items-center gap-3 p-2.5 md:p-3 rounded-lg border transition-colors ${
                  item.item_type === "retro"
                    ? "border-[#1d9e75]/30 bg-[#e7f5ee] hover:border-[#1d9e75]"
                    : "border-[#dcd5c7] bg-white hover:border-[#1d9e75]/40"
                }`}
              >
                <span
                  className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${
                    item.completed
                      ? "bg-[#1d9e75] border-[#1d9e75] text-white"
                      : item.item_type === "retro"
                        ? "border-[#1d9e75] text-[#1d9e75]"
                        : "border-[#dcd5c7]"
                  }`}
                >
                  {item.completed ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : item.item_type === "retro" ? (
                    <span className="text-[10px]">📝</span>
                  ) : null}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${item.completed ? "text-[#13251d]/50 line-through" : "text-[#1a3a2a]"}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-[#13251d]/40">
                    {typeLabel}
                    {context ? ` · ${context}` : ""}
                  </p>
                </div>
              </button>
            );
          })
        )}
        {allDayItemsDone && (
          <p className="rounded-lg border border-[#b9d9cd] bg-[#f3faf6] px-3 py-2 text-xs text-[#1a3a2a]">
            Everything planned for today is recorded. The next plan opens
            tomorrow; use the remaining time for a quick recall or practice.
          </p>
        )}
      </div>

      {/* Weekly review + replan */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={handleReplan}
          disabled={replanning}
          className="px-4 py-2 text-sm font-medium text-[#1a3a2a] border border-[#dcd5c7] hover:border-[#1d9e75] rounded-lg transition-colors disabled:opacity-50"
        >
          {replanning ? "Replanning…" : "Replan"}
        </button>
        <Link
          href={`${lmsBase}/retro`}
          className="text-sm font-medium text-[#1d9e75] hover:underline"
        >
          Open weekly retrospective →
        </Link>
      </div>
    </div>
  );
}
