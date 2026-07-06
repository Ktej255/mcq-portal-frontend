"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * Shared subject context for the GS LMS.
 *
 * The Geography LMS was built first and several of its pages/components
 * hard-coded `"geography"` and `/upsc/geography/lms/...` paths. To reuse the
 * same shell for Environment, Disaster Management, and future GS subjects,
 * every subject-specific value flows through this context instead.
 *
 * `lmsBase` is derived from the subject slug so the route helpers stay in
 * sync with the Next.js route segments under
 * `app/(dashboard)/upsc/<slug>/lms/...`.
 */

export type SubjectLmsContextValue = {
  /** URL-safe subject slug, e.g. "geography", "environment", "disaster-management". */
  subject: string;
  /** Display name shown in breadcrumbs, headings, etc. */
  label: string;
  /** Base path for this subject's LMS routes, e.g. "/upsc/environment/lms". */
  lmsBase: string;
};

const DEFAULT_VALUE: SubjectLmsContextValue = {
  subject: "geography",
  label: "Geography",
  lmsBase: "/upsc/geography/lms",
};

const SubjectLmsContext = createContext<SubjectLmsContextValue>(DEFAULT_VALUE);

/** Derive the LMS route base for a subject slug. */
export function lmsBaseForSlug(slug: string): string {
  return `/upsc/${slug}/lms`;
}

export function SubjectLmsProvider({
  subject,
  label,
  children,
}: {
  subject: string;
  label: string;
  children: ReactNode;
}) {
  const value = useMemo<SubjectLmsContextValue>(
    () => ({ subject, label, lmsBase: lmsBaseForSlug(subject) }),
    [subject, label],
  );
  return (
    <SubjectLmsContext.Provider value={value}>
      {children}
    </SubjectLmsContext.Provider>
  );
}

export function useSubjectLms(): SubjectLmsContextValue {
  return useContext(SubjectLmsContext);
}
