import { notFound } from "next/navigation";

import { OptionalSubjectDetail } from "@/components/upsc/UpscYearlyPlanner";
import { OptionalSubjectLMS } from "@/components/upsc/OptionalSubjectLMS";
import { GEOGRAPHY_OPTIONAL_SLUG } from "@/lib/upsc/optionalGeographyLms";
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

  // Geography is the fully-built LMS course player (reference implementation).
  if (subject.slug === GEOGRAPHY_OPTIONAL_SLUG) {
    return <OptionalSubjectLMS title={subject.title} group={subject.group} />;
  }

  return <OptionalSubjectDetail subject={subject} />;
}
