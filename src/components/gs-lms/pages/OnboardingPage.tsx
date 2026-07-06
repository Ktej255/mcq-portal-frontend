"use client";

import { OnboardingWizard } from "../OnboardingWizard";

/**
 * Onboarding page — renders the shared onboarding wizard. The wizard reads
 * the subject/paths from `SubjectLmsContext`.
 */
export function OnboardingPage() {
  return <OnboardingWizard />;
}
