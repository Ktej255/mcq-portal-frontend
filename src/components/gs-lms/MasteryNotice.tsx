"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { gsLmsService } from "@/services/api/gsLmsService";
import { McqLabStep } from "./McqLabStep";
import { useSubjectLms } from "./SubjectLmsContext";
import { useProgression } from "@/hooks/useProgression";

/**
 * For a completed topic that is not mastered yet (best MCQ lab < 60%): says what
 * is needed and lets the student retake the MCQ lab in place. Renders nothing
 * while the topic is mastered or its status is unknown.
 */
export function MasteryNotice({ nodeId }: { nodeId: number }) {
  const { subject, lmsBase } = useSubjectLms();
  const { progression, orderEnforced, refresh } = useProgression(subject);
  const [mastered, setMastered] = useState<boolean | null>(null);
  const [retaking, setRetaking] = useState(false);
  const [retakeKey, setRetakeKey] = useState(0);

  const loadMastery = useCallback(() => {
    gsLmsService
      .getSyllabusNode(subject, nodeId)
      .then((node) => setMastered(node.mastered ?? null))
      .catch(() => setMastered(null));
  }, [subject, nodeId]);

  useEffect(() => {
    loadMastery();
  }, [loadMastery]);

  const handleRetakeDone = () => {
    setRetaking(false);
    loadMastery();
    void refresh();
  };

  if (mastered === null) return null;

  if (mastered) {
    const next = progression?.next_leaf;
    return (
      <div data-testid="mastery-notice" className="mt-4 rounded-xl bg-white/15 p-3 text-sm font-bold">
        Topic mastered.
        {next && next.node_id !== nodeId && (
          <Link href={`${lmsBase}/topic/${next.node_id}`} className="ml-2 underline">
            Next: {next.title}
          </Link>
        )}
      </div>
    );
  }

  if (retaking) {
    return (
      <div className="mt-4 rounded-xl bg-[#fffdf8] p-4 text-left text-[#13251d]">
        <McqLabStep
          key={retakeKey}
          nodeId={nodeId}
          subject={subject}
          completeLabel="Done"
          onComplete={handleRetakeDone}
        />
      </div>
    );
  }

  return (
    <div data-testid="mastery-notice" className="mt-4 rounded-xl bg-amber-50 p-4 text-left text-amber-900">
      <p className="text-sm font-bold">
        {orderEnforced
          ? "Score 60% in the MCQ lab to unlock the next topic"
          : "Score 60% in the MCQ lab to master this topic"}
      </p>
      <button
        type="button"
        onClick={() => {
          setRetakeKey((k) => k + 1);
          setRetaking(true);
        }}
        className="mt-3 rounded-lg bg-[#1a3a2a] px-4 py-2 text-xs font-black text-white"
      >
        Retake MCQ lab
      </button>
    </div>
  );
}

export default MasteryNotice;
