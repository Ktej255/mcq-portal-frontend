import { GsSubjectComingSoon } from "@/components/upsc/GsSubjectComingSoon";

/**
 * Layout gate for Economy — renders "Coming Soon" for all sub-routes.
 * The subject is not yet ready for student access.
 */
export default function EconomyLayout({ children }: { children: React.ReactNode }) {
  return <GsSubjectComingSoon subjectName="Economy" />;
}
