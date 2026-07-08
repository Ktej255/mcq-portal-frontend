"use client";

import { useEffect, useState } from "react";
import { PlannerUI } from "@/components/gs-lms/PlannerUI";
import { gsLmsService } from "@/services/api/gsLmsService";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useSubjectLms } from "@/components/gs-lms/SubjectLmsContext";

interface RecallGateState {
  recall_needed: boolean;
  topic_id: number | null;
  topic_title: string | null;
  concepts: string[] | null;
}

function RecallGateBanner({
  gate,
  onClear,
  subject,
  lmsBase,
}: {
  gate: RecallGateState;
  onClear: () => void;
  subject: string;
  lmsBase: string;
}) {
  const [clearing, setClearing] = useState(false);

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
                window.open(
                  `${lmsBase}/topic/${gate.topic_id}`,
                  "_self"
                )
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

export default function PlannerPage() {
  const { isLoaded, isSignedIn } = useApiConfig();
  const { subject, lmsBase } = useSubjectLms();
  const [gate, setGate] = useState<RecallGateState | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    gsLmsService
      .checkRecallGate(subject)
      .then(setGate)
      .catch(() => setGate(null));
  }, [isLoaded, isSignedIn, subject]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-[#1a3a2a] mb-6">
        Daily Planner
      </h1>
      {gate?.recall_needed && (
        <RecallGateBanner
          gate={gate}
          onClear={() => setGate(null)}
          subject={subject}
          lmsBase={lmsBase}
        />
      )}
      <PlannerUI />
    </div>
  );
}
