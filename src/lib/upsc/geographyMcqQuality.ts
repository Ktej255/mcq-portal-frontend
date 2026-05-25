import type { QuestionPayload } from "@/services/api/adminService";

import type { GeographySession } from "./plan";

type McqQualityNotes = {
  subject?: string;
  day?: string | number;
  week?: string | number;
  chapter?: string;
  topic?: string;
  batch_code?: string;
  test_title?: string;
  map_or_case_tag?: string;
  pyq_linked?: string;
};

export type GeographyMcqQualityItem = {
  id: string;
  label: string;
  detail: string;
  passed: boolean;
  ratio: number;
};

export type GeographyMcqQualityAudit = {
  batchCode: string;
  passed: boolean;
  score: number;
  readyCount: number;
  totalQuestions: number;
  plannedCount: number;
  requiredMapTags: string[];
  requiredKeywords: string[];
  items: GeographyMcqQualityItem[];
  warnings: string[];
};

const TRAP_TERMS = [
  "statement",
  "consider",
  "correct",
  "incorrect",
  "not",
  "only",
  "all",
  "any",
  "except",
  "following",
  "pair",
  "pairs",
  "assertion",
  "reason",
  "upsc",
];

const MECHANISM_TERMS = [
  "because",
  "therefore",
  "mechanism",
  "process",
  "cause",
  "effect",
  "link",
  "leads",
  "results",
  "explains",
  "pattern",
  "distribution",
  "map",
  "relief",
  "climate",
  "river",
  "plate",
  "monsoon",
  "soil",
];

function qualityNotes(question: QuestionPayload): McqQualityNotes {
  const notes = question.quality_notes;
  if (!notes || typeof notes !== "object" || Array.isArray(notes)) return {};
  return notes as McqQualityNotes;
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function normalizedText(value: unknown): string {
  return textValue(value).toLowerCase();
}

function optionsComplete(question: QuestionPayload): boolean {
  const options = question.options_en;
  return Boolean(
    options &&
      textValue(options.A).length >= 8 &&
      textValue(options.B).length >= 8 &&
      textValue(options.C).length >= 8 &&
      textValue(options.D).length >= 8 &&
      ["A", "B", "C", "D"].includes(textValue(question.correct_option).toUpperCase()),
  );
}

function includesAny(text: string, terms: string[]): boolean {
  if (!text) return false;
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function ratio(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

function item(id: string, label: string, detail: string, current: number, required: number, total: number) {
  const currentRatio = ratio(current, total);
  return {
    id,
    label,
    detail: `${current}/${total} ready. ${detail}`,
    passed: current >= required,
    ratio: currentRatio,
  };
}

function compactUnique(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => value.replace(/\s+/g, " ")),
    ),
  );
}

function buildMapTags(session: GeographySession) {
  return compactUnique([
    session.lab,
    session.anchor,
    session.chapter,
    session.title,
    "India map",
    "relief",
    "river",
    "climate",
    "monsoon",
    "soil",
    "plate tectonics",
    "atlas",
  ]).slice(0, 14);
}

function buildKeywords(session: GeographySession) {
  return compactUnique([
    session.chapter,
    session.title,
    session.anchor,
    session.watch,
    session.talk,
    session.test,
    session.lab,
  ])
    .flatMap((keyword) => keyword.split(/[,:/|.;-]/g))
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length >= 4)
    .slice(0, 20);
}

export function auditGeographyMcqBatch(
  session: GeographySession,
  batchCode: string,
  questions: QuestionPayload[],
  plannedCount: number,
): GeographyMcqQualityAudit {
  const total = questions.length;
  const requiredMapTags = buildMapTags(session);
  const requiredKeywords = buildKeywords(session);
  const requiredForMost = Math.max(1, Math.ceil(total * 0.8));
  const requiredForHalf = Math.max(1, Math.ceil(total * 0.5));

  const batchMapped = questions.filter((question) => qualityNotes(question).batch_code === batchCode).length;
  const dayMapped = questions.filter((question) => {
    const notes = qualityNotes(question);
    const dayMatches = textValue(notes.day) === String(session.day);
    const topicOrChapter = `${normalizedText(notes.topic)} ${normalizedText(notes.chapter)}`;
    return dayMatches && (topicOrChapter.includes(session.title.toLowerCase()) || topicOrChapter.includes(session.chapter.toLowerCase()));
  }).length;
  const completeOptions = questions.filter(optionsComplete).length;
  const stemReady = questions.filter((question) => {
    const stem = normalizedText(question.text_en);
    return stem.length >= 70 && includesAny(stem, TRAP_TERMS);
  }).length;
  const explanationRich = questions.filter((question) => {
    const explanation = normalizedText(question.explanation_en);
    return explanation.length >= 90 && includesAny(explanation, MECHANISM_TERMS);
  }).length;
  const mapAnchored = questions.filter((question) => {
    const notes = qualityNotes(question);
    const combined = `${normalizedText(question.text_en)} ${normalizedText(question.explanation_en)} ${normalizedText(
      notes.map_or_case_tag,
    )}`;
    return Boolean(textValue(notes.map_or_case_tag)) || includesAny(combined, requiredMapTags);
  }).length;
  const syllabusAnchored = questions.filter((question) => {
    const notes = qualityNotes(question);
    const combined = `${normalizedText(question.text_en)} ${normalizedText(question.explanation_en)} ${normalizedText(
      notes.topic,
    )} ${normalizedText(notes.chapter)}`;
    return includesAny(combined, requiredKeywords);
  }).length;

  const countReady = total >= plannedCount;
  const items: GeographyMcqQualityItem[] = [
    {
      id: "planned-count",
      label: "Fresh batch count",
      detail: `${total}/${plannedCount} drafted in this CSV.`,
      passed: countReady,
      ratio: plannedCount > 0 ? Math.min(100, ratio(total, plannedCount)) : 0,
    },
    item("batch-code", "Batch code attached", `Every question must carry ${batchCode}.`, batchMapped, total, total),
    item("day-topic", "Day and topic mapped", "Day, chapter, and exact topic metadata must stay attached.", dayMapped, total, total),
    item("options", "Four-option MCQ format", "A-D options need meaningful text and a valid answer key.", completeOptions, total, total),
    item("stem-depth", "UPSC-style stem", "Stem should be long enough and include statement/qualifier/trap language.", stemReady, requiredForMost, total),
    item(
      "explanation-depth",
      "Mechanism explanation",
      "Explanation should include process, cause-effect, map, relief, climate, river, or pattern logic.",
      explanationRich,
      requiredForMost,
      total,
    ),
    item("map-anchor", "Map or atlas anchor", "Every Geography row needs a map/case/lab anchor.", mapAnchored, total, total),
    item("syllabus-keywords", "Syllabus keyword anchor", "At least half the batch should touch the day topic or anchor.", syllabusAnchored, requiredForHalf, total),
  ];

  const score = Math.round(items.reduce((sum, check) => sum + Math.min(100, check.ratio), 0) / items.length);
  const warnings = items.filter((check) => !check.passed).map((check) => check.label);
  return {
    batchCode,
    passed: countReady && score >= 85 && warnings.length === 0,
    score,
    readyCount: items.filter((check) => check.passed).length,
    totalQuestions: total,
    plannedCount,
    requiredMapTags,
    requiredKeywords,
    items,
    warnings,
  };
}
