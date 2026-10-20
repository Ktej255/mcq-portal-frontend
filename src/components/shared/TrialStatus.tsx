"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

import { apiClient } from "@/services/api/client";

type MyEntitlements = {
  source?: "admin" | "subscription" | "trial" | "open" | "expired";
  paywall_enabled?: boolean;
  trial_days_left?: number | null;
};

/** Header chip for the free trial: days left, or a nudge once it has ended. */
export function TrialStatus() {
  const [me, setMe] = useState<MyEntitlements | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get("entitlements/me")
      .then((res) => {
        if (!cancelled) setMe((res.data?.data ?? null) as MyEntitlements | null);
      })
      .catch(() => {
        /* No chip when the backend can't say. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!me?.paywall_enabled) return null;

  if (me.source === "trial") {
    const days = me.trial_days_left ?? 0;
    return (
      <Link
        href="/upsc/pricing"
        className="hidden items-center gap-1.5 rounded-full border border-[#cfe9dc] bg-[#eefaf4] px-2.5 py-1 text-xs font-semibold text-[#1a3a2a] hover:border-[#1d9e75] sm:inline-flex"
      >
        <Clock className="h-3.5 w-3.5" aria-hidden />
        Free trial · {days} {days === 1 ? "day" : "days"} left
      </Link>
    );
  }

  if (me.source === "expired") {
    return (
      <Link
        href="/upsc/pricing"
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:border-amber-400"
      >
        <Clock className="h-3.5 w-3.5" aria-hidden />
        Trial ended · Choose a plan
      </Link>
    );
  }

  return null;
}
