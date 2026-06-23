"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";

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
  // Find the segment after "lms"
  const lmsIdx = segments.indexOf("lms");
  const pageSegment = lmsIdx >= 0 ? segments[lmsIdx + 1] : undefined;
  return BREADCRUMB_MAP[pageSegment ?? ""] ?? "Home";
}

export default function LmsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [gateChecked, setGateChecked] = useState(false);

  useEffect(() => {
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
      .getOnboardingStatus()
      .then((status) => {
        if (!status.completed) {
          router.replace("/upsc/geography/lms/onboarding");
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
  }, [pathname, router]);

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
            <span>Geography</span>
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
