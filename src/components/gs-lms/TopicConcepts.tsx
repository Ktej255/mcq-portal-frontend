"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, Circle } from "lucide-react";
import { gsLmsService, type TopicConceptsOut } from "@/services/api/gsLmsService";

const STATUS_UI = {
  PASSED: { label: "Passed", icon: CheckCircle2, tone: "text-[#1d9e75]", pill: "bg-[#e7f5ee] text-[#085041]" },
  LEARNING: { label: "Learning", icon: CircleDashed, tone: "text-amber-600", pill: "bg-amber-50 text-amber-800" },
  NOT_STARTED: { label: "Not started", icon: Circle, tone: "text-[#b9b3a5]", pill: "bg-[#f7f4ee] text-[#5d675f]" },
} as const;

/**
 * Compact checklist of a topic's concepts with the student's status on each.
 * Renders nothing when the topic has no reviewed concepts or the request fails.
 */
export function TopicConcepts({ nodeId, subject = "geography" }: { nodeId: number; subject?: string }) {
  const [data, setData] = useState<TopicConceptsOut | null>(null);

  useEffect(() => {
    let cancelled = false;
    gsLmsService
      .getTopicConcepts(subject, nodeId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [subject, nodeId]);

  if (!data || data.concepts.length === 0) return null;

  return (
    <section
      aria-label="Topic concepts"
      data-testid="topic-concepts"
      className="rounded-xl border border-[#dcd5c7] bg-white px-4 py-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-black uppercase tracking-wide text-[#49675e]">Concepts in this topic</h2>
        <span className="text-[11px] font-bold text-[#5d675f]">
          {data.topic_mastery.passed}/{data.topic_mastery.concepts} passed
        </span>
      </div>
      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
        {data.concepts.map((concept) => {
          const ui = STATUS_UI[concept.mastery.status] ?? STATUS_UI.NOT_STARTED;
          const Icon = ui.icon;
          return (
            <li key={concept.concept_id} className="flex items-center gap-2 text-xs text-[#13251d]">
              <Icon className={`h-3.5 w-3.5 shrink-0 ${ui.tone}`} aria-hidden />
              <span className="flex-1 truncate" title={concept.title}>
                {concept.title}
              </span>
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${ui.pill}`}>{ui.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default TopicConcepts;
