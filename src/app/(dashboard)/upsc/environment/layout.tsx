import { GsSubjectComingSoon } from "@/components/upsc/GsSubjectComingSoon";

/**
 * Layout gate for Environment — renders "Coming Soon" for all sub-routes.
 * The subject is not yet ready for student access.
 */
export default function EnvironmentLayout({ children }: { children: React.ReactNode }) {
  return <GsSubjectComingSoon subjectName="Environment" />;
}
