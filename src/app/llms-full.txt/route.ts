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
    "# Sarit Classes — UPSC Command (full content)",
    "",
    "## What it is",
    "Sarit Classes is an integrated UPSC Civil Services Examination (CSE) preparation platform for India. Instead of scattering preparation across many tabs, PDFs and apps, it connects the whole study journey into one personalized daily loop: Watch a lesson, Talk to an AI teacher to clear doubts, use the Visual Lab (maps and concept boards), practise fresh MCQs, Track weak areas, and Revisit through spaced revision.",
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
    "## Live beta scope",
    "- 1 of 8 General Studies subjects is live: Geography, with a reviewed syllabus and loop-ready topics.",
    "- 1 of 25 optional-subject libraries carries reviewed content today (Geography). The other 24, Anthropology and Sociology included, are marked coming soon until their notes are authored and reviewed; each subject page still shows the official Paper I / Paper II structure.",
    "- Current affairs items publish only after editorial review; nothing is auto-published.",
    "- Payments are closed. Choosing a plan records an intent for the tier and billing cycle; no card is charged.",
    "",
    "## Plans",
    "- Foundation (₹399/mo): live Geography GS path with more subjects as they ship, daily planner and workspace notes, standard MCQ generator, one spaced weak-topic repair run, and a basic syllabus sheet.",
    "- Plus: everything in Foundation, the Geography optional library with reviewed content (24 more opening as they are authored), advanced MCQ generator, five spaced weak-topic repair runs, and a priority syllabus and PYQ library.",
    "- Pro: everything in Plus, unlimited MCQ practice, unlimited weak-topic analytics, priority revision queueing, and auto-stitched mobile Mains uploads.",
    "- Ultimate: everything in Pro, priority access to new live features as they ship, and a direct guidance channel with Sarit Classes.",
    "- Billing cycles: monthly, yearly (-15%), 2-year (-25%) and 3-year (-35%). Prices are launch rates recorded as plan intent until payment collection opens.",
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
    "Q: Is it really free to start? A: Yes. You get a personalized plan, the live Geography loop, daily MCQs, current affairs as reviewed items publish, and limited AI doubts, with no card required.",
    "Q: How is this different from other UPSC platforms? A: Most platforms hand you scattered content; Sarit Classes connects watch, discuss, practise, track and revise into a single daily loop that adapts to you.",
    "Q: What does a paid plan unlock? A: Each tier adds scope from Foundation to Ultimate — live subject paths, optional libraries, practice volume, diagnostics and priority access. Plans are recorded as intent today; payments have not opened.",
    "Q: Do you promise a rank or selection? A: No. Practice analytics show your own accuracy and coverage trend; no rank, score or selection outcome is guaranteed.",
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
