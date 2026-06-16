import {
  gsSubjects,
  optionalSubjects,
  resourceGroups,
  pyqYears,
} from "@/components/marketing/site-data";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

/**
 * /llms-full.txt — Agent Experience (AX) full content export.
 * A fuller plain-text/Markdown representation of the site for AI agents and
 * answer engines, so they can read and understand the offering completely.
 */
export function GET() {
  const lines: string[] = [
    "# Sarit Learn — UPSC Command (full content)",
    "",
    "## What it is",
    "Sarit Learn is an integrated UPSC Civil Services Examination (CSE) preparation platform for India. Instead of scattering preparation across many tabs, PDFs and apps, it connects the whole study journey into one personalized daily loop: Watch a lesson, Talk to an AI teacher to clear doubts, use the Visual Lab (maps and concept boards), practise fresh MCQs, Track weak areas, and Revisit through spaced revision.",
    "",
    "## Who it is for",
    "Aspirants preparing for UPSC Prelims and Mains (General Studies and Optional subjects), in both English and Hindi over time.",
    "",
    "## How it is different",
    "- One connected loop instead of scattered sources, reducing information overload.",
    "- Personalized to the learner: a short diagnostic builds a plan that adapts to weak areas.",
    "- Practice produces a diagnosis (what to fix next), not just a score.",
    "- Honest, transparent coverage reporting instead of marketing claims.",
    "- Ask-the-teacher AI for conversational doubt-solving beside the lesson.",
    "",
    "## Plans",
    "- Free: a 2-minute diagnostic and personalized plan, one full subject loop, 10 personalized MCQs per day, daily current affairs and quiz, a free previous-year-question browser, streaks and progress tracking, and limited ask-the-teacher AI (about 5 doubts per day).",
    "- Pro: all subjects unlocked, unlimited ask-the-teacher AI, Mains answer evaluation, deep analytics and weakness recovery, spaced revision scheduler, full PYQ and full-length test series, all-India rank and mentor check-ins. Pricing is being finalized.",
    "",
    "## General Studies subjects",
    ...gsSubjects.map((s) => `- ${s.name} (${s.status}): ${s.tagline} — ${SITE_URL}/subjects/${s.slug}`),
    "",
    "## Optional subjects",
    ...optionalSubjects.map((s) => `- ${s.name} (${s.status}): ${s.tagline} — ${SITE_URL}/subjects/${s.slug}`),
    "",
    "## Free previous year questions (PYQs)",
    "UPSC Prelims and Mains previous year questions are available free, browsable by year and by subject.",
    ...pyqYears.map((y) => `- ${y.year}: Prelims (${y.prelims}), Mains (${y.mains})`),
    `More at ${SITE_URL}/pyqs`,
    "",
    "## Free study resources",
    ...resourceGroups.flatMap((g) => [
      `### ${g.heading}`,
      ...g.items.map((it) => `- ${it.title}: ${it.detail}`),
    ]),
    `More at ${SITE_URL}/resources`,
    "",
    "## Frequently asked questions",
    "Q: Is it really free to start? A: Yes. You get a personalized plan, one full subject loop, daily MCQs, current affairs and limited AI doubts, with no card required.",
    "Q: How is this different from other UPSC platforms? A: Most platforms hand you scattered content; Sarit Learn connects watch, discuss, practise, track and revise into a single daily loop that adapts to you.",
    "Q: What does Pro unlock? A: Every subject, unlimited AI doubt-solving, Mains answer evaluation, deep analytics, spaced revision, full tests and all-India rank.",
    "Q: Do you cover Hindi medium? A: Yes — content is being rolled out bilingually (Hindi and English), subject by subject.",
    "",
    "## Contact",
    `Email: support@saritlearn.com — ${SITE_URL}/contact`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
