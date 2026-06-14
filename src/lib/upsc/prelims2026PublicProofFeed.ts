import type { ShowcaseQuestionEvidence } from "@/lib/upsc/prelims2026ShowcaseEvidence";

export const prelims2026PublicProofFeedVersion = "upsc-prelims-2026-public-proof-feed-v1";
export const prelims2026PublicProofFeedLocalStorageKey =
  "sarit-upsc-prelims-2026-public-proof-feed-local-v1";

export type Prelims2026ProofPacket = {
  sourceRef: string;
  pageRef: string;
  teacherNote: string;
  publicClaim: string;
  updatedAt?: string;
};

export type Prelims2026PublicProofFeedClaimInput = {
  question: ShowcaseQuestionEvidence;
  packet: Prelims2026ProofPacket;
};

export type Prelims2026PublicProofFeed = {
  version: string;
  lastUpdatedAt: string;
  audit: {
    direct: number;
    partial: number;
    misses: number;
    dropped: number;
    scorableQuestions: number;
    effectiveCoveragePercent: number;
  };
  proofPolicy: string;
  portalOwner: string;
  releasedClaims: Array<{
    questionNumber: number;
    subject: string;
    auditStatus: ShowcaseQuestionEvidence["status"];
    statusLabel: string;
    format: string;
    sourceLead: string;
    matchScope: string;
    publicClaim: string;
    sourceRef: string;
    pageRef: string;
    teacherNote: string;
    updatedAt: string | null;
    question: {
      stem: string;
      statements: string[];
      instruction: string;
      options: ShowcaseQuestionEvidence["options"];
      answer: string;
    };
    matchedPortions: Array<{
      label: string;
      text: string;
      coverageLabel: string;
      matchedSignals: string[];
    }>;
    manualCheckPortions: Array<{
      label: string;
      text: string;
      coverageLabel: string;
    }>;
  }>;
};

export function buildEmptyPrelims2026PublicProofFeed(
  lastUpdatedAt = "local-draft"
): Prelims2026PublicProofFeed {
  return {
    version: prelims2026PublicProofFeedVersion,
    lastUpdatedAt,
    audit: {
      direct: 44,
      partial: 30,
      misses: 23,
      dropped: 3,
      scorableQuestions: 97,
      effectiveCoveragePercent: 76,
    },
    proofPolicy:
      "Question-wise public claims require Approved decision plus complete source reference, page/location, teacher note and public claim line.",
    portalOwner: "/upsc/prelims-2027-strategy#prelims-2026-public-claim-release-board",
    releasedClaims: [],
  };
}

export function buildPrelims2026PublicProofFeed(
  rows: Prelims2026PublicProofFeedClaimInput[]
): Prelims2026PublicProofFeed {
  const updatedAts = rows
    .map((row) => row.packet.updatedAt)
    .filter((updatedAt): updatedAt is string => Boolean(updatedAt))
    .sort();
  const lastUpdatedAt = updatedAts[updatedAts.length - 1] ?? "local-draft";
  const feed = buildEmptyPrelims2026PublicProofFeed(lastUpdatedAt);

  return {
    ...feed,
    releasedClaims: rows.map((row) => ({
      questionNumber: row.question.number,
      subject: row.question.subject,
      auditStatus: row.question.status,
      statusLabel: row.question.statusLabel,
      format: row.question.formatLabel,
      sourceLead: row.question.sourceLead,
      matchScope: row.question.matchScope,
      publicClaim: row.packet.publicClaim,
      sourceRef: row.packet.sourceRef,
      pageRef: row.packet.pageRef,
      teacherNote: row.packet.teacherNote,
      updatedAt: row.packet.updatedAt ?? null,
      question: {
        stem: row.question.stemFull,
        statements: row.question.statementsFull,
        instruction: row.question.instruction,
        options: row.question.options,
        answer: row.question.answer,
      },
      matchedPortions: row.question.statementCoverage
        .filter((portion) => portion.coverage !== "manual-check")
        .map((portion) => ({
          label: portion.label,
          text: portion.text,
          coverageLabel: portion.coverageLabel,
          matchedSignals: portion.matchedSignals,
        })),
      manualCheckPortions: row.question.statementCoverage
        .filter((portion) => portion.coverage === "manual-check")
        .map((portion) => ({
          label: portion.label,
          text: portion.text,
          coverageLabel: portion.coverageLabel,
        })),
    })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseOptions(value: unknown): ShowcaseQuestionEvidence["options"] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      letter: typeof item.letter === "string" ? item.letter : "",
      text: typeof item.text === "string" ? item.text : "",
    }))
    .filter((option) => option.letter && option.text);
}

