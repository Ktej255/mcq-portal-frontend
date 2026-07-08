"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { PracticeSessionOut, PracticeResultOut } from "@/services/api/gsLmsService";
import { PracticeUI } from "@/components/gs-lms/PracticeUI";
import { PracticeResults } from "@/components/gs-lms/PracticeResults";
import { LmsLoadingSkeleton } from "@/components/gs-lms/LmsLoadingSkeleton";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useSubjectLms } from "@/components/gs-lms/SubjectLmsContext";

export default function PracticeSessionPage() {
  const params = useParams();
  const sessionId = Number(params.sessionId);
  const { isLoaded, isSignedIn } = useApiConfig();
  const { subject, lmsBase } = useSubjectLms();
  const [session, setSession] = useState<PracticeSessionOut | null>(null);
  const [result, setResult] = useState<PracticeResultOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchSessionFromApi = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const data = await gsLmsService.getPracticeSession(subject, sessionId);
      setSession(data);
      // Persist to sessionStorage for future reloads
      try {
        sessionStorage.setItem(
          `practice-session-${sessionId}`,
          JSON.stringify(data)
        );
      } catch {
        // sessionStorage unavailable (private browsing) — continue without caching
      }
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 404) {
        setNotFound(true);
      } else {
        setError("Could not load session. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId, subject]);

  useEffect(() => {
    // Wait for auth before making API calls
    if (!isLoaded || !isSignedIn) return;

    let restored = false;
    try {
      const stored = sessionStorage.getItem(`practice-session-${sessionId}`);
      if (stored) {
        setSession(JSON.parse(stored));
        restored = true;
      }
    } catch {
      // JSON parse failed or sessionStorage unavailable — fall through to API
    }

    if (restored) {
      setLoading(false);
    } else {
      // Fallback: fetch from backend API
      fetchSessionFromApi();
    }
  }, [sessionId, fetchSessionFromApi, isLoaded, isSignedIn]);

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
      const updated = await gsLmsService.answerQuestion(subject, sessionId, answer);
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
      const updated = await gsLmsService.skipQuestion(subject, sessionId);
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
      const res = await gsLmsService.submitPractice(subject, sessionId);
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
      <div className="p-6 text-center">
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchSessionFromApi}
          className="text-sm text-[#1d9e75] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-[#13251d]/60 mb-4">
          Session not found. It may have expired or already been submitted.
        </p>
        <a
          href={`${lmsBase}/practice`}
          className="text-sm text-[#1d9e75] hover:underline"
        >
          ← Back to topic selector
        </a>
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

  // No session loaded (unexpected — API fallback should have handled this)
  if (!session) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-[#13251d]/60 mb-4">
          Session data not found. This may happen on page refresh.
        </p>
        <button
          onClick={fetchSessionFromApi}
          className="text-sm text-[#1d9e75] hover:underline mr-4"
        >
          Retry
        </button>
        <a
          href={`${lmsBase}/practice`}
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
