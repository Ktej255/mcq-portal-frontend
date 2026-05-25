import type { QuestionPayload } from "@/services/api/adminService";

import { auditEnvironmentMcqBatch } from "./environmentMcqQuality";
import { auditGeographyMcqBatch } from "./geographyMcqQuality";
import { getGeographyBatchCode } from "./mcqContract";
import { geographySessions } from "./plan";
import { environmentPlan } from "./subjectPlans";

export const LOCAL_BULK_DRAFT_KEY = "sarit-admin-bulk-question-drafts-v1";
export const UPSC_MCQ_COMMAND_STATE_KEY = "sarit-upsc-mcq-command-v1";

export type LocalBulkImportMode = "EMPTY" | "LEGACY" | "UPSC_MCQ_COMMAND" | "MIXED";

export type LocalBulkQuestionDraft = {
  id: string;
  createdAt: string;
  importMode: LocalBulkImportMode;
  questions: QuestionPayload[];
};

export type McqCommandBatchState = {
  planned: number;
  drafted: number;
  difficulty: string;
  status: "DRAFT" | "READY";
  updatedAt?: string;
};

function getQualityNotes(question: QuestionPayload) {
  const notes = question.quality_notes;
  return notes && typeof notes === "object" && !Array.isArray(notes) ? (notes as Record<string, unknown>) : {};
}

function getTextValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

export function readLocalBulkQuestionDrafts(): LocalBulkQuestionDraft[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_BULK_DRAFT_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalBulkQuestionDrafts(drafts: LocalBulkQuestionDraft[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_BULK_DRAFT_KEY, JSON.stringify(drafts));
}

export function appendLocalBulkQuestionDraft(draft: Omit<LocalBulkQuestionDraft, "id" | "createdAt">) {
  const nextDraft: LocalBulkQuestionDraft = {
    id: `local-bulk-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...draft,
  };
  writeLocalBulkQuestionDrafts([...readLocalBulkQuestionDrafts(), nextDraft]);
  syncMcqCommandStateFromQuestions(nextDraft.questions);
  return nextDraft;
}

export function readMcqCommandBatchStates(): Record<string, McqCommandBatchState> {
  if (typeof window === "undefined") return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(UPSC_MCQ_COMMAND_STATE_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function writeMcqCommandBatchStates(states: Record<string, McqCommandBatchState>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(UPSC_MCQ_COMMAND_STATE_KEY, JSON.stringify(states));
}

export function readMcqCommandBatchState(batchCode: string) {
  return readMcqCommandBatchStates()[batchCode] ?? null;
}

export function readLocalMcqCommandQuestionsForBatch(batchCode: string) {
  return readLocalBulkQuestionDrafts().flatMap((draft) =>
    draft.questions.filter((question) => getTextValue(getQualityNotes(question).batch_code) === batchCode)
  );
}

export function upsertMcqCommandBatchState(batchCode: string, patch: Partial<McqCommandBatchState>) {
  const existing = readMcqCommandBatchStates();
  const current = existing[batchCode];
  const planned = patch.planned ?? current?.planned ?? 25;
  const drafted = patch.drafted ?? current?.drafted ?? 0;
  const next: McqCommandBatchState = {
    planned,
    drafted,
    difficulty: patch.difficulty ?? current?.difficulty ?? "MEDIUM",
    status: patch.status ?? (drafted >= planned ? "READY" : "DRAFT"),
    updatedAt: new Date().toISOString(),
  };
  writeMcqCommandBatchStates({
    ...existing,
    [batchCode]: next,
  });
  return next;
}

function dayFromBatchCode(batchCode: string) {
  const match = /(?:GEO|ENV)-D(\d+)/i.exec(batchCode);
  return match ? Number(match[1]) : null;
}

function hasPassedSubjectQualityGate(batchCode: string, batchQuestions: QuestionPayload[], planned: number) {
  const day = dayFromBatchCode(batchCode);
  if (!day) return batchQuestions.length >= planned;

  if (/^GEO-D/i.test(batchCode)) {
    const session = geographySessions.find((item) => item.day === day);
    if (!session || getGeographyBatchCode(session) !== batchCode) return false;
    return auditGeographyMcqBatch(session, batchCode, batchQuestions, planned).passed;
  }

  if (/^ENV-D/i.test(batchCode)) {
    const session = environmentPlan.sessions.find((item) => item.day === day);
    if (!session) return false;
    return auditEnvironmentMcqBatch(environmentPlan, session, batchCode, batchQuestions, planned).passed;
  }

  return batchQuestions.length >= planned;
}

export function syncMcqCommandStateFromQuestions(questions: QuestionPayload[]) {
  if (typeof window === "undefined") return;

  const grouped = questions.reduce<Record<string, QuestionPayload[]>>((acc, question) => {
    const batchCode = getTextValue(getQualityNotes(question).batch_code);
    if (!batchCode) return acc;
    acc[batchCode] = [...(acc[batchCode] ?? []), question];
    return acc;
  }, {});

  if (Object.keys(grouped).length === 0) return;

  const existing = readMcqCommandBatchStates();

  const next = { ...existing };
  for (const [batchCode, batchQuestions] of Object.entries(grouped)) {
    const current = next[batchCode];
    const drafted = batchQuestions.length;
    const planned = Math.max(current?.planned ?? 25, drafted);
    const qualityPassed = hasPassedSubjectQualityGate(batchCode, batchQuestions, planned);
    next[batchCode] = {
      planned,
      drafted,
      difficulty: batchQuestions[0]?.difficulty || current?.difficulty || "MEDIUM",
      status: drafted >= planned && qualityPassed ? "READY" : "DRAFT",
      updatedAt: new Date().toISOString(),
    };
  }

  writeMcqCommandBatchStates(next);
}
