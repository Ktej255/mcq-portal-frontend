"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { DailyPlanOut } from "@/services/api/gsLmsService";
import { LmsLoadingSkeleton } from "./LmsLoadingSkeleton";

export function PlannerUI() {
  const router = useRouter();
  const [plan, setPlan] = useState<DailyPlanOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bandwidth, setBandwidthVal] = useState<number>(3);
  const [updating, setUpdating] = useState(false);
  const [replanning, setReplanning] = useState(false);

  useEffect(() => {
    gsLmsService
      .getTodayPlan()
      .then((data) => {
        setPlan(data);
        setBandwidthVal(data.bandwidth);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load plan")
      )
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateBandwidth = async () => {
    setUpdating(true);
    try {
      const updated = await gsLmsService.setBandwidth(bandwidth);
      setPlan(updated);
    } catch {
      // revert
    } finally {
      setUpdating(false);
    }
  };

  const handleReplan = async () => {
    setReplanning(true);
    try {
      await gsLmsService.replan();
      const refreshed = await gsLmsService.getTodayPlan();
      setPlan(refreshed);
    } catch {
      // silent
    } finally {
      setReplanning(false);
    }
  };

  if (loading) return <LmsLoadingSkeleton variant="list" />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!plan) return null;

  return (
    <div className="space-y-6">
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
              Projected completion:{" "}
              {new Date(plan.projected_completion_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-orange-500">
          <span className="text-lg">🔥</span>
          <span className="text-sm font-semibold">{plan.streak_days} day streak</span>
        </div>
      </div>

      {/* Bandwidth selector */}
      <div className="flex items-center gap-3 p-4 rounded-lg border border-[#dcd5c7] bg-white">
        <label className="text-sm text-[#13251d]/70">Daily bandwidth:</label>
        <input
          type="number"
          min={1}
          max={20}
          value={bandwidth}
          onChange={(e) => setBandwidthVal(Number(e.target.value))}
          className="w-16 px-2 py-1.5 text-sm border border-[#dcd5c7] rounded-lg text-center focus:border-[#1d9e75] outline-none"
        />
        <span className="text-xs text-[#13251d]/50">items/day</span>
        <button
          onClick={handleUpdateBandwidth}
          disabled={updating || bandwidth === plan.bandwidth}
          className="ml-auto px-3 py-1.5 text-xs font-medium text-white bg-[#1d9e75] hover:bg-[#178a65] rounded-lg disabled:opacity-50 transition-colors"
        >
          {updating ? "Saving…" : "Update"}
        </button>
      </div>

      {/* Planned items checklist */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[#1a3a2a] uppercase tracking-wide">
          Today&apos;s Plan
        </h3>
        {plan.planned_items.length === 0 ? (
          <p className="text-sm text-[#13251d]/50 py-4">No items planned for today.</p>
        ) : (
          plan.planned_items.map((item) => (
            <button
              key={`${item.node_id}-${item.item_type}`}
              onClick={() =>
                router.push(
                  item.item_type === "practice"
                    ? "/upsc/geography/lms/practice"
                    : `/upsc/geography/lms/topic/${item.node_id}`
                )
              }
              className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-[#dcd5c7] bg-white hover:border-[#1d9e75]/40 transition-colors"
            >
              <span
                className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${
                  item.completed
                    ? "bg-[#1d9e75] border-[#1d9e75] text-white"
                    : "border-[#dcd5c7]"
                }`}
              >
                {item.completed && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <div>
                <p className={`text-sm ${item.completed ? "text-[#13251d]/50 line-through" : "text-[#1a3a2a]"}`}>
                  {item.title}
                </p>
                <p className="text-xs text-[#13251d]/40 capitalize">{item.item_type}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Replan button */}
      <div className="pt-2">
        <button
          onClick={handleReplan}
          disabled={replanning}
          className="px-4 py-2 text-sm font-medium text-[#1a3a2a] border border-[#dcd5c7] hover:border-[#1d9e75] rounded-lg transition-colors disabled:opacity-50"
        >
          {replanning ? "Replanning…" : "Replan"}
        </button>
      </div>
    </div>
  );
}
