import type { QuestionPayload } from "@/services/api/adminService";

import type { SubjectSession, SubjectSprintPlan } from "./subjectPlans";
import { getHistoryLearningPack } from "./historyLearningDecks";

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

export type HistoryMcqQualityItem = {
  id: string;
  label: string;
  detail: string;
  passed: boolean;
  ratio: number;
};

export type HistoryMcqQualityAudit = {
  batchCode: string;
  passed: boolean;
  score: number;
  readyCount: number;
  totalQuestions: number;
  plannedCount: number;
  requiredCaseTags: string[];
  requiredKeywords: string[];
  items: HistoryMcqQualityItem[];
  warnings: string[];
};

const HISTORY_TRAP_TERMS = [
  "statement",
  "consider",
  "correct",
  "incorrect",
  "not",
  "only",
  "all",
  "except",
  "pair",
  "pairs",
  "match",
  "chronology",
  "sequence",
  "source",
  "period",
  "feature",
  "assertion",
  "reason",
];

const HISTORY_PROOF_TERMS = [
  "source",
  "map",
  "site",
  "centre",
  "leader",
  "personality",
  "region",
  "act",
  "inscription",
  "archaeological",
  "literary",
  "period",
  "dynasty",
  "school",
  "patronage",
  "chronology",
  "cause",
  "consequence",
  "evidence",
];

const HISTORY_CHRONOLOGY_TERMS = [
  "chronology",
  "period",
  "phase",
  "century",
  "before",
  "after",
  "timeline",
  "sequence",
  "event",
  "ancient",
  "medieval",
  "modern",
  "act",
  "dynasty",
  "empire",
  "movement",
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
      textValue(options.A) &&
      textValue(options.B) &&
      textValue(options.C) &&
      textValue(options.D) &&
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

function buildCaseTags(session: SubjectSession) {
  const learningPack = getHistoryLearningPack(session);
  return compactUnique([
    session.lab,
    session.title,
    session.chapter,
    session.anchor,
    ...learningPack.caseAnchors,
    ...learningPack.causeChain,
    ...learningPack.mcqAngles,
  ]).slice(0, 14);
}

function buildKeywords(session: SubjectSession) {
  const learningPack = getHistoryLearningPack(session);
  return compactUnique([
    session.chapter,
    session.title,
    session.anchor,
    ...learningPack.keywords,
    ...learningPack.caseAnchors,
    ...learningPack.causeChain,
    ...learningPack.mcqAngles,
  ])
    .flatMap((keyword) => keyword.split(/[,:/|>-]/g))
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length >= 4)
    .slice(0, 22);
}

export function auditHistoryMcqBatch(
  plan: SubjectSprintPlan,
  session: SubjectSession,
  batchCode: string,
  questions: QuestionPayload[],
  plannedCount: number,
): HistoryMcqQualityAudit {
  const total = questions.length;
  const requiredCaseTags = buildCaseTags(session);
  const requiredKeywords = buildKeywords(session);
  const requiredForMost = Math.max(1, Math.ceil(total * 0.8));
  const requiredForHalf = Math.max(1, Math.ceil(total * 0.5));
  const requiredForCoverage = Math.max(1, Math.ceil(total * 0.35));

  const batchMapped = questions.filter((question) => qualityNotes(question).batch_code === batchCode).length;
  const dayMapped = questions.filter((question) => {
    const notes = qualityNotes(question);
    const dayMatches = textValue(notes.day) === String(session.day);
    const chapterMatches = normalizedText(notes.chapter).includes(session.chapter.toLowerCase());
    const topicMatches = normalizedText(notes.topic).includes(session.title.toLowerCase());
    return dayMatches && (chapterMatches || topicMatches);
  }).length;
  const completeOptions = questions.filter(optionsComplete).length;
  const explanationRich = questions.filter((question) => {
    const explanation = normalizedText(question.explanation_en);
    return explanation.length >= 90 && includesAny(explanation, HISTORY_PROOF_TERMS);
  }).length;
  const trapReady = questions.filter((question) => {
    const combined = `${normalizedText(question.text_en)} ${normalizedText(question.explanation_en)}`;
    return includesAny(combined, HISTORY_TRAP_TERMS);
  }).length;
  const sourceMapAnchored = questions.filter((question) => {
    const notes = qualityNotes(question);
    const combined = `${normalizedText(question.text_en)} ${normalizedText(question.explanation_en)} ${normalizedText(
      notes.map_or_case_tag,
    )}`;
    return Boolean(textValue(notes.map_or_case_tag)) || includesAny(combined, requiredCaseTags) || includesAny(combined, HISTORY_PROOF_TERMS);
  }).length;
  const chronologyProof = questions.filter((question) => {
    const combined = `${normalizedText(question.text_en)} ${normalizedText(question.explanation_en)} ${normalizedText(
      qualityNotes(question).map_or_case_tag,
    )}`;
    return includesAny(combined, HISTORY_CHRONOLOGY_TERMS);
  }).length;
  const keywordAnchored = questions.filter((question) => {
    const notes = qualityNotes(question);
    const combined = `${normalizedText(question.text_en)} ${normalizedText(question.explanation_en)} ${normalizedText(
      notes.topic,
    )} ${normalizedText(notes.chapter)}`;
    return includesAny(combined, requiredKeywords);
  }).length;

  const countReady = total >= plannedCount;
  const items: HistoryMcqQualityItem[] = [
    {
      id: "planned-count",
      label: "Fresh batch count",
      detail: `${total}/${plannedCount} drafted in local bulk bank.`,
      passed: countReady,
      ratio: plannedCount > 0 ? Math.min(100, ratio(total, plannedCount)) : 0,
    },
    item("batch-code", "Batch code attached", `Every question must carry ${batchCode}.`, batchMapped, total, total),
    item("day-topic", "Day and topic mapped", "Day, chapter, or exact topic metadata must stay attached.", dayMapped, total, total),
    item("options", "Four-option MCQ format", "A-D options and a valid correct option are required.", completeOptions, total, total),
    item(
      "explanation-depth",
      "History proof explanation",
      "Explanations should name source, map/site, actor/institution, cause, period, or consequence.",
      explanationRich,
      requiredForMost,
      total,
    ),
    item(
      "trap-depth",
      "UPSC trap language",
      "Stems or explanations should use statement, chronology, pair, source, period, or feature traps.",
      trapReady,
      requiredForHalf,
      total,
    ),
    item(
      "source-map-anchor",
      "Source-map-personality anchor",
      "At least one-third of the batch should carry a map, source, site, leader, institution, or feature hook.",
      sourceMapAnchored,
      requiredForCoverage,
      total,
    ),
    item(
      "chronology-proof",
      "Chronology or period proof",
      "History MCQs must test timeline, period, phase, dynasty, act, movement, or sequence logic.",
      chronologyProof,
      requiredForHalf,
      total,
    ),
    item(
      "syllabus-keywords",
      "History syllabus anchor",
      "Questions should touch the day topic, chapter, learning keywords, or case anchors.",
      keywordAnchored,
      requiredForHalf,
      total,
    ),
  ];

  const score = Math.round(items.reduce((sum, check) => sum + Math.min(100, check.ratio), 0) / items.length);
  const warnings = items.filter((check) => !check.passed).map((check) => check.label);

  return {
    batchCode,
    passed: plan.slug === "history" && countReady && score >= 80 && warnings.length === 0,
    score,
    readyCount: items.filter((check) => check.passed).length,
    totalQuestions: total,
    plannedCount,
    requiredCaseTags,
    requiredKeywords,
    items,
    warnings,
  };
}
