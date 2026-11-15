"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useSubjectLms } from "../SubjectLmsContext";

/**
 * LMS entry — redirects to onboarding or syllabus based on the student's
 * onboarding status for the current subject.
 */
export function LmsEntryPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useApiConfig();
  const { subject, lmsBase } = useSubjectLms();
  const [retryCount, setRetryCount] = useState(0);
  const [failedAttempt, setFailedAttempt] = useState<string | null>(null);

  // The attempt is identified by its inputs, so a retry or a subject switch
  // clears the previous failure by derivation instead of by resetting state at
  // the start of the effect.
  const attemptKey = `${subject}:${lmsBase}:${retryCount}`;
  const ready = isLoaded && isSignedIn;
  const error =
    failedAttempt === attemptKey
      ? "We couldn't load your onboarding status. Please try again."
      : null;
  const loading = ready && error === null;

  useEffect(() => {
    if (!ready) return;

    let active = true;

    gsLmsService
      .getOnboardingStatus(subject)
      .then((status) => {
        if (!active) return;
        if (status.completed) {
          router.replace(`${lmsBase}/syllabus`);
        } else {
          router.replace(`${lmsBase}/onboarding`);
        }
      })
      .catch(() => {
        if (active) setFailedAttempt(attemptKey);
      });

    return () => {
      active = false;
    };
  }, [ready, isLoaded, isSignedIn, router, subject, lmsBase, attemptKey]);

  if (!isLoaded) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center" role="status">
        <p className="text-sm text-[#13251d]/70">Checking your sign-in status…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="max-w-md px-6 text-center" role="alert">
          <p className="text-sm text-[#13251d]/70">Please sign in to access this LMS.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="max-w-md px-6 text-center space-y-3" role="alert">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="text-sm font-medium text-[#1d9e75] hover:underline disabled:opacity-50"
            disabled={loading}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[40vh] flex items-center justify-center" role="status">
      <div className="w-6 h-6 border-2 border-[#1d9e75] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
