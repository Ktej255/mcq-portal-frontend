import { notFound } from "next/navigation";

import { SubjectShell } from "@/components/upsc/SubjectShell";
import { OPTIONAL_SUBJECTS } from "@/lib/upsc/optionalSubjectsCatalog";

export function generateStaticParams() {
  return OPTIONAL_SUBJECTS.map((subject) => ({ slug: subject.slug }));
}

export default async function OptionalSubjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const subject = OPTIONAL_SUBJECTS.find((entry) => entry.slug === slug);

  if (!subject) {
    notFound();
  }

  // The visible subject route uses the canonical authenticated shell. It owns
  // syllabus, PYQ, practice, recall, and answer-workspace navigation through
  // the shared Optional API contracts; the legacy browser-local course player
  // remains isolated from this entry path.
  return <SubjectShell slug={subject.slug} />;
}
