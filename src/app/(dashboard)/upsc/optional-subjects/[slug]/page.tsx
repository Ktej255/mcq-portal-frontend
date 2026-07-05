import { notFound } from "next/navigation";

import { OptionalSubjectLMS } from "@/components/upsc/OptionalSubjectLMS";
import { getOptionalSubject, optionalSubjects } from "@/lib/upsc/yearlyPlanner";

export function generateStaticParams() {
  return optionalSubjects.map((subject) => ({ slug: subject.slug }));
}

export default async function OptionalSubjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const subject = getOptionalSubject(slug);

  if (!subject) {
    notFound();
  }

  // Every optional opens the LMS course player. Geography is the richest
  // reference (PYQs, interactive map, trends); other subjects inherit the same
  // shell driven by their own scraped syllabus, with those modules being filled.
  return <OptionalSubjectLMS slug={subject.slug} title={subject.title} group={subject.group} />;
}
