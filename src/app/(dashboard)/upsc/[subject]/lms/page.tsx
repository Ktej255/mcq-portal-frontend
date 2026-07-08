"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useSubjectLms } from "@/components/gs-lms/SubjectLmsContext";

export default function LmsEntryPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useApiConfig();
  const { subject, lmsBase } = useSubjectLms();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    gsLmsService
      .getOnboardingStatus(subject)
      .then((status) => {
        if (status.completed) {
          router.replace(`${lmsBase}/syllabus`);
        } else {
          router.replace(`${lmsBase}/onboarding`);
        }
      })
      .catch(() => {
        // Fallback to syllabus on error
        router.replace(`${lmsBase}/syllabus`);
      });
  }, [router, isLoaded, isSignedIn, subject, lmsBase]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#1d9e75] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
