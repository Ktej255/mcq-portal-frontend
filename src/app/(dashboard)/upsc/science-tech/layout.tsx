import { GsSubjectComingSoon } from "@/components/upsc/GsSubjectComingSoon";

/**
 * Layout gate for Science & Technology — renders "Coming Soon" for all sub-routes.
 * The subject is not yet ready for student access.
 */
export default function ScienceTechLayout({ children }: { children: React.ReactNode }) {
  return <GsSubjectComingSoon subjectName="Science & Technology" />;
}
