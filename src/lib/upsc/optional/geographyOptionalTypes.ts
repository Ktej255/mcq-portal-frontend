/**
 * Geography Optional — shared content model.
 *
 * This powers the "Read" (personal-notes) experience and the three-layer
 * Syllabus view (Official says / Trend says / Hidden topics) for the
 * UPSC Geography Optional papers.
 *
 * The model is deliberately content-first: a topic carries an authentic
 * syllabus mapping plus deeply-written subtopics so that a first-time
 * aspirant can build genuine conceptual confidence by reading alone.
 */

export type Frequency = "Very High" | "High" | "Medium" | "Low";

/** What the UPSC question trend reveals about a theme. */
export type TrendPoint = {
  theme: string;
  insight: string;
  frequency: Frequency;
};

/**
 * A topic that is not named verbatim in the official syllabus but is
 * repeatedly required to answer questions under the parent theme.
 */
export type HiddenTopic = {
  topic: string;
  why: string;
};

/** The three-layer syllabus contract for a topic. */
export type SyllabusLayer = {
  /** Verbatim-style official syllabus phrases (as printed by UPSC). */
  official: string[];
  /** What 25+ years of question papers actually demand. */
  trendSays: TrendPoint[];
  /** Implicit / never-named-but-always-needed topics. */
  hiddenTopics: HiddenTopic[];
};

export type CalloutTone = "key" | "trap" | "keyword" | "example" | "link";

/** A renderable block inside a subtopic's notes. */
export type ContentBlock =
  | { type: "para"; text: string }
  | { type: "points"; heading?: string; items: string[] }
  | { type: "callout"; tone: CalloutTone; title: string; items: string[] }
  | { type: "diagram"; id: DiagramId; caption: string };

/** Identifiers for the hand-drawn (pencil-style) SVG diagrams. */
export type DiagramId =
  | "endo-exo-balance"
  | "plate-boundaries"
  | "isostasy-airy-pratt"
  | "davis-penck-cycle"
  | "channel-patterns"
  | "slope-elements";

export type Pyq = {
  year?: string;
  q: string;
};

export type Subtopic = {
  id: string;
  title: string;
  /** Which official syllabus phrase this maps to. */
  syllabusTag: string;
  /** One-line confidence hook: why this matters and what you'll own. */
  hook: string;
  blocks: ContentBlock[];
  /** Exam vocabulary the examiner rewards. */
  examKeywords: string[];
  /** Ready-to-use answer phrasing in UPSC register. */
  answerLanguage: string[];
  /** Representative previous-year questions. */
  pyq: Pyq[];
};

export type TopicStatus = "ready" | "coming-soon";

export type OptionalTopic = {
  slug: string;
  title: string;
  paper: string;
  section: string;
  order: number;
  status: TopicStatus;
  /** One-line summary used on cards. */
  summary: string;
  /** Estimated focused reading time. */
  readMinutes: number;
  syllabus: SyllabusLayer;
  subtopics: Subtopic[];
};
