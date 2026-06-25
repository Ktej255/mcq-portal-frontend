import { GsSubjectComingSoon } from "@/components/upsc/GsSubjectComingSoon";

/**
 * Layout gate for Disaster Management — renders "Coming Soon" for all sub-routes.
 * The subject is not yet ready for student access.
 */
export default function DisasterManagementLayout({ children }: { children: React.ReactNode }) {
  return <GsSubjectComingSoon subjectName="Disaster Management" />;
}
