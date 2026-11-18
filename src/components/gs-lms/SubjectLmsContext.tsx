"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  lmsBaseForSlug,
  type SupportedGsLmsSubject,
} from "@/lib/gsLmsRoutePolicy";

export type SubjectLmsContextValue = {
  subject: SupportedGsLmsSubject;
  label: string;
  lmsBase: string;
};

const SubjectLmsContext = createContext<SubjectLmsContextValue | null>(null);

export function SubjectLmsProvider({
  subject,
  label,
  children,
}: {
  subject: SupportedGsLmsSubject;
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
  const value = useContext(SubjectLmsContext);
  if (!value) {
    throw new Error("useSubjectLms must be used within SubjectLmsProvider");
  }
  return value;
}
