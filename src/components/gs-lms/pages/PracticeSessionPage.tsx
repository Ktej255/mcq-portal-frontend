"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { PracticeSessionOut, PracticeResultOut } from "@/services/api/gsLmsService";
import { PracticeUI } from "../PracticeUI";
import { PracticeResults } from "../PracticeResults";
import { LmsLoadingSkeleton } from "../LmsLoadingSkeleton";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useSubjectLms } from "../SubjectLmsContext";

export function PracticeSessionPage() {
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
      try {
        sessionStorage.setItem(`practice-session-${sessionId}`, JSON.stringify(data));
      } catch { /* sessionStorage unavailable */ }
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
    if (!isLoaded || !isSignedIn) return;
    let restored = false;
    try {
      const stored = sessionStorage.getItem(`practice-session-${sessionId}`);
      if (stored) {
        setSession(JSON.parse(stored));
        restored = true;
      }
    } catch { /* fall through to API */ }
    if (restored) {
      setLoading(false);
    } else {
      fetchSessionFromApi();
    }
  }, [sessionId, fetchSessionFromApi, isLoaded, isSignedIn]);

  useEffect(() => {
    if (session) {
      sessionStorage.setItem(`practice-session-${sessionId}`, JSON.stringify(session));
    }
  }, [session, sessionId]);

  const handleAnswer = async (answer: string) => {
    try {
      const updated = await gsLmsService.answerQuestion(subject, sessionId, answer);
      if (updated.status === "COMPLETED" || updated.current_question === null) {
        handleSubmit();
      } else {
        setSession(updated);
      }
    } catch { /* retry */ }
  };

  const handleSkip = async () => {
    try {
      const updated = await gsLmsService.skipQuestion(subject, sessionId);
      if (updated.status === "COMPLETED" || updated.current_question === null) {
        handleSubmit();
      } else {
        setSession(updated);
      }
    } catch { /* retry */ }
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
        <button onClick={fetchSessionFromApi} className="text-sm text-[#1d9e75] hover:underline">
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
        <a href={`${lmsBase}/practice`} className="text-sm text-[#1d9e75] hover:underline">
          ← Back to topic selector
        </a>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <PracticeResults result={result} />
      </div>
    );
  }

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

  if (!session) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-[#13251d]/60 mb-4">
          Session data not found. This may happen on page refresh.
        </p>
        <button onClick={fetchSessionFromApi} className="text-sm text-[#1d9e75] hover:underline mr-4">
          Retry
        </button>
        <a href={`${lmsBase}/practice`} className="text-sm text-[#1d9e75] hover:underline">
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
