import { redirect } from "next/navigation";

import { readyTopics } from "@/lib/upsc/optional/geographyOptionalTopics";

const GEOGRAPHY_NOTES_ROUTE = "/upsc/optional-subjects/geography-optional";

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Older optional panels link here with `?topic=<lesson title>&subject=<slug>`.
 * This page used to show placeholder text ("notes will fill after upload").
 * It now sends the student to the real notes: the matching Geography topic
 * when there is one, the Geography notes index otherwise, and the subject's
 * own page for any other optional.
 */
export default async function OptionalReadPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  const subject = first(params.subject) || "geography";
  const topic = normalize(first(params.topic));

  if (subject !== "geography") {
    redirect(`/upsc/optional-subjects/${encodeURIComponent(subject)}`);
  }

  const match = topic
    ? readyTopics.find((candidate) => {
        const title = normalize(candidate.title);
        return title === topic || topic.includes(title) || title.includes(topic);
      })
    : undefined;

  redirect(match ? `${GEOGRAPHY_NOTES_ROUTE}/read/${match.slug}` : `${GEOGRAPHY_NOTES_ROUTE}/read`);
}
