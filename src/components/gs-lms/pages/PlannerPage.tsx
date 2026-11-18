"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PlannerUI } from "../PlannerUI";
import { gsLmsService } from "@/services/api/gsLmsService";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useSubjectLms } from "../SubjectLmsContext";

interface RecallGateState {
  recall_needed: boolean;
  topic_id: number | null;
  topic_title: string | null;
  concepts: string[] | null;
}

function RecallGateBanner({
  gate,
  onClear,
}: {
  gate: RecallGateState;
  onClear: () => void;
}) {
  const [clearing, setClearing] = useState(false);
  const { subject, lmsBase } = useSubjectLms();

  const handleClear = async () => {
    if (!gate.topic_id) return;
    setClearing(true);
    try {
      await gsLmsService.clearRecallGate(subject, gate.topic_id);
      onClear();
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-[#ef9f27]/40 bg-[#fff4df] p-4 sm:p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-xl sm:text-2xl mt-0.5" aria-hidden="true">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#6f4a12]">
            Quick Recall before you start
          </p>
          <p className="text-sm text-[#6f4a12]/90 mt-1">
            Recall yesterday&apos;s topic:{" "}
            <span className="font-semibold text-[#5a3b0a]">{gate.topic_title}</span>
          </p>
          {gate.concepts && gate.concepts.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {gate.concepts.map((concept, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#ef9f27]/20 text-[#6f4a12]"
                >
                  {concept}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleClear}
              disabled={clearing}
              className="min-h-11 inline-flex items-center justify-center px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#ef9f27] hover:bg-[#d98c1e] active:scale-[0.98] rounded-lg transition-all disabled:opacity-50 shadow-sm"
            >
              {clearing ? "Marking done…" : "✓ Done — I recalled it"}
            </button>
            {gate.topic_id && (
              <Link
                href={`${lmsBase}/topic/${gate.topic_id}`}
                className="min-h-11 inline-flex items-center justify-center px-4 py-2.5 text-xs sm:text-sm font-bold text-[#6f4a12] border border-[#ef9f27]/50 hover:bg-[#ef9f27]/10 active:scale-[0.98] rounded-lg transition-all"
              >
                Review topic first →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlannerPage() {
  const { isLoaded, isSignedIn } = useApiConfig();
  const { subject } = useSubjectLms();
  const [gate, setGate] = useState<RecallGateState | null>(null);
  const [failedSubject, setFailedSubject] = useState<string | null>(null);
  const recallRequestRef = useRef(0);
  // The failure is recorded against the subject that failed, so switching
  // subject cannot show the previous subject's error and the loader does not
  // have to clear state before it starts.
  const recallGateError =
    failedSubject === subject ? "Recall check unavailable. Please retry." : null;

  // Writes happen inside promise callbacks so they are provably asynchronous,
  // and the request id stops a slow response for a previous subject from
  // overwriting the current one.
  const fetchRecallGate = useCallback(() => {
    const requestId = ++recallRequestRef.current;

    gsLmsService
      .checkRecallGate(subject)
      .then((nextGate) => {
        if (requestId !== recallRequestRef.current) return;
        setGate(nextGate);
        setFailedSubject(null);
      })
      .catch(() => {
        if (requestId !== recallRequestRef.current) return;
        setGate(null);
        setFailedSubject(subject);
      });
  }, [subject]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetchRecallGate();
    return () => {
      recallRequestRef.current += 1;
    };
  }, [isLoaded, isSignedIn, fetchRecallGate]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a3a2a]">
          Daily Planner
        </h1>
      </div>
      {recallGateError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{recallGateError}</p>
          <button
            type="button"
            onClick={fetchRecallGate}
            className="mt-3 min-h-11 px-4 py-2 inline-flex items-center justify-center rounded-lg bg-red-800 text-xs sm:text-sm font-bold text-white transition hover:bg-red-900"
          >
            Retry recall check
          </button>
        </div>
      )}
      {gate?.recall_needed && (
        <RecallGateBanner gate={gate} onClear={() => setGate(null)} />
      )}
      <PlannerUI />
    </div>
  );
}
