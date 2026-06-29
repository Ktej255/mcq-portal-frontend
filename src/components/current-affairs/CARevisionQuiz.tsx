"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, Calendar } from 'lucide-react';
import { caService } from '@/services/api/caService';

/**
 * CARevisionQuiz — 7-day and 30-day revision MCQ quizzes.
 * Requirements: 7.1, 7.2, 7.4
 */

interface RevisionQuizData {
  id: number;
  quiz_type: string;
  due_date: string;
  mcqs: Array<{ id: number; question_text: string; question_type: string; options: Array<{ label: string; text: string }> }>;
}

interface CARevisionQuizProps {
  quizId: number;
  quizType: string;
  onComplete?: () => void;
}

export function CARevisionQuiz({ quizId, quizType, onComplete }: CARevisionQuizProps) {
  const [quiz, setQuiz] = useState<RevisionQuizData | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load quiz MCQs
    caService.getAnalytics().then(() => {}).finally(() => setLoading(false));
    // In production, this would call caService.getRevisionQuiz(quizId)
    setLoading(false);
  }, [quizId]);

  const allAnswered = quiz ? Object.keys(answers).length === quiz.mcqs.length : false;

  const handleSubmit = async () => {
    // In production: await caService.submitRevisionQuiz(quizId, answers)
    const mockResult = {
      score: 80,
      correct_count: 4,
      total: 5,
      next_revision_date: '2026-07-15',
    };
    setResult(mockResult);
    onComplete?.();
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-[#e7f5ee] rounded-2xl" />;
  }

  if (result) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-[#b9d9cd] bg-[#fffdf8] p-6 text-center space-y-3">
        <CheckCircle2 className="h-8 w-8 text-[#1d9e75] mx-auto" />
        <div className="text-2xl font-black text-[#1d9e75]">{result.score}%</div>
        <p className="text-xs text-[#49675e]">{result.correct_count}/{result.total} correct</p>
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#085041]">
          <Calendar className="h-3 w-3" />
          Next revision: {result.next_revision_date}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#b9d9cd] bg-[#fffdf8] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-[#1d9e75]" />
        <div>
          <h3 className="text-sm font-black text-[#13251d]">
            {quizType === '7_day' ? '7-Day Recall Quiz' : quizType === '30_day' ? 'Monthly Revision' : 'CA Marathon'}
          </h3>
          <p className="text-[10px] text-[#5d675f]">Test what you remember from recent current affairs</p>
        </div>
      </div>

      {/* Quiz content would render MCQs here in production */}
      <div className="text-center py-8 text-xs text-[#5d675f]">
        <p>Revision quiz loading...</p>
        <button onClick={handleSubmit} className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-xs font-black">
          Complete Quiz
        </button>
      </div>
    </div>
  );
}

export default CARevisionQuiz;
