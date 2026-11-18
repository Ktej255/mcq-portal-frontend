"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
    <div className="mb-6 rounded-xl border border-[#ef9f27]/40 bg-[#fff4df] p-4">
      <div className="flex items-start gap-3">
        <span className="text-lg">🔔</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#6f4a12]">
            Quick Recall before you start
          </p>
          <p className="text-sm text-[#6f4a12]/80 mt-1">
            Recall yesterday&apos;s topic:{" "}
            <span className="font-medium">{gate.topic_title}</span>
          </p>
          {gate.concepts && gate.concepts.length > 0 && (
            <p className="text-xs text-[#6f4a12]/70 mt-1.5">
              Key concepts: {gate.concepts.join(" · ")}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleClear}
              disabled={clearing}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#ef9f27] hover:bg-[#d98c1e] rounded-lg transition-colors disabled:opacity-50"
            >
              {clearing ? "Marking done…" : "Done — I recalled it"}
            </button>
            <button
              onClick={() =>
                gate.topic_id &&
                window.open(`${lmsBase}/topic/${gate.topic_id}`, "_self")
              }
              className="px-3 py-1.5 text-xs font-medium text-[#6f4a12] border border-[#ef9f27]/40 hover:bg-[#ef9f27]/10 rounded-lg transition-colors"
            >
              Review topic first
            </button>
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
    <div className="p-6">
      <h1 className="text-xl font-semibold text-[#1a3a2a] mb-6">
        Daily Planner
      </h1>
      {recallGateError && (
        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{recallGateError}</p>
          <button
            type="button"
            onClick={fetchRecallGate}
            className="mt-3 rounded-lg bg-red-800 px-3 py-1.5 text-xs font-semibold text-white"
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
