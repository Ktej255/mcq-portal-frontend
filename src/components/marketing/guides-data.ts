/**
 * Evergreen UPSC guides (content hub) — high-intent informational queries that
 * build topical authority and internally link to the money pages. Content is
 * original, non-fluff guidance (no fabricated facts or guarantees).
 */

export type Guide = {
  slug: string;
  title: string;
  metaTitle: string;
  excerpt: string;
  cluster: "Getting started" | "Strategy" | "Resources";
  updated: string;
  readMins: number;
  intro: string;
  sections: { heading: string; body: string[] }[];
  faqs: { q: string; a: string }[];
};

export const guides: Guide[] = [
  {
    slug: "how-to-start-upsc-preparation",
    title: "How to start UPSC preparation: a beginner's roadmap",
    metaTitle: "How to Start UPSC Preparation in 2026 — Beginner's Roadmap | Sarit Classes",
    excerpt:
      "A clear, step-by-step roadmap for beginners: understand the exam, read the syllabus, build NCERT foundations, add current affairs, and start practising early.",
    cluster: "Getting started",
    updated: "June 2026",
    readMins: 6,
    intro:
      "Most aspirants don't struggle because they study too little — they struggle because they start without a map. This roadmap gives you a calm, ordered way to begin UPSC preparation without drowning in sources.",
    sections: [
      {
        heading: "Understand the exam before you study",
        body: [
          "The UPSC Civil Services Examination has three stages: Prelims (objective screening), Mains (written), and the Personality Test (interview). Knowing what each stage rewards helps you study the right way from day one.",
          "Read a few previous year papers early so you can see how topics are actually tested, not just listed.",
        ],
      },
      {
        heading: "Make the syllabus your filter",
        body: [
          "The official syllabus is your single most important document. Treat every potential source as optional until you've checked it against the syllabus.",
          "Print it, annotate it, and return to it whenever you feel lost or tempted by a new resource.",
        ],
      },
      {
        heading: "Build the NCERT foundation first",
        body: [
          "NCERT textbooks (classes 6–12) build the base for History, Geography, Polity, Economics and Science. Finish them before jumping to advanced standard books.",
          "Take short notes you can actually revise, and don't aim for perfection on the first pass.",
        ],
      },
      {
        heading: "Add current affairs and start practising early",
        body: [
          "Begin a light daily current-affairs habit instead of hoarding monthly magazines to read 'later'. A short daily quiz keeps it active.",
          "Start attempting MCQs from the beginning — practice is how concepts become recall.",
        ],
      },
    ],
    faqs: [
      { q: "How long does UPSC preparation take?", a: "Most aspirants spend roughly a year of focused preparation, but the right duration depends on your starting point and consistency, not a fixed number." },
      { q: "Can I start without coaching?", a: "Yes. A clear syllabus-led plan, NCERTs, current affairs and regular practice can take you far; structured guidance helps but isn't mandatory to begin." },
    ],
  },
  {
    slug: "upsc-syllabus-explained",
    title: "The UPSC syllabus explained (Prelims and Mains)",
    metaTitle: "UPSC Syllabus Explained — Prelims & Mains Breakdown | Sarit Classes",
    excerpt:
      "A plain-language breakdown of the UPSC Prelims and Mains syllabus, paper by paper, so you know exactly what to study and what to skip.",
    cluster: "Getting started",
    updated: "June 2026",
    readMins: 7,
    intro:
      "The syllabus looks vast, but it is finite and well-defined. Understanding its structure is the fastest way to stop over-reading and start studying with purpose.",
    sections: [
      {
        heading: "Prelims: GS Paper I and CSAT",
        body: [
          "Paper I (General Studies) covers current events, history, geography, polity, economy, environment and general science. It decides your screening score.",
          "Paper II (CSAT) tests comprehension, reasoning and basic numeracy and is qualifying — you need 33% but it still deserves practice.",
        ],
      },
      {
        heading: "Mains: the four GS papers",
        body: [
          "GS-I covers heritage, history, geography and society; GS-II covers polity, governance and international relations; GS-III covers economy, environment, science and security; GS-IV covers ethics, integrity and aptitude.",
          "Mains rewards structured, balanced answers — content plus presentation.",
        ],
      },
      {
        heading: "Essay and the optional subject",
        body: [
          "The Essay paper tests clarity of thought and structure across two essays. Your chosen Optional subject carries significant Mains weight, so pick it carefully.",
          "Explore the options on our subjects page before committing.",
        ],
      },
    ],
    faqs: [
      { q: "Is the Prelims CSAT paper counted in the final rank?", a: "No. CSAT is qualifying (33%); it does not add to your final rank, but failing it means you don't clear Prelims." },
      { q: "How do I choose an optional subject?", a: "Weigh your interest, background, overlap with GS, and availability of material. Our subjects page lists the common GS and optional choices." },
    ],
  },
  {
    slug: "best-books-for-upsc-preparation",
    title: "Best books for UPSC preparation (without the overload)",
    metaTitle: "Best Books for UPSC Preparation 2026 — Curated Booklist | Sarit Classes",
    excerpt:
      "A curated, minimal UPSC booklist — NCERTs plus one standard reference per subject — so you read deeply instead of collecting books you never finish.",
    cluster: "Resources",
    updated: "June 2026",
    readMins: 5,
    intro:
      "More books rarely means more marks. The aspirants who do well usually revise a small set of trusted sources many times. Here's how to keep your booklist lean.",
    sections: [
      {
        heading: "Start with NCERTs",
        body: [
          "NCERTs build the conceptual base across subjects and are written in clear language. Finish the relevant classes before moving on.",
        ],
      },
      {
        heading: "One standard book per subject",
        body: [
          "For each GS subject, choose a single widely-trusted standard reference and stick with it. Resist the urge to switch books mid-preparation.",
          "See our resources page for a subject-wise booklist and what to skip.",
        ],
      },
      {
        heading: "Revise more than you add",
        body: [
          "Every new source increases confusion and reduces retention close to the exam. Repetition of a few sources beats expansion into many.",
        ],
      },
    ],
    faqs: [
      { q: "Do I need expensive coaching material?", a: "Not to begin. NCERTs, one standard book per subject, current affairs and regular practice cover the foundation; add material only when there's a clear gap." },
    ],
  },
  {
    slug: "how-to-prepare-current-affairs-for-upsc",
    title: "How to prepare current affairs for UPSC",
    metaTitle: "How to Prepare Current Affairs for UPSC — A Simple System | Sarit Classes",
    excerpt:
      "A simple, sustainable current-affairs system for UPSC: filter daily, link news to the syllabus, consolidate monthly, and revise with quizzes.",
    cluster: "Strategy",
    updated: "June 2026",
    readMins: 5,
    intro:
      "Current affairs feel endless because most aspirants try to read everything. The fix is a filter and a routine, not more sources.",
    sections: [
      {
        heading: "Filter daily, don't hoard",
        body: [
          "Only a fraction of daily news is exam-relevant. Read a single, exam-filtered daily briefing rather than scrolling many sites.",
          "Our current affairs page distils each day into Prelims bytes, Mains points and editorial gist.",
        ],
      },
      {
        heading: "Link every item to the syllabus",
        body: [
          "Tag news to the syllabus topic it supports (polity, economy, environment, IR). This turns scattered facts into organised, retrievable knowledge.",
        ],
      },
      {
        heading: "Consolidate monthly and quiz yourself",
        body: [
          "Use a monthly consolidation for revision and a short daily quiz to lock items in. Active recall beats passive re-reading.",
        ],
      },
    ],
    faqs: [
      { q: "How many months of current affairs are needed?", a: "Roughly the 12–18 months before the exam, with heavier focus on the most recent year — but consistency matters more than the exact window." },
    ],
  },
  {
    slug: "upsc-prelims-preparation-strategy",
    title: "UPSC Prelims preparation strategy that works",
    metaTitle: "UPSC Prelims Strategy 2026 — Study Plan & Revision | Sarit Classes",
    excerpt:
      "A practical UPSC Prelims strategy: master static through NCERTs and PYQs, integrate current affairs, take regular mocks, and revise in tightening loops.",
    cluster: "Strategy",
    updated: "June 2026",
    readMins: 6,
    intro:
      "Prelims rewards accuracy and recall under pressure. A good strategy combines strong static foundations, current-affairs integration, and disciplined mock practice.",
    sections: [
      {
        heading: "Master static with NCERTs and PYQs",
        body: [
          "Build static knowledge from NCERTs and one standard book per subject, then test it against previous year questions to see how topics are framed.",
          "Our free PYQ browser lets you practise year-wise and subject-wise.",
        ],
      },
      {
        heading: "Integrate current affairs into static",
        body: [
          "Don't study current affairs in isolation — connect each item to its static topic so you can answer application-style questions.",
        ],
      },
      {
        heading: "Take mocks and revise in loops",
        body: [
          "Regular full-length and sectional mocks build exam temperament and reveal weak areas. Then revise in tightening loops, focusing on what you got wrong.",
          "Our tests page turns each attempt into a weakness map and a spaced re-test.",
        ],
      },
    ],
    faqs: [
      { q: "How many mock tests should I take before Prelims?", a: "Enough to build accuracy and time management — many aspirants take a few dozen across sectional and full-length mocks, with thorough analysis after each." },
      { q: "Is negative marking a big risk?", a: "It can be. Practise intelligent guessing through mocks so you learn when an educated attempt is worth the risk." },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

export const guideClusters: Guide["cluster"][] = ["Getting started", "Strategy", "Resources"];
