"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useSubjectLms } from "../SubjectLmsContext";

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

export function RetroPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useApiConfig();
  const { subject, lmsBase } = useSubjectLms();
  const [retro, setRetro] = useState<RetroStatus | null>(null);
  const [reflection, setReflection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // `loading` begins true and is cleared by every completion path, so the loader
  // performs no synchronous state write and can be called straight from the
  // mount effect. Retries clear the previous failure from the click handler.
  const fetchRetro = useCallback(() => {
    return gsLmsService
      .getCurrentRetro(subject)
      .then((data) => {
        setRetro(data);
        setError(null);
        if (data.reflection_text) setReflection(data.reflection_text);
        if (data.completed) setDone(true);
      })
      .catch(() => {
        setRetro(null);
        setError("We couldn't load your retrospective. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [subject]);

  const retryFetchRetro = () => {
    setLoading(true);
    setError(null);
    void fetchRetro();
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void fetchRetro();
  }, [isLoaded, isSignedIn, fetchRetro]);

  const handleSubmit = async () => {
    if (!reflection.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await gsLmsService.completeRetro(subject, reflection);
      setDone(true);
    } catch {
      setSubmitError("We couldn't save your retrospective. Please try again.");
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

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="rounded-xl border border-[#ef9f27]/30 bg-[#fff4df] p-5 space-y-3">
          <h1 className="text-lg font-semibold text-[#6f4a12]">Unable to load your retrospective</h1>
          <p className="text-sm text-[#6f4a12]/80">{error}</p>
          <button
            onClick={retryFetchRetro}
            className="inline-flex min-h-11 items-center justify-center px-5 py-2.5 text-sm font-bold text-white bg-[#1d9e75] rounded-lg hover:bg-[#178a65] transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!retro) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-5">
          <h1 className="text-lg font-semibold text-[#1a3a2a]">No retrospective available</h1>
          <p className="text-sm text-[#13251d]/60 mt-1">
            There is no retrospective to review for this subject yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <p className="text-xs font-semibold text-[#1d9e75] uppercase tracking-widest mb-1">
          Week {retro.week_number} · {new Date(retro.plan_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </p>
        <h1 className="text-2xl font-bold text-[#1a3a2a]">Weekly Retrospective</h1>
        <p className="text-sm text-[#13251d]/60 mt-1">
          Reflect on your week. What did you cover? What needs more work?
        </p>
      </div>

      {retro.topics_completed && retro.topics_completed.length > 0 ? (
        <section className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4">
          <h2 className="text-sm font-semibold text-[#1a3a2a] mb-3">Topics Completed This Week</h2>
          <ul className="space-y-1">
            {retro.topics_completed.map((t) => (
              <li key={t.node_id} className="text-sm text-[#13251d]/80 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1d9e75] flex-shrink-0" />
                {t.title}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4">
          <h2 className="text-sm font-semibold text-[#1a3a2a] mb-1">Topics Completed This Week</h2>
          <p className="text-sm text-[#13251d]/65">
            No topic has been fully completed in the last seven days. Partial
            reading is not counted here; a topic only appears when every
            reviewed section is done.
          </p>
          <Link
            href={`${lmsBase}/planner`}
            className="mt-2 inline-block text-sm font-medium text-[#1d9e75] hover:underline"
          >
            Open today&apos;s plan →
          </Link>
        </section>
      )}

      {retro.gap_summary && retro.gap_summary.length > 0 && (
        <section className="rounded-xl border border-[#ef9f27]/30 bg-[#fff4df] p-4">
          <h2 className="text-sm font-semibold text-[#6f4a12] mb-3">Areas That Need Work</h2>
          <ul className="space-y-1">
            {retro.gap_summary.map((g, i) => (
              <li key={i} className="text-sm text-[#6f4a12]/80 flex items-center justify-between">
                <span>{g.type}</span>
                <span className="font-medium">{Math.round(g.accuracy * 100)}% accuracy</span>
              </li>
            ))}
          </ul>
          <Link
            href={`${lmsBase}/gaps`}
            className="mt-2 inline-block text-sm font-medium text-[#6f4a12] underline decoration-[#ef9f27]/50 hover:decoration-[#6f4a12]"
          >
            See which topics this affects in readiness →
          </Link>
        </section>
      )}

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
            className="w-full px-3 py-2 text-base sm:text-sm border border-[#dcd5c7] rounded-lg focus:border-[#1d9e75] focus:ring-1 focus:ring-[#1d9e75] outline-none resize-none"
          />
        )}
      </section>

      {submitError && (
        <div
          role="alert"
          className="rounded-xl border border-[#ef9f27]/30 bg-[#fff4df] p-4 space-y-2"
        >
          <p className="text-sm text-[#6f4a12]">{submitError}</p>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reflection.trim()}
            className="inline-flex min-h-11 items-center justify-center px-5 py-2.5 text-sm font-bold text-white bg-[#1d9e75] rounded-lg hover:bg-[#178a65] transition-colors disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      )}

      {done ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-sm text-[#1d9e75] font-semibold">✓ Retro complete for week {retro.week_number}</span>
          <button
            onClick={() => router.push(`${lmsBase}/planner`)}
            className="inline-flex min-h-11 items-center justify-center px-5 py-2.5 text-sm font-bold text-white bg-[#1d9e75] rounded-lg hover:bg-[#178a65] transition-colors w-full sm:w-auto"
          >
            Back to Planner
          </button>
        </div>
      ) : (
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={() => router.push(`${lmsBase}/planner`)}
            className="inline-flex min-h-11 items-center justify-center px-4 py-2.5 text-sm font-medium text-[#13251d]/70 hover:text-[#1a3a2a] transition-colors w-full sm:w-auto"
          >
            Skip for now
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reflection.trim()}
            className="inline-flex min-h-11 items-center justify-center px-6 py-2.5 text-sm font-bold text-white bg-[#1d9e75] hover:bg-[#178a65] rounded-lg transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            {submitting ? "Saving…" : "Complete Retro"}
          </button>
        </div>
      )}
    </div>
  );
}
