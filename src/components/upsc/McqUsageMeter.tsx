"use client";

import { useEffect, useState } from "react";

import { readStudentProfile } from "@/lib/upsc/studentProfile";
import { getMcqUsedToday } from "@/lib/upsc/dailyUsage";
import { getEntitlements, TIER_LABEL, type EntitlementTier } from "@/lib/upsc/entitlements";

/**
 * Compact "X / cap MCQs today" usage meter for the practice surfaces.
 * Reads the student's tier + today's usage on mount; shows "Unlimited" for
 * Pro/Ultimate and turns amber at the cap.
 */
export function McqUsageMeter() {
  const [state, setState] = useState<{ tier: EntitlementTier; used: number } | null>(null);

  useEffect(() => {
    let tier: EntitlementTier = "free";
    try {
      const profile = readStudentProfile();
      if (profile?.subscriptionPlanId) tier = profile.subscriptionPlanId as EntitlementTier;
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe client read after mount
    setState({ tier, used: getMcqUsedToday() });
  }, []);

  if (!state) return null;

  const ent = getEntitlements(state.tier);
  const limit = ent.dailyMcqLimit; // null = unlimited
  const used = state.used;
  const atCap = limit !== null && used >= limit;
  const pct = limit === null ? 100 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));

  return (
    <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">Daily MCQs · {TIER_LABEL[state.tier]}</span>
        <span className="text-sm font-black text-[#13251d]">
          {limit === null ? `${used} · Unlimited` : `${used} / ${limit}`}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#e1d8ca]">
        <div
          className={`h-full rounded-full transition-all duration-300 ${atCap ? "bg-[#ef9f27]" : "bg-[#1d9e75]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {atCap && limit !== null ? (
        <p className="mt-2 text-xs font-bold text-[#8c5d14]">You&apos;ve hit today&apos;s limit — upgrade for more daily practice.</p>
      ) : null}
    </div>
  );
}
