"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, RefreshCw, BookOpen, Target, Bell } from "lucide-react";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { DailyPlanOut, PlanItemOut } from "@/services/api/gsLmsService";
import { useApiConfig } from "@/lib/hooks/useApi";

interface RecallGateState {
  recall_needed: boolean;
  topic_id: number | null;
  topic_title: string | null;
  concepts: string[] | null;
}

/**
 * LMS Home Summary — Backend-connected section shown at top of the student
 * home dashboard. Shows today's LMS plan, streak, recall gate, and quick
 * navigation to the GS LMS.
 *
 * This is ADDITIVE to the existing UpscDailyMissionControl — placed above
 * the existing localStorage-based sections. Falls back gracefully if the
 * backend is unreachable (shows nothing, doesn't break the page).
 */
export function LmsHomeSummary() {
  const { isLoaded, isSignedIn } = useApiConfig();
  const [plan, setPlan] = useState<DailyPlanOut | null>(null);
  const [recallGate, setRecallGate] = useState<RecallGateState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    Promise.all([
      gsLmsService.getTodayPlan("geography").catch(() => null),
      gsLmsService.checkRecallGate("geography").catch(() => null),
    ])
      .then(([planData, gateData]) => {
        setPlan(planData);
        setRecallGate(gateData);
      })
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn]);

  // Don't show anything while loading or if backend is unreachable
  if (loading || (!plan && !recallGate)) return null;

  const streakDays = plan?.streak_days ?? 0;
  const completedCount = plan?.completed_count ?? 0;
  const totalItems = plan?.planned_items?.length ?? 0;
  const pendingItems = (plan?.planned_items ?? []).filter((item) => !item.completed);
  const hasRecallDue = recallGate?.recall_needed === true;

  return (
    <section className="rounded-2xl border border-[#b9d9cd] bg-gradient-to-br from-[#e7f5ee] to-[#fffdf8] p-5 shadow-sm md:p-6">
      {/* Header: Streak + Progress */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#ef9f27]">
            <Flame className="h-5 w-5" />
            <span className="text-lg font-black">{streakDays}</span>
            <span className="text-xs font-bold text-[#6f4a12]">day streak</span>
          </div>
          {plan?.projected_completion_date && (
            <span className="text-xs font-semibold text-[#536259]">
              · Finish by{" "}
              {new Date(plan.projected_completion_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>
        <Link
          href="/upsc/geography/lms/planner"
          className="text-xs font-bold text-[#1d9e75] hover:text-[#178a65] transition"
        >
          Full planner →
        </Link>
      </div>

      {/* Recall Gate Banner */}
      {hasRecallDue && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#ef9f27]/40 bg-[#fff4df] p-3">
          <Bell className="mt-0.5 h-4 w-4 text-[#ef9f27] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#6f4a12]">
              Quick recall before today&apos;s plan
            </p>
            <p className="text-xs text-[#6f4a12]/70 mt-0.5 truncate">
              Yesterday: {recallGate?.topic_title}
              {recallGate?.concepts && ` · ${recallGate.concepts.join(", ")}`}
            </p>
          </div>
          <Link
            href="/upsc/geography/lms/planner"
            className="shrink-0 px-3 py-1.5 text-xs font-bold text-white bg-[#ef9f27] rounded-lg hover:bg-[#d98c1e] transition"
          >
            Recall
          </Link>
        </div>
      )}

      {/* Today's Plan Items */}
      {pendingItems.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
            Today&apos;s plan ({completedCount}/{totalItems} done)
          </p>
          {pendingItems.slice(0, 3).map((item, idx) => (
            <PlanItemRow key={`${item.node_id}-${item.item_type}-${idx}`} item={item} />
          ))}
          {pendingItems.length > 3 && (
            <p className="text-xs font-semibold text-[#536259]">
              +{pendingItems.length - 3} more items in planner
            </p>
          )}
        </div>
      ) : plan ? (
        <div className="flex items-center gap-2 py-2">
          <Target className="h-4 w-4 text-[#1d9e75]" />
          <p className="text-sm font-bold text-[#085041]">
            All done for today! 🎉 Come back tomorrow.
          </p>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/upsc/geography/lms"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#1a3a2a] rounded-lg hover:bg-[#10291d] transition"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Continue GS
          <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          href="/upsc/current-affairs"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#1a3a2a] border border-[#dcd5c7] bg-white rounded-lg hover:border-[#1d9e75] transition"
        >
          Current Affairs
        </Link>
        <Link
          href="/upsc/geography/lms/gaps"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#1a3a2a] border border-[#dcd5c7] bg-white rounded-lg hover:border-[#1d9e75] transition"
        >
          View Gaps
        </Link>
      </div>
    </section>
  );
}

function PlanItemRow({ item }: { item: PlanItemOut }) {
  const isRevisit = item.item_type === "revisit";
  const isRetro = item.item_type === "retro";

  const icon = isRevisit ? (
    <RefreshCw className="h-3.5 w-3.5 text-[#ef9f27]" />
  ) : isRetro ? (
    <span className="text-xs">📝</span>
  ) : (
    <BookOpen className="h-3.5 w-3.5 text-[#1d9e75]" />
  );

  const dest = isRetro
    ? "/upsc/geography/lms/retro"
    : isRevisit
      ? `/upsc/geography/lms/topic/${item.node_id}?mode=revisit`
      : item.item_type === "practice"
        ? "/upsc/geography/lms/practice"
        : `/upsc/geography/lms/topic/${item.node_id}`;

  return (
    <Link
      href={dest}
      className={`flex items-center gap-3 rounded-lg border p-3 transition hover:-translate-y-0.5 ${
        isRevisit
          ? "border-[#ef9f27]/30 bg-[#fff8e8] hover:border-[#ef9f27]"
          : "border-[#dcd5c7] bg-white hover:border-[#1d9e75]"
      }`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f7f4ee]">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#13251d] truncate">{item.title}</p>
        <p className="text-[10px] font-semibold text-[#536259] uppercase">
          {item.item_type}
          {isRevisit && item.overdue && <span className="text-[#ef9f27] ml-1">· Overdue</span>}
        </p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-[#536259] shrink-0" />
    </Link>
  );
}
