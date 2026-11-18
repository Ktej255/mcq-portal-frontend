"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PenLine, RefreshCw, SkipForward } from 'lucide-react';
import { funnelService, MainsQuestionOut, MainsEvalStatusOut } from '@/services/api/funnelService';

/**
 * MainsPracticeStep — Structured 3-section workspace (Intro/Body/Conclusion)
 * with Evaluation Engine integration via background job polling.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.9, 8.10, 8.11, 8.12
 */

interface MainsPracticeStepProps {
  nodeId: number;
  subject?: string;
  onComplete: () => void;
}

type MainsMode = 'loading' | 'writing' | 'submitting' | 'polling' | 'timed_out' | 'result' | 'error';

export function MainsPracticeStep({ nodeId, subject = "geography", onComplete }: MainsPracticeStepProps) {
  const [mode, setMode] = useState<MainsMode>('loading');
  const [questions, setQuestions] = useState<MainsQuestionOut[]>([]);
  const [activeQIdx, setActiveQIdx] = useState(0);
  const [introduction, setIntroduction] = useState('');
  const [body, setBody] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [evalStatus, setEvalStatus] = useState<MainsEvalStatusOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const jobStorageKey = `gs-lms:mains-job:${subject}:${nodeId}`;

  // Load questions and restore a server-issued job ID for same-browser reloads.
  useEffect(() => {
    let active = true;
    let savedJobId: string | null = null;
    try {
      savedJobId = window.sessionStorage.getItem(jobStorageKey);
    } catch {
      // Storage may be unavailable in privacy-restricted browser contexts.
    }

    if (savedJobId) {
      queueMicrotask(() => {
        if (!active) return;
        setJobId(savedJobId);
        setMode('polling');
      });
    }

    funnelService.getMainsQuestions(subject, nodeId)
      .then((qs) => {
        if (!active) return;
        setQuestions(qs);
        setMode((currentMode) => currentMode === 'polling' ? currentMode : 'writing');
      })
      .catch(() => {
        if (!active) return;
        setError('Failed to load Mains questions');
        setMode('error');
      });

    return () => {
      active = false;
    };
  }, [jobStorageKey, nodeId, subject]);

  const activeQuestion = questions[activeQIdx] || null;

  // Word count
  const wordCount = useMemo(() => {
    const combined = `${introduction} ${body} ${conclusion}`.trim();
    return combined ? combined.split(/\s+/).length : 0;
  }, [introduction, body, conclusion]);

  const canSubmit = wordCount >= 10;

  // Submit typed answer
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !activeQuestion || mode === 'submitting' || jobId) return;
    setMode('submitting');
    setError(null);

    try {
      const res = await funnelService.submitMainsAnswer(subject, nodeId, activeQuestion.question_id, {
        introduction,
        body,
        conclusion,
        mode: 'TYPED',
      });
      setJobId(res.job_id);
      try {
        window.sessionStorage.setItem(jobStorageKey, res.job_id);
      } catch {
        // Best-effort reload recovery; the server remains the status authority.
      }
      setMode('polling');
    } catch {
      setError('Failed to submit answer. Please try again.');
      setMode('writing');
    }
  }, [canSubmit, activeQuestion, introduction, body, conclusion, subject, nodeId, mode, jobId, jobStorageKey]);

  // Poll for evaluation result
  useEffect(() => {
    if (mode !== 'polling' || !jobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await funnelService.pollMainsEvaluation(subject, nodeId, jobId);
        setEvalStatus(status);

        if (status.status === 'COMPLETED' || status.status === 'FAILED' || status.status === 'DEGRADED') {
          clearInterval(pollInterval);
          setMode('result');
        }
      } catch (err: unknown) {
        const status =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;
        if (status === 404) {
          try {
            window.sessionStorage.removeItem(jobStorageKey);
          } catch {
            // Ignore unavailable browser storage.
          }
          setJobId(null);
          setError('This evaluation is no longer available. You can submit a new answer.');
          setMode('writing');
        }
        // Continue polling on transient errors.
      }
    }, 3000);

    // Max polling: 5 minutes. Keep the job ID and latest server status so the
    // learner can resume polling instead of seeing an incomplete result.
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      setMode('timed_out');
    }, 300000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [mode, jobId, subject, nodeId, jobStorageKey]);

  if (mode === 'loading') {
    return <div className="animate-pulse h-64 bg-[#fffdf8] rounded-2xl" />;
  }

  if (mode === 'error') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  // Result view
  if (mode === 'result' && evalStatus) {
    const report = evalStatus.report;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#b9d9cd] bg-[#fffdf8] p-6">
          <h3 className="text-sm font-black text-[#1a3a2a] mb-3">Evaluation Report</h3>
          {report ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-[#1d9e75]">
                    {report.marks_awarded}/{report.max_marks}
                  </div>
                  <div className="text-[10px] text-[#49675e]">Marks</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-black text-[#085041]">
                    {report.word_count}/{report.word_limit} words
                  </div>
                </div>
              </div>
              {Object.entries(report.sections).map(([key, section]) => (
                <div key={key} className="border-t border-[#dcd5c7] pt-2">
                  <p className="text-xs font-black text-[#1a3a2a] capitalize">{key}</p>
                  <p className="text-xs text-[#49675e] mt-0.5">{section.feedback}</p>
                </div>
              ))}
              {report.incomplete_sections.length > 0 && (
                <p className="text-[10px] text-amber-700">
                  Note: Some sections could not be evaluated: {report.incomplete_sections.join(', ')}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#49675e]">
              {evalStatus.status === 'FAILED' ? 'Evaluation failed. Your answer has been saved.' : 'Evaluation processing...'}
            </p>
          )}
        </div>
        {(evalStatus.model_answer || evalStatus.explanation) && (
          <details className="rounded-2xl border border-[#dcd5c7] bg-white p-5">
            <summary className="cursor-pointer text-sm font-black text-[#1a3a2a]">
              Compare with the examiner&apos;s reference
            </summary>
            <p className="mt-2 text-[11px] leading-relaxed text-[#49675e]">
              This is the reference used to score your answer, not a perfect answer to memorise.
              Note what it covers that yours did not.
            </p>
            {evalStatus.model_answer && (
              <div className="mt-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#085041]">Reference answer</p>
                <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-[#1f2e26]">
                  {evalStatus.model_answer}
                </p>
              </div>
            )}
            {evalStatus.explanation && (
              <div className="mt-3 border-t border-[#dcd5c7] pt-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#085041]">Reference outline</p>
                <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-[#1f2e26]">
                  {evalStatus.explanation}
                </p>
              </div>
            )}
          </details>
        )}
        <button
          onClick={() => {
            try {
              window.sessionStorage.removeItem(jobStorageKey);
            } catch {
              // Ignore unavailable browser storage.
            }
            onComplete();
          }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-sm font-black"
        >
          Continue to Growth Report →
        </button>
      </div>
    );
  }

  // Bounded-timeout view: the server job remains authoritative and can be
  // resumed through the same status endpoint without submitting again.
  if (mode === 'timed_out') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center space-y-3">
        <RefreshCw className="h-8 w-8 text-amber-700 mx-auto" />
        <p className="text-sm font-black text-amber-900">Evaluation is still pending</p>
        <p className="text-xs text-amber-800">
          We stopped automatic checking after five minutes. Your answer is still submitted, and the server may still be completing the evaluation.
        </p>
        {evalStatus && (
          <p className="text-[11px] text-amber-800">
            Latest server status: {evalStatus.status.replace('_', ' ').toLowerCase()}.
          </p>
        )}
        <button
          onClick={() => {
            setError(null);
            setMode('polling');
          }}
          disabled={!jobId}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-xs font-black disabled:opacity-50"
        >
          <RefreshCw className="h-3 w-3" /> Resume checking
        </button>
      </div>
    );
  }

  // Polling view
  if (mode === 'polling') {
    return (
      <div className="rounded-2xl border border-[#b9d9cd] bg-[#fffdf8] p-8 text-center space-y-3">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <RefreshCw className="h-8 w-8 text-[#1d9e75] mx-auto" />
        </motion.div>
        <p className="text-sm font-black text-[#1a3a2a]">Evaluating your answer...</p>
        <p className="text-xs text-[#49675e]">This may take a moment. Please wait.</p>
      </div>
    );
  }

  // Writing view
  return (
    <div className="space-y-4">
      {/* Question Selector */}
      {questions.length > 1 && (
        <div className="flex gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.question_id}
              onClick={() => setActiveQIdx(idx)}
              className={`px-3 py-1.5 rounded-full text-xs font-black ${
                idx === activeQIdx
                  ? 'bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white'
                  : 'bg-white border border-[#dcd5c7] text-[#5d675f]'
              }`}
            >
              {q.gs_paper} • {q.year}
            </button>
          ))}
        </div>
      )}

      {/* Question Display */}
      {activeQuestion && (
        <div className="rounded-xl border border-[#dcd5c7] bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-[#0f766e]/10 border border-[#0f766e]/20 px-2 py-0.5 text-[9px] font-black text-[#0f766e]">
              {activeQuestion.gs_paper} • {activeQuestion.year}
            </span>
            <span className="text-[10px] text-[#49675e]">{activeQuestion.marks} marks • {activeQuestion.word_limit} words</span>
          </div>
          <p className="text-sm text-[#1f2e26] leading-relaxed">{activeQuestion.question_text}</p>
        </div>
      )}

      {/* Answer Workspace */}
      <div className="space-y-3">
        {/* Introduction */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-5 h-5 rounded-full bg-[#1d9e75] text-white text-[10px] font-black flex items-center justify-center">1</span>
            <span className="text-xs font-black text-[#1a3a2a]">Introduction</span>
          </div>
          <textarea
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            placeholder="Open with context..."
            className="w-full h-20 rounded-xl border border-[#b9d9cd] bg-white p-3 text-sm text-[#1f2e26] resize-none focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/30"
          />
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-5 h-5 rounded-full bg-[#1d9e75] text-white text-[10px] font-black flex items-center justify-center">2</span>
            <span className="text-xs font-black text-[#1a3a2a]">Body</span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Develop the argument..."
            className="w-full h-40 rounded-xl border border-[#b9d9cd] bg-white p-3 text-sm text-[#1f2e26] resize-none focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/30"
          />
        </div>

        {/* Conclusion */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-5 h-5 rounded-full bg-[#1d9e75] text-white text-[10px] font-black flex items-center justify-center">3</span>
            <span className="text-xs font-black text-[#1a3a2a]">Conclusion</span>
          </div>
          <textarea
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            placeholder="Tie together, way forward..."
            className="w-full h-20 rounded-xl border border-[#b9d9cd] bg-white p-3 text-sm text-[#1f2e26] resize-none focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/30"
          />
        </div>
      </div>

      {/* Word Counter + Actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#49675e]">{wordCount} words {activeQuestion ? `/ ${activeQuestion.word_limit}` : ''}</span>
        <div className="flex gap-2">
          <button
            onClick={onComplete}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#dcd5c7] text-xs font-semibold text-[#5d675f]"
          >
            <SkipForward className="h-3 w-3" /> Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || mode === 'submitting'}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black ${
              canSubmit
                ? 'bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white'
                : 'bg-[#dcd5c7] text-[#5d675f] cursor-not-allowed'
            }`}
          >
            <PenLine className="h-3 w-3" />
            {mode === 'submitting' ? 'Submitting...' : '🎯 Evaluate'}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default MainsPracticeStep;
