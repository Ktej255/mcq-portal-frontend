"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import { useApiConfig } from "@/lib/hooks/useApi";
import { activeAuthProvider } from "@/env";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSubjectLms } from "../SubjectLmsContext";
import { getOnboardingCacheKey } from "@/lib/auth/identity-storage";
import {
  GS_LMS_ACCESS_DENIED_EVENT,
  type GsLmsAccessDeniedDetail,
} from "@/lib/gs-lms/access-events";

const BREADCRUMB_MAP: Record<string, string> = {
  syllabus: "Syllabus",
  topic: "Topic",
  practice: "Practice",
  gaps: "Readiness",
  planner: "Today",
  retro: "Retrospective",
  onboarding: "Onboarding",
  checkpoint: "Review test",
};

// The workspace has to be traversable from every page. Without these links a
// learner on a topic page could only use the browser back button, which breaks
// the "what do I do next" loop the portal exists to close.
const LMS_TABS: Array<{ segment: string; label: string; pages: string[] }> = [
  { segment: "planner", label: "Today", pages: ["planner", "retro"] },
  { segment: "syllabus", label: "Syllabus", pages: ["syllabus", "topic"] },
  { segment: "practice", label: "Practice", pages: ["practice"] },
  { segment: "gaps", label: "Readiness", pages: ["gaps"] },
];

function getLmsPageSegment(pathname: string): string | undefined {
  const segments = pathname.split("/").filter(Boolean);
  const lmsIdx = segments.indexOf("lms");
  return lmsIdx >= 0 ? segments[lmsIdx + 1] : undefined;
}

function getBreadcrumbLabel(pageSegment: string | undefined): string {
  return BREADCRUMB_MAP[pageSegment ?? ""] ?? "Home";
}

/**
 * Shared LMS layout shell: onboarding gate + breadcrumb header, parameterized
 * by the subject from `SubjectLmsContext`. Mirrors the original Geography LMS
 * layout so every subject gets identical navigation/honest-state behaviour.
 */
