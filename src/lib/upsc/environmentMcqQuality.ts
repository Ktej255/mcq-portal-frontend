import type { QuestionPayload } from "@/services/api/adminService";

import type { SubjectSession, SubjectSprintPlan } from "./subjectPlans";
import { getEnvironmentLabDeck } from "./environmentLabDecks";
import { getEnvironmentLearningPack } from "./environmentLearningDecks";

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

export type EnvironmentMcqQualityItem = {
  id: string;
  label: string;
  detail: string;
  passed: boolean;
  ratio: number;
};

export type EnvironmentMcqQualityAudit = {
  batchCode: string;
  passed: boolean;
  score: number;
  readyCount: number;
  totalQuestions: number;
  plannedCount: number;
  requiredCaseTags: string[];
  requiredKeywords: string[];
  items: EnvironmentMcqQualityItem[];
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
  "pair",
  "pairs",
  "following",
  "assertion",
  "reason",
  "can",
  "may",
  "must",
];

const MECHANISM_TERMS = [
  "because",
  "therefore",
  "mechanism",
  "impact",
  "cause",
  "effect",
  "link",
  "leads",
  "results",
  "process",
  "feedback",
  "trade-off",
  "governance",
  "ecosystem",
];

function qualityNotes(question: QuestionPayload): McqQualityNotes {
  const notes = question.quality_notes;
  if (!notes || typeof notes !== "object" || Array.isArray(notes)) return {};
  return notes as McqQualityNotes;
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

function buildCaseTags(plan: SubjectSprintPlan, session: SubjectSession) {
  const labSlug = plan.labs.find((lab) => lab.title === session.lab)?.slug ?? "ecosystem-cases";
  const deck = getEnvironmentLabDeck(labSlug, session);
  const learningPack = getEnvironmentLearningPack(session);
  return compactUnique([
    session.lab,
    ...deck.map((card) => card.title),
    ...deck.map((card) => card.category),
    ...deck.map((card) => card.anchor),
    ...learningPack.caseAnchors,
  ]).slice(0, 12);
}

function buildKeywords(session: SubjectSession) {
  const learningPack = getEnvironmentLearningPack(session);
  return compactUnique([
    session.chapter,
    session.title,
    session.anchor,
    ...learningPack.keywords,
    ...learningPack.caseAnchors,
  ])
    .flatMap((keyword) => keyword.split(/[,:/|]/g))
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length >= 4)
    .slice(0, 18);
}

export function getEnvironmentMcqTemplateHints(plan: SubjectSprintPlan, session: SubjectSession) {
  const learningPack = getEnvironmentLearningPack(session);
  const requiredCaseTags = buildCaseTags(plan, session);
  return {
    trapSeed: learningPack.trapBank[0] ?? `UPSC qualifier trap for ${session.title}`,
    explanationSeed:
      learningPack.teacherFocus ??
      `Explain the mechanism, the map or case anchor, and why each distractor fails for ${session.title}.`,
    caseTag: requiredCaseTags[0] ?? session.lab,
    requiredCaseTags,
    requiredKeywords: buildKeywords(session),
  };
}

export function auditEnvironmentMcqBatch(
  plan: SubjectSprintPlan,
  session: SubjectSession,
  batchCode: string,
  questions: QuestionPayload[],
  plannedCount: number,
): EnvironmentMcqQualityAudit {
  const total = questions.length;
  const requiredCaseTags = buildCaseTags(plan, session);
  const requiredKeywords = buildKeywords(session);
  const requiredForMost = Math.max(1, Math.ceil(total * 0.8));
  const requiredForHalf = Math.max(1, Math.ceil(total * 0.5));
  const requiredForCoverage = Math.max(1, Math.ceil(total * 0.35));

  const batchMapped = questions.filter((question) => qualityNotes(question).batch_code === batchCode).length;
  const dayMapped = questions.filter((question) => {
    const notes = qualityNotes(question);
    const dayMatches = textValue(notes.day) === String(session.day);
    const hasTopic = Boolean(textValue(notes.topic) || textValue(notes.chapter));
    return dayMatches && hasTopic;
  }).length;
  const completeOptions = questions.filter(optionsComplete).length;
  const explanationRich = questions.filter((question) => {
    const explanation = normalizedText(question.explanation_en);
    return explanation.length >= 80 && includesAny(explanation, MECHANISM_TERMS);
  }).length;
  const trapReady = questions.filter((question) => {
    const combined = `${normalizedText(question.text_en)} ${normalizedText(question.explanation_en)}`;
    return includesAny(combined, TRAP_TERMS);
  }).length;
  const caseAnchored = questions.filter((question) => {
    const notes = qualityNotes(question);
    const combined = `${normalizedText(question.text_en)} ${normalizedText(question.explanation_en)} ${normalizedText(
      notes.map_or_case_tag,
    )}`;
    return Boolean(textValue(notes.map_or_case_tag)) || includesAny(combined, requiredCaseTags);
  }).length;
  const keywordAnchored = questions.filter((question) => {
    const notes = qualityNotes(question);
    const combined = `${normalizedText(question.text_en)} ${normalizedText(question.explanation_en)} ${normalizedText(
      notes.topic,
    )} ${normalizedText(notes.chapter)}`;
    return includesAny(combined, requiredKeywords);
  }).length;

  const countReady = total >= plannedCount;
  const items: EnvironmentMcqQualityItem[] = [
    {
      id: "planned-count",
      label: "Fresh batch count",
      detail: `${total}/${plannedCount} drafted in local bulk bank.`,
      passed: countReady,
      ratio: plannedCount > 0 ? Math.min(100, ratio(total, plannedCount)) : 0,
    },
    item("batch-code", "Batch code attached", `Every question must carry ${batchCode}.`, batchMapped, total, total),
    item("day-topic", "Day and topic mapped", "Day, chapter, and topic metadata must stay attached.", dayMapped, total, total),
    item("options", "Four-option MCQ format", "A-D options and a valid correct option are required.", completeOptions, total, total),
    item(
      "explanation-depth",
      "Mechanism explanation",
      "Explanations should explain cause, process, impact, or governance logic.",
      explanationRich,
      requiredForMost,
      total,
    ),
    item(
      "trap-depth",
      "UPSC trap language",
      "Stems or explanations should include qualifier, statement, pair, or assertion style traps.",
      trapReady,
      requiredForHalf,
      total,
    ),
    item(
      "case-map-anchor",
      "Case or map anchor",
      "At least one-third of the batch should carry a map/case tag.",
      caseAnchored,
      requiredForCoverage,
      total,
    ),
    item(
      "syllabus-keywords",
      "Syllabus keyword anchor",
      "Questions should touch the day topic, learning keywords, or case anchors.",
      keywordAnchored,
      requiredForHalf,
      total,
    ),
  ];

  const score = Math.round(items.reduce((sum, check) => sum + Math.min(100, check.ratio), 0) / items.length);
  const warnings = items.filter((check) => !check.passed).map((check) => check.label);
  return {
    batchCode,
    passed: countReady && score >= 80 && warnings.length === 0,
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
