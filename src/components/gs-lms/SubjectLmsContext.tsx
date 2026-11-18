"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { examFromPathname } from "@/lib/exams/examRoutes";
import { lmsBaseForSlug } from "@/lib/gsLmsRoutePolicy";

export type SubjectLmsContextValue = {
  // The subject's URL slug. Any GS subject (the study page shows every subject);
  // which subjects open their LMS pages is decided by the LMS layout.
  subject: string;
  label: string;
  lmsBase: string;
};

const SubjectLmsContext = createContext<SubjectLmsContextValue | null>(null);

export function SubjectLmsProvider({
  subject,
  label,
  children,
}: {
  subject: string;
  label: string;
  children: ReactNode;
}) {
  const exam = examFromPathname(usePathname());
  const value = useMemo<SubjectLmsContextValue>(
    () => ({ subject, label, lmsBase: lmsBaseForSlug(subject, exam) }),
    [subject, label, exam],
  );

  return (
    <SubjectLmsContext.Provider value={value}>
      {children}
    </SubjectLmsContext.Provider>
  );
}

export function useSubjectLms(): SubjectLmsContextValue {
  const value = useContext(SubjectLmsContext);
  if (!value) {
    throw new Error("useSubjectLms must be used within SubjectLmsProvider");
  }
  return value;
}
