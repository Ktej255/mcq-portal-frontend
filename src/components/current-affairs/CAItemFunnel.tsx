"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, BookOpen, MessageSquare, Target, PenLine, CheckCircle2, Lock } from 'lucide-react';
import { caService, CAItemDetailOut, CAFunnelStateOut } from '@/services/api/caService';
import { McqLabStep } from '@/components/gs-lms/McqLabStep';
import { MainsPracticeStep } from '@/components/gs-lms/MainsPracticeStep';
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

  useEffect(() => {
    caService.getFunnelState(itemId)
      .then(setState)
      .finally(() => setLoading(false));
  }, [itemId]);

  const completeStep = useCallback(async (step: number) => {
    try {
      const newState = await caService.completeFunnelStep(itemId, step);
      setState(newState);
    } catch { /* handled by UI */ }
  }, [itemId]);

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

      {/* Completion celebration */}
      {is_completed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-gradient-to-br from-[#1a3a2a] to-[#1d9e75] p-6 text-center text-white"
        >
          <h2 className="text-lg font-black">✅ Item Complete!</h2>
          <p className="text-sm opacity-80 mt-1">You've covered this current affairs item.</p>
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
                <RichBlocks blocks={item.content_blocks as any} />
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
                I've Read This → Continue to Discussion
              </button>
            </div>
          )}

          {/* Step 3: AI Discussion */}
          {current_step === 3 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-[#1a3a2a]">AI Discussion</h3>
              <p className="text-xs text-[#5d675f]">
                Discuss this news item. Think about the UPSC angle, which GS paper it connects to, and the underlying static concept.
              </p>
              {/* In full implementation, this uses DiscussionOverlay with CA-specific prompts */}
              <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 text-center">
                <MessageSquare className="h-8 w-8 text-[#1d9e75] mx-auto mb-2" />
                <p className="text-xs text-[#49675e]">Discussion mode — think about the UPSC implications</p>
                <button
                  onClick={() => completeStep(3)}
                  className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-xs font-black"
                >
                  Complete Discussion →
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
          {current_step === 5 && !is_completed && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-[#1a3a2a]">Mains Practice (Optional)</h3>
              <p className="text-xs text-[#5d675f]">Practice writing a structured answer for this topic.</p>
              <button
                onClick={() => completeStep(5)}
                className="w-full py-3 rounded-xl border border-[#dcd5c7] text-xs font-black text-[#5d675f]"
              >
                Skip Mains → Complete Item
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Simple MCQ sub-component for CA items
function CAMcqSection({ itemId, onComplete }: { itemId: number; onComplete: () => void }) {
  const [mcqs, setMcqs] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    caService.getCaMcqs(itemId).then(setMcqs).finally(() => setLoading(false));
  }, [itemId]);

  if (loading) return <div className="animate-pulse h-32 bg-[#e7f5ee] rounded-xl" />;
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
    const res = await caService.submitCaMcqs(itemId, answers);
    setResult(res);
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
            {(mcq.options || []).map((opt: any) => (
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
      <button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className={`w-full py-3 rounded-xl text-sm font-black ${
          allAnswered ? 'bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white' : 'bg-[#dcd5c7] text-[#5d675f]'
        }`}
      >
        Submit All ({Object.keys(answers).length}/{mcqs.length})
      </button>
    </div>
  );
}

export default CAItemFunnel;
