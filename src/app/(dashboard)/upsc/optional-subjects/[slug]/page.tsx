import { SubjectShell } from "@/components/upsc/SubjectShell";
import { OPTIONAL_SUBJECTS } from "@/lib/upsc/optionalSubjectsCatalog";

export function generateStaticParams() {
  // Pre-render the 25 standard optional subjects from the canonical catalog.
  // The legacy bespoke "geography-optional" route segment was removed in task
  // 6.4; the canonical Geography optional is the catalog slug "geography",
  // served (like every subject) by SubjectShell below. Unknown/non-catalog
  // slugs still resolve at request time and render SubjectShell's graceful
  // "subject not found / coming soon" state.
  return OPTIONAL_SUBJECTS.map((subject) => ({ slug: subject.slug }));
}

export default async function OptionalSubjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SubjectShell slug={slug} />;
}
