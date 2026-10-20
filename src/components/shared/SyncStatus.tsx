"use client";

import { useSyncExternalStore } from "react";
import { CheckCircle2, CloudOff, Loader2 } from "lucide-react";

import {
  getLearnerSyncStatus,
  learnerSyncStatusEvent,
  type LearnerSyncStatus,
} from "@/lib/upsc/learnerPersistence";

function subscribe(onChange: () => void) {
  window.addEventListener(learnerSyncStatusEvent, onChange);
  return () => window.removeEventListener(learnerSyncStatusEvent, onChange);
}

const serverSnapshot = (): LearnerSyncStatus => "idle";

/** Small header badge: whether the learner's progress has reached their account. */
export function SyncStatus() {
  const status = useSyncExternalStore(subscribe, getLearnerSyncStatus, serverSnapshot);

  if (status === "idle") return null;

  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5d675f]" role="status">
        <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
        <span className="hidden sm:inline">Saving…</span>
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1d7a55]" role="status">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">All progress saved</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900"
      role="status"
      title="Your progress is safe on this device. We'll keep trying to save it to your account."
    >
      <CloudOff className="h-3.5 w-3.5" aria-hidden />
      <span>Not saved yet, retrying</span>
    </span>
  );
}
