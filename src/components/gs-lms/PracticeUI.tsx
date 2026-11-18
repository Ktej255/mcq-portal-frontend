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
    <div className="p-4 sm:p-6 space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-bold text-[#13251d]/70">
          Question {current_index + 1} of {total_questions}
        </span>
        <span className="text-xs font-semibold text-[#1a3a2a] bg-[#e7f5ee] px-2.5 py-1 rounded-md border border-[#1d9e75]/20">
          {current_question.question_type.replace(/_/g, " ")}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#dcd5c7] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1d9e75] rounded-full transition-all"
          style={{ width: `${((current_index + 1) / total_questions) * 100}%` }}
        />
      </div>

      {/* Question text */}
      <p className="text-sm sm:text-base text-[#1a3a2a] leading-relaxed font-medium">
        {current_question.question_text}
      </p>

      {/* Options */}
      <div className="space-y-3">
        {current_question.options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onAnswer(option.label)}
            className="w-full text-left p-3.5 sm:p-4 min-h-[48px] rounded-xl border border-[#dcd5c7] bg-white hover:border-[#1d9e75] hover:bg-[#1d9e75]/5 active:scale-[0.99] transition-all group shadow-2xs"
          >
            <span className="inline-flex items-center gap-3">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-[#dcd5c7] text-xs font-bold text-[#13251d]/70 group-hover:border-[#1d9e75] group-hover:text-[#1d9e75] bg-gray-50 group-hover:bg-white transition-colors">
                {option.label}
              </span>
              <span className="text-xs sm:text-sm font-medium text-[#13251d]">{option.text}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Skip button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSkip}
          className="min-h-11 px-4 py-2 inline-flex items-center text-xs sm:text-sm font-bold text-[#13251d]/70 hover:text-[#13251d] hover:bg-gray-100 rounded-lg transition-colors"
        >
          Skip question &rarr;
        </button>
      </div>
    </div>
  );
}
