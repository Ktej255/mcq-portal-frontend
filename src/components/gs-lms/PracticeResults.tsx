"use client";

import Link from "next/link";

import type { PracticeResultOut } from "@/services/api/gsLmsService";
import { useSubjectLms } from "./SubjectLmsContext";

interface PracticeResultsProps {
  result: PracticeResultOut;
  /** Topic this session belongs to, used for the next-step links. */
  nodeId?: number;
}

export function PracticeResults({ result, nodeId }: PracticeResultsProps) {
  const { lmsBase } = useSubjectLms();
  const scorePercent =
    result.total_questions > 0
      ? Math.round((result.correct_count / result.total_questions) * 100)
      : 0;

  const weakestType = result.type_accuracy
    .filter((ta) => ta.total > 0 && ta.accuracy < 0.6)
    .sort((a, b) => a.accuracy - b.accuracy)[0];

  const nextStep =
    scorePercent >= 80
      ? {
          label: "Strong recall",
          body: "You can move on. Schedule this topic for a spaced revisit so the recall holds, then pick the next topic in your planner.",
        }
      : scorePercent >= 60
        ? {
            label: "Close, but not secure",
            body: "Re-read the sections behind the questions you missed, then retry this set before starting a new topic.",
          }
        : {
            label: "Full revision needed",
            body: "Do not move on yet. Re-read the Basic and Advanced sections of this topic, then retry the set; your readiness report will keep this topic marked as weak until the evidence improves.",
          };

  return (
    <div className="p-6 space-y-8">
      {/* Score header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-4xl font-bold text-[#1a3a2a]">Practice Complete</h2>
        <div className="inline-flex items-baseline gap-1">
          <span className="text-2xl md:text-4xl font-bold text-[#1d9e75]">
            {result.correct_count}
          </span>
          <span className="text-lg text-[#13251d]/60">
            / {result.total_questions} correct
          </span>
        </div>
        <p className="text-sm text-[#13251d]/60">Score: {scorePercent}%</p>
      </div>

      {/* What to do next — the result must change the plan, not just report it. */}
      <div className="rounded-xl border border-[#b9d9cd] bg-[#f3faf6] p-4 space-y-2">
        <h3 className="text-sm font-semibold text-[#085041]">{nextStep.label}</h3>
        <p className="text-sm text-[#1a3a2a]">{nextStep.body}</p>
        {weakestType && (
          <p className="text-xs text-[#49675e]">
            Weakest question type:{" "}
            <span className="font-semibold">
              {weakestType.question_type.replace(/_/g, " ")}
            </span>{" "}
            ({Math.round(weakestType.accuracy * 100)}% of {weakestType.total}).
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {nodeId !== undefined && (
            <Link
              href={`${lmsBase}/topic/${nodeId}`}
              className="rounded-lg border border-[#b9d9cd] bg-white px-3 py-1.5 text-xs font-bold text-[#1d9e75] transition hover:bg-[#e7f5ee]"
            >
              Re-read this topic
            </Link>
          )}
          <Link
            href={`${lmsBase}/planner`}
            className="rounded-lg bg-[#1d9e75] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#167a5b]"
          >
            Open today&apos;s plan
          </Link>
        </div>
      </div>

      {/* Per-question results */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#1a3a2a] uppercase tracking-wide">
          Question Breakdown
        </h3>
        {result.attempts.map((attempt, idx) => (
          <div
            key={attempt.question_id}
            className={`rounded-lg border p-3 md:p-4 ${
              attempt.is_correct
                ? "border-[#1d9e75]/30 bg-[#1d9e75]/5"
                : attempt.chosen_answer === null
                ? "border-[#dcd5c7] bg-[#f7f4ee]"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-medium text-[#13251d]/50">
                Q{idx + 1}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  attempt.is_correct
                    ? "text-[#1d9e75] bg-[#1d9e75]/10"
                    : attempt.chosen_answer === null
                    ? "text-[#13251d]/50 bg-[#dcd5c7]/50"
                    : "text-red-600 bg-red-100"
                }`}
              >
                {attempt.is_correct
                  ? "Correct"
                  : attempt.chosen_answer === null
                  ? "Skipped"
                  : "Incorrect"}
              </span>
            </div>
            <div className="mt-2 text-xs text-[#13251d]/60 space-y-1">
              {attempt.chosen_answer && (
                <p>Your answer: <strong>{attempt.chosen_answer}</strong></p>
              )}
              <p>Correct answer: <strong>{attempt.correct_answer}</strong></p>
              {attempt.explanation && (
                <p className="mt-1 text-[#13251d]/70">{attempt.explanation}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Per-type accuracy breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#1a3a2a] uppercase tracking-wide">
          Accuracy by Question Type
        </h3>
        {result.type_accuracy.map((ta) => {
          const pct = Math.round(ta.accuracy * 100);
          return (
            <div key={ta.question_type} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#13251d]/70">
                  {ta.question_type.replace(/_/g, " ")}
                </span>
                <span className="font-medium text-[#1a3a2a]">
                  {ta.correct}/{ta.total} ({pct}%)
                </span>
              </div>
              <div className="h-2 bg-[#dcd5c7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1d9e75] rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
