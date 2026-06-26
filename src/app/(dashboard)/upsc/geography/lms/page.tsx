"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import { useApiConfig } from "@/lib/hooks/useApi";

export default function LmsEntryPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useApiConfig();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    gsLmsService
      .getOnboardingStatus("geography")
      .then((status) => {
        if (status.completed) {
          router.replace("/upsc/geography/lms/syllabus");
        } else {
          router.replace("/upsc/geography/lms/onboarding");
        }
      })
      .catch(() => {
        // Fallback to syllabus on error
        router.replace("/upsc/geography/lms/syllabus");
      });
  }, [router, isLoaded, isSignedIn]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#1d9e75] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