function parseMatchedPortions(value: unknown): Prelims2026PublicProofFeed["releasedClaims"][number]["matchedPortions"] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      label: typeof item.label === "string" ? item.label : "",
      text: typeof item.text === "string" ? item.text : "",
      coverageLabel: typeof item.coverageLabel === "string" ? item.coverageLabel : "",
      matchedSignals: isStringArray(item.matchedSignals) ? item.matchedSignals : [],
    }))
    .filter((portion) => portion.label && portion.text);
}

function parseManualCheckPortions(
  value: unknown
): Prelims2026PublicProofFeed["releasedClaims"][number]["manualCheckPortions"] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      label: typeof item.label === "string" ? item.label : "",
      text: typeof item.text === "string" ? item.text : "",
      coverageLabel: typeof item.coverageLabel === "string" ? item.coverageLabel : "",
    }))
    .filter((portion) => portion.label && portion.text);
}

function parseReleasedClaim(value: unknown): Prelims2026PublicProofFeed["releasedClaims"][number] | null {
  if (!isRecord(value)) return null;
  const question = isRecord(value.question) ? value.question : {};
  const auditStatus = value.auditStatus === "direct" || value.auditStatus === "partial" ? value.auditStatus : "none";
  const questionNumber = Number(value.questionNumber);

  if (!Number.isFinite(questionNumber) || questionNumber < 1) return null;
  if (
    typeof value.subject !== "string" ||
    typeof value.statusLabel !== "string" ||
    typeof value.format !== "string" ||
    typeof value.publicClaim !== "string" ||
    typeof value.sourceRef !== "string" ||
    typeof value.pageRef !== "string" ||
    typeof value.teacherNote !== "string"
  ) {
    return null;
  }

  return {
    questionNumber,
    subject: value.subject,
    auditStatus,
    statusLabel: value.statusLabel,
    format: value.format,
    sourceLead: typeof value.sourceLead === "string" ? value.sourceLead : "",
    matchScope: typeof value.matchScope === "string" ? value.matchScope : "",
    publicClaim: value.publicClaim,
    sourceRef: value.sourceRef,
    pageRef: value.pageRef,
    teacherNote: value.teacherNote,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
    question: {
      stem: typeof question.stem === "string" ? question.stem : "",
      statements: isStringArray(question.statements) ? question.statements : [],
      instruction: typeof question.instruction === "string" ? question.instruction : "",
      options: parseOptions(question.options),
      answer: typeof question.answer === "string" ? question.answer : "",
    },
    matchedPortions: parseMatchedPortions(value.matchedPortions),
    manualCheckPortions: parseManualCheckPortions(value.manualCheckPortions),
  };
}

export function parsePrelims2026PublicProofFeed(value: unknown): Prelims2026PublicProofFeed | null {
  if (!isRecord(value)) return null;
  if (value.version !== prelims2026PublicProofFeedVersion) return null;
  if (!Array.isArray(value.releasedClaims)) return null;

  const base = buildEmptyPrelims2026PublicProofFeed(
    typeof value.lastUpdatedAt === "string" ? value.lastUpdatedAt : "local-draft"
  );
  const releasedClaims = value.releasedClaims.map(parseReleasedClaim).filter(Boolean);

  return {
    ...base,
    proofPolicy: typeof value.proofPolicy === "string" ? value.proofPolicy : base.proofPolicy,
    portalOwner: typeof value.portalOwner === "string" ? value.portalOwner : base.portalOwner,
    releasedClaims: releasedClaims as Prelims2026PublicProofFeed["releasedClaims"],
  };
}
