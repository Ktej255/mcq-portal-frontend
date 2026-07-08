"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useSubjectLms } from "@/components/gs-lms/SubjectLmsContext";

interface RetroStatus {
  id: number;
  week_number: number;
  plan_date: string;
  topics_completed: Array<{ node_id: number; title: string }> | null;
  gap_summary: Array<{ type: string; accuracy: number }> | null;
  reflection_text: string | null;
  completed: boolean;
  completed_at: string | null;
}

export default function RetroPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useApiConfig();
  const { subject, lmsBase } = useSubjectLms();
  const [retro, setRetro] = useState<RetroStatus | null>(null);
  const [reflection, setReflection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    gsLmsService
      .getCurrentRetro(subject)
      .then((data) => {
        setRetro(data);
        if (data.reflection_text) setReflection(data.reflection_text);
        if (data.completed) setDone(true);
      })
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn, subject]);

  const handleSubmit = async () => {
    if (!reflection.trim()) return;
    setSubmitting(true);
    try {
      await gsLmsService.completeRetro(subject, reflection);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-6 h-6 border-2 border-[#1d9e75] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!retro) return null;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <p className="text-xs font-semibold text-[#1d9e75] uppercase tracking-widest mb-1">
          Week {retro.week_number} · {new Date(retro.plan_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </p>
        <h1 className="text-2xl font-bold text-[#1a3a2a]">Weekly Retrospective</h1>
        <p className="text-sm text-[#13251d]/60 mt-1">
          Reflect on your week. What did you cover? What needs more work?
        </p>
      </div>

      {/* Topics completed this week */}
      {retro.topics_completed && retro.topics_completed.length > 0 && (
        <section className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4">
          <h2 className="text-sm font-semibold text-[#1a3a2a] mb-3">✅ Topics Completed This Week</h2>
          <ul className="space-y-1">
            {retro.topics_completed.map((t) => (
              <li key={t.node_id} className="text-sm text-[#13251d]/80 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1d9e75] flex-shrink-0" />
                {t.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Weak areas */}
      {retro.gap_summary && retro.gap_summary.length > 0 && (
        <section className="rounded-xl border border-[#ef9f27]/30 bg-[#fff4df] p-4">
          <h2 className="text-sm font-semibold text-[#6f4a12] mb-3">⚠️ Areas That Need Work</h2>
          <ul className="space-y-1">
            {retro.gap_summary.map((g, i) => (
              <li key={i} className="text-sm text-[#6f4a12]/80 flex items-center justify-between">
                <span>{g.type}</span>
                <span className="font-medium">{Math.round(g.accuracy * 100)}% accuracy</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Reflection prompt */}
      <section className="rounded-xl border border-[#dcd5c7] bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#1a3a2a]">📝 Your Reflection</h2>
        <p className="text-xs text-[#13251d]/50">
          What felt hard this week? What patterns do you notice in your gaps?
        </p>
        {done ? (
          <p className="text-sm text-[#13251d]/80 italic">&quot;{retro.reflection_text || reflection}&quot;</p>
        ) : (
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={4}
            placeholder="Write your reflection here…"
            className="w-full px-3 py-2 text-sm border border-[#dcd5c7] rounded-lg focus:border-[#1d9e75] focus:ring-1 focus:ring-[#1d9e75] outline-none resize-none"
          />
        )}
      </section>

      {/* Actions */}
      {done ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#1d9e75] font-medium">✓ Retro complete for week {retro.week_number}</span>
          <button
            onClick={() => router.push(`${lmsBase}/planner`)}
            className="ml-auto px-4 py-2 text-sm font-medium text-white bg-[#1d9e75] rounded-lg hover:bg-[#178a65] transition-colors"
          >
            Back to Planner
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`${lmsBase}/planner`)}
            className="px-4 py-2 text-sm text-[#13251d]/60 hover:text-[#1a3a2a] transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reflection.trim()}
            className="px-5 py-2 text-sm font-medium text-white bg-[#1d9e75] hover:bg-[#178a65] rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Complete Retro"}
          </button>
        </div>
      )}
    </div>
  );
}
