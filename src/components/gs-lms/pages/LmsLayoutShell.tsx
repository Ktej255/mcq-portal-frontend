"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useSubjectLms } from "../SubjectLmsContext";

const ONBOARDING_CACHE_KEY = "lms-onboarding-completed";

const BREADCRUMB_MAP: Record<string, string> = {
  syllabus: "Syllabus",
  topic: "Topic",
  practice: "Practice",
  gaps: "Gaps",
  planner: "Planner",
  onboarding: "Onboarding",
};

function getBreadcrumbLabel(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const lmsIdx = segments.indexOf("lms");
  const pageSegment = lmsIdx >= 0 ? segments[lmsIdx + 1] : undefined;
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
  const { subject, label, lmsBase } = useSubjectLms();
  const [gateChecked, setGateChecked] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    // Skip onboarding check if already on the onboarding page
    if (pathname.includes("/onboarding")) {
      setGateChecked(true);
      return;
    }

    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(ONBOARDING_CACHE_KEY);
      if (cached === "true") {
        setGateChecked(true);
        return;
      }
    } catch {
      // sessionStorage unavailable (private browsing) — continue to API
    }

    gsLmsService
      .getOnboardingStatus(subject)
      .then((status) => {
        if (!status.completed) {
          router.replace(`${lmsBase}/onboarding`);
        } else {
          try {
            sessionStorage.setItem(ONBOARDING_CACHE_KEY, "true");
          } catch {
            // Ignore storage errors
          }
          setGateChecked(true);
        }
      })
      .catch(() => {
        // On error, allow through (don't block the student)
        setGateChecked(true);
      });
  }, [pathname, router, subject, lmsBase]);

  // While checking onboarding status, show minimal loading
  if (!gateChecked && !pathname.includes("/onboarding")) {
    return (
      <div className="min-h-screen bg-[#fffdf8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1d9e75] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const breadcrumbLabel = getBreadcrumbLabel(pathname);

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
      </div>

      {/* Page content */}
      <div className="max-w-5xl mx-auto">{children}</div>
    </div>
  );
}
