"use client";

import type { PracticeResultOut } from "@/services/api/gsLmsService";

interface PracticeResultsProps {
  result: PracticeResultOut;
}

export function PracticeResults({ result }: PracticeResultsProps) {
  const scorePercent = Math.round(
    (result.correct_count / result.total_questions) * 100
  );

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
