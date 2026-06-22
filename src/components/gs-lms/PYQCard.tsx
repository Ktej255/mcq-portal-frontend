"use client";

import { useState } from "react";
import type { PyqOut } from "@/services/api/gsLmsService";

interface PYQCardProps {
  pyq: PyqOut;
  onReveal: (pyqId: number) => Promise<void>;
}

export function PYQCard({ pyq, onReveal }: PYQCardProps) {
  const [revealed, setRevealed] = useState(pyq.revealed);
  const [revealing, setRevealing] = useState(false);

  const handleReveal = async () => {
    setRevealing(true);
    try {
      await onReveal(pyq.id);
      setRevealed(true);
    } finally {
      setRevealing(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4">
      {/* Header: year badge + marks */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1a3a2a] text-white">
          {pyq.year}
        </span>
        {pyq.exam_type === "MAINS" && pyq.marks != null && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#1d9e75]/15 text-[#1a3a2a]">
            {pyq.marks} marks
          </span>
        )}
      </div>

      {/* Question text */}
      <p className="text-sm text-[#13251d] leading-relaxed mb-4">
        {pyq.question_text}
      </p>

      {/* Reveal section */}
      {!revealed ? (
        <button
          onClick={handleReveal}
          disabled={revealing}
          className="text-sm font-medium text-[#1d9e75] hover:text-[#178a65] transition-colors disabled:opacity-50"
        >
          {revealing ? "Revealing…" : "Reveal Answer"}
        </button>
      ) : (
        <div className="space-y-2 pt-3 border-t border-[#dcd5c7]">
          {pyq.answer_text && (
            <div>
              <span className="text-xs font-semibold text-[#1a3a2a] uppercase">Answer</span>
              <p className="text-sm text-[#13251d] mt-1">{pyq.answer_text}</p>
            </div>
          )}
          {pyq.explanation && (
            <div>
              <span className="text-xs font-semibold text-[#1a3a2a] uppercase">Explanation</span>
              <p className="text-sm text-[#13251d]/80 mt-1 leading-relaxed">
                {pyq.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
