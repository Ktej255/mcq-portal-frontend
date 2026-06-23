"use client";

import type { PracticeSessionOut } from "@/services/api/gsLmsService";

interface PracticeUIProps {
  session: PracticeSessionOut;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
}

export function PracticeUI({ session, onAnswer, onSkip }: PracticeUIProps) {
  const { current_question, current_index, total_questions } = session;

  if (!current_question) {
    return (
      <div className="p-6 text-center text-sm text-[#13251d]/60">
        No more questions available.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs md:text-sm font-medium text-[#13251d]/70">
          Question {current_index + 1} of {total_questions}
        </span>
        <span className="text-xs text-[#13251d]/50 bg-[#f7f4ee] px-2 py-1 rounded">
          {current_question.question_type.replace(/_/g, " ")}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#dcd5c7] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1d9e75] rounded-full transition-all"
          style={{ width: `${((current_index + 1) / total_questions) * 100}%` }}
        />
      </div>

      {/* Question text */}
      <p className="text-base text-[#1a3a2a] leading-relaxed">
        {current_question.question_text}
      </p>

      {/* Options */}
      <div className="space-y-3">
        {current_question.options.map((option) => (
          <button
            key={option.label}
            onClick={() => onAnswer(option.label)}
            className="w-full text-left px-3 py-2.5 md:px-4 md:py-3 min-h-[44px] rounded-lg border border-[#dcd5c7] bg-white hover:border-[#1d9e75] hover:bg-[#1d9e75]/5 transition-colors group"
          >
            <span className="inline-flex items-center gap-3">
              <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-[#dcd5c7] text-xs font-semibold text-[#13251d]/70 group-hover:border-[#1d9e75] group-hover:text-[#1d9e75]">
                {option.label}
              </span>
              <span className="text-sm text-[#13251d]">{option.text}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Skip button */}
      <div className="flex justify-end">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-sm text-[#13251d]/60 hover:text-[#13251d] transition-colors"
        >
          Skip →
        </button>
      </div>
    </div>
  );
}
