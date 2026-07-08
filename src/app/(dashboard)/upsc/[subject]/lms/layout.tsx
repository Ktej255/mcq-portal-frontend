"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import { useApiConfig } from "@/lib/hooks/useApi";
import { SubjectLmsProvider, useSubjectLms } from "@/components/gs-lms/SubjectLmsContext";

const ONBOARDING_CACHE_KEY_PREFIX = "lms-onboarding-completed-";

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
  // Find the segment after "lms"
  const lmsIdx = segments.indexOf("lms");
  const pageSegment = lmsIdx >= 0 ? segments[lmsIdx + 1] : undefined;
  return BREADCRUMB_MAP[pageSegment ?? ""] ?? "Home";
}

function LmsLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useApiConfig();
  const [gateChecked, setGateChecked] = useState(false);
  const { subject, label, lmsBase } = useSubjectLms();

  const onboardingCacheKey = `${ONBOARDING_CACHE_KEY_PREFIX}${subject}`;

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    // Skip onboarding check if already on the onboarding page
    if (pathname.includes("/onboarding")) {
      setGateChecked(true);
      return;
    }

    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(onboardingCacheKey);
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
            sessionStorage.setItem(onboardingCacheKey, "true");
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
  }, [pathname, router, isLoaded, isSignedIn, subject, lmsBase, onboardingCacheKey]);

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

export default function LmsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ subject: string }>();
  const subject = params.subject || "geography";

  const labelMap: Record<string, string> = {
    geography: "Geography",
    "polity-governance": "Polity & Governance",
    economy: "Economy",
    history: "History",
    "science-tech": "Science & Tech",
    environment: "Environment",
    "disaster-management": "Disaster Management",
    "internal-security-society": "Internal Security & Society",
    csat: "CSAT",
  };
  const label = labelMap[subject] || subject.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <SubjectLmsProvider subject={subject} label={label}>
      <LmsLayoutInner>{children}</LmsLayoutInner>
    </SubjectLmsProvider>
  );
}
