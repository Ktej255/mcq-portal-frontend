"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
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
  onComplete: () => void | Promise<void>;
}

type McqLabMode = 'loading' | 'answering' | 'submitting' | 'result' | 'error';

type ApiErrorDetails = {
  status?: number;
  message: string;
};

function getApiErrorDetails(error: unknown, fallback: string): ApiErrorDetails {
  const response =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: unknown }).response
      : undefined;
  const responseRecord =
    response && typeof response === 'object'
      ? (response as Record<string, unknown>)
      : {};
  const data =
    responseRecord.data && typeof responseRecord.data === 'object'
      ? (responseRecord.data as Record<string, unknown>)
      : {};
  const detail = data.detail;
  const detailMessage =
    detail && typeof detail === 'object' && 'message' in detail
      ? (detail as { message?: unknown }).message
      : undefined;

  return {
    status: typeof responseRecord.status === 'number' ? responseRecord.status : undefined,
    message:
      typeof detail === 'string'
        ? detail
        : typeof detailMessage === 'string'
          ? detailMessage
          : typeof data.message === 'string'
            ? data.message
            : fallback,
  };
}

export function McqLabStep({ nodeId, subject = "geography", onComplete }: McqLabStepProps) {
  const [mode, setMode] = useState<McqLabMode>('loading');
  const [questions, setQuestions] = useState<McqLabQuestionOut[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<McqLabResultOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  // A 409 means the topic does not yet have a complete reviewed set. That is a
  // content coverage gap, not a transient failure, so retrying can never help.
  const [coverageGap, setCoverageGap] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const submissionInFlight = useRef(false);

  // Restore a submitted result when returning to the step; otherwise load a
  // fresh reviewed set. A missing result is the normal first-attempt path.
  useEffect(() => {
    let active = true;

    const loadQuestions = async () => {
      try {
        const qs = await funnelService.getMcqLabQuestions(subject, nodeId);
        if (!active) return;
        setQuestions(qs);
        setMode('answering');
      } catch (err: unknown) {
        if (!active) return;
        const details = getApiErrorDetails(err, '');
        setCoverageGap(details.status === 409);
        setError(details.message || 'Failed to load MCQ Lab questions');
        setMode('error');
      }
    };

    const loadResult = async () => {
      try {
        const savedResult = await funnelService.getMcqLabResult(subject, nodeId);
        if (!active) return;
        if (!savedResult) {
          // No saved attempt yet: go straight to the question flow.
          void loadQuestions();
          return;
        }
        setResult(savedResult);
        setMode('result');
      } catch (err: unknown) {
        if (!active) return;
        const details = getApiErrorDetails(err, 'Could not restore the previous MCQ result.');
        if (details.status === 404) {
          void loadQuestions();
          return;
        }
        setError(`${details.message} You can retry loading the MCQ Lab.`);
        setMode('error');
      }
    };

    // Starting a new Lab session clears the previous one. The clear is deferred
    // by one microtask so this effect never writes state synchronously; every
    // response below already arrives asynchronously, so the ordering is
    // unchanged, and the `active` flag stops a stale clear after a re-run.
    queueMicrotask(() => {
      if (!active) return;
      setMode('loading');
      setQuestions([]);
      setAnswers({});
      setResult(null);
      setError(null);
    });
    void loadResult();

    return () => {
      active = false;
    };
  }, [nodeId, subject]);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  const handleSelectAnswer = useCallback((questionId: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!allAnswered) return;
    if (submissionInFlight.current) return;
    submissionInFlight.current = true;
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
      setError('Submission failed. Your answers remain on this page while you retry.');
      setMode('answering');
    } finally {
      submissionInFlight.current = false;
    }
  }, [allAnswered, answers, questions, subject, nodeId]);

  const handleContinueWithoutLab = async () => {
    if (advancing) return;
    setAdvancing(true);
    try {
      await onComplete();
    } finally {
      setAdvancing(false);
    }
  };

  if (coverageGap) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-[#efd8a7] bg-[#fff8e8] p-6"
      >
        <p className="text-sm font-semibold text-[#6f4a12]">
          MCQ practice is not open for this topic yet
        </p>
        <p className="mt-1 text-sm text-[#6f4a12]/80">
          {error} The lab needs 15 reviewed questions, and this topic has fewer
          today. That is a coverage gap on our side, not a judgement of your
          preparation. The readiness report will keep this topic marked
          practice-unverified until the set is complete.
        </p>
        <button
          type="button"
          onClick={handleContinueWithoutLab}
          disabled={advancing}
          className="mt-4 w-full rounded-xl border border-[#ef9f27]/50 bg-white py-3 text-sm font-black text-[#6f4a12] transition hover:bg-[#ef9f27]/10 disabled:opacity-50"
        >
          {advancing ? "Continuing…" : "Continue without the MCQ Lab →"}
        </button>
        <p className="mt-2 text-xs text-[#6f4a12]/60">
          Mains practice and the growth report stay available, so the topic can
          still be completed.
        </p>
      </div>
    );
  }

  if (error && mode === 'error') {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-800">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-800 hover:bg-red-100"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  if (error && mode === 'loading') {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-800">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-800 hover:bg-red-100"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
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

  if (mode === 'answering' && questions.length === 0 && !error) {
    return (
      <div className="rounded-2xl border border-[#efd8a7] bg-[#fff8e8] p-6 text-center">
        <p className="text-sm font-semibold text-[#6f4a12]">
          No MCQ Lab questions are available for this topic yet.
        </p>
        <p className="mt-1 text-xs text-[#6f4a12]/70">
          This is a coverage gap, not a learner failure. You can continue and the
          topic will stay practice-unverified in readiness.
        </p>
        <button
          type="button"
          onClick={handleContinueWithoutLab}
          disabled={advancing}
          className="mt-4 w-full rounded-xl border border-[#ef9f27]/50 bg-white py-3 text-sm font-black text-[#6f4a12] transition hover:bg-[#ef9f27]/10 disabled:opacity-50"
        >
          {advancing ? "Continuing…" : "Continue without the MCQ Lab →"}
        </button>
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
            `Submit All (${answeredCount}/${questions.length} answered)`
          )}
        </button>
        {error && <p className="text-xs text-red-600 text-center mt-2">{error}</p>}
      </div>
    </div>
  );
}

export default McqLabStep;
