"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { PracticeSessionOut, PracticeResultOut } from "@/services/api/gsLmsService";
import { PracticeUI } from "../PracticeUI";
import { PracticeResults } from "../PracticeResults";
import { LmsLoadingSkeleton } from "../LmsLoadingSkeleton";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useSubjectLms } from "../SubjectLmsContext";
import { parsePositiveRouteId } from "@/lib/gsLmsRoutePolicy";

type PracticeAction =
  | { kind: "answer"; answer: string }
  | { kind: "skip" };

export function PracticeSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = parsePositiveRouteId(params.sessionId);
  const { isLoaded, isSignedIn } = useApiConfig();
  const { subject, lmsBase } = useSubjectLms();
  const [session, setSession] = useState<PracticeSessionOut | null>(null);
  const [result, setResult] = useState<PracticeResultOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorRetryAction, setErrorRetryAction] = useState<"load" | "submit">("load");
  const [actionError, setActionError] = useState<string | null>(null);
  const [failedAction, setFailedAction] = useState<PracticeAction | null>(null);
  const [notFound, setNotFound] = useState(false);
  const actionInFlightRef = useRef(false);
  const submitInFlightRef = useRef(false);

  const fetchSessionFromApi = useCallback(async () => {
    if (sessionId === null) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setErrorRetryAction("load");
    setNotFound(false);
    try {
      const data = await gsLmsService.getPracticeSession(subject, sessionId);
      if (data.status === "SUBMITTED") {
        const res = await gsLmsService.submitPractice(subject, sessionId);
        setResult(res);
        setLoading(false);
        return;
      }
      setSession(data);
      try {
        sessionStorage.setItem(
          `practice-session-${subject}-${sessionId}`,
          JSON.stringify(data),
        );
      } catch { /* sessionStorage unavailable */ }
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 404) {
        // Attempt to replay submitted result before declaring 404
        try {
          const res = await gsLmsService.submitPractice(subject, sessionId);
          setResult(res);
          setLoading(false);
          return;
        } catch {
          setNotFound(true);
        }
      } else {
        setError("Could not load session. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId, subject]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    queueMicrotask(() => {
      if (sessionId === null) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      let restored = false;
      try {
        const stored = sessionStorage.getItem(
          `practice-session-${subject}-${sessionId}`,
        );
        if (stored) {
          setSession(JSON.parse(stored));
          restored = true;
        }
      } catch { /* fall through to API */ }
      if (restored) {
        setLoading(false);
      } else {
        void fetchSessionFromApi();
      }
    });
  }, [sessionId, subject, fetchSessionFromApi, isLoaded, isSignedIn]);

  useEffect(() => {
    if (sessionId === null || !session) return;
    try {
      sessionStorage.setItem(
        `practice-session-${subject}-${sessionId}`,
        JSON.stringify(session),
      );
    } catch {
      // sessionStorage unavailable; the backend remains authoritative.
    }
  }, [session, sessionId, subject]);

  const handleAnswer = async (answer: string) => {
    if (sessionId === null || actionInFlightRef.current || submitInFlightRef.current) return;

    actionInFlightRef.current = true;
    setActionError(null);
    setFailedAction(null);
    try {
      const updated = await gsLmsService.answerQuestion(subject, sessionId, answer);
      if (updated.status === "COMPLETED" || updated.current_question === null) {
        await handleSubmit();
      } else {
        setSession(updated);
      }
    } catch {
      setActionError("We couldn't save that answer. Please try again.");
      setFailedAction({ kind: "answer", answer });
    } finally {
      actionInFlightRef.current = false;
    }
  };

  const handleSkip = async () => {
    if (sessionId === null || actionInFlightRef.current || submitInFlightRef.current) return;

    actionInFlightRef.current = true;
    setActionError(null);
    setFailedAction(null);
    try {
      const updated = await gsLmsService.skipQuestion(subject, sessionId);
      if (updated.status === "COMPLETED" || updated.current_question === null) {
        await handleSubmit();
      } else {
        setSession(updated);
      }
    } catch {
      setActionError("We couldn't skip that question. Please try again.");
      setFailedAction({ kind: "skip" });
    } finally {
      actionInFlightRef.current = false;
    }
  };

  const retryFailedAction = () => {
    if (!failedAction) return;
    if (failedAction.kind === "answer") {
      void handleAnswer(failedAction.answer);
    } else {
      void handleSkip();
    }
  };

  const handleSubmit = useCallback(async () => {
    if (sessionId === null || submitInFlightRef.current) return;

    submitInFlightRef.current = true;
    setSubmitting(true);
    setError(null);
    setErrorRetryAction("submit");
    try {
      const res = await gsLmsService.submitPractice(subject, sessionId);
      setResult(res);
      sessionStorage.removeItem(`practice-session-${subject}-${sessionId}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Submit failed")
          : "Submit failed";
      setError(msg);
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  }, [sessionId, subject]);

  // If session is already completed (all questions answered/skipped) and no result is set, auto-submit
  useEffect(() => {
    if (!session || result || submitting) return;
    if (session.status === "COMPLETED" || session.current_question === null) {
      void handleSubmit();
    }
  }, [session, result, submitting, handleSubmit]);

  if (sessionId === null) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-lg font-semibold text-[#1a3a2a]">Session not found</h1>
        <p className="mt-2 text-sm text-[#13251d]/60">
          The practice-session URL is invalid. Start a new session from the topic selector.
        </p>
        <a href={`${lmsBase}/practice`} className="mt-4 inline-block text-sm text-[#1d9e75] hover:underline">
          ← Back to topic selector
        </a>
      </div>
    );
  }

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
          onClick={errorRetryAction === "submit" ? () => void handleSubmit() : fetchSessionFromApi}
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
        <a href={`${lmsBase}/practice`} className="text-sm text-[#1d9e75] hover:underline">
          ← Back to topic selector
        </a>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <PracticeResults result={result} nodeId={session?.syllabus_node_id} />
        <div className="mt-6 text-center">
          <a href={`${lmsBase}/practice`} className="text-sm text-[#1d9e75] hover:underline">
            ← Back to practice selector
          </a>
        </div>
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
      {actionError ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-t-xl bg-[#fff4e5] px-4 py-3 text-xs text-[#8c5d14]"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={retryFailedAction}
            className="shrink-0 font-semibold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      ) : null}
      <PracticeUI session={session} onAnswer={handleAnswer} onSkip={handleSkip} />
    </div>
  );
}
