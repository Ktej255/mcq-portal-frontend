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
    "# Sarit Classes — UPSC Command",
    "",
    "> One connected system to learn, practise and revise for the UPSC Civil Services Examination (CSE). The live beta opens Geography as the first General Studies subject, with a daily loop of recall, lesson, discussion, MCQ and revisit. More GS subjects and optional libraries are shipping subject by subject. Payments have not opened; plan choices are recorded as intent, not charged.",
    "",
    "## Core pages",
    `- [Home](${SITE_URL}/): The connected daily loop (Watch, Talk, Visual Lab, MCQ, Track, Revisit) and how it works.`,
    `- [Get started](${SITE_URL}/start): A free 2-minute diagnostic that builds a personalized UPSC starting plan.`,
    `- [Live demo](${SITE_URL}/demo): A read-only preview of the daily command center — today's loop, streak, targets and weakness queue.`,
    `- [Features](${SITE_URL}/features): Personalized plan, ask-the-teacher AI, weakness map, spaced revision and PYQs.`,
    `- [Pricing](${SITE_URL}/pricing): The four plan tiers and what each opens. Plans are currently recorded as intent; no payment is collected.`,
    `- [Free PYQs](${SITE_URL}/pyqs): UPSC Prelims & Mains previous year questions, year-wise and subject-wise, free.`,
    `- [Current affairs](${SITE_URL}/current-affairs): Exam-filtered current affairs with linked syllabus topics. Items publish only after editorial review.`,
    `- [Tests & practice](${SITE_URL}/tests): Daily quizzes, sectional Prelims sets, CSAT practice and Mains answer writing with accuracy analytics.`,
    `- [Study resources](${SITE_URL}/resources): NCERT booklist, standard references, current affairs, mind maps, Mains frameworks.`,
    `- [Subjects](${SITE_URL}/subjects): All General Studies and Optional subjects, with live and planned status shown.`,
    `- [Guides](${SITE_URL}/guides): Practical UPSC guides on starting prep, the syllabus, books, current affairs and Prelims strategy.`,
    `- [How we measure coverage](${SITE_URL}/methodology): Our transparent method for measuring and reporting exam coverage.`,
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
    "- Live beta scope: 1 of 8 General Studies subjects (Geography) and 1 of 25 optional libraries with reviewed content (Geography optional).",
    "- Previous year questions are free and intended for open practice.",
    "- Payments are closed. A chosen plan tier and billing cycle are saved as intent only; no card is charged and no rank or selection outcome is promised.",
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
