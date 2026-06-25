import { GsSubjectComingSoon } from "@/components/upsc/GsSubjectComingSoon";

/**
 * Layout gate for Internal Security & Society — renders "Coming Soon" for all sub-routes.
 * The subject is not yet ready for student access.
 */
export default function InternalSecuritySocietyLayout({ children }: { children: React.ReactNode }) {
  return <GsSubjectComingSoon subjectName="Internal Security & Society" />;
}
