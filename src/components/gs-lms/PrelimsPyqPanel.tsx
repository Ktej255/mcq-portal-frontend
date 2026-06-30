"use client";

import { useState, useEffect } from 'react';
import { ScrollText, CheckCircle2 } from 'lucide-react';
import { gsLmsService, PyqOut } from '@/services/api/gsLmsService';

/**
 * PrelimsPyqPanel — surfaces Prelims previous-year questions for a topic with
 * a reveal-answer interaction. Shown inside the Mains tab so the funnel
 * exposes BOTH Prelims and Mains PYQs after the Traps step.
 */

interface PrelimsPyqPanelProps {
  nodeId: number;
  subject?: string;
}

export function PrelimsPyqPanel({ nodeId, subject = "geography" }: PrelimsPyqPanelProps) {
  const [pyqs, setPyqs] = useState<PyqOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<number, PyqOut>>({});

  useEffect(() => {
    gsLmsService
      .getTopicPyqs(subject, nodeId, "PRELIMS")
      .then((res) => setPyqs(res.pyqs))
      .catch(() => setPyqs([]))
      .finally(() => setLoading(false));
  }, [nodeId, subject]);

  const handleReveal = async (pyqId: number) => {
    try {
      const full = await gsLmsService.revealPyqAnswer(subject, pyqId);
      setRevealed((prev) => ({ ...prev, [pyqId]: full }));
    } catch {
      /* ignore — keep question visible without answer */
    }
  };

  if (loading || pyqs.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#dcd5c7] bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-[#1d9e75]" />
        <h3 className="text-sm font-black text-[#13251d]">
          Prelims PYQs ({pyqs.length})
        </h3>
      </div>

      {pyqs.map((q, idx) => {
        const full = revealed[q.id];
        return (
          <div key={q.id} className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#1d9e75]/10 border border-[#b9d9cd] px-2 py-0.5 text-[9px] font-black text-[#1a3a2a]">
                PRELIMS • {q.year}
              </span>
              {q.question_type && (
                <span className="text-[9px] text-[#5d675f]">{q.question_type.replace(/_/g, ' ')}</span>
              )}
            </div>
            <p className="text-sm text-[#1f2e26] leading-relaxed whitespace-pre-wrap">
              {idx + 1}. {q.question_text}
            </p>
            {full?.answer_text ? (
              <div className="rounded-lg bg-[#e9f6f0] border border-[#bfe3d3] p-3 space-y-1">
                <p className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wide text-[#1a3a2a]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Answer: {full.answer_text}
                </p>
                {full.explanation && (
                  <p className="text-xs leading-6 text-[#31443a]">{full.explanation}</p>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleReveal(q.id)}
                className="rounded-lg bg-[#1d9e75] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#178a65] transition-colors"
              >
                Reveal Answer
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PrelimsPyqPanel;
