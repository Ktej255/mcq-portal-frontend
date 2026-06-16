import { notFound } from "next/navigation";

import { OptionalSubjectDetail } from "@/components/upsc/UpscYearlyPlanner";
import { getOptionalSubject, optionalSubjects } from "@/lib/upsc/yearlyPlanner";

export function generateStaticParams() {
  // geography-optional has its own dedicated static route segment
  // (./geography-optional) with a full Read + Syllabus experience, so it is
  // excluded here to avoid two routes resolving to the same path.
  return optionalSubjects
    .filter((subject) => subject.slug !== "geography-optional")
    .map((subject) => ({ slug: subject.slug }));
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

  return <OptionalSubjectDetail subject={subject} />;
}
