"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useProgression } from "@/hooks/useProgression";
import { useSubjectLms } from "./SubjectLmsContext";

/**
 * Shown instead of a topic the student isn't allowed into yet (HTTP 423).
 * `reason` is the server's message, which names the topic or test to finish.
 */
export function LockedTopicScreen({ reason, nodeId }: { reason: string; nodeId?: number }) {
  const { subject, lmsBase } = useSubjectLms();
  const { progression } = useProgression(subject);

  const dueCheckpoint = progression?.due_checkpoint ?? null;
  const nextLeaf = progression?.next_leaf ?? null;
  const showNext = nextLeaf && nextLeaf.node_id !== nodeId;

  const linkClass =
    "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-5 py-2.5 text-sm font-black text-white";

  return (
    <div className="p-6">
      <div
        data-testid="topic-locked"
        className="mx-auto max-w-lg rounded-2xl border border-[#dcd5c7] bg-white p-8 text-center space-y-4"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f4ee]">
          <Lock className="h-6 w-6 text-[#5d675f]" aria-hidden />
        </div>
        <h1 className="text-lg font-black text-[#1a3a2a]">This topic is locked</h1>
        <p data-testid="topic-locked-reason" className="text-sm leading-relaxed text-[#49675e]">
          {reason}
        </p>
        <div className="flex flex-col items-center gap-2 pt-2">
          {dueCheckpoint ? (
            <Link href={`${lmsBase}/checkpoint/${dueCheckpoint.checkpoint_id}`} className={linkClass}>
              Take review test
            </Link>
          ) : showNext ? (
            <Link href={`${lmsBase}/topic/${nextLeaf.node_id}`} className={linkClass}>
              Go to {nextLeaf.title}
            </Link>
          ) : null}
          <Link href={`${lmsBase}/syllabus`} className="text-xs font-bold text-[#1d9e75] hover:underline">
            Back to syllabus
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LockedTopicScreen;
