"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, CheckCircle2, XCircle } from 'lucide-react';
import { caService, type QuickTestMcqOut, type QuickTestResultOut } from '@/services/api/caService';

/**
 * CAQuickTest — "Test Anytime" floating action button + quiz modal.
 * Students can trigger on-demand quizzes from the CA feed.
 *
 * Enhancement 3: Test Anytime
 */

type Scope = 'today' | 'this_week' | 'this_month' | 'subject';

type QuickTestMcq = QuickTestMcqOut;

export function CAQuickTest() {
  const [isOpen, setIsOpen] = useState(false);
  const [scope, setScope] = useState<Scope | null>(null);
  const [mcqs, setMcqs] = useState<QuickTestMcq[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuickTestResultOut | null>(null);
  const [label, setLabel] = useState('');

  const startTest = async (selectedScope: Scope) => {
    setScope(selectedScope);
    setLoading(true);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setError(null);
    setLoadFailed(false);
    try {
      const data = await caService.getQuickTest(selectedScope, 10);
      setMcqs(data.mcqs);
      setLabel(data.quiz_label);
    } catch {
      setMcqs([]);
      setLabel('');
      setLoadFailed(true);
      setError('Quick Test is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== mcqs.length || loading) return;
    setLoading(true);
    setError(null);
    try {
      const submittedResult = await caService.submitQuickTest(
        mcqs.map((mcq) => mcq.id),
        answers,
      );
      setResult(submittedResult);
      setSubmitted(true);
    } catch {
      setError('Your answers could not be scored. Please retry without leaving this test.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-amber-500 text-white shadow-lg hover:shadow-xl hover:bg-amber-600 transition-all"
      >
        <Zap className="h-4 w-4" />
        <span className="text-xs font-black">Quick Test</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Quick Test"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[#dcd5c7] bg-white">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <h2 className="text-sm font-black text-[#13251d]">{label || 'Quick Test'}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setScope(null); setMcqs([]); setLoadFailed(false); setError(null); }}
                  aria-label="Close Quick Test"
                  className="min-h-11 min-w-11 inline-flex items-center justify-center p-2 rounded-lg text-[#5d675f] hover:text-[#13251d]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5">
                {/* Scope selection */}
                {!scope && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#5d675f]">Choose what to test:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'today' as Scope, label: "Today's CA" },
                        { id: 'this_week' as Scope, label: 'This Week' },
                        { id: 'this_month' as Scope, label: 'Last 30 Days' },
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => startTest(opt.id)}
                          className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 text-left hover:border-[#1d9e75] transition-colors"
                        >
                          <span className="text-xs font-black text-[#13251d]">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading */}
                {loading && <div className="py-8 text-center text-xs text-[#5d675f]">Loading questions...</div>}

                {/* Load failed — keep it distinct from an empty scope */}
                {scope && !loading && loadFailed && (
                  <div className="py-8 text-center">
                    <p role="alert" className="text-xs font-semibold text-red-700">{error}</p>
                    <div className="mt-3 flex items-center justify-center gap-3">
                      <button
                        onClick={() => { if (scope) void startTest(scope); }}
                        className="rounded-lg bg-[#1d9e75] px-3 py-2 text-xs font-black text-white"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => { setScope(null); setLoadFailed(false); setError(null); }}
                        className="text-xs font-black text-[#1d9e75]"
                      >
                        Choose another scope
                      </button>
                    </div>
                  </div>
                )}

                {/* No questions */}
                {scope && !loading && !loadFailed && mcqs.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-xs text-[#5d675f]">No MCQs available for this scope.</p>
                    <button onClick={() => setScope(null)} className="mt-2 text-xs font-black text-[#1d9e75]">Try another scope</button>
                  </div>
                )}

                {/* Questions */}
                {mcqs.length > 0 && !submitted && (
                  <div className="space-y-4">
                    {mcqs.map((mcq, idx) => (
                      <div key={mcq.id} className="rounded-lg border border-[#dcd5c7] p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-[#49675e]">Q{idx + 1} — {mcq.item_title}</span>
                          <span className="text-[8px] text-[#5d675f]">{mcq.item_date}</span>
                        </div>
                        <p className="text-xs font-semibold text-[#1f2e26]">{mcq.question_text}</p>
                        <div className="space-y-1.5">
                          {mcq.options.map(opt => (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => setAnswers(prev => ({ ...prev, [mcq.id]: opt.label }))}
                              className={`w-full min-h-11 text-left rounded-lg border p-3 text-xs sm:text-sm font-medium transition-colors ${
                                answers[mcq.id] === opt.label
                                  ? 'border-[#1a3a2a] bg-[#e7f5ee] font-bold text-[#085041]'
                                  : 'border-[#dcd5c7] hover:border-[#b9d9cd] text-[#1f2e26]'
                              }`}
                            >
                              <strong className="mr-1">{opt.label}.</strong> {opt.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={handleSubmit}
                      disabled={Object.keys(answers).length !== mcqs.length || loading}
                      className={`w-full py-3 rounded-xl text-sm font-black ${
                        Object.keys(answers).length === mcqs.length && !loading
                          ? 'bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white'
                          : 'bg-[#dcd5c7] text-[#5d675f]'
                      }`}
                    >
                      {loading ? 'Scoring…' : `Submit (${Object.keys(answers).length}/${mcqs.length})`}
                    </button>
                  </div>
                )}

                {error && !loadFailed && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Results */}
                {submitted && result && (
                  <div className="py-6 text-center space-y-3">
                    <CheckCircle2 className="h-10 w-10 text-[#1d9e75] mx-auto" />
                    <p className="text-lg font-black text-[#13251d]">Quiz Submitted!</p>
                    <p className="text-xs text-[#5d675f]">
                      Score: {result.correct_count}/{result.total_questions} ({result.score}%)
                    </p>
                    <p className="text-xs text-[#5d675f]">
                      This score is authoritative for this submission. It is not saved to history or progress.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setScope(null); setMcqs([]); setSubmitted(false); setResult(null); setAnswers({}); setError(null); setLoadFailed(false); }}
                      className="mt-3 min-h-11 inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[#dcd5c7] text-xs font-black text-[#13251d] hover:border-[#1d9e75] transition-colors"
                    >
                      Take Another Test
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default CAQuickTest;
