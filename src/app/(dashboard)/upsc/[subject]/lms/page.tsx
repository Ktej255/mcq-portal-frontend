"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";

/**
 * Dynamic [subject] LMS entry page.
 *
 * Routing behavior:
 * - If subject is "geography", redirect to the existing static route
 *   at /upsc/geography/lms (which has its own onboarding gate and full LMS).
 * - For any other subject, display a "Coming Soon" placeholder.
 *
 * NOTE: In Next.js App Router, static segments take priority over dynamic ones.
 * Since /upsc/geography/ is a static directory, requests to /upsc/geography/lms/*
 * are served by the static route — they never reach this dynamic route.
 * This page primarily handles subjects that don't have their own static directory,
 * and acts as a safety fallback if somehow reached for "geography".
 */
export default function SubjectLmsPage() {
  const params = useParams<{ subject: string }>();
  const router = useRouter();
  const subject = params.subject;

  // Safety redirect: if somehow this dynamic route is reached for geography,
  // redirect to the static geography LMS route.
  useEffect(() => {
    if (subject === "geography") {
      router.replace("/upsc/geography/lms");
    }
  }, [subject, router]);

  // While redirecting geography, show a spinner
  if (subject === "geography") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#fffdf8]">
        <div className="w-6 h-6 border-2 border-[#1d9e75] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Format subject slug for display (e.g., "polity-governance" → "Polity Governance")
  const displayName = subject
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#fffdf8]">
      <div className="max-w-md mx-auto text-center px-6 py-12">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#1d9e75]/10 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-[#1d9e75]" />
        </div>
        <h1 className="text-2xl font-semibold text-[#1a3a2a] mb-3">
          {displayName} LMS
        </h1>
        <p className="text-[#13251d]/60 text-base leading-relaxed mb-6">
          The structured learning system for {displayName} is coming soon.
          You&apos;ll get the same syllabus-driven, discussion-based learning
          experience currently available for Geography.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1d9e75]/10 text-[#1d9e75] text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-[#1d9e75] animate-pulse" />
          Coming Soon
        </div>
      </div>
    </div>
  );
}
