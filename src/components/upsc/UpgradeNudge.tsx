"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, X } from "lucide-react";

import { evaluateUpgradePrompt, type UpgradeSignals } from "@/lib/upsc/entitlements";

const DISMISS_PREFIX = "sarit-upgrade-dismissed-";
const COOLDOWN_DAYS = 6;

function isDismissed(id: string): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_PREFIX + id);
    if (!raw) return false;
    const until = Number(raw);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

function dismiss(id: string) {
  try {
    localStorage.setItem(DISMISS_PREFIX + id, String(Date.now() + COOLDOWN_DAYS * 86400_000));
  } catch {
    // ignore
  }
}

/**
 * Contextual upgrade nudge. Pass current usage/billing signals; it renders the
 * single most relevant prompt (tier or cycle) or nothing. Dismissals are
 * frequency-capped per prompt id so users aren't nagged. Reuse this as a banner
 * (default) anywhere in the dashboard; show as a modal by wrapping if desired.
 */
export function UpgradeNudge({ signals, href = "/pricing" }: { signals: UpgradeSignals; href?: string }) {
  const suggestion = evaluateUpgradePrompt(signals);
  const [hidden, setHidden] = useState(() => (suggestion ? isDismissed(suggestion.id) : true));

  if (!suggestion || hidden) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#ef9f27]/40 bg-[#fff7e9] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1a3a2a] text-[#ef9f27]">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-black text-[#13251d]">{suggestion.title}</p>
          <p className="mt-0.5 text-sm font-semibold leading-5 text-[#7a5a18]">{suggestion.body}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={href}
          className="inline-flex h-9 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
        >
          {suggestion.kind === "cycle" ? "See savings" : "Upgrade"}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            dismiss(suggestion.id);
            setHidden(true);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-md text-[#8c5d14] transition hover:bg-[#fbe9c9]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
