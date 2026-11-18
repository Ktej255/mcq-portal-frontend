"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AnswerWorkspace } from "@/components/upsc/AnswerWorkspace";
import { getSubjectPyqQuestion } from "@/lib/upsc/optionalSubjectStandards";

const positiveInteger = (value: string | null): number | undefined => {
  if (!value || !/^\d+$/.test(value.trim())) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
};

/**
 * URL adapter for legacy Optional deep links. The workspace itself remains the
 * canonical authenticated FastAPI-backed surface; this component only maps
 * existing `id`/`text`/`level` query parameters to its prompt contract.
 */
export function OptionalAnswerRoute() {
  const params = useSearchParams();
  const subject = params.get("subject")?.trim() || "geography";
  const legacyId = params.get("id")?.trim() || null;
  const legacyPyq = legacyId ? getSubjectPyqQuestion(subject, legacyId) : null;
  const questionText =
    params.get("text")?.trim() ||
    params.get("question")?.trim() ||
    legacyPyq?.text ||
    null;
  const level = params.get("level")?.trim();
  const topicTitle =
    params.get("topicTitle")?.trim() ||
    params.get("topic")?.trim() ||
    (level ? `Practice · ${level}` : undefined);
  const prompt = questionText || topicTitle
    ? {
        questionText: questionText ?? undefined,
        topicTitle,
        pyqId: positiveInteger(params.get("pyqId")),
        topicNodeId: positiveInteger(params.get("topicNodeId") ?? params.get("topic_node_id")),
      }
    : null;

  if (!prompt) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] px-4 py-10 text-[#13251d]">
        <section className="mx-auto max-w-xl rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-6 text-center shadow-sm">
          <h1 className="text-xl font-black">Answer prompt unavailable</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
            This answer link does not contain a question or practice prompt. Return to the optional subject and choose a reviewed prompt.
          </p>
          <Link href={`/upsc/optional-subjects/${encodeURIComponent(subject)}`} className="mt-4 inline-flex rounded-xl bg-[#1a3a2a] px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-white">
            Back to subject
          </Link>
        </section>
      </main>
    );
  }

  return <AnswerWorkspace slug={subject} prompt={prompt} />;
}
