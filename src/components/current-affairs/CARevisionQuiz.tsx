"use client";

import { CalendarClock } from 'lucide-react';

/**
 * CARevisionQuiz — placeholder for 7-day and 30-day revision quizzes.
 *
 * The backend does not expose revision-quiz endpoints yet. This component
 * deliberately renders an explicit "not available" state instead of scoring
 * anything locally: a revision score shown to a learner must come from a real
 * submission, never from a constant.
 */

interface CARevisionQuizProps {
  quizId: number;
  quizType: string;
  onComplete?: () => void;
}

export function CARevisionQuiz({ quizType }: CARevisionQuizProps) {
  const label =
    quizType === '7_day' ? '7-Day Recall Quiz'
    : quizType === '30_day' ? 'Monthly Revision'
    : 'CA Marathon';

  return (
    <div className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-[#1d9e75]" />
        <div>
          <h3 className="text-sm font-black text-[#13251d]">{label}</h3>
          <p className="text-[10px] text-[#5d675f]">Scheduled recall for recent current affairs</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-[#5d675f]">
        Revision quizzes for current affairs are not available yet. Use Quick Test
        from the Current Affairs feed to check yourself in the meantime; it scores
        through the server and does not save to history.
      </p>
    </div>
  );
}

export default CARevisionQuiz;
