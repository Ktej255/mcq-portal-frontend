"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, CheckCircle2, XCircle } from 'lucide-react';
import { apiClient } from '@/services/api/client';

/**
 * CAQuickTest — "Test Anytime" floating action button + quiz modal.
 * Students can trigger on-demand quizzes from the CA feed.
 *
 * Enhancement 3: Test Anytime
 */

const unwrap = <T,>(data: unknown): T => {
  const record = (data && typeof data === 'object' ? (data as Record<string, unknown>) : {});
  return (record.data ?? record) as T;
};

interface QuickTestMcq {
  id: number;
  question_text: string;
  question_type: string;
  options: Array<{ label: string; text: string }>;
  item_title: string;
  item_date: string;
}

type Scope = 'today' | 'this_week' | 'this_month' | 'subject';

export function CAQuickTest() {
  const [isOpen, setIsOpen] = useState(false);
  const [scope, setScope] = useState<Scope | null>(null);
  const [mcqs, setMcqs] = useState<QuickTestMcq[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState('');

  const startTest = async (selectedScope: Scope) => {
    setScope(selectedScope);
    setLoading(true);
    setAnswers({});
    setSubmitted(false);
    try {
      const res = await apiClient.get(`current-affairs/quick-test?scope=${selectedScope}&count=10`);
      const data = unwrap<{ quiz_label: string; mcqs: QuickTestMcq[]; total_count: number }>(res.data);
      setMcqs(data.mcqs);
      setLabel(data.quiz_label);
    } catch {
      setMcqs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => setSubmitted(true);

  // Simple scoring (no backend call needed for quick test — correct answers not sent to client)
  const score = submitted ? Object.keys(answers).length : 0;

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
                <button onClick={() => { setIsOpen(false); setScope(null); setMcqs([]); }} className="text-[#5d675f] hover:text-[#13251d]">
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

                {/* No questions */}
                {scope && !loading && mcqs.length === 0 && (
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
                              onClick={() => setAnswers(prev => ({ ...prev, [mcq.id]: opt.label }))}
                              className={`w-full text-left rounded-md border p-2 text-[10px] transition-colors ${
                                answers[mcq.id] === opt.label
                                  ? 'border-[#1a3a2a] bg-[#e7f5ee]'
                                  : 'border-[#dcd5c7] hover:border-[#b9d9cd]'
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
                      disabled={Object.keys(answers).length !== mcqs.length}
                      className={`w-full py-3 rounded-xl text-sm font-black ${
                        Object.keys(answers).length === mcqs.length
                          ? 'bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white'
                          : 'bg-[#dcd5c7] text-[#5d675f]'
                      }`}
                    >
                      Submit ({Object.keys(answers).length}/{mcqs.length})
                    </button>
                  </div>
                )}

                {/* Results */}
                {submitted && (
                  <div className="py-6 text-center space-y-3">
                    <CheckCircle2 className="h-10 w-10 text-[#1d9e75] mx-auto" />
                    <p className="text-lg font-black text-[#13251d]">Quiz Submitted!</p>
                    <p className="text-xs text-[#5d675f]">{Object.keys(answers).length} questions answered</p>
                    <button
                      onClick={() => { setScope(null); setMcqs([]); setSubmitted(false); setAnswers({}); }}
                      className="mt-3 px-4 py-2 rounded-lg border border-[#dcd5c7] text-xs font-black text-[#5d675f]"
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
