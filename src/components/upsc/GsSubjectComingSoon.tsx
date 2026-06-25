"use client";

import { Clock, Compass } from "lucide-react";

/**
 * Placeholder page rendered for GS subjects that are not yet live.
 * Shows a warm "Coming Soon" state consistent with the Sarit Learn design tokens.
 *
 * Used by: polity-governance, economy, environment, history, science-tech,
 *          disaster-management, internal-security-society.
 */
export function GsSubjectComingSoon({ subjectName }: { subjectName: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[#1d9e75]/10 flex items-center justify-center mb-6">
        <Clock className="w-8 h-8 text-[#1d9e75]" />
      </div>

      <h1 className="text-2xl font-semibold text-[#1a3a2a] mb-3">
        {subjectName}
      </h1>

      <p className="text-[#13251d]/60 max-w-md mb-6 leading-relaxed">
        This subject is being prepared with the same depth and rigour as
        Geography. You&apos;ll be notified as soon as it&apos;s ready for study.
      </p>

      <div className="flex items-center gap-2 text-sm text-[#13251d]/40">
        <Compass className="w-4 h-4" />
        <span>Coming Soon</span>
      </div>
    </div>
  );
}
