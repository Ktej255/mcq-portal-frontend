// LMS content model for the Geography optional course player.
// Curriculum is derived from the real syllabus scraped from saritclasses.com.
// This is the SKELETON; video links, PYQ text, content, maps and diagrams are
// seeded and meant to be filled by the founder / future extraction.
import { getOptionalSubjectContent } from "./optionalSubjectContent";

export const GEOGRAPHY_OPTIONAL_SLUG = "geography";
export const GEOGRAPHY_FREE_LESSON_COUNT = 2;

// Section headings that belong to Paper II (Geography of India).
const PAPER_II_HEADINGS = new Set<string>([
  "Physical Setting",
  "Resources",
  "Agriculture",
  "Industry",
  "Transport, Communication, and Trade",
  "Cultural Setting",
  "Settlements",
  "Regional Development and Planning",
  "Political Aspects",
  "Contemporary Issues",
]);

export type LmsLesson = { id: string; title: string; videoUrl?: string; durationLabel: string; free: boolean };
export type LmsModule = { id: string; title: string; lessons: LmsLesson[] };
export type LmsPaper = { paper: "Paper I" | "Paper II"; subtitle: string; modules: LmsModule[] };

/** Split the real syllabus into Paper I (Physical + Human) and Paper II (India). */
export function getGeographyPapers(): LmsPaper[] {
  const content = getOptionalSubjectContent(GEOGRAPHY_OPTIONAL_SLUG);
  const paper1: LmsModule[] = [];
  const paper2: LmsModule[] = [];
  let lessonIndex = 0;
  const sections = content ? content.papers.flatMap((p) => p.sections) : [];
  sections.forEach((section, si) => {
    const lessons = section.topics.map((topic, ti) => {
      const free = lessonIndex < GEOGRAPHY_FREE_LESSON_COUNT;
      lessonIndex += 1;
      return { id: `m${si}-l${ti}`, title: topic, durationLabel: "Video coming soon", free };
    });
    const mod: LmsModule = { id: `m${si}`, title: section.heading, lessons };
    (PAPER_II_HEADINGS.has(section.heading) ? paper2 : paper1).push(mod);
  });
  return [
    { paper: "Paper I", subtitle: "Principles of Geography (Physical + Human)", modules: paper1 },
    { paper: "Paper II", subtitle: "Geography of India", modules: paper2 },
  ];
}


// ─── PYQs: addressable, split by paper, year-wise (in-page, no external links) ───
export type PyqQuestion = { id: string; year: number; paper: "Paper I" | "Paper II"; text: string };
export type PyqYear = { year: number; papers: { paper: "Paper I" | "Paper II"; questions: PyqQuestion[] }[] };

function q(year: number, paper: "Paper I" | "Paper II", n: number, text: string): PyqQuestion {
  return { id: `pyq-${year}-${paper === "Paper I" ? "1" : "2"}-${n}`, year, paper, text };
}

export const geographyPyqYears: PyqYear[] = [
  {
    year: 2023,
    papers: [
      {
        paper: "Paper I",
        questions: [
          q(2023, "Paper I", 1, "Discuss the relevance of the Davisian model of cycle of erosion in the present-day context."),
          q(2023, "Paper I", 2, "Examine the role of jet streams in the development of the Indian monsoon."),
          q(2023, "Paper I", 3, "Critically analyse the applied aspects of coastal geomorphology."),
        ],
      },
      {
        paper: "Paper II",
        questions: [
          q(2023, "Paper II", 1, "Bring out the geographical basis of inter-state water disputes in India."),
          q(2023, "Paper II", 2, "Examine the spatial pattern of drought-prone areas in India and suggest remedies."),
        ],
      },
    ],
  },
  {
    year: 2022,
    papers: [
      {
        paper: "Paper I",
        questions: [
          q(2022, "Paper I", 1, "Explain the concept of isostasy and discuss the views of Airy and Pratt."),
          q(2022, "Paper I", 2, "Critically examine Mackinder's heartland theory in the contemporary world order."),
        ],
      },
      {
        paper: "Paper II",
        questions: [
          q(2022, "Paper II", 1, "Discuss the factors responsible for the localisation of the cotton textile industry in India."),
        ],
      },
    ],
  },
  {
    year: 2021,
    papers: [
      { paper: "Paper I", questions: [q(2021, "Paper I", 1, "Discuss the climatic classification of Koppen with reference to India.")] },
      { paper: "Paper II", questions: [q(2021, "Paper II", 1, "Examine the role of agro-climatic regional planning in Indian agriculture.")] },
    ],
  },
];

export function getPyqQuestion(id: string): PyqQuestion | null {
  for (const year of geographyPyqYears) {
    for (const group of year.papers) {
      const found = group.questions.find((item) => item.id === id);
      if (found) return found;
    }
  }
  return null;
}


