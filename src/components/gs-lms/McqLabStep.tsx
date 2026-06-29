"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { funnelService, McqLabQuestionOut, McqLabResultOut } from '@/services/api/funnelService';

/**
 * McqLabStep — 15-question simultaneous display with submit-all flow.
 * All questions visible at once, colored type badges, disabled submit until all answered.
 *
 * Requirements: 6.1, 6.3, 6.4, 6.8
 */

interface McqLabStepProps {
  nodeId: number;
  subject?: string;
  onComplete: () => void;
}

type McqLabMode = 'loading' | 'answering' | 'submitting' | 'result';

export function McqLabStep({ nodeId, subject = "geography", onComplete }: McqLabStepProps) {
  const [mode, setMode] = useState<McqLabMode>('loading');
  const [questions, setQuestions] = useState<McqLabQuestionOut[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<McqLabResultOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load questions
  useEffect(() => {
    funnelService.getMcqLabQuestions(subject, nodeId)
      .then((qs) => {
        setQuestions(qs);
        setMode('answering');
      })
      .catch(() => setError('Failed to load MCQ Lab questions'));
  }, [nodeId, subject]);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === 15;

  const handleSelectAnswer = useCallback((questionId: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!allAnswered) return;
    setMode('submitting');
    setError(null);

    try {
      const payload = questions.map((q) => ({
        question_id: q.question_id,
        chosen_answer: answers[q.question_id],
        time_taken_seconds: undefined,
      }));
      const res = await funnelService.submitMcqLab(subject, nodeId, payload);
      setResult(res);
      setMode('result');
    } catch {
      setError('Submission failed. Your answers are saved locally — please retry.');
      setMode('answering');
    }
  }, [allAnswered, answers, questions, subject, nodeId]);

  if (error && mode === 'loading') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (mode === 'loading') {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-[#e7f5ee] rounded-xl" />
        ))}
      </div>
    );
  }

  // Result view
  if (mode === 'result' && result) {
    return (
      <div className="space-y-6">
        {/* Score Card */}
        <div className="rounded-2xl border border-[#b9d9cd] bg-[#fffdf8] p-6 text-center">
          <div className="text-4xl font-black text-[#1d9e75]">{result.score}%</div>
          <p className="text-sm text-[#49675e] mt-1">
            {result.correct_count}/{result.total_questions} correct
          </p>
        </div>

        {/* Type Breakdown */}
        <div className="space-y-2">
          <h4 className="text-xs font-black text-[#49675e] uppercase">Per-Type Accuracy</h4>
          {result.type_breakdown.map((tb) => (
            <div key={tb.question_type} className="flex items-center justify-between text-xs">
              <span className="text-[#1f2e26]">{tb.question_type.replace(/_/g, ' ')}</span>
              <span className={`font-black ${tb.accuracy >= 50 ? 'text-[#1d9e75]' : 'text-red-600'}`}>
                {tb.accuracy}% ({tb.correct}/{tb.total})
              </span>
            </div>
          ))}
        </div>

        {/* Per-Question Results */}
        <div className="space-y-2">
          <h4 className="text-xs font-black text-[#49675e] uppercase">Per-Question Results</h4>
          {result.attempts.map((attempt, idx) => (
            <details key={idx} className="rounded-lg border border-[#dcd5c7] bg-white">
              <summary className="flex items-center gap-2 p-3 cursor-pointer text-xs">
                {attempt.is_correct ? (
                  <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-semibold text-[#1f2e26]">Q{idx + 1}</span>
                <span className="rounded-full bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-2 py-0.5 text-[8px] font-black text-white">
                  {attempt.question_type.replace(/_/g, ' ')}
                </span>
              </summary>
              <div className="px-3 pb-3 text-xs text-[#49675e]">
                <p>Your answer: <strong>{attempt.chosen_answer}</strong></p>
                <p>Correct answer: <strong className="text-[#1d9e75]">{attempt.correct_answer}</strong></p>
                {attempt.explanation && (
                  <p className="mt-1 text-[#1f2e26]">{attempt.explanation}</p>
                )}
              </div>
            </details>
          ))}
        </div>

        <button
          onClick={onComplete}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-sm font-black"
        >
          Continue to Mains Practice →
        </button>
      </div>
    );
  }

  // Answering view
  return (
    <div className="space-y-4">
      {/* Questions */}
      {questions.map((q, idx) => (
        <div key={q.question_id} className="rounded-xl border border-[#dcd5c7] bg-white p-4 space-y-3">
          {/* Type badge */}
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-2.5 py-0.5 text-[8px] font-black text-white">
              {q.question_type.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] text-[#49675e]">Q{idx + 1}</span>
          </div>

          {/* Question text */}
          <p className="text-sm text-[#1f2e26] leading-relaxed whitespace-pre-wrap">
            {q.question_text}
          </p>

          {/* Options */}
          <div className="space-y-2">
            {q.options.map((opt) => {
              const isSelected = answers[q.question_id] === opt.label;
              return (
                <button
                  key={opt.label}
                  onClick={() => handleSelectAnswer(q.question_id, opt.label)}
                  className={`
                    w-full text-left rounded-lg border p-3 text-xs transition-all
                    ${isSelected
                      ? 'border-[#1a3a2a] bg-[#e7f5ee] shadow-sm'
                      : 'border-[#dcd5c7] bg-white hover:border-[#b9d9cd]'
                    }
                  `}
                >
                  <span className="font-black text-[#1a3a2a]">{opt.label}.</span>{' '}
                  <span className="text-[#1f2e26]">{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Submit Button (Sticky) */}
      <div className="sticky bottom-4 pt-4">
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || mode === 'submitting'}
          className={`
            w-full py-3 rounded-xl text-sm font-black transition-all
            ${allAnswered
              ? 'bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white shadow-lg'
              : 'bg-[#dcd5c7] text-[#5d675f] cursor-not-allowed'
            }
          `}
        >
          {mode === 'submitting' ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" /> Submitting...
            </span>
          ) : (
            `Submit All (${answeredCount}/15 answered)`
          )}
        </button>
        {error && <p className="text-xs text-red-600 text-center mt-2">{error}</p>}
      </div>
    </div>
  );
}

export default McqLabStep;
