import { GsSubjectComingSoon } from "@/components/upsc/GsSubjectComingSoon";

/**
 * Layout gate for Polity & Governance — renders "Coming Soon" for all sub-routes.
 * The subject is not yet ready for student access.
 */
export default function PolityGovernanceLayout({ children }: { children: React.ReactNode }) {
  return <GsSubjectComingSoon subjectName="Polity & Governance" />;
}
