"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { PracticeSessionOut, PracticeResultOut } from "@/services/api/gsLmsService";
import { PracticeUI } from "@/components/gs-lms/PracticeUI";
import { PracticeResults } from "@/components/gs-lms/PracticeResults";
import { LmsLoadingSkeleton } from "@/components/gs-lms/LmsLoadingSkeleton";

export default function PracticeSessionPage() {
  const params = useParams();
  const sessionId = Number(params.sessionId);

  const [session, setSession] = useState<PracticeSessionOut | null>(null);
  const [result, setResult] = useState<PracticeResultOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`practice-session-${sessionId}`);
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch {
        setError("Could not restore session. Please start a new practice.");
      }
    }
    setLoading(false);
  }, [sessionId]);

  // Persist session to sessionStorage on updates
  useEffect(() => {
    if (session) {
      sessionStorage.setItem(
        `practice-session-${sessionId}`,
        JSON.stringify(session)
      );
    }
  }, [session, sessionId]);

  const handleAnswer = async (answer: string) => {
    try {
      const updated = await gsLmsService.answerQuestion(sessionId, answer);
      if (updated.status === "COMPLETED" || updated.current_question === null) {
        // All questions answered — submit for results
        handleSubmit();
      } else {
        setSession(updated);
      }
    } catch {
      // Let user retry
    }
  };

  const handleSkip = async () => {
    try {
      const updated = await gsLmsService.skipQuestion(sessionId);
      if (updated.status === "COMPLETED" || updated.current_question === null) {
        handleSubmit();
      } else {
        setSession(updated);
      }
    } catch {
      // Let user retry
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await gsLmsService.submitPractice(sessionId);
      setResult(res);
      sessionStorage.removeItem(`practice-session-${sessionId}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Submit failed")
          : "Submit failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LmsLoadingSkeleton variant="content" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  // Show results if we have them
  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <PracticeResults result={result} />
      </div>
    );
  }

  // Show submitting state
  if (submitting) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#1d9e75] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#13251d]/60">Submitting your answers…</p>
        </div>
      </div>
    );
  }

  // No session loaded yet (e.g. page refresh without stored data)
  if (!session) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-[#13251d]/60 mb-4">
          Session data not found. This may happen on page refresh.
        </p>
        <a
          href="/upsc/geography/lms/practice"
          className="text-sm text-[#1d9e75] hover:underline"
        >
          ← Back to topic selector
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-[#fffdf8] rounded-xl border border-[#dcd5c7]">
      <PracticeUI session={session} onAnswer={handleAnswer} onSkip={handleSkip} />
    </div>
  );
}