// ─── AI evaluation tiers — shown by NUMBER OF PARAMETERS checked (not credits/model) ───
export type EvaluationLevel = { id: string; label: string; parameterCount: number; note: string; parameters: string[] };
export const evaluationLevels: EvaluationLevel[] = [
  {
    id: "easy",
    label: "Easy",
    parameterCount: 5,
    note: "Quick check on the essentials.",
    parameters: ["Intro-body-conclusion structure", "Keyword coverage", "Directive compliance (discuss/examine)", "Word limit adherence", "Legibility"],
  },
  {
    id: "medium",
    label: "Medium",
    parameterCount: 11,
    note: "Adds content depth, examples and gaps.",
    parameters: ["All Easy parameters", "Concept accuracy", "Examples / case studies", "Diagram presence", "Syllabus linkage", "Balance of view", "Redundant-word detection"],
  },
  {
    id: "tough",
    label: "Tough",
    parameterCount: 20,
    note: "Strict examiner-style critique.",
    parameters: ["All Medium parameters", "Scholar / model citation", "Inter-linkage of dimensions", "Map accuracy", "Data & facts recency", "Flow & coherence", "Marks-per-segment breakdown"],
  },
  {
    id: "upsc",
    label: "UPSC-like",
    parameterCount: 35,
    note: "Full UPSC rubric, marks-oriented.",
    parameters: ["All Tough parameters", "Examiner empathy & lift-value", "Value-addition / way-forward", "Answer-to-demand precision", "Diagram quality & labelling", "Time-pressure realism", "Predicted score band"],
  },
];

// Per-year PYQ question-type distribution (for the animated Trends charts).
export const trendTypeColors: Record<string, string> = { Direct: "#1d9e75", Conceptual: "#1a3a2a", Applied: "#ef9f27" };
export const geographyTrendByYear: Array<{ year: number; distribution: Array<{ name: string; value: number }> }> = [
  { year: 2023, distribution: [{ name: "Direct", value: 3 }, { name: "Conceptual", value: 5 }, { name: "Applied", value: 6 }] },
  { year: 2022, distribution: [{ name: "Direct", value: 4 }, { name: "Conceptual", value: 6 }, { name: "Applied", value: 4 }] },
  { year: 2021, distribution: [{ name: "Direct", value: 6 }, { name: "Conceptual", value: 5 }, { name: "Applied", value: 3 }] },
];

// ─── Subjective practice (UPSC is descriptive, NOT MCQ) ───
export type PracticeLevel = { id: string; label: string; words: string; note: string };
export const practiceLevels: PracticeLevel[] = [
  { id: "easy", label: "Easy", words: "10 marks · 150 words", note: "Definition + one mechanism + example." },
  { id: "moderate", label: "Moderate", words: "15 marks · 250 words", note: "Cause-effect, diagram, and balanced view." },
  { id: "upsc", label: "UPSC-like", words: "20 marks · 250 words", note: "Analytical, multi-dimensional, map/diagram, value-addition." },
];

export function buildTopicPractice(topic: string): Array<{ level: string; prompt: string }> {
  return [
    { level: "Easy", prompt: `Explain the concept of "${topic}" with one suitable example. (150 words)` },
    { level: "Moderate", prompt: `Discuss "${topic}" with its causes, effects, and a labelled diagram. (250 words)` },
    { level: "UPSC-like", prompt: `Critically examine "${topic}", linking it to contemporary relevance and map/diagram support. (250 words)` },
  ];
}

// ─── Trend analysis (skeleton — fill with verified counts) ───
export const geographyTrendWindows = [
  { window: "Last 3 years", insight: "Higher weight on applied geomorphology, climate change, and map-linked current affairs." },
  { window: "Last 7 years", insight: "Shift from direct factual recall toward conceptual and analytical framing." },
  { window: "Last 15 years", insight: "Evolution: direct → conceptual → applied; diagrams and case studies increasingly rewarded." },
];

// ─── Optional gap framing (what UPSC expects vs current readiness) ───
export const geographyGapAreas = [
  { area: "Answer structuring", expectation: "Intro-body-conclusion with sub-headings", status: "Track per attempt" },
  { area: "Map & diagram usage", expectation: "Labelled maps/diagrams in most answers", status: "Track per attempt" },
  { area: "Conceptual depth", expectation: "Models, theories, and scholars cited", status: "Track per attempt" },
  { area: "Current affairs linkage", expectation: "Static topics tied to recent events", status: "Track per attempt" },
];

export const geographyResources = [
  { label: "NCERT Geography (Class XI-XII) anchor notes", kind: "PDF" },
  { label: "Topic map sheet and diagram pack", kind: "PDF" },
  { label: "Answer-writing model structure", kind: "DOC" },
];

export const answerScaffold = [
  { part: "Introduction", hint: "Define the core term / set context in 2-3 lines. Optionally a data point or map." },
  { part: "Body", hint: "Dimensions, cause-effect, models/scholars, examples, and a labelled diagram or map." },
  { part: "Conclusion", hint: "Balanced way-forward / contemporary relevance in 2-3 lines." },
];
