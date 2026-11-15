"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, BookOpen, MessageSquare, Target, PenLine, CheckCircle2, Lock } from 'lucide-react';
import { caService, CAItemDetailOut, CAFunnelStateOut, CAMcqOut, CAMcqResultOut, CAMainsQuestionOut } from '@/services/api/caService';
import type { ContentBlock } from '@/services/api/gsLmsService';
import { RichBlocks } from '@/components/gs-lms/RichBlockRenderer';

/**
 * CAItemFunnel — 5-step per-item learning funnel.
 * Watch → Read → Discuss → MCQ → Mains (optional)
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

interface CAItemFunnelProps {
  itemId: number;
  item: CAItemDetailOut;
}

const FUNNEL_STEPS = [
  { step: 1, label: 'Watch', icon: Video },
  { step: 2, label: 'Read', icon: BookOpen },
  { step: 3, label: 'Discuss', icon: MessageSquare },
  { step: 4, label: 'MCQs', icon: Target },
  { step: 5, label: 'Mains', icon: PenLine },
];

export function CAItemFunnel({ itemId, item }: CAItemFunnelProps) {
  const [state, setState] = useState<CAFunnelStateOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [completingStep, setCompletingStep] = useState<number | null>(null);
  const [completionError, setCompletionError] = useState("");
  const [failedStep, setFailedStep] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    caService.getFunnelState(itemId)
      .then((nextState) => {
        if (cancelled) return;
        setState(nextState);
        setLoadFailed(false);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [itemId, loadAttempt]);

  const retryLoad = useCallback(() => {
    setLoadFailed(false);
    setLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  const completeStep = useCallback(async (step: number) => {
    if (completingStep !== null) return;

    setCompletionError("");
    setFailedStep(null);
    setCompletingStep(step);
    try {
      const newState = await caService.completeFunnelStep(itemId, step);
      setState(newState);
    } catch {
      setFailedStep(step);
      setCompletionError("This step could not be saved. Your current funnel state is unchanged; retry when the connection is available.");
    } finally {
      setCompletingStep(null);
    }
  }, [completingStep, itemId]);

  if (loadFailed) {
    return (
      <div role="alert" className="rounded-2xl border border-[#ef9f27]/50 bg-[#fff4df] p-5">
        <p className="text-sm font-black text-[#7a5410]">Funnel progress could not be loaded.</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-[#7a5410]/80">
          No step has been marked complete. Check the connection and retry.
        </p>
        <button
          type="button"
          onClick={retryLoad}
          className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-[#9a6a16] px-3 text-xs font-black text-white transition hover:bg-[#7a5410]"
        >
          Retry load
        </button>
      </div>
    );
  }

  if (loading || !state) {
    return <div className="animate-pulse h-64 bg-[#e7f5ee] rounded-2xl" />;
  }

  const { current_step, completed_steps, video_available, is_completed } = state;

  return (
    <div className="space-y-5">
      {/* Progress Steps */}
      <div className="flex items-center gap-1">
        {FUNNEL_STEPS.map(({ step, label, icon: Icon }) => {
          const isCompleted = completed_steps.includes(step);
          const isCurrent = step === current_step;
          const isLocked = step > current_step;
          const isSkipped = step === 1 && !video_available;

          if (isSkipped) return null;

          return (
            <div key={step} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted ? 'bg-[#1d9e75] text-white' :
                isCurrent ? 'bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white shadow-md' :
                'bg-[#dcd5c7] text-[#5d675f]'
              }`}>
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> :
                 isLocked ? <Lock className="h-3 w-3" /> :
                 <Icon className="h-3.5 w-3.5" />}
              </div>
              <span className={`text-[9px] font-black ${isCurrent ? 'text-[#1d9e75]' : 'text-[#5d675f]'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {completionError && failedStep !== null ? (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-[#ef9f27]/50 bg-[#fff4df] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold leading-5 text-[#7a5410]">{completionError}</p>
          <button
            type="button"
            onClick={() => void completeStep(failedStep)}
            disabled={completingStep !== null}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-[#9a6a16] px-3 text-xs font-black text-white transition hover:bg-[#7a5410] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {completingStep === failedStep ? "Retrying..." : "Retry save"}
          </button>
        </div>
      ) : null}

      {/* Completion celebration */}
      {is_completed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-gradient-to-br from-[#1a3a2a] to-[#1d9e75] p-6 text-center text-white"
        >
          <h2 className="text-lg font-black">✅ Item Complete!</h2>
          <p className="text-sm opacity-80 mt-1">You&apos;ve covered this current affairs item.</p>
        </motion.div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current_step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step 1: Watch Video */}
          {current_step === 1 && video_available && item.video_url && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-[#1a3a2a]">Watch the Video</h3>
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  src={item.video_url}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
              <button
                onClick={() => completeStep(1)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-sm font-black"
              >
                Mark as Watched →
              </button>
            </div>
          )}

          {/* Step 2: Read Content */}
          {current_step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[#1a3a2a]">Read the Content</h3>
              <div className="rounded-xl border border-[#dcd5c7] bg-white p-5">
                <RichBlocks blocks={item.content_blocks as unknown as ContentBlock[]} />
              </div>

              {/* UPSC Statement Frames */}
              {item.upsc_statement_frames && (
                <div className="rounded-xl border border-[#7c3aed]/20 bg-[#7c3aed]/5 p-4">
                  <h4 className="text-xs font-black text-[#7c3aed] uppercase mb-2">How UPSC Will Ask This</h4>
                  <ul className="space-y-1.5">
                    {item.upsc_statement_frames.prelims_statements.map((s, i) => (
                      <li key={i} className="text-xs text-[#5d4e80]">• {s}</li>
                    ))}
                    {item.upsc_statement_frames.mains_angle && (
                      <li className="text-xs text-[#5d4e80] font-semibold mt-2">
                        Mains: {item.upsc_statement_frames.mains_angle}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* So What Analysis */}
              {item.so_what_analysis && (
                <div className="rounded-xl border border-[#b9d9cd] bg-[#e7f5ee] p-4">
                  <h4 className="text-xs font-black text-[#085041] uppercase mb-2">So What?</h4>
                  <div className="grid gap-2 text-xs text-[#1f2e26]">
                    {item.so_what_analysis.who_benefits && <p><strong>Who benefits:</strong> {item.so_what_analysis.who_benefits}</p>}
                    {item.so_what_analysis.who_loses && <p><strong>Who loses:</strong> {item.so_what_analysis.who_loses}</p>}
                    {item.so_what_analysis.what_changes_next && <p><strong>What changes:</strong> {item.so_what_analysis.what_changes_next}</p>}
                    {item.so_what_analysis.upsc_angle && <p><strong>UPSC angle:</strong> {item.so_what_analysis.upsc_angle}</p>}
                    {item.so_what_analysis.connected_static_topic && <p><strong>Static link:</strong> {item.so_what_analysis.connected_static_topic}</p>}
                  </div>
                </div>
              )}

              <button
                onClick={() => completeStep(2)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-sm font-black"
              >
                I&apos;ve Read This → Continue to Discussion
              </button>
            </div>
          )}

          {/* Step 3: Discussion */}
          {current_step === 3 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-[#1a3a2a]">Discussion</h3>
              <p className="text-xs text-[#5d675f]">
                The Ask a Doubt chat at the bottom of this page is where to discuss the
                item: the UPSC angle, the GS paper it connects to, and the underlying
                static concept. Replies are labelled when a mock provider is in use.
              </p>
              <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 text-center">
                <MessageSquare className="h-8 w-8 text-[#1d9e75] mx-auto mb-2" />
                <p className="text-xs text-[#49675e]">Discussion is voluntary and never locks the rest of the funnel.</p>
                <button
                  onClick={() => completeStep(3)}
                  className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-xs font-black"
                >
                  Mark Discussion Reviewed →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: MCQ Practice */}
          {current_step === 4 && !is_completed && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-[#1a3a2a]">MCQ Practice</h3>
              {/* Simplified MCQ section using CA-specific MCQs */}
              <CAMcqSection itemId={itemId} onComplete={() => completeStep(4)} />
            </div>
          )}

          {/* Step 5: Mains Practice (optional) */}
          {current_step === 5 && (
            <CAMainsSection
              itemId={itemId}
              item={item}
              isCompleted={is_completed}
              mainsReviewed={completed_steps.includes(5)}
              onComplete={() => completeStep(5)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Optional Mains step for CA items. Prompts are shown for practice; this
// funnel never scores a written answer, and says so.
function CAMainsSection({
  itemId,
  item,
  isCompleted,
  mainsReviewed,
  onComplete,
}: {
  itemId: number;
  item: CAItemDetailOut;
  isCompleted: boolean;
  mainsReviewed: boolean;
  onComplete: () => void;
}) {
  const [questions, setQuestions] = useState<CAMainsQuestionOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    caService.getCaMainsQuestions(itemId)
      .then(setQuestions)
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false));
  }, [itemId]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-black text-[#1a3a2a]">Mains Practice (Optional)</h3>
      <p className="text-xs text-[#5d675f]">
        This Current Affairs funnel does not score written answers. Write the prompt on
        paper, then use the connected GS topic&apos;s Mains step for structured practice
        and evaluation.
      </p>

      {loading ? (
        <div className="animate-pulse h-20 bg-[#e7f5ee] rounded-xl" />
      ) : loadFailed ? (
        <p className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 text-xs font-semibold text-[#49675e]">
          Mains prompts could not be loaded. The rest of the funnel is unaffected; reload to retry.
        </p>
      ) : questions.length > 0 ? (
        <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4">
          <h4 className="text-[10px] font-black uppercase tracking-wide text-[#49675e]">Practice prompts</h4>
          <ul className="mt-2 space-y-3">
            {questions.map((q) => (
              <li key={q.id}>
                <p className="text-xs font-semibold text-[#1f2e26]">{q.question_text}</p>
                <p className="mt-1 text-[10px] font-bold text-[#5d675f]">
                  {q.gs_paper} · {q.marks} marks · {q.word_limit} words
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 text-xs font-semibold text-[#49675e]">
          No Mains prompts are attached to this item yet.
        </p>
      )}

      {item.syllabus_links.length > 0 && (
        <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4">
          <h4 className="text-[10px] font-black uppercase tracking-wide text-[#49675e]">Connected GS topics</h4>
          <ul className="mt-1.5 space-y-1">
            {item.syllabus_links.map((link, i) => (
              <li key={`${link.node_id}-${i}`} className="text-xs text-[#1f2e26]">
                {link.topic_title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {mainsReviewed ? (
        <p className="text-center text-[10px] font-bold uppercase tracking-wide text-[#49675e]">
          Mains step reviewed
        </p>
      ) : (
        <button
          onClick={onComplete}
          className="w-full py-3 rounded-xl border border-[#dcd5c7] text-xs font-black text-[#5d675f]"
        >
          {isCompleted ? "Mark Mains step reviewed →" : "Continue without Mains practice → Complete Item"}
        </button>
      )}
    </div>
  );
}

// Simple MCQ sub-component for CA items
function CAMcqSection({ itemId, onComplete }: { itemId: number; onComplete: () => void }) {
  const [mcqs, setMcqs] = useState<CAMcqOut[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<CAMcqResultOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;
    caService.getCaMcqs(itemId)
      .then((nextMcqs) => {
        if (cancelled) return;
        setMcqs(nextMcqs);
        setLoadFailed(false);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [itemId, loadAttempt]);

  const retryLoad = () => {
    setLoadFailed(false);
    setLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  if (loading) return <div className="animate-pulse h-32 bg-[#e7f5ee] rounded-xl" />;
  if (loadFailed) {
    return (
      <div role="alert" className="space-y-3">
        <p className="rounded-xl border border-[#ef9f27]/50 bg-[#fff4df] p-4 text-xs font-bold leading-5 text-[#7a5410]">
          MCQs could not be loaded, so nothing has been scored. Check the connection and retry.
        </p>
        <button
          type="button"
          onClick={retryLoad}
          className="w-full py-3 rounded-xl border border-[#9a6a16] text-xs font-black text-[#7a5410]"
        >
          Retry load
        </button>
      </div>
    );
  }
  if (mcqs.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-[#5d675f]">No MCQs available for this item.</p>
        <button onClick={onComplete} className="mt-2 px-4 py-2 rounded-lg bg-[#1d9e75] text-white text-xs font-black">Continue →</button>
      </div>
    );
  }

  const allAnswered = Object.keys(answers).length === mcqs.length;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await caService.submitCaMcqs(itemId, answers);
      setResult(res);
    } catch {
      setSubmitError("Your answers were not scored. They are kept below, so you can submit again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-[#b9d9cd] bg-[#fffdf8] p-4 text-center">
          <div className="text-2xl font-black text-[#1d9e75]">{result.score}%</div>
          <p className="text-xs text-[#49675e]">{result.correct_count}/{result.total_questions} correct</p>
        </div>
        <button onClick={onComplete} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-sm font-black">
          Continue →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mcqs.map((mcq, idx) => (
        <div key={mcq.id} className="rounded-lg border border-[#dcd5c7] bg-white p-3 space-y-2">
          <p className="text-xs font-semibold text-[#1f2e26]">Q{idx + 1}. {mcq.question_text}</p>
          <div className="space-y-1.5">
            {(mcq.options || []).map((opt) => (
              <button
                key={opt.label}
                onClick={() => setAnswers(prev => ({ ...prev, [mcq.id]: opt.label }))}
                className={`w-full text-left rounded-md border p-2 text-[11px] ${
                  answers[mcq.id] === opt.label ? 'border-[#1a3a2a] bg-[#e7f5ee]' : 'border-[#dcd5c7]'
                }`}
              >
                <strong>{opt.label}.</strong> {opt.text}
              </button>
            ))}
          </div>
        </div>
      ))}
      {submitError ? (
        <p role="alert" className="rounded-lg border border-[#ef9f27]/50 bg-[#fff4df] p-3 text-[11px] font-bold leading-5 text-[#7a5410]">
          {submitError}
        </p>
      ) : null}
      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className={`w-full py-3 rounded-xl text-sm font-black ${
          allAnswered && !submitting ? 'bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white' : 'bg-[#dcd5c7] text-[#5d675f]'
        }`}
      >
        {submitting ? "Scoring…" : `Submit All (${Object.keys(answers).length}/${mcqs.length})`}
      </button>
    </div>
  );
}

export default CAItemFunnel;
