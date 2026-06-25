import { GsSubjectComingSoon } from "@/components/upsc/GsSubjectComingSoon";

/**
 * Layout gate for History — renders "Coming Soon" for all sub-routes.
 * The subject is not yet ready for student access.
 */
export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <GsSubjectComingSoon subjectName="History" />;
}
