import { notFound } from "next/navigation";

import { GeographyOptionalReader } from "@/components/upsc/optional/GeographyOptionalReader";
import { getReadyTopic, readyTopics } from "@/lib/upsc/optional/geographyOptionalTopics";

export function generateStaticParams() {
  return readyTopics.map((t) => ({ topic: t.slug }));
}

export default async function GeographyOptionalReadTopic({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const data = getReadyTopic(topic);

  if (!data) {
    notFound();
  }

  return <GeographyOptionalReader topic={data} />;
}
