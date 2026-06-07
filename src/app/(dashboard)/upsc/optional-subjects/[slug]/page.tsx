import { notFound } from "next/navigation";

import { OptionalSubjectDetail } from "@/components/upsc/UpscYearlyPlanner";
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

  return <OptionalSubjectDetail subject={subject} />;
}