export function LmsLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useApiConfig();
  const { user } = useAuth();
  const { subject, label, lmsBase } = useSubjectLms();
  const [gateChecked, setGateChecked] = useState(false);
  const [statusRetryCount, setStatusRetryCount] = useState(0);
  const [failedCheckKey, setFailedCheckKey] = useState<string | null>(null);
  // A 403 from the gate means the account is authenticated but has no active
  // cohort grant. That is a different, deliberately worded state from "status
  // unavailable", so it is tracked separately and keyed the same way.
  const [deniedCheck, setDeniedCheck] = useState<{ key: string; message: string } | null>(null);
  const [rechecking, setRechecking] = useState(false);
  const onboardingCacheKey = user?.uid
    ? getOnboardingCacheKey(activeAuthProvider, user.uid, subject)
    : null;
  // An unavailable status is remembered for the exact check that failed, so a
  // retry or subject switch clears it by derivation instead of resetting state
  // at the top of the effect.
  const onboardingCheckKey = `${onboardingCacheKey ?? "anonymous"}:${subject}:${statusRetryCount}`;
  const onboardingStatusUnavailable = failedCheckKey === onboardingCheckKey;
  const accessDenied = deniedCheck?.key === onboardingCheckKey ? deniedCheck : null;

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      queueMicrotask(() => setGateChecked(true));
      return;
    }

    if (!user?.uid || !onboardingCacheKey) {
      queueMicrotask(() => setGateChecked(true));
      return;
    }

    // Skip onboarding check if already on the onboarding page
    if (pathname.includes("/onboarding")) {
      queueMicrotask(() => setGateChecked(true));
      return;
    }

    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(onboardingCacheKey);
      if (cached === "true") {
        queueMicrotask(() => setGateChecked(true));
        return;
      }
    } catch {
      // sessionStorage unavailable (private browsing) — continue to API
    }

    gsLmsService
      .getOnboardingStatus(subject)
      .then((status) => {
        setFailedCheckKey(null);
        if (!status.completed) {
          router.replace(`${lmsBase}/onboarding`);
        } else {
          try {
            sessionStorage.setItem(onboardingCacheKey, "true");
          } catch {
            // Ignore storage errors
          }
          setGateChecked(true);
        }
      })
      .catch((error: unknown) => {
        const response =
          error && typeof error === "object" && "response" in error
            ? (error as { response?: { status?: number; data?: { detail?: unknown } } }).response
            : undefined;

        if (response?.status === 403) {
          const detail = response.data?.detail;
          setDeniedCheck({
            key: onboardingCheckKey,
            message:
              typeof detail === "string" && detail.trim()
                ? detail
                : "This beta area is limited to learners with active cohort access.",
          });
          setGateChecked(true);
          return;
        }

        // Status is unavailable; allow through without treating the student as complete.
        setFailedCheckKey(onboardingCheckKey);
        setGateChecked(true);
      });
  }, [
    pathname,
    router,
    isLoaded,
    isSignedIn,
    user?.uid,
    subject,
    lmsBase,
    onboardingCacheKey,
    onboardingCheckKey,
    statusRetryCount,
  ]);

  // The gate above runs once per subject and is then cached for the tab, but a
  // cohort grant can be revoked while the learner is inside a page. Every GS
  // LMS request is enforced server-side, so the API client reports the first
  // refused request here; the page is replaced by the deliberate denial state
  // instead of a generic load error.
  useEffect(() => {
    const handleAccessDenied = (event: Event) => {
      const message = (event as CustomEvent<Partial<GsLmsAccessDeniedDetail>>).detail?.message;
      if (typeof message !== "string" || !message.trim()) return;
      setDeniedCheck({ key: onboardingCheckKey, message });
      setGateChecked(true);
    };

    window.addEventListener(GS_LMS_ACCESS_DENIED_EVENT, handleAccessDenied);
    return () => window.removeEventListener(GS_LMS_ACCESS_DENIED_EVENT, handleAccessDenied);
  }, [onboardingCheckKey]);

  const retryAccessCheck = () => {
    // A cached gate pass would answer the retry without asking the server, so
    // the retry deliberately drops the cache and re-verifies entitlement. It
    // asks the server directly rather than waiting on the gate effect, because
    // the onboarding path skips that gate by design.
    if (!onboardingCacheKey || rechecking) return;
    try {
      sessionStorage.removeItem(onboardingCacheKey);
    } catch {
      // sessionStorage unavailable — the check below runs regardless
    }
    setRechecking(true);
    gsLmsService
      .getOnboardingStatus(subject)
      .then((status) => {
        try {
          sessionStorage.setItem(onboardingCacheKey, "true");
        } catch {
          // Ignore storage errors
        }
        setFailedCheckKey(null);
        setDeniedCheck(null);
        setGateChecked(true);
        if (!status.completed && !pathname.includes("/onboarding")) {
          router.replace(`${lmsBase}/onboarding`);
        }
      })
      .catch((error: unknown) => {
        const response =
          error && typeof error === "object" && "response" in error
            ? (error as { response?: { status?: number; data?: { detail?: unknown } } }).response
            : undefined;

        if (response?.status === 403) {
          const detail = response.data?.detail;
          setDeniedCheck({
            key: onboardingCheckKey,
            message:
              typeof detail === "string" && detail.trim()
                ? detail
                : "This beta area is limited to learners with active cohort access.",
          });
          return;
        }
        setDeniedCheck(null);
        setFailedCheckKey(onboardingCheckKey);
      })
      .finally(() => setRechecking(false));
  };

  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#fffdf8] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-[#1a3a2a]">Sign in required</h1>
          <p className="mt-2 text-sm text-[#13251d]/60">Sign in to access this learning workspace.</p>
          <a
            href={`/login?redirect=${encodeURIComponent(pathname)}`}
            className="mt-5 inline-flex rounded-lg bg-[#1d9e75] px-4 py-2 text-sm font-semibold text-white"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#fffdf8] flex items-center justify-center p-6">
        <div className="max-w-md text-center" role="alert">
          <h1 className="text-lg font-semibold text-[#1a3a2a]">Beta access not active</h1>
          <p className="mt-2 text-sm text-[#13251d]/70">{accessDenied.message}</p>
          <p className="mt-3 text-sm text-[#13251d]/60">
            Your account is signed in. If you expected to be part of the {label} beta,
            contact the program team so they can activate cohort access for this account.
          </p>
          <button
            type="button"
            onClick={retryAccessCheck}
            disabled={rechecking}
            className="mt-5 rounded-lg bg-[#1d9e75] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {rechecking ? "Checking access…" : "Retry access check"}
          </button>
        </div>
      </div>
    );
  }

  if (onboardingStatusUnavailable && !pathname.includes("/onboarding")) {
    return (
      <div className="min-h-screen bg-[#fffdf8] flex items-center justify-center p-6">
        <div className="max-w-md text-center" role="alert">
          <h1 className="text-lg font-semibold text-[#1a3a2a]">Onboarding status unavailable</h1>
          <p className="mt-2 text-sm text-[#13251d]/60">
            We cannot verify completion right now, so this learning area remains locked until the status is available.
          </p>
          <button
            type="button"
            onClick={() => {
              setGateChecked(false);
              setStatusRetryCount((count) => count + 1);
            }}
            className="mt-5 rounded-lg bg-[#1d9e75] px-4 py-2 text-sm font-semibold text-white"
          >
            Retry status check
          </button>
        </div>
      </div>
    );
  }

  // While checking onboarding status, show minimal loading
  if (!gateChecked && !pathname.includes("/onboarding")) {
    return (
      <div className="min-h-screen bg-[#fffdf8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1d9e75] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pageSegment = getLmsPageSegment(pathname);
  const breadcrumbLabel = getBreadcrumbLabel(pageSegment);
  const showTabs = pageSegment !== "onboarding";

  return (
    <div className="min-h-screen bg-[#fffdf8]">
      {/* Breadcrumb header */}
      <div className="border-b border-[#dcd5c7] bg-white/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-[#13251d]/60">
            <span>{label}</span>
            <span className="text-[#13251d]/30">›</span>
            <span>LMS</span>
            <span className="text-[#13251d]/30">›</span>
            <span className="text-[#1a3a2a] font-medium">{breadcrumbLabel}</span>
          </nav>
        </div>
        {showTabs && (
          <nav
            aria-label="Learning workspace"
            className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto"
          >
            {LMS_TABS.map((tab) => {
              const active = tab.pages.includes(pageSegment ?? "");
              return (
                <Link
                  key={tab.segment}
                  href={`${lmsBase}/${tab.segment}`}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-[#1d9e75] text-[#1a3a2a]"
                      : "border-transparent text-[#13251d]/55 hover:text-[#1a3a2a]"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Page content */}
      {onboardingStatusUnavailable && !pathname.includes("/onboarding") && (
        <div
          className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-center text-sm text-amber-900"
          role="status"
          aria-live="polite"
        >
          Onboarding status is currently unavailable. You can continue, but completion may not be reflected until it is available.
        </div>
      )}
      <div className="max-w-5xl mx-auto">{children}</div>
    </div>
  );
}
