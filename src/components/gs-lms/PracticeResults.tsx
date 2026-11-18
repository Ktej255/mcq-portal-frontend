"use client";

import { useState } from "react";
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
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'correct' | 'skipped'>('all');

  const scorePercent =
    result.total_questions > 0
      ? Math.round((result.correct_count / result.total_questions) * 100)
      : 0;

  const incorrectCount = result.attempts.filter((a) => a.is_correct === false && a.chosen_answer !== null).length;
  const skippedCount = result.attempts.filter((a) => a.chosen_answer === null).length;
  const correctCount = result.correct_count;

  const filteredAttempts = result.attempts.filter((attempt) => {
    if (filter === 'incorrect') return attempt.is_correct === false && attempt.chosen_answer !== null;
    if (filter === 'correct') return attempt.is_correct === true;
    if (filter === 'skipped') return attempt.chosen_answer === null;
    return true;
  });

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
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Score header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1a3a2a]">Practice Complete</h2>
        <div className="inline-flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-extrabold text-[#1d9e75]">
            {result.correct_count}
          </span>
          <span className="text-base sm:text-lg text-[#13251d]/60 font-semibold">
            / {result.total_questions} correct
          </span>
        </div>
        <p className="text-sm font-semibold text-[#13251d]/70">Score: {scorePercent}%</p>
      </div>

      {/* What to do next */}
      <div className="rounded-xl border border-[#b9d9cd] bg-[#f3faf6] p-4 sm:p-5 space-y-2.5 shadow-2xs">
        <h3 className="text-sm font-bold text-[#085041]">{nextStep.label}</h3>
        <p className="text-xs sm:text-sm text-[#1a3a2a] leading-relaxed">{nextStep.body}</p>
        {weakestType && (
          <p className="text-xs text-[#49675e]">
            Weakest question type:{" "}
            <span className="font-bold text-[#1a3a2a]">
              {weakestType.question_type.replace(/_/g, " ")}
            </span>{" "}
            ({Math.round(weakestType.accuracy * 100)}% of {weakestType.total}).
          </p>
        )}
        <div className="flex flex-wrap gap-2.5 pt-2">
          {nodeId !== undefined && (
            <Link
              href={`${lmsBase}/topic/${nodeId}`}
              className="min-h-11 inline-flex items-center justify-center rounded-xl border border-[#b9d9cd] bg-white px-4 py-2 text-xs sm:text-sm font-bold text-[#085041] shadow-2xs transition hover:bg-[#e7f5ee] active:scale-[0.98]"
            >
              📖 Re-read this topic
            </Link>
          )}
          <Link
            href={`${lmsBase}/planner`}
            className="min-h-11 inline-flex items-center justify-center rounded-xl bg-[#1d9e75] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-[#167a5b] active:scale-[0.98]"
          >
            📅 Open today&apos;s plan
          </Link>
        </div>
      </div>

      {/* Per-question results with Filter Chips */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h3 className="text-xs sm:text-sm font-bold text-[#1a3a2a] uppercase tracking-wider">
            Question Breakdown
          </h3>
          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-[#f7f4ee] rounded-xl border border-[#dcd5c7]">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`min-h-9 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-white text-[#1a3a2a] shadow-xs border border-[#dcd5c7]'
                  : 'text-[#13251d]/60 hover:text-[#1a3a2a]'
              }`}
            >
              All ({result.total_questions})
            </button>
            <button
              type="button"
              onClick={() => setFilter('incorrect')}
              className={`min-h-9 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                filter === 'incorrect'
                  ? 'bg-red-50 text-red-700 shadow-xs border border-red-200'
                  : 'text-[#13251d]/60 hover:text-red-700'
              }`}
            >
              ❌ Wrong ({incorrectCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('correct')}
              className={`min-h-9 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                filter === 'correct'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200'
                  : 'text-[#13251d]/60 hover:text-emerald-800'
              }`}
            >
              ✅ Correct ({correctCount})
            </button>
            {skippedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter('skipped')}
                className={`min-h-9 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  filter === 'skipped'
                    ? 'bg-gray-100 text-gray-800 shadow-xs border border-gray-300'
                    : 'text-[#13251d]/60 hover:text-gray-800'
                }`}
              >
                ⏭️ Skipped ({skippedCount})
              </button>
            )}
          </div>
        </div>

        {filteredAttempts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#dcd5c7] bg-white p-6 text-center text-xs sm:text-sm text-[#13251d]/60">
            No questions match this filter.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredAttempts.map((attempt, idx) => (
              <div
                key={attempt.question_id}
                className={`rounded-xl border p-3.5 sm:p-4 shadow-2xs ${
                  attempt.is_correct
                    ? "border-[#1d9e75]/30 bg-[#e7f5ee]/40"
                    : attempt.chosen_answer === null
                    ? "border-[#dcd5c7] bg-[#f7f4ee]"
                    : "border-red-200 bg-red-50/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-bold text-[#13251d]/70">
                    Question #{idx + 1}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      attempt.is_correct
                        ? "text-[#085041] bg-[#e7f5ee] border border-[#1d9e75]/30"
                        : attempt.chosen_answer === null
                        ? "text-[#13251d]/60 bg-[#dcd5c7]/50"
                        : "text-red-700 bg-red-100 border border-red-200"
                    }`}
                  >
                    {attempt.is_correct
                      ? "✓ Correct"
                      : attempt.chosen_answer === null
                      ? "Skipped"
                      : "✕ Incorrect"}
                  </span>
                </div>
                <div className="mt-2.5 text-xs sm:text-sm text-[#13251d]/75 space-y-1">
                  {attempt.chosen_answer && (
                    <p>Your answer: <strong className={attempt.is_correct ? "text-[#085041]" : "text-red-700"}>{attempt.chosen_answer}</strong></p>
                  )}
                  <p>Correct answer: <strong className="text-[#085041]">{attempt.correct_answer}</strong></p>
                  {attempt.explanation && (
                    <div className="mt-2 p-2.5 rounded-lg bg-white border border-[#dcd5c7]/60 text-xs text-[#13251d]/85 leading-relaxed">
                      <span className="font-bold text-[#1a3a2a]">Explanation: </span>
                      {attempt.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-type accuracy breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-[#1a3a2a] uppercase tracking-wider">
          Accuracy by Question Type
        </h3>
        <div className="space-y-2">
          {result.type_accuracy.map((ta) => {
            const pct = Math.round(ta.accuracy * 100);
            return (
              <div key={ta.question_type} className="rounded-lg border border-[#dcd5c7] bg-white p-3 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#13251d]">
                    {ta.question_type.replace(/_/g, " ")}
                  </span>
                  <span className={`font-bold ${pct >= 60 ? "text-[#085041]" : "text-red-600"}`}>
                    {ta.correct}/{ta.total} ({pct}%)
                  </span>
                </div>
                <div className="h-2 bg-[#dcd5c7]/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct >= 60 ? "bg-[#1d9e75]" : "bg-red-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
