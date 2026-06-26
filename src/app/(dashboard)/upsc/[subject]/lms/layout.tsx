/**
 * Minimal layout for the dynamic [subject]/lms route.
 * Simply passes children through — no onboarding gate needed here
 * since this route either redirects to the static geography LMS
 * or shows a "Coming Soon" placeholder for other subjects.
 */
export default function SubjectLmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
