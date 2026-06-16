import { subjects } from "@/components/marketing/site-data";
import { guides } from "@/components/marketing/guides-data";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

/**
 * /llms.txt — Agent Experience (AX) index.
 * A clean Markdown map of the site for LLMs and AI agents, following the
 * llms.txt convention (sibling to robots.txt / sitemap.xml).
 */
export function GET() {
  const lines: string[] = [
    "# Sarit Learn — UPSC Command",
    "",
    "> One connected system to learn, practise and revise for the UPSC Civil Services Examination (CSE). Lessons, AI doubt-solving, interactive maps, fresh MCQs, weakness tracking and spaced revision live in one personalized daily loop. Free to start; a Pro membership unlocks all subjects, unlimited AI doubt-solving and Mains answer evaluation.",
    "",
    "## Core pages",
    `- [Home](${SITE_URL}/): The connected daily loop (Watch, Talk, Visual Lab, MCQ, Track, Revisit) and how it works.`,
    `- [Features](${SITE_URL}/features): Personalized plan, ask-the-teacher AI, weakness map, spaced revision, PYQs, Mains answer evaluation.`,
    `- [Pricing](${SITE_URL}/pricing): Free plan vs Pro membership; what each unlocks.`,
    `- [Free PYQs](${SITE_URL}/pyqs): UPSC Prelims & Mains previous year questions, year-wise and subject-wise, free.`,
    `- [Current affairs](${SITE_URL}/current-affairs): Exam-filtered daily current affairs, editorials, schemes and monthly consolidation.`,
    `- [Tests & practice](${SITE_URL}/tests): Daily quizzes, Prelims mocks, CSAT practice and Mains answer writing with analytics.`,
    `- [Study resources](${SITE_URL}/resources): NCERT booklist, standard references, current affairs, mind maps, Mains frameworks.`,
    `- [Subjects](${SITE_URL}/subjects): All General Studies and Optional subjects.`,
    `- [Guides](${SITE_URL}/guides): Practical UPSC guides on starting prep, the syllabus, books, current affairs and Prelims strategy.`,
    "",
    "## Subjects",
    ...subjects.map((s) => `- [${s.name}](${SITE_URL}/subjects/${s.slug}): ${s.tagline}`),
    "",
    "## Guides",
    ...guides.map((g) => `- [${g.title}](${SITE_URL}/guides/${g.slug}): ${g.excerpt}`),
    "",
    "## Company",
    `- [About](${SITE_URL}/about): Mission and approach.`,
    `- [Contact](${SITE_URL}/contact): Support, partnerships and feedback.`,
    `- [Privacy](${SITE_URL}/privacy)`,
    `- [Terms](${SITE_URL}/terms)`,
    "",
    "## Notes for agents",
    "- A fuller, content-rich version is available at /llms-full.txt.",
    "- Previous year questions are free and intended for open practice.",
    "- Pricing figures for Pro are being finalized; treat any number as provisional.",
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
