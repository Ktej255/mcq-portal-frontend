"use client";

import { useEffect, useState } from "react";

import { readStudentProfile } from "@/lib/upsc/studentProfile";
import { getMcqUsedToday } from "@/lib/upsc/dailyUsage";
import { UpgradeNudge } from "@/components/upsc/UpgradeNudge";
import type { EntitlementTier } from "@/lib/upsc/entitlements";

/**
 * Self-contained: reads the student's tier + today's MCQ usage on mount and
 * renders the contextual upgrade nudge when the daily cap is reached. Drop it
 * above any practice surface; it renders nothing until the cap matters.
 */
export function McqUsageNudge() {
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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-8">
      <UpgradeNudge signals={{ tier: state.tier, mcqUsedToday: state.used, billingCycle: "monthly" }} />
    </div>
  );
}
