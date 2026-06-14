"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  FileCheck2,
  FileSearch,
  Gauge,
  Layers3,
  Radar,
  RefreshCw,
  Route,
  ShieldCheck,
  Target,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  buildPrelims2026ShowcaseEvidence,
  type ShowcaseQuestionEvidence,
} from "@/lib/upsc/prelims2026ShowcaseEvidence";
import { buildPrelims2026ShowcaseManifest } from "@/lib/upsc/prelims2026ShowcaseManifest";
import {
  buildPrelims2026PublicProofFeed,
  prelims2026PublicProofFeedLocalStorageKey,
  type Prelims2026PublicProofFeed,
  type Prelims2026ProofPacket,
} from "@/lib/upsc/prelims2026PublicProofFeed";
import { buildArchiveCandidatesForQuestion } from "@/lib/upsc/prelims2026ArchiveProofReadiness";
import {
  buildSourceGapWorkOrder,
  readSourceGapWorkOrders,
  sourceGapWorkOrderId,
  sourceGapWorkOrderStatusOptions,
  sourceGapWorkOrderTone,
  type SourceGapWorkOrder,
  type SourceGapWorkOrderStatus,
  writeSourceGapWorkOrders,
} from "@/lib/upsc/prelims2027Operations";
import { readLocalQuestionBankAttempts, type QuestionBankAttempt } from "@/lib/upsc/questionBankEngine";
import type {
  SourceArchiveFileHit,
  SourceArchiveIntakeResponse,
} from "@/lib/upsc/sourceArchiveIntake";
import {
  buildStrategyPracticeHandoff,
  formatRebuildRules,
  prelims2027Priorities,
  simulatorModules,
  strategyEvidenceLedger,
  strategyExecutionTasks,
  strategyGapTypes,
  strategyLaunchSteps,
  strategyPracticeHandoffStorageKey,
  strategyPracticeBlueprints,
  strategyReallocationPlan,
  strategySprintCalendar,
  type StrategyPracticeHandoff,
  type StrategyStatus,
  type StrategyTaskPhase,
} from "@/lib/upsc/prelims2027Strategy";
import { cn } from "@/lib/utils";

const storageKey = "sarit-upsc-prelims-2027-strategy-v1";
const mcqCommandStorageKey = "sarit-upsc-mcq-command-v1";
const questionProofStorageKey = "sarit-upsc-prelims-2026-question-proof-v1";
const questionProofPacketStorageKey = "sarit-upsc-prelims-2026-proof-packets-v1";
const statusOptions: StrategyStatus[] = ["Planned", "Building", "Ready"];
const questionProofOptions = ["Needs proof", "Approved", "Rejected", "Build gap"] as const;
const strategyTaskPhaseOrder: StrategyTaskPhase[] = ["Source", "Capsule", "MCQ", "Proof", "Release", "Planner"];

const summaryCards: Array<{ title: string; body: string; icon: LucideIcon }> = [
  {
    title: "Proof locked",
    body: "Public claim remains locked until exact source/page proof is retained.",
    icon: ShieldCheck,
  },
  {
    title: "Planner linked",
    body: "Critical priorities now link to existing content, MCQ and subject surfaces.",
    icon: Route,
  },
  {
    title: "Readiness visible",
    body: "Students can be simulated against the 2027 risk map before practice starts.",
    icon: BrainCircuit,
  },
];

type StoredStrategyState = {
  statuses: Record<string, StrategyStatus>;
  completedModules: string[];
  completedTasks: string[];
  queuedBlueprints: string[];
};

type McqCommandBatchState = {
  planned: number;
  drafted: number;
  difficulty: string;
  status: "DRAFT" | "READY";
  updatedAt?: string;
  strategyBlueprintId?: string;
  strategyTitle?: string;
  strategyFormat?: string;
};

type QuestionProofDecision = (typeof questionProofOptions)[number];

type QuestionProofPacket = Prelims2026ProofPacket;

type PublicClaimReleaseRow = {
  question: ShowcaseQuestionEvidence;
  packet: QuestionProofPacket;
  matchedPortions: number;
  pendingPortions: number;
};

type QuestionLedgerApiQuestion = {
  number: number;
  subject: string;
  answer: string;
  status: string;
  statusLabel: string;
  sourceLead: string;
  proofLocked: boolean;
  question: {
    stem: string;
    statements: string[];
    instruction: string;
    options: Array<{
      letter: string;
      text: string;
    }>;
  };
  match: {
    coveredSignals: string[];
    matchScope: string;
    conceptLead: string;
    statementCoverage: ShowcaseQuestionEvidence["statementCoverage"];
  };
};

type QuestionLedgerApiPayload = {
  version: string;
  publicAnchor: string;
  proofPolicy: string;
  correctedAudit: {
    direct: number;
    partial: number;
    misses: number;
    dropped: number;
    scorableQuestions: number;
    preparedQuestions: number;
    effectiveCoveragePercent: number;
  };
  sourceLeadLedger: {
    directTextLeads: number;
    conceptualLeads: number;
    noIndexedLeads: number;
    totalQuestions: number;
  };
  summary: {
    totalQuestions: number;
    completeQuestionCards: number;
    optionSets: number;
    statementCoverageRows: number;
    sourceSignalRows: number;
    conceptSignalRows: number;
    manualCheckRows: number;
    multiStatementQuestions: number;
  };
  questions: QuestionLedgerApiQuestion[];
  api: {
    reviewCommand: string;
    manifest: string;
    questionLedger: string;
    proofFeed: string;
  };
};

type QuestionLedgerApiState = {
  status: "loading" | "ready" | "error";
  message: string;
  ledger: QuestionLedgerApiPayload | null;
};

type MatchAccountabilityApiQuestion = {
  number: number;
  subject: string;
  status: string;
  statusLabel: string;
  answer: string;
  proofLocked: boolean;
  question: {
    stem: string;
    statements: string[];
    instruction: string;
    options: Array<{
      letter: string;
      text: string;
    }>;
  };
  match: {
    sourceLead: string;
    formatLabel: string;
    trapStyle: string;
    matchScope: string;
    highestMatchedPortion: string;
    matchedPortionLabels: string[];
    manualCheckPortionLabels: string[];
    coverageScorePercent: number;
    coveredSignals: string[];
    nextProofAction: string;
    researchNote: string;
    portionCoverage: ShowcaseQuestionEvidence["statementCoverage"];
  };
};

type MatchAccountabilityApiPayload = {
  version: string;
  publicAnchor: string;
  strategyAnchor: string;
  proofPolicy: string;
  summary: {
    totalQuestions: number;
    completeQuestionCards: number;
    optionSets: number;
    portionRows: number;
    matchedPortionRows: number;
    sourceSignalRows: number;
    conceptSignalRows: number;
    manualCheckRows: number;
    fullyMatchedQuestions: number;
    partialMatchQuestions: number;
    manualOnlyQuestions: number;
    highlightedQuestions: number;
    proofLockedQuestions: number;
    directTextLeads: number;
    conceptualLeads: number;
    noIndexedLeads: number;
  };
  questions: MatchAccountabilityApiQuestion[];
  api: {
    releaseDecision: string;
    matchAccountability: string;
    questionLedger: string;
    proofFeed: string;
    manifest: string;
  };
};

type MatchAccountabilityApiState = {
  status: "loading" | "ready" | "error";
  message: string;
  accountability: MatchAccountabilityApiPayload | null;
};

type CourseActionApiPriority = {
  id: string;
  subject: string;
  priority: string;
  window: string;
  ownerSurface: string;
  action: string;
  taskCount: number;
  blueprintCount: number;
  proofStatus: string;
  releaseGate: string;
  nextProofAction: string;
};

type CourseActionApiPayload = {
  version: string;
  publicAnchor: string;
  proofPolicy: string;
  summary: {
    priorityCount: number;
    criticalPriorityCount: number;
    highPriorityCount: number;
    mediumPriorityCount: number;
    lowPriorityCount: number;
    minimalPriorityCount: number;
    taskCount: number;
    sprintCount: number;
    practiceBlueprintCount: number;
    formatRuleCount: number;
    reallocationDecisionCount: number;
    evidenceLedgerCount: number;
    launchStepCount: number;
    phaseCounts: Record<StrategyTaskPhase, number>;
  };
  priorities: CourseActionApiPriority[];
  api: {
    reviewCommand: string;
    manifest: string;
    questionLedger: string;
    proofFeed: string;
    courseAction: string;
  };
};

type CourseActionApiState = {
  status: "loading" | "ready" | "error";
  message: string;
  courseAction: CourseActionApiPayload | null;
};

type SourceArchiveSummaryApiPayload = {
  version: string;
  sourceLabel: string;
  publicRoute: string;
  publicAnchor: string;
  internalIntakeRoute: string;
  proofPolicy: string;
  scan: {
    ok: boolean;
    rootConnected: boolean;
    totalFiles: number;
    totalDirectories: number;
    totalBytes: number;
    pdfCount: number;
    docxCount: number;
    imageCount: number;
    extensionTypeCount: number;
    folderBucketCount: number;
    trackCount: number;
    strongestTrackId: string;
    strongestTrackLabel: string;
    message: string;
  };
  extensions: Array<{
    extension: string;
    count: number;
  }>;
  topFolders: Array<{
    name: string;
    fileCount: number;
  }>;
  tracks: Array<{
    id: string;
    label: string;
    decision: string;
    hitCount: number;
    sampleCount: number;
    nextAction: string;
  }>;
  api: {
    manifest: string;
    questionLedger: string;
    proofFeed: string;
    courseAction: string;
    sourceArchiveSummary: string;
  };
};

type SourceArchiveSummaryApiState = {
  status: "loading" | "ready" | "error";
  message: string;
  summary: SourceArchiveSummaryApiPayload | null;
};

type BuildReadinessRequirement = {
  id: string;
  label: string;
  status: string;
  publicAnchor: string;
  portalOwner: string;
  apiEvidence: string;
  verifier: string;
  proof: string;
};

type BuildReadinessGate = {
  id: string;
  label: string;
  status: string;
  rule: string;
};

type BuildReadinessApiPayload = {
  version: string;
  status: string;
  publicRoute: string;
  strategyRoute: string;
  proofPolicy: string;
  summary: {
    requirementCount: number;
    completeCount: number;
    proofLockedCount: number;
    portalOwnedCount: number;
    websiteCopyBlockCount: number;
    integrationRowCount: number;
    originalTrackerCount: number;
    questionCount: number;
    completeQuestionCards: number;
    optionSetCount: number;
    statementCoverageRows: number;
    priorityCount: number;
    strategyTaskCount: number;
    practiceBlueprintCount: number;
    formatRuleCount: number;
    apiEndpointCount: number;
    verifierCount: number;
  };
  gates: BuildReadinessGate[];
  requirements: BuildReadinessRequirement[];
  api: {
    reviewCommand: string;
    releaseDecision: string;
    mainSiteHandoff: string;
    manifest: string;
    matchAccountability: string;
    questionLedger: string;
    proofFeed: string;
    courseAction: string;
    sourceArchiveSummary: string;
    buildReadiness: string;
  };
};

type BuildReadinessApiState = {
  status: "loading" | "ready" | "error";
  message: string;
  readiness: BuildReadinessApiPayload | null;
};

type ReleaseDecisionApiPayload = {
  version: string;
  status: string;
  publicRoute: string;
  publicAnchor: string;
  strategyRoute: string;
  strategyAnchor: string;
  proofPolicy: string;
  decision: {
    headline: string;
    publicStatus: string;
    allowedNow: string[];
    proofLocked: string[];
    internalOnly: string[];
  };
  summary: {
    effectiveCoveragePercent: number;
    preparedQuestions: number;
    scorableQuestions: number;
    proofLockedQuestionCount: number;
    releasedClaimCount: number;
    sourceArchiveFileCount: number;
    strategyTaskCount: number;
    practiceBlueprintCount: number;
    apiEndpointCount: number;
  };
  gates: Array<{
    id: string;
    title: string;
    status: string;
    metric: string;
    evidence: string;
    publicAction: string;
    softwareOwner: string;
  }>;
  api: {
    reviewCommand: string;
    releaseDecision: string;
    mainSiteHandoff: string;
    manifest: string;
    matchAccountability: string;
    questionLedger: string;
    proofFeed: string;
    courseAction: string;
    sourceArchiveSummary: string;
    buildReadiness: string;
  };
};

type ReleaseDecisionApiState = {
  status: "loading" | "ready" | "error";
  message: string;
  decision: ReleaseDecisionApiPayload | null;
};

type PublicProofFeedApiPayload = {
  mode: string;
  table: string;
  feed: Prelims2026PublicProofFeed;
  claimCount: number;
  publishedAt: string | null;
  message: string;
};

type PublicProofFeedApiState = {
  status: "loading" | "ready" | "error";
  message: string;
  payload: PublicProofFeedApiPayload | null;
};

const defaultCompletedModules = ["economy-master", "art-culture-bank", "history-tn-board"];

function readStrategyState(): StoredStrategyState {
  if (typeof window === "undefined") {
    return { statuses: {}, completedModules: defaultCompletedModules, completedTasks: [], queuedBlueprints: [] };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return { statuses: {}, completedModules: defaultCompletedModules, completedTasks: [], queuedBlueprints: [] };
    }
    const parsed = JSON.parse(raw);

    return {
      statuses: parsed?.statuses && typeof parsed.statuses === "object" ? parsed.statuses : {},
      completedModules: Array.isArray(parsed?.completedModules) ? parsed.completedModules : defaultCompletedModules,
      completedTasks: Array.isArray(parsed?.completedTasks) ? parsed.completedTasks : [],
      queuedBlueprints: Array.isArray(parsed?.queuedBlueprints) ? parsed.queuedBlueprints : [],
    };
  } catch {
    return { statuses: {}, completedModules: defaultCompletedModules, completedTasks: [], queuedBlueprints: [] };
  }
}

function writeStrategyState(state: StoredStrategyState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

function readPracticeHandoffs(): StrategyPracticeHandoff[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(strategyPracticeHandoffStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePracticeHandoffs(handoffs: StrategyPracticeHandoff[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(strategyPracticeHandoffStorageKey, JSON.stringify(handoffs));
}

function readMcqBatchStates(): Record<string, McqCommandBatchState> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(mcqCommandStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, McqCommandBatchState>) : {};
  } catch {
    return {};
  }
}

function defaultQuestionProofDecision(status: ShowcaseQuestionEvidence["status"]): QuestionProofDecision {
  return status === "none" ? "Build gap" : "Needs proof";
}

function readQuestionProofStates(): Record<string, QuestionProofDecision> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(questionProofStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => questionProofOptions.includes(value as QuestionProofDecision))
    ) as Record<string, QuestionProofDecision>;
  } catch {
    return {};
  }
}

function writeQuestionProofStates(states: Record<string, QuestionProofDecision>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(questionProofStorageKey, JSON.stringify(states));
}

function readQuestionProofPackets(): Record<string, QuestionProofPacket> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(questionProofPacketStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => {
        if (!value || typeof value !== "object") return false;
        const packet = value as Partial<QuestionProofPacket>;
        return (
          typeof packet.sourceRef === "string" &&
          typeof packet.pageRef === "string" &&
          typeof packet.teacherNote === "string" &&
          typeof packet.publicClaim === "string"
        );
      })
    ) as Record<string, QuestionProofPacket>;
  } catch {
    return {};
  }
}

function writeQuestionProofPackets(packets: Record<string, QuestionProofPacket>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(questionProofPacketStorageKey, JSON.stringify(packets));
}

function emptyProofPacket(): QuestionProofPacket {
  return {
    sourceRef: "",
    pageRef: "",
    teacherNote: "",
    publicClaim: "",
  };
}

function proofPacketComplete(packet?: QuestionProofPacket) {
  return Boolean(
    packet?.sourceRef.trim() &&
      packet.pageRef.trim() &&
      packet.teacherNote.trim() &&
      packet.publicClaim.trim()
  );
}

function buildWebsitePublishPacketText(rows: PublicClaimReleaseRow[]) {
  const releasedClaims = rows.length
    ? rows
        .map(
          (row) =>
            `- Q${row.question.number} (${row.question.subject}): ${row.packet.publicClaim} Proof retained: ${row.packet.sourceRef}, ${row.packet.pageRef}.`
        )
        .join("\n")
    : "- No question-level claims released yet. Keep MCQ-level claims proof-locked.";

  return [
    "UPSC Prelims 2026: what we built, what appeared, and what changes for 2027.",
    "",
    "Corrected research outcome: 44 direct hits, 30 partial hits, 23 misses and 3 dropped questions.",
    "Public interpretation: 74 of 97 scorable questions had direct or partial preparation advantage, or 76% effective coverage.",
    "",
    "Proof discipline: question-wise claims are released only after exact source/page proof, teacher note and public claim line are retained in the portal.",
    "",
    "Released question-level claims:",
    releasedClaims,
    "",
    "Portal owner: /upsc/prelims-2027-strategy#prelims-2026-public-claim-release-board",
  ].join("\n");
}

function formatProofFeedUpdateLabel(updatedAt: string) {
  if (updatedAt === "local-draft") return "Local draft";

  const [date, time] = updatedAt.split("T");
  if (!date || !time) return updatedAt;

  return `${date} ${time.slice(0, 5)}`;
}

function statusTone(status: StrategyStatus) {
  if (status === "Ready") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (status === "Building") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]";
}

function priorityTone(priority: string) {
  if (priority === "Critical") return "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]";
  if (priority === "High") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  if (priority === "Minimal") return "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b]";
  return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
}

function difficultyTone(difficulty: string) {
  if (difficulty === "Exam Trap") return "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]";
  if (difficulty === "Applied") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
}

function deliveryStageTone(stage: string) {
  if (stage === "Student solved") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (stage === "MCQ locked") return "border-[#1a3a2a] bg-[#edf7f1] text-[#123828]";
  if (stage === "Generated") return "border-[#1f5d8f] bg-[#eef5ff] text-[#1f5d8f]";
  if (stage === "Queued") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#dcd5c7] bg-[#f7f4ee] text-[#746f66]";
}

function evidenceStatusTone(status: string) {
  if (status === "Claim ready") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (status === "Needs source pack") return "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]";
  if (status === "Needs page proof") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#dcd5c7] bg-[#f7f4ee] text-[#746f66]";
}

function questionProofDecisionTone(status: QuestionProofDecision) {
  if (status === "Approved") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (status === "Rejected") return "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]";
  if (status === "Build gap") return "border-[#1f5d8f] bg-[#eef5ff] text-[#1f5d8f]";
  return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
}

function auditStatusTone(status: ShowcaseQuestionEvidence["status"]) {
  if (status === "direct") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (status === "partial") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]";
}

function publishGateTone(status: string) {
  if (status === "Public safe" || status === "Ready") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (status === "Proof locked" || status === "In progress") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]";
}

function buildReadinessStatusTone(status: string) {
  if (status === "Complete" || status === "Pass") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (status === "Proof locked" || status === "Portal owned") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]";
}

function sprintStatusTone(status: string) {
  if (status === "Ready") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (status === "Building") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#dcd5c7] bg-[#f7f4ee] text-[#746f66]";
}

function reallocationDecisionTone(decision: string) {
  if (decision === "Build from scratch") return "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]";
  if (decision === "Depth upgrade") return "border-[#805ad5] bg-[#f2ecff] text-[#5b3aa5]";
  if (decision === "Patch and tag") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  if (decision === "Maintain") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  return "border-[#1f5d8f] bg-[#eef5ff] text-[#1f5d8f]";
}

function formatArchiveBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

function formatArchiveDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function UpscPrelims2027StrategyCommand() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, StrategyStatus>>({});
  const [completedModules, setCompletedModules] = useState<string[]>(defaultCompletedModules);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [queuedBlueprints, setQueuedBlueprints] = useState<string[]>([]);
  const [practiceHandoffs, setPracticeHandoffs] = useState<StrategyPracticeHandoff[]>([]);
  const [mcqBatchStates, setMcqBatchStates] = useState<Record<string, McqCommandBatchState>>({});
  const [questionBankAttempts, setQuestionBankAttempts] = useState<QuestionBankAttempt[]>([]);
  const [questionProofStates, setQuestionProofStates] = useState<Record<string, QuestionProofDecision>>({});
  const [questionProofPackets, setQuestionProofPackets] = useState<Record<string, QuestionProofPacket>>({});
  const [sourceGapWorkOrders, setSourceGapWorkOrders] = useState<Record<string, SourceGapWorkOrder>>({});
  const [selectedProofQuestionNumber, setSelectedProofQuestionNumber] = useState(1);
  const [copiedReleaseId, setCopiedReleaseId] = useState<string | null>(null);
  const [copiedPublishPacket, setCopiedPublishPacket] = useState(false);
  const [copiedCoursePacket, setCopiedCoursePacket] = useState(false);
  const [copiedManifestEndpoint, setCopiedManifestEndpoint] = useState(false);
  const [copiedQuestionLedgerEndpoint, setCopiedQuestionLedgerEndpoint] = useState(false);
  const [copiedCourseActionEndpoint, setCopiedCourseActionEndpoint] = useState(false);
  const [copiedSourceArchiveSummaryEndpoint, setCopiedSourceArchiveSummaryEndpoint] = useState(false);
  const [copiedBuildReadinessEndpoint, setCopiedBuildReadinessEndpoint] = useState(false);
  const [copiedProofFeed, setCopiedProofFeed] = useState(false);
  const [questionLedgerApi, setQuestionLedgerApi] = useState<QuestionLedgerApiState>({
    status: "loading",
    message: "Checking question ledger endpoint...",
    ledger: null,
  });
  const [matchAccountabilityApi, setMatchAccountabilityApi] = useState<MatchAccountabilityApiState>({
    status: "loading",
    message: "Checking match-accountability endpoint...",
    accountability: null,
  });
  const [courseActionApi, setCourseActionApi] = useState<CourseActionApiState>({
    status: "loading",
    message: "Checking 2027 course-action endpoint...",
    courseAction: null,
  });
  const [sourceArchiveSummaryApi, setSourceArchiveSummaryApi] = useState<SourceArchiveSummaryApiState>({
    status: "loading",
    message: "Checking source archive summary endpoint...",
    summary: null,
  });
  const [buildReadinessApi, setBuildReadinessApi] = useState<BuildReadinessApiState>({
    status: "loading",
    message: "Checking build-readiness endpoint...",
    readiness: null,
  });
  const [releaseDecisionApi, setReleaseDecisionApi] = useState<ReleaseDecisionApiState>({
    status: "loading",
    message: "Checking release-decision endpoint...",
    decision: null,
  });
  const [feedApiStatus, setFeedApiStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [feedApiMode, setFeedApiMode] = useState<string | null>(null);
  const [feedApiMessage, setFeedApiMessage] = useState("Ready to publish the approved proof feed to the API.");
  const [publicProofFeedApi, setPublicProofFeedApi] = useState<PublicProofFeedApiState>({
    status: "loading",
    message: "Checking public proof-feed endpoint...",
    payload: null,
  });
  const [sourceArchive, setSourceArchive] = useState<SourceArchiveIntakeResponse | null>(null);
  const [sourceArchiveStatus, setSourceArchiveStatus] = useState<"loading" | "ready" | "error">("loading");

  async function refreshPublicProofFeedApi() {
    setPublicProofFeedApi({
      status: "loading",
      message: "Checking public proof-feed endpoint...",
      payload: null,
    });

    try {
      const response = await fetch("/api/upsc/prelims-2026/public-proof-feed", { cache: "no-store" });
      const payload = (await response.json()) as PublicProofFeedApiPayload;

      if (!response.ok) {
        throw new Error(payload.message ?? "Public proof-feed endpoint did not return a valid response.");
      }

      setPublicProofFeedApi({
        status: "ready",
        message: payload.message ?? "Public proof-feed endpoint is reachable.",
        payload,
      });
    } catch (error) {
      setPublicProofFeedApi({
        status: "error",
        message: error instanceof Error ? error.message : "Public proof-feed endpoint check failed.",
        payload: null,
      });
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readStrategyState();
      setStatuses(stored.statuses);
      setCompletedModules(stored.completedModules);
      setCompletedTasks(stored.completedTasks);
      setQueuedBlueprints(stored.queuedBlueprints);
      setPracticeHandoffs(readPracticeHandoffs());
      setMcqBatchStates(readMcqBatchStates());
      setQuestionBankAttempts(readLocalQuestionBankAttempts());
      setQuestionProofStates(readQuestionProofStates());
      setQuestionProofPackets(readQuestionProofPackets());
      setSourceGapWorkOrders(readSourceGapWorkOrders());
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    void refreshPublicProofFeedApi();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSourceArchive() {
      setSourceArchiveStatus("loading");
      try {
        const response = await fetch("/api/upsc/source-archive", { cache: "no-store" });
        const payload = (await response.json()) as SourceArchiveIntakeResponse;
        if (cancelled) return;

        setSourceArchive(payload);
        setSourceArchiveStatus(response.ok && payload.rootExists ? "ready" : "error");
      } catch {
        if (cancelled) return;
        setSourceArchive(null);
        setSourceArchiveStatus("error");
      }
    }

    void loadSourceArchive();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadQuestionLedgerApi() {
      setQuestionLedgerApi({
        status: "loading",
        message: "Checking question ledger endpoint...",
        ledger: null,
      });

      try {
        const response = await fetch("/api/upsc/prelims-2026/question-ledger", { cache: "no-store" });
        const payload = (await response.json()) as QuestionLedgerApiPayload;
        if (cancelled) return;

        if (!response.ok) {
          throw new Error("Question ledger endpoint did not return a valid response.");
        }

        setQuestionLedgerApi({
          status: "ready",
          message: "Question ledger endpoint is live with complete MCQ evidence cards.",
          ledger: payload,
        });
      } catch (error) {
        if (cancelled) return;
        setQuestionLedgerApi({
          status: "error",
          message: error instanceof Error ? error.message : "Question ledger endpoint check failed.",
          ledger: null,
        });
      }
    }

    void loadQuestionLedgerApi();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMatchAccountabilityApi() {
      setMatchAccountabilityApi({
        status: "loading",
        message: "Checking match-accountability endpoint...",
        accountability: null,
      });

      try {
        const response = await fetch("/api/upsc/prelims-2026/match-accountability", { cache: "no-store" });
        const payload = (await response.json()) as MatchAccountabilityApiPayload;
        if (cancelled) return;

        if (!response.ok) {
          throw new Error("Match-accountability endpoint did not return a valid response.");
        }

        setMatchAccountabilityApi({
          status: "ready",
          message: "Match-accountability endpoint is live with highest matched portions and manual-check portions.",
          accountability: payload,
        });
      } catch (error) {
        if (cancelled) return;
        setMatchAccountabilityApi({
          status: "error",
          message: error instanceof Error ? error.message : "Match-accountability endpoint check failed.",
          accountability: null,
        });
      }
    }

    void loadMatchAccountabilityApi();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCourseActionApi() {
      setCourseActionApi({
        status: "loading",
        message: "Checking 2027 course-action endpoint...",
        courseAction: null,
      });

      try {
        const response = await fetch("/api/upsc/prelims-2027/course-action", { cache: "no-store" });
        const payload = (await response.json()) as CourseActionApiPayload;
        if (cancelled) return;

        if (!response.ok) {
          throw new Error("2027 course-action endpoint did not return a valid response.");
        }

        setCourseActionApi({
          status: "ready",
          message: "2027 course-action endpoint is live with strategy priorities, tasks and proof gates.",
          courseAction: payload,
        });
      } catch (error) {
        if (cancelled) return;
        setCourseActionApi({
          status: "error",
          message: error instanceof Error ? error.message : "2027 course-action endpoint check failed.",
          courseAction: null,
        });
      }
    }

    void loadCourseActionApi();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSourceArchiveSummaryApi() {
      setSourceArchiveSummaryApi({
        status: "loading",
        message: "Checking source archive summary endpoint...",
        summary: null,
      });

      try {
        const response = await fetch("/api/upsc/prelims-2026/source-archive-summary", { cache: "no-store" });
        const payload = (await response.json()) as SourceArchiveSummaryApiPayload;
        if (cancelled) return;

        if (!response.ok) {
          throw new Error("Source archive summary endpoint did not return a valid response.");
        }

        setSourceArchiveSummaryApi({
          status: "ready",
          message: payload.scan.message || "Source archive summary endpoint is live with sanitized archive counts.",
          summary: payload,
        });
      } catch (error) {
        if (cancelled) return;
        setSourceArchiveSummaryApi({
          status: "error",
          message: error instanceof Error ? error.message : "Source archive summary endpoint check failed.",
          summary: null,
        });
      }
    }

    void loadSourceArchiveSummaryApi();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadReleaseDecisionApi() {
      setReleaseDecisionApi({
        status: "loading",
        message: "Checking release-decision endpoint...",
        decision: null,
      });

      try {
        const response = await fetch("/api/upsc/prelims-2026/release-decision", { cache: "no-store" });
        const payload = (await response.json()) as ReleaseDecisionApiPayload;
        if (cancelled) return;

        if (!response.ok) {
          throw new Error("Release-decision endpoint did not return a valid response.");
        }

        setReleaseDecisionApi({
          status: "ready",
          message: "Release-decision endpoint is live with public-safe, proof-locked and internal-only publish rules.",
          decision: payload,
        });
      } catch (error) {
        if (cancelled) return;
        setReleaseDecisionApi({
          status: "error",
          message: error instanceof Error ? error.message : "Release-decision endpoint check failed.",
          decision: null,
        });
      }
    }

    void loadReleaseDecisionApi();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadBuildReadinessApi() {
      setBuildReadinessApi({
        status: "loading",
        message: "Checking build-readiness endpoint...",
        readiness: null,
      });

      try {
        const response = await fetch("/api/upsc/prelims-2026/build-readiness", { cache: "no-store" });
        const payload = (await response.json()) as BuildReadinessApiPayload;
        if (cancelled) return;

        if (!response.ok) {
          throw new Error("Build-readiness endpoint did not return a valid response.");
        }

        setBuildReadinessApi({
          status: "ready",
          message: "Build-readiness endpoint is live with deliverables, gates and verifier evidence.",
          readiness: payload,
        });
      } catch (error) {
        if (cancelled) return;
        setBuildReadinessApi({
          status: "error",
          message: error instanceof Error ? error.message : "Build-readiness endpoint check failed.",
          readiness: null,
        });
      }
    }

    void loadBuildReadinessApi();

    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedPriorities = useMemo(
    () =>
      prelims2027Priorities.map((priority) => ({
        ...priority,
        status: statuses[priority.id] ?? priority.defaultStatus,
      })),
    [statuses]
  );

  const totals = useMemo(() => {
    const criticalOpen = resolvedPriorities.filter(
      (priority) => priority.priority === "Critical" && priority.status !== "Ready"
    ).length;
    const ready = resolvedPriorities.filter((priority) => priority.status === "Ready").length;
    const building = resolvedPriorities.filter((priority) => priority.status === "Building").length;
    const statusCompletion = Math.round((ready / resolvedPriorities.length) * 100);
    const completedTaskCount = strategyExecutionTasks.filter((task) => completedTasks.includes(task.id)).length;
    const taskCompletion = Math.round((completedTaskCount / strategyExecutionTasks.length) * 100);
    const completion = Math.round(statusCompletion * 0.4 + taskCompletion * 0.6);
    const selectedBlueprints = strategyPracticeBlueprints.filter((blueprint) => queuedBlueprints.includes(blueprint.id));
    const queuedMinutes = selectedBlueprints.reduce((sum, blueprint) => sum + blueprint.minutes, 0);
    const generatedBlueprintCount = new Set(practiceHandoffs.map((handoff) => handoff.blueprintId)).size;

    return {
      criticalOpen,
      ready,
      building,
      completion,
      completedTaskCount,
      taskCompletion,
      queuedBlueprintCount: selectedBlueprints.length,
      queuedMinutes,
      generatedBlueprintCount,
    };
  }, [completedTasks, practiceHandoffs, queuedBlueprints, resolvedPriorities]);

  const simulator = useMemo(() => {
    const completed = simulatorModules.filter((module) => completedModules.includes(module.id));
    const score = completed.reduce((sum, module) => sum + module.weight, 0);
    const exposed = simulatorModules.filter((module) => !completedModules.includes(module.id));
    const topExposure = exposed.slice().sort((a, b) => b.weight - a.weight).slice(0, 3);

    return { completed, exposed, topExposure, score };
  }, [completedModules]);

  const questionEvidence = useMemo(() => buildPrelims2026ShowcaseEvidence(), []);
  const showcaseManifest = useMemo(() => buildPrelims2026ShowcaseManifest(), []);

  const questionProofRows = useMemo(
    () =>
      questionEvidence.map((question) => {
        const decision = questionProofStates[String(question.number)] ?? defaultQuestionProofDecision(question.status);
        const packet = questionProofPackets[String(question.number)];
        const matchedPortions = question.statementCoverage.filter((coverage) => coverage.coverage !== "manual-check");
        const pendingPortions = question.statementCoverage.filter((coverage) => coverage.coverage === "manual-check");

        return {
          question,
          decision,
          packet,
          packetComplete: proofPacketComplete(packet),
          matchedPortions,
          pendingPortions,
        };
      }),
    [questionEvidence, questionProofPackets, questionProofStates]
  );

  const questionProofTotals = useMemo(() => {
    const candidateClaims = questionProofRows.filter(({ question }) => question.status !== "none").length;
    const approved = questionProofRows.filter((row) => row.decision === "Approved").length;
    const approvedWithPacket = questionProofRows.filter(
      (row) => row.question.status !== "none" && row.decision === "Approved" && row.packetComplete
    ).length;
    const rejected = questionProofRows.filter((row) => row.decision === "Rejected").length;
    const buildGaps = questionProofRows.filter((row) => row.decision === "Build gap").length;
    const needsProof = questionProofRows.filter((row) => row.decision === "Needs proof").length;
    const candidateApproved = questionProofRows.filter(
      (row) => row.question.status !== "none" && row.decision === "Approved"
    ).length;
    const packetsComplete = questionProofRows.filter((row) => row.packetComplete).length;
    const approvedMissingPacket = questionProofRows.filter(
      (row) => row.question.status !== "none" && row.decision === "Approved" && !row.packetComplete
    ).length;
    const unlockPercent = candidateClaims ? Math.round((approvedWithPacket / candidateClaims) * 100) : 0;

    return {
      total: questionProofRows.length,
      candidateClaims,
      approved,
      approvedWithPacket,
      rejected,
      buildGaps,
      needsProof,
      candidateApproved,
      packetsComplete,
      approvedMissingPacket,
      unlockPercent,
    };
  }, [questionProofRows]);

  const selectedProofRow = useMemo(
    () => questionProofRows.find((row) => row.question.number === selectedProofQuestionNumber) ?? questionProofRows[0],
    [questionProofRows, selectedProofQuestionNumber]
  );

  const selectedProofPacket = selectedProofRow?.packet ?? emptyProofPacket();

  const selectedArchiveCandidates = useMemo(
    () =>
      selectedProofRow
        ? buildArchiveCandidatesForQuestion(selectedProofRow.question, sourceArchive)
        : { tracks: [], files: [] as SourceArchiveFileHit[] },
    [selectedProofRow, sourceArchive]
  );

  const archiveProofTriageRows = useMemo(
    () =>
      questionProofRows
        .map((row) => {
          const candidates = buildArchiveCandidatesForQuestion(row.question, sourceArchive, { useFallback: false });
          const topFile = candidates.files[0] ?? null;

          return {
            ...row,
            archiveTracks: candidates.tracks,
            archiveFiles: candidates.files,
            topFile,
          };
        })
        .sort((left, right) => {
          const leftNeedsProof = left.decision === "Needs proof" ? 0 : 1;
          const rightNeedsProof = right.decision === "Needs proof" ? 0 : 1;
          const leftCandidate = left.archiveFiles.length ? 0 : 1;
          const rightCandidate = right.archiveFiles.length ? 0 : 1;
          return (
            leftCandidate - rightCandidate ||
            leftNeedsProof - rightNeedsProof ||
            right.archiveFiles.length - left.archiveFiles.length ||
            left.question.number - right.question.number
          );
        }),
    [questionProofRows, sourceArchive]
  );

  const archiveProofTriageTotals = useMemo(() => {
    const rowsWithCandidates = archiveProofTriageRows.filter((row) => row.archiveFiles.length > 0).length;
    const needsProofWithCandidates = archiveProofTriageRows.filter(
      (row) => row.decision === "Needs proof" && row.archiveFiles.length > 0
    ).length;
    const approvedWithArchive = archiveProofTriageRows.filter(
      (row) => row.decision === "Approved" && row.archiveFiles.length > 0
    ).length;
    const blindSpots = archiveProofTriageRows.filter((row) => row.archiveFiles.length === 0).length;

    return { rowsWithCandidates, needsProofWithCandidates, approvedWithArchive, blindSpots };
  }, [archiveProofTriageRows]);

  const archiveBlindSpotRows = useMemo(
    () => archiveProofTriageRows.filter((row) => row.archiveFiles.length === 0),
    [archiveProofTriageRows]
  );

  const archiveBlindSpotTotals = useMemo(() => {
    const needsProof = archiveBlindSpotRows.filter((row) => row.decision === "Needs proof").length;
    const buildGaps = archiveBlindSpotRows.filter((row) => row.decision === "Build gap").length;
    const rejected = archiveBlindSpotRows.filter((row) => row.decision === "Rejected").length;

    return { needsProof, buildGaps, rejected };
  }, [archiveBlindSpotRows]);

  const sourceGapWorkOrderRows = useMemo(
    () =>
      sourceArchiveStatus === "ready"
        ? archiveBlindSpotRows.map((row) => {
            const id = sourceGapWorkOrderId(row.question.number);
            const workOrder = sourceGapWorkOrders[id] ?? null;
            const displayOrder = workOrder ?? buildSourceGapWorkOrder(row.question, "Queued");

            return {
              ...row,
              workOrder,
              displayOrder,
            };
          })
        : [],
    [archiveBlindSpotRows, sourceArchiveStatus, sourceGapWorkOrders]
  );

  const sourceGapWorkOrderTotals = useMemo(() => {
    const activeOrderIds = new Set(sourceGapWorkOrderRows.map((row) => row.displayOrder.id));
    const activeOrders = Object.values(sourceGapWorkOrders).filter((order) => activeOrderIds.has(order.id));
    const queued = activeOrders.filter((order) => order.status === "Queued").length;
    const drafted = activeOrders.filter((order) => order.status === "Source row drafted").length;
    const resolved = activeOrders.filter((order) => order.status === "Resolved").length;

    return {
      blindSpots: sourceGapWorkOrderRows.length,
      workOrders: activeOrders.length,
      unqueued: Math.max(sourceGapWorkOrderRows.length - activeOrders.length, 0),
      queued,
      drafted,
      resolved,
    };
  }, [sourceGapWorkOrderRows, sourceGapWorkOrders]);

  const publicClaimReleaseRows = useMemo<PublicClaimReleaseRow[]>(
    () =>
      questionProofRows
        .filter((row) => row.question.status !== "none" && row.decision === "Approved" && row.packetComplete && row.packet)
        .map((row) => ({
          question: row.question,
          packet: row.packet as QuestionProofPacket,
          matchedPortions: row.matchedPortions.length,
          pendingPortions: row.pendingPortions.length,
        })),
    [questionProofRows]
  );

  const publicClaimReleaseTotals = useMemo(() => {
    const subjects = new Set(publicClaimReleaseRows.map((row) => row.question.subject));
    const direct = publicClaimReleaseRows.filter((row) => row.question.status === "direct").length;
    const partial = publicClaimReleaseRows.filter((row) => row.question.status === "partial").length;

    return {
      readyClaims: publicClaimReleaseRows.length,
      subjects: subjects.size,
      direct,
      partial,
    };
  }, [publicClaimReleaseRows]);

  const websitePublishPacketText = useMemo(
    () => buildWebsitePublishPacketText(publicClaimReleaseRows),
    [publicClaimReleaseRows]
  );

  const publicProofFeed = useMemo(() => buildPrelims2026PublicProofFeed(publicClaimReleaseRows), [publicClaimReleaseRows]);

  const publicProofFeedJson = useMemo(() => JSON.stringify(publicProofFeed, null, 2), [publicProofFeed]);

  const publicProofFeedApiPayload = publicProofFeedApi.payload;
  const publicProofFeedEndpointInSync =
    publicProofFeedApi.status === "ready" &&
    publicProofFeedApiPayload !== null &&
    publicProofFeedApiPayload.claimCount === publicProofFeed.releasedClaims.length;
  const publicProofFeedPersistenceLabel =
    publicProofFeedApiPayload?.mode === "supabase"
      ? "External website persistence ready"
      : publicProofFeedApiPayload?.mode === "dry-run"
        ? "Validated dry run"
        : publicProofFeedApiPayload?.mode === "local-only"
          ? "Local-only until Supabase is configured"
          : publicProofFeedApi.status === "error"
            ? "Endpoint needs attention"
            : "Checking endpoint";

  const questionLedgerPreviewQuestions = useMemo(
    () => questionLedgerApi.ledger?.questions.slice(0, 2) ?? [],
    [questionLedgerApi.ledger]
  );
  const matchAccountabilityPreviewQuestions = useMemo(
    () => matchAccountabilityApi.accountability?.questions.slice(0, 4) ?? [],
    [matchAccountabilityApi.accountability]
  );

  const courseActionPreviewPriorities = useMemo(
    () => courseActionApi.courseAction?.priorities.slice(0, 4) ?? [],
    [courseActionApi.courseAction]
  );

  const sourceArchiveSummaryPreviewTracks = useMemo(
    () => sourceArchiveSummaryApi.summary?.tracks.slice(0, 8) ?? [],
    [sourceArchiveSummaryApi.summary]
  );

  const sourceArchiveSummaryPreviewFolders = useMemo(
    () => sourceArchiveSummaryApi.summary?.topFolders.slice(0, 6) ?? [],
    [sourceArchiveSummaryApi.summary]
  );

  const sourceArchiveSummaryPreviewExtensions = useMemo(
    () => sourceArchiveSummaryApi.summary?.extensions.slice(0, 6) ?? [],
    [sourceArchiveSummaryApi.summary]
  );

  const buildReadinessRequirementRows = useMemo(
    () => buildReadinessApi.readiness?.requirements ?? [],
    [buildReadinessApi.readiness]
  );

  const buildReadinessGateRows = useMemo(
    () => buildReadinessApi.readiness?.gates ?? [],
    [buildReadinessApi.readiness]
  );

  const tasksByPriority = useMemo(
    () =>
      resolvedPriorities.map((priority) => {
        const tasks = strategyExecutionTasks.filter((task) => task.priorityId === priority.id);
        const completedCount = tasks.filter((task) => completedTasks.includes(task.id)).length;
        const percent = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

        return { priority, tasks, completedCount, percent };
      }),
    [completedTasks, resolvedPriorities]
  );
  const taskPhaseCounts = useMemo(
    () =>
      strategyExecutionTasks.reduce<Partial<Record<StrategyTaskPhase, number>>>((counts, task) => {
        counts[task.phase] = (counts[task.phase] ?? 0) + 1;
        return counts;
      }, {}),
    []
  );

  const practiceBlueprintsByPriority = useMemo(
    () =>
      resolvedPriorities.map((priority) => {
        const blueprints = strategyPracticeBlueprints
          .filter((blueprint) => blueprint.priorityId === priority.id)
          .map((blueprint) => ({
            ...blueprint,
            format: formatRebuildRules.find((rule) => rule.id === blueprint.formatRuleId)?.format ?? "Practice",
            queued: queuedBlueprints.includes(blueprint.id),
            handoff: practiceHandoffs.find((handoff) => handoff.blueprintId === blueprint.id),
          }));
        const queuedCount = blueprints.filter((blueprint) => blueprint.queued).length;

        return { priority, blueprints, queuedCount };
      }),
    [practiceHandoffs, queuedBlueprints, resolvedPriorities]
  );

  const deliveryRows = useMemo(
    () =>
      strategyPracticeBlueprints.map((blueprint) => {
        const priority = prelims2027Priorities.find((item) => item.id === blueprint.priorityId);
        const format = formatRebuildRules.find((rule) => rule.id === blueprint.formatRuleId)?.format ?? "Practice";
        const handoff = practiceHandoffs.find((item) => item.blueprintId === blueprint.id);
        const lockedBatches = Object.entries(mcqBatchStates).filter(
          ([, state]) => state.strategyBlueprintId === blueprint.id
        );
        const attempts = questionBankAttempts.filter(
          (attempt) =>
            attempt.source === "UPSC_2027_STRATEGY" &&
            attempt.questionId.startsWith(`strategy-${blueprint.id}-`)
        );
        const solvedCount = attempts.length;
        const correctCount = attempts.filter((attempt) => attempt.isCorrect).length;
        const stage = solvedCount
          ? "Student solved"
          : lockedBatches.length
            ? "MCQ locked"
            : handoff
              ? "Generated"
              : queuedBlueprints.includes(blueprint.id)
                ? "Queued"
                : "Not started";
        const latestSolvedAt = attempts
          .map((attempt) => Date.parse(attempt.solvedAt))
          .filter((time) => Number.isFinite(time))
          .sort((left, right) => right - left)[0];

        return {
          blueprint,
          priority,
          format,
          handoff,
          lockedBatches,
          stage,
          solvedCount,
          correctCount,
          latestSolvedAt,
        };
      }),
    [mcqBatchStates, practiceHandoffs, questionBankAttempts, queuedBlueprints]
  );

  const deliveryTotals = useMemo(() => {
    const queued = deliveryRows.filter((row) => queuedBlueprints.includes(row.blueprint.id)).length;
    const generated = deliveryRows.filter((row) => row.handoff).length;
    const locked = deliveryRows.filter((row) => row.lockedBatches.length > 0).length;
    const solved = deliveryRows.filter((row) => row.solvedCount > 0).length;
    const totalSolvedAttempts = deliveryRows.reduce((sum, row) => sum + row.solvedCount, 0);

    return { queued, generated, locked, solved, totalSolvedAttempts };
  }, [deliveryRows, queuedBlueprints]);

  const evidenceRows = useMemo(
    () =>
      strategyEvidenceLedger.map((entry) => {
        const priority = prelims2027Priorities.find((item) => item.id === entry.priorityId);
        const proofTasks = strategyExecutionTasks.filter(
          (task) => task.priorityId === entry.priorityId && (task.phase === "Source" || task.phase === "Proof")
        );
        const doneProofTasks = proofTasks.filter((task) => completedTasks.includes(task.id)).length;
        const proofPercent = proofTasks.length ? Math.round((doneProofTasks / proofTasks.length) * 100) : 0;

        return {
          entry,
          priority,
          proofTasks,
          doneProofTasks,
          proofPercent,
        };
      }),
    [completedTasks]
  );

  const evidenceTotals = useMemo(() => {
    const claimReady = evidenceRows.filter((row) => row.entry.proofStatus === "Claim ready").length;
    const needsSource = evidenceRows.filter((row) => row.entry.proofStatus === "Needs source pack").length;
    const needsPageProof = evidenceRows.filter((row) => row.entry.proofStatus === "Needs page proof").length;
    const internalOnly = evidenceRows.filter((row) => row.entry.proofStatus === "Internal only").length;
    const totalProofTasks = evidenceRows.reduce((sum, row) => sum + row.proofTasks.length, 0);
    const completedProofTasks = evidenceRows.reduce((sum, row) => sum + row.doneProofTasks, 0);

    return { claimReady, needsSource, needsPageProof, internalOnly, totalProofTasks, completedProofTasks };
  }, [evidenceRows]);

  const publishGateRows = useMemo(() => {
    const proofTaskPercent = evidenceTotals.totalProofTasks
      ? Math.round((evidenceTotals.completedProofTasks / evidenceTotals.totalProofTasks) * 100)
      : 0;
    const generatedPercent = Math.round((deliveryTotals.generated / strategyPracticeBlueprints.length) * 100);
    const lockedPercent = Math.round((deliveryTotals.locked / strategyPracticeBlueprints.length) * 100);
    const solvedPercent = Math.round((deliveryTotals.solved / strategyPracticeBlueprints.length) * 100);

    return [
      {
        id: "public-language",
        title: "Main website language",
        status: "Public safe",
        metric: "Ready",
        detail: "Use the corrected 76% research outcome with clear proof-lock wording for question-level claims.",
        action: "Publish the showcase page language, not raw internal notes.",
      },
      {
        id: "proof-lock",
        title: "Question-level public claims",
        status: questionProofTotals.approvedWithPacket === questionProofTotals.candidateClaims ? "Ready" : "Proof locked",
        metric: `${questionProofTotals.approvedWithPacket}/${questionProofTotals.candidateClaims}`,
        detail: `${questionProofTotals.needsProof} matches still need review and ${questionProofTotals.approvedMissingPacket} approved matches still need a complete proof packet.`,
        action: "Approve only the MCQs where exact source/page proof, teacher note and public claim line are retained.",
      },
      {
        id: "proof-tasks",
        title: "Source and proof task execution",
        status: proofTaskPercent === 100 ? "Ready" : "In progress",
        metric: `${evidenceTotals.completedProofTasks}/${evidenceTotals.totalProofTasks}`,
        detail: "Every proof-linked execution task should be checked before marketing exact UPSC coverage.",
        action: "Finish source matrix, act-text, map proof, TN Board and regulator proof tasks.",
      },
      {
        id: "source-gap-work-orders",
        title: "No-source MCQ work orders",
        status:
          sourceGapWorkOrderTotals.blindSpots === 0
            ? "Ready"
            : sourceGapWorkOrderTotals.unqueued === 0
              ? "In progress"
              : "Action needed",
        metric: `${sourceGapWorkOrderTotals.workOrders}/${sourceGapWorkOrderTotals.blindSpots}`,
        detail: `${sourceGapWorkOrderTotals.blindSpots} archive blind spots are currently blocked from public question-level claims; ${sourceGapWorkOrderTotals.unqueued} still need a source-gap work order.`,
        action: "Queue a source row or content-build action for every no-source MCQ, then resolve only after exact archive proof exists.",
      },
      {
        id: "critical-build",
        title: "Critical 2027 build status",
        status: totals.criticalOpen === 0 ? "Ready" : "Action needed",
        metric: `${2 - totals.criticalOpen}/2`,
        detail: "IR / Multilateral Bodies and S&T New Domains are the two immediate build gaps from the final PDF.",
        action: "Move both critical priorities to Ready only after content, source and MCQ tasks are locked.",
      },
      {
        id: "practice-generation",
        title: "Practice blueprint generation",
        status: deliveryTotals.generated === strategyPracticeBlueprints.length ? "Ready" : "In progress",
        metric: `${deliveryTotals.generated}/${strategyPracticeBlueprints.length}`,
        detail: `${generatedPercent}% of blueprint drills have generated handoffs for MCQ Command and Question Bank.`,
        action: "Generate all 16 blueprint drills before calling the 2027 engine fully operational.",
      },
      {
        id: "mcq-lock",
        title: "MCQ Command lock",
        status: deliveryTotals.locked === strategyPracticeBlueprints.length ? "Ready" : "Action needed",
        metric: `${deliveryTotals.locked}/${strategyPracticeBlueprints.length}`,
        detail: `${lockedPercent}% of strategy drills are locked into MCQ Command batches.`,
        action: "Open generated handoffs in MCQ Command and lock batches by blueprint.",
      },
      {
        id: "student-solve",
        title: "Student practice proof",
        status: deliveryTotals.solved ? "In progress" : "Action needed",
        metric: `${deliveryTotals.solved}/${strategyPracticeBlueprints.length}`,
        detail: `${solvedPercent}% of strategy drills have at least one saved Question Bank attempt.`,
        action: "Use student practice links to collect attempt proof for each high-priority blueprint.",
      },
    ];
  }, [deliveryTotals, evidenceTotals, questionProofTotals, sourceGapWorkOrderTotals, totals.criticalOpen]);

  const sprintRows = useMemo(
    () =>
      strategySprintCalendar.map((sprint) => {
        const completedTaskCount = sprint.taskIds.filter((taskId) => completedTasks.includes(taskId)).length;
        const generatedCount = sprint.blueprintIds.filter((blueprintId) =>
          practiceHandoffs.some((handoff) => handoff.blueprintId === blueprintId)
        ).length;
        const lockedCount = sprint.blueprintIds.filter((blueprintId) =>
          Object.values(mcqBatchStates).some((state) => state.strategyBlueprintId === blueprintId)
        ).length;
        const solvedCount = sprint.blueprintIds.filter((blueprintId) =>
          questionBankAttempts.some(
            (attempt) =>
              attempt.source === "UPSC_2027_STRATEGY" &&
              attempt.questionId.startsWith(`strategy-${blueprintId}-`)
          )
        ).length;
        const priorityLabels = sprint.priorityIds
          .map((priorityId) => prelims2027Priorities.find((priority) => priority.id === priorityId)?.subject)
          .filter((subject): subject is string => Boolean(subject));
        const totalWorkUnits = sprint.taskIds.length + sprint.blueprintIds.length;
        const completedWorkUnits = completedTaskCount + generatedCount;
        const progress = totalWorkUnits ? Math.round((completedWorkUnits / totalWorkUnits) * 100) : 0;
        const status = progress === 100 ? "Ready" : progress > 0 ? "Building" : "Planned";

        return {
          sprint,
          completedTaskCount,
          generatedCount,
          lockedCount,
          solvedCount,
          priorityLabels,
          progress,
          status,
        };
      }),
    [completedTasks, mcqBatchStates, practiceHandoffs, questionBankAttempts]
  );

  const sprintTotals = useMemo(() => {
    const ready = sprintRows.filter((row) => row.status === "Ready").length;
    const building = sprintRows.filter((row) => row.status === "Building").length;
    const planned = sprintRows.filter((row) => row.status === "Planned").length;
    const averageProgress = sprintRows.length
      ? Math.round(sprintRows.reduce((sum, row) => sum + row.progress, 0) / sprintRows.length)
      : 0;

    return { ready, building, planned, averageProgress };
  }, [sprintRows]);

  const reallocationRows = useMemo(
    () =>
      strategyReallocationPlan.map((decision) => {
        const priority = resolvedPriorities.find((item) => item.id === decision.priorityId);
        const evidence = strategyEvidenceLedger.find((entry) => entry.priorityId === decision.priorityId);
        const tasks = strategyExecutionTasks.filter((task) => task.priorityId === decision.priorityId);
        const completedTaskCount = tasks.filter((task) => completedTasks.includes(task.id)).length;
        const blueprints = strategyPracticeBlueprints.filter((blueprint) => blueprint.priorityId === decision.priorityId);
        const generatedCount = blueprints.filter((blueprint) =>
          practiceHandoffs.some((handoff) => handoff.blueprintId === blueprint.id)
        ).length;
        const lockedCount = blueprints.filter((blueprint) =>
          Object.values(mcqBatchStates).some((state) => state.strategyBlueprintId === blueprint.id)
        ).length;
        const solvedCount = blueprints.filter((blueprint) =>
          questionBankAttempts.some(
            (attempt) =>
              attempt.source === "UPSC_2027_STRATEGY" &&
              attempt.questionId.startsWith(`strategy-${blueprint.id}-`)
          )
        ).length;
        const totalUnits = tasks.length + blueprints.length;
        const completedUnits = completedTaskCount + generatedCount;
        const progress = totalUnits ? Math.round((completedUnits / totalUnits) * 100) : 0;
        const stage =
          priority?.status === "Ready" && progress === 100
            ? "Ready"
            : progress > 0 || priority?.status === "Building"
              ? "Building"
              : "Planned";

        return {
          decision,
          priority,
          evidence,
          tasks,
          completedTaskCount,
          blueprints,
          generatedCount,
          lockedCount,
          solvedCount,
          progress,
          stage,
        };
      }),
    [completedTasks, mcqBatchStates, practiceHandoffs, questionBankAttempts, resolvedPriorities]
  );

  const reallocationTotals = useMemo(() => {
    const buildFromScratch = reallocationRows.filter((row) => row.decision.decision === "Build from scratch").length;
    const depthUpgrade = reallocationRows.filter((row) => row.decision.decision === "Depth upgrade").length;
    const patchAndTag = reallocationRows.filter((row) => row.decision.decision === "Patch and tag").length;
    const maintainOrReduce = reallocationRows.filter((row) =>
      row.decision.decision === "Maintain" || row.decision.decision === "Reduce"
    ).length;
    const averageProgress = reallocationRows.length
      ? Math.round(reallocationRows.reduce((sum, row) => sum + row.progress, 0) / reallocationRows.length)
      : 0;

    return { buildFromScratch, depthUpgrade, patchAndTag, maintainOrReduce, averageProgress };
  }, [reallocationRows]);

  const courseCorrectionPacketText = useMemo(() => {
    const decisionGroups = ["Build from scratch", "Depth upgrade", "Patch and tag", "Maintain", "Reduce"].map(
      (decision) => {
        const subjects = reallocationRows
          .filter((row) => row.decision.decision === decision)
          .map((row) => row.priority?.subject ?? row.decision.priorityId)
          .join("; ");

        return `- ${decision}: ${subjects || "None"}`;
      }
    );
    const sprintSequence = sprintRows.map(
      (row, index) =>
        `${index + 1}. ${row.sprint.window} - ${row.sprint.phase}: ${row.sprint.focus} Proof gate: ${row.sprint.proofGate}`
    );
    const decisionRows = reallocationRows.map((row) => {
      const ownerRoute = row.evidence?.route ?? row.priority?.targetRoute ?? "/upsc/prelims-2027-strategy";

      return [
        `- ${row.priority?.subject ?? row.decision.priorityId}`,
        `  Decision: ${row.decision.decision}. ${row.decision.allocation}`,
        `  Source shift: ${row.decision.sourceShift}`,
        `  MCQ target: ${row.decision.mcqTarget}`,
        `  Release gate: ${row.decision.releaseGate}`,
        `  Student signal: ${row.decision.studentSignal}`,
        `  Owner route: ${ownerRoute}`,
      ].join("\n");
    });
    const sourceGapRows = sourceGapWorkOrderRows
      .filter((row) => row.workOrder)
      .map((row) =>
        [
          `- Q${row.question.number} (${row.question.subject})`,
          `  Status: ${row.displayOrder.status}`,
          `  Source action: ${row.displayOrder.sourceAction}`,
          `  Public rule: ${row.displayOrder.publicRule}`,
        ].join("\n")
      );

    return [
      "UPSC Prelims 2027 Course Correction Packet",
      "",
      "Corrected 2026 signal: 44 direct hits, 30 partial hits, 23 misses and 3 dropped questions.",
      "Planning interpretation: 74/97 scorable questions had direct or partial preparation advantage, so 2027 work should protect strengths and rebuild the exact weak zones.",
      "",
      `Software status: ${reallocationRows.length} decision tracks, ${reallocationTotals.buildFromScratch} new builds, ${reallocationTotals.depthUpgrade} depth upgrades, ${reallocationTotals.patchAndTag} patch/tag tracks, ${reallocationTotals.maintainOrReduce} maintain-or-reduce tracks.`,
      `Execution read: ${reallocationTotals.averageProgress}% reallocation progress and ${sprintTotals.averageProgress}% sprint progress.`,
      "",
      "Decision groups:",
      ...decisionGroups,
      "",
      "Operator sequence:",
      ...sprintSequence,
      "",
      "Track actions:",
      ...decisionRows,
      "",
      "Source gap work orders:",
      ...(sourceGapRows.length
        ? sourceGapRows
        : [
            "- No source gap work orders queued yet. Use the source-gap work-order section to convert no-source MCQs into archive/content actions.",
          ]),
      "",
      "Public rule: keep this as an internal software/course action packet. Only proof-locked claims from the public proof feed should move to the main website.",
    ].join("\n");
  }, [reallocationRows, reallocationTotals, sourceGapWorkOrderRows, sprintRows, sprintTotals.averageProgress]);

  const saveStatuses = (nextStatuses: Record<string, StrategyStatus>) => {
    setStatuses(nextStatuses);
    writeStrategyState({ statuses: nextStatuses, completedModules, completedTasks, queuedBlueprints });
  };

  const saveCompletedModules = (nextCompleted: string[]) => {
    setCompletedModules(nextCompleted);
    writeStrategyState({ statuses, completedModules: nextCompleted, completedTasks, queuedBlueprints });
  };

  const saveCompletedTasks = (nextCompletedTasks: string[]) => {
    setCompletedTasks(nextCompletedTasks);
    writeStrategyState({ statuses, completedModules, completedTasks: nextCompletedTasks, queuedBlueprints });
  };

  const saveQueuedBlueprints = (nextQueuedBlueprints: string[]) => {
    setQueuedBlueprints(nextQueuedBlueprints);
    writeStrategyState({ statuses, completedModules, completedTasks, queuedBlueprints: nextQueuedBlueprints });
  };

  const setQuestionProofDecision = (questionNumber: number, decision: QuestionProofDecision) => {
    const nextProofStates = { ...questionProofStates, [String(questionNumber)]: decision };
    setQuestionProofStates(nextProofStates);
    writeQuestionProofStates(nextProofStates);
  };

  const updateProofPacket = (questionNumber: number, patch: Partial<QuestionProofPacket>) => {
    const currentPacket = questionProofPackets[String(questionNumber)] ?? emptyProofPacket();
    const nextPacket = {
      ...currentPacket,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    const nextPackets = { ...questionProofPackets, [String(questionNumber)]: nextPacket };
    setQuestionProofPackets(nextPackets);
    writeQuestionProofPackets(nextPackets);
  };

  const useArchiveCandidateForProof = (file: SourceArchiveFileHit) => {
    if (!selectedProofRow) return;

    updateProofPacket(selectedProofRow.question.number, {
      sourceRef: file.relativePath,
      teacherNote:
        selectedProofPacket.teacherNote.trim() ||
        "Archive candidate selected from the Morning Batch source intake. Verify exact page/location and matched statement before approval.",
    });
  };

  const saveSourceGapWorkOrders = (nextOrders: Record<string, SourceGapWorkOrder>) => {
    setSourceGapWorkOrders(nextOrders);
    writeSourceGapWorkOrders(nextOrders);
  };

  const setSourceGapWorkOrderStatus = (question: ShowcaseQuestionEvidence, status: SourceGapWorkOrderStatus) => {
    const id = sourceGapWorkOrderId(question.number);
    const nextOrder = buildSourceGapWorkOrder(question, status, sourceGapWorkOrders[id]);
    saveSourceGapWorkOrders({ ...sourceGapWorkOrders, [id]: nextOrder });
  };

  const copyReleaseClaim = async (row: PublicClaimReleaseRow) => {
    const copyText = [
      `UPSC Prelims 2026 Q${row.question.number} (${row.question.subject})`,
      row.packet.publicClaim,
      `Proof retained: ${row.packet.sourceRef}, ${row.packet.pageRef}.`,
      `Teacher note: ${row.packet.teacherNote}`,
      `Match scope: ${row.question.matchScope}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(copyText);
      setCopiedReleaseId(String(row.question.number));
      window.setTimeout(
        () => setCopiedReleaseId((current) => (current === String(row.question.number) ? null : current)),
        1800
      );
    } catch {
      setCopiedReleaseId(null);
    }
  };

  const copyWebsitePublishPacket = async () => {
    try {
      await navigator.clipboard.writeText(websitePublishPacketText);
      setCopiedPublishPacket(true);
      window.setTimeout(() => setCopiedPublishPacket(false), 1800);
    } catch {
      setCopiedPublishPacket(false);
    }
  };

  const copyCourseCorrectionPacket = async () => {
    try {
      await navigator.clipboard.writeText(courseCorrectionPacketText);
      setCopiedCoursePacket(true);
      window.setTimeout(() => setCopiedCoursePacket(false), 1800);
    } catch {
      setCopiedCoursePacket(false);
    }
  };

  const copyManifestEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(showcaseManifest.api.manifest);
      setCopiedManifestEndpoint(true);
      window.setTimeout(() => setCopiedManifestEndpoint(false), 1800);
    } catch {
      setCopiedManifestEndpoint(false);
    }
  };

  const copyQuestionLedgerEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(showcaseManifest.api.questionLedger);
      setCopiedQuestionLedgerEndpoint(true);
      window.setTimeout(() => setCopiedQuestionLedgerEndpoint(false), 1800);
    } catch {
      setCopiedQuestionLedgerEndpoint(false);
    }
  };

  const copyCourseActionEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(showcaseManifest.api.courseAction);
      setCopiedCourseActionEndpoint(true);
      window.setTimeout(() => setCopiedCourseActionEndpoint(false), 1800);
    } catch {
      setCopiedCourseActionEndpoint(false);
    }
  };

  const copySourceArchiveSummaryEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(showcaseManifest.api.sourceArchiveSummary);
      setCopiedSourceArchiveSummaryEndpoint(true);
      window.setTimeout(() => setCopiedSourceArchiveSummaryEndpoint(false), 1800);
    } catch {
      setCopiedSourceArchiveSummaryEndpoint(false);
    }
  };

  const copyBuildReadinessEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(showcaseManifest.api.buildReadiness);
      setCopiedBuildReadinessEndpoint(true);
      window.setTimeout(() => setCopiedBuildReadinessEndpoint(false), 1800);
    } catch {
      setCopiedBuildReadinessEndpoint(false);
    }
  };

  const copyPublicProofFeed = async () => {
    try {
      await navigator.clipboard.writeText(publicProofFeedJson);
      setCopiedProofFeed(true);
      window.setTimeout(() => setCopiedProofFeed(false), 1800);
    } catch {
      setCopiedProofFeed(false);
    }
  };

  const publishPublicProofFeed = async () => {
    if (!publicProofFeed.releasedClaims.length) {
      setFeedApiStatus("error");
      setFeedApiMode(null);
      setFeedApiMessage("Approve at least one complete proof packet before publishing the feed.");
      return;
    }

    setFeedApiStatus("saving");
    setFeedApiMessage("Publishing approved proof feed to the API...");

    try {
      const token = window.localStorage.getItem("MOCK_TOKEN");
      const dryRun = window.localStorage.getItem("sarit-upsc-public-proof-feed-dry-run") === "true";
      const response = await fetch("/api/upsc/prelims-2026/public-proof-feed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(dryRun ? { "X-UPSC-Proof-Feed-Dry-Run": "1" } : {}),
        },
        body: JSON.stringify({ feed: publicProofFeed }),
      });
      const payload = (await response.json()) as {
        mode?: string;
        claimCount?: number;
        message?: string;
        feed?: Prelims2026PublicProofFeed;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Public proof feed publish failed.");
      }

      window.localStorage.setItem(
        prelims2026PublicProofFeedLocalStorageKey,
        JSON.stringify(payload.feed ?? publicProofFeed)
      );
      setFeedApiStatus("saved");
      setFeedApiMode(payload.mode ?? "unknown");
      setFeedApiMessage(
        `${payload.message ?? "Public proof feed accepted."} ${payload.claimCount ?? publicProofFeed.releasedClaims.length} claims ready.`
      );
      if (payload.feed) {
        setPublicProofFeedApi({
          status: "ready",
          message: payload.message ?? "Public proof-feed endpoint accepted the approved draft.",
          payload: {
            mode: payload.mode ?? "unknown",
            table: "upsc_prelims_2026_public_proof_feed",
            feed: payload.feed,
            claimCount: payload.claimCount ?? payload.feed.releasedClaims.length,
            publishedAt: payload.feed.lastUpdatedAt === "local-draft" ? null : payload.feed.lastUpdatedAt,
            message: payload.message ?? "Public proof feed accepted.",
          },
        });
      }
    } catch (error) {
      setFeedApiStatus("error");
      setFeedApiMode(null);
      setFeedApiMessage(error instanceof Error ? error.message : "Public proof feed publish failed.");
    }
  };

  const setPriorityStatus = (id: string, status: StrategyStatus) => {
    saveStatuses({ ...statuses, [id]: status });
  };

  const toggleModule = (id: string) => {
    const nextCompleted = completedModules.includes(id)
      ? completedModules.filter((moduleId) => moduleId !== id)
      : [...completedModules, id];
    saveCompletedModules(nextCompleted);
  };

  const toggleTask = (id: string) => {
    const nextCompletedTasks = completedTasks.includes(id)
      ? completedTasks.filter((taskId) => taskId !== id)
      : [...completedTasks, id];
    saveCompletedTasks(nextCompletedTasks);
  };

  const toggleBlueprint = (id: string) => {
    const nextQueuedBlueprints = queuedBlueprints.includes(id)
      ? queuedBlueprints.filter((blueprintId) => blueprintId !== id)
      : [...queuedBlueprints, id];
    saveQueuedBlueprints(nextQueuedBlueprints);
  };

  const generateBlueprint = (id: string) => {
    const blueprint = strategyPracticeBlueprints.find((item) => item.id === id);
    if (!blueprint) return;

    const handoff = buildStrategyPracticeHandoff(blueprint);
    const nextHandoffs = [handoff, ...practiceHandoffs.filter((item) => item.blueprintId !== id)];
    const nextQueuedBlueprints = queuedBlueprints.includes(id) ? queuedBlueprints : [...queuedBlueprints, id];

    setPracticeHandoffs(nextHandoffs);
    writePracticeHandoffs(nextHandoffs);
    setQueuedBlueprints(nextQueuedBlueprints);
    writeStrategyState({ statuses, completedModules, completedTasks, queuedBlueprints: nextQueuedBlueprints });
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#13251d]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 text-sm font-black">
          Loading 2027 strategy command...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen max-w-full overflow-x-hidden bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 md:px-8">
        <section
          data-testid="prelims-2027-strategy-hero"
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:items-end">
            <div className="min-w-0">
              <Link href="/upsc" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
                <ArrowLeft className="h-4 w-4" /> UPSC command home
              </Link>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">2027 Strategy Command</Badge>
                <span className="text-sm font-bold text-[#776f64]">PDF audit to execution engine</span>
              </div>
              <h1 className="max-w-4xl text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
                Turn the 2026 audit into a precise 2027 build queue.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This command surface converts the final research PDF into operational tasks: critical gaps, source
                proof, question-format rebuild rules, practice blueprints, and student readiness simulation.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/upsc/prelims-2026-showcase" className="inline-flex min-h-11 items-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white">
                  Open 2026 proof page <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="#practice-blueprints" className="inline-flex min-h-11 items-center rounded-md border border-[#1d9e75] bg-white px-4 text-sm font-black text-[#085041]">
                  Build practice queue
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Execution completion", `${totals.completion}%`],
                ["Task completion", `${totals.taskCompletion}%`],
                ["Critical gaps open", totals.criticalOpen],
                ["Tasks complete", `${totals.completedTaskCount}/${strategyExecutionTasks.length}`],
                ["Practice queued", `${totals.queuedBlueprintCount}/${strategyPracticeBlueprints.length}`],
                ["Generated sets", `${totals.generatedBlueprintCount}/${strategyPracticeBlueprints.length}`],
                ["Queue time", `${totals.queuedMinutes} min`],
                ["Build items active", totals.building],
                ["Simulator score", `${simulator.score}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-3xl font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="prelims-2027-publish-gate" data-testid="prelims-2027-publish-gate" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 grid gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Main website publish gate</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Separate publish-safe proof from internal execution work</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This gate tells the team what can be pasted on the main website now, which claims must stay proof-locked,
                and what operational evidence still needs to be completed inside the software.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[28rem]">
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Website status</p>
                <p className="mt-1 text-2xl font-black text-[#13251d]">Safe with lock</p>
              </div>
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Proof tasks</p>
                <p className="mt-1 text-2xl font-black text-[#13251d]">
                  {evidenceTotals.completedProofTasks}/{evidenceTotals.totalProofTasks}
                </p>
              </div>
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Blueprints generated</p>
                <p className="mt-1 text-2xl font-black text-[#13251d]">
                  {deliveryTotals.generated}/{strategyPracticeBlueprints.length}
                </p>
              </div>
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Student proof</p>
                <p className="mt-1 text-2xl font-black text-[#13251d]">
                  {deliveryTotals.solved}/{strategyPracticeBlueprints.length}
                </p>
              </div>
            </div>
          </div>

          <div
            data-testid="prelims-2026-release-decision-api-readiness"
            data-api-status={releaseDecisionApi.status}
            data-version={releaseDecisionApi.decision?.version ?? "loading"}
            data-release-status={releaseDecisionApi.decision?.status ?? "loading"}
            data-effective-coverage={releaseDecisionApi.decision?.summary.effectiveCoveragePercent ?? 0}
            data-proof-locked-question-count={releaseDecisionApi.decision?.summary.proofLockedQuestionCount ?? 0}
            data-released-claim-count={releaseDecisionApi.decision?.summary.releasedClaimCount ?? 0}
            data-api-endpoint-count={releaseDecisionApi.decision?.summary.apiEndpointCount ?? 0}
            data-gate-count={releaseDecisionApi.decision?.gates.length ?? 0}
            className="mb-5 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                  Release-decision API readiness
                </p>
                <h3 className="mt-1 text-lg font-black tracking-tight text-[#13251d]">
                  One contract decides what the main site can publish
                </h3>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                  {releaseDecisionApi.message}
                </p>
              </div>
              <Link
                href="/upsc-prelims-2026-showcase#release-decision"
                className="inline-flex min-h-10 items-center rounded-md border border-[#1d9e75] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
              >
                Public decision <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-5">
              {[
                ["Endpoint", releaseDecisionApi.decision?.api.releaseDecision ?? "/api/upsc/prelims-2026/release-decision"],
                ["Review command API", releaseDecisionApi.decision?.api.reviewCommand ?? showcaseManifest.api.reviewCommand],
                ["Public status", releaseDecisionApi.decision?.decision.publicStatus ?? "Checking"],
                ["Coverage", releaseDecisionApi.decision ? `${releaseDecisionApi.decision.summary.preparedQuestions}/${releaseDecisionApi.decision.summary.scorableQuestions}` : "Checking"],
                ["API endpoints", releaseDecisionApi.decision?.summary.apiEndpointCount ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#dcd5c7] bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 break-words text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3">
              {(releaseDecisionApi.decision?.gates ?? []).map((gate) => (
                <article
                  key={`release-decision-api-${gate.id}`}
                  data-testid="prelims-2026-release-decision-gate"
                  data-gate-id={gate.id}
                  data-gate-status={gate.status}
                  className="grid gap-3 rounded-md border border-[#dcd5c7] bg-white p-3 lg:grid-cols-[0.75fr_1.25fr_0.9fr]"
                >
                  <div>
                    <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em]", publishGateTone(gate.status))}>
                      {gate.status}
                    </span>
                    <h4 className="mt-2 text-sm font-black text-[#13251d]">{gate.title}</h4>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-[#746f66]">{gate.metric}</p>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-[#5d675f]">{gate.evidence}</p>
                  <p className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-3 text-xs font-bold leading-5 text-[#31443a]">
                    {gate.publicAction}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="mb-5 grid gap-3 lg:grid-cols-3">
            {[
              {
                label: "Headline to use",
                body: "UPSC Prelims 2026: what we built, what appeared, and what changes for the 2027 preparation cycle.",
              },
              {
                label: "Coverage line to use",
                body: "The corrected research audit shows 74 of 97 scorable questions had direct or partial preparation advantage.",
              },
              {
                label: "Line to avoid",
                body: "Do not publish final question-wise accuracy claims until exact source/page proof is retained.",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{item.label}</p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#31443a]">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3">
            {publishGateRows.map((gate) => (
              <article
                key={gate.id}
                data-testid="prelims-2027-publish-gate-row"
                data-gate-id={gate.id}
                data-gate-status={gate.status}
                className="grid gap-4 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 lg:grid-cols-[0.8fr_1.05fr_0.95fr] lg:items-start"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", publishGateTone(gate.status))}>
                      {gate.status}
                    </span>
                    <span className="rounded-md border border-[#dcd5c7] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#746f66]">
                      {gate.metric}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-black tracking-tight text-[#13251d]">{gate.title}</h3>
                </div>
                <p className="text-sm font-semibold leading-6 text-[#5d675f]">{gate.detail}</p>
                <p className="rounded-md border border-[#dcd5c7] bg-white p-3 text-sm font-bold leading-6 text-[#31443a]">
                  {gate.action}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/upsc-prelims-2026-showcase#strategy-2027" className="inline-flex min-h-10 items-center rounded-md border border-[#1d9e75] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]">
              Open public handoff <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
            <Link href="#prelims-2027-evidence-ledger" className="inline-flex min-h-10 items-center rounded-md border border-[#dcd5c7] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#31443a]">
              Review proof ledger <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section id="prelims-2027-sprint-calendar" data-testid="prelims-2027-sprint-calendar" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">2027 sprint calendar</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Turn the PDF recommendations into a 12-week build sequence</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This calendar answers what to build first, what proof must be retained, and which release signal proves
                each phase is ready to move from content work into MCQ Command and student practice.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[36rem]">
              {[
                ["Average progress", `${sprintTotals.averageProgress}%`],
                ["Ready", sprintTotals.ready],
                ["Building", sprintTotals.building],
                ["Planned", sprintTotals.planned],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {sprintRows.map((row) => (
              <article
                key={row.sprint.id}
                data-testid="prelims-2027-sprint-row"
                data-sprint-id={row.sprint.id}
                data-sprint-status={row.status}
                data-sprint-progress={row.progress}
                className="grid gap-4 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 xl:grid-cols-[0.8fr_1.1fr_0.95fr] xl:items-start"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", sprintStatusTone(row.status))}>
                      {row.status}
                    </span>
                    <span className="rounded-md border border-[#dcd5c7] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#746f66]">
                      {row.sprint.window}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-black tracking-tight text-[#13251d]">{row.sprint.title}</h3>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#746f66]">{row.sprint.phase}</p>
                  <div className="mt-4 rounded-md border border-[#dcd5c7] bg-white p-3">
                    <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#746f66]">
                      <span>Sprint progress</span>
                      <span>{row.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f7f4ee]">
                      <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${row.progress}%` }} />
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-6 text-[#5d675f]">{row.sprint.focus}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {row.priorityLabels.map((label) => (
                      <span key={`${row.sprint.id}-${label}`} className="rounded-md border border-[#dcd5c7] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#31443a]">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    {[
                      ["Tasks", `${row.completedTaskCount}/${row.sprint.taskIds.length}`],
                      ["Generated", `${row.generatedCount}/${row.sprint.blueprintIds.length}`],
                      ["Locked", `${row.lockedCount}/${row.sprint.blueprintIds.length}`],
                      ["Solved", `${row.solvedCount}/${row.sprint.blueprintIds.length}`],
                    ].map(([label, value]) => (
                      <div key={`${row.sprint.id}-${label}`} className="rounded-md border border-[#dcd5c7] bg-white p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">{label}</p>
                        <p className="mt-1 text-sm font-black text-[#13251d]">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid min-w-0 gap-3">
                  <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Proof gate</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">{row.sprint.proofGate}</p>
                  </div>
                  <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Release signal</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">{row.sprint.releaseSignal}</p>
                  </div>
                  <Link
                    href={row.sprint.route}
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
                  >
                    Open sprint surface <CalendarDays className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="prelims-2027-reallocation-board" data-testid="prelims-2027-reallocation-board" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">2027 reallocation board</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">What to build, patch, maintain or reduce after the 2026 paper</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This board turns the research recommendation into an execution decision: new build, depth upgrade,
                current/map patch, maintenance or reduction. Each row is tied to tasks, proof gate, MCQ targets and student signal.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 xl:min-w-[44rem]">
              {[
                ["Avg progress", `${reallocationTotals.averageProgress}%`],
                ["New builds", reallocationTotals.buildFromScratch],
                ["Depth", reallocationTotals.depthUpgrade],
                ["Patch", reallocationTotals.patchAndTag],
                ["Hold/reduce", reallocationTotals.maintainOrReduce],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {reallocationRows.map((row) => (
              <article
                key={row.decision.id}
                data-testid="prelims-2027-reallocation-row"
                data-priority-id={row.decision.priorityId}
                data-decision={row.decision.decision}
                data-stage={row.stage}
                data-progress={row.progress}
                className="grid gap-4 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 xl:grid-cols-[0.75fr_1.1fr_1fr] xl:items-start"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", reallocationDecisionTone(row.decision.decision))}>
                      {row.decision.decision}
                    </span>
                    <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", sprintStatusTone(row.stage))}>
                      {row.stage}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-black tracking-tight text-[#13251d]">
                    {row.priority?.subject ?? row.decision.priorityId}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{row.decision.allocation}</p>
                  <div className="mt-4 rounded-md border border-[#dcd5c7] bg-white p-3">
                    <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#746f66]">
                      <span>Execution progress</span>
                      <span>{row.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f7f4ee]">
                      <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${row.progress}%` }} />
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Source shift</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">{row.decision.sourceShift}</p>
                    </div>
                    <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">MCQ target</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">{row.decision.mcqTarget}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    {[
                      ["Tasks", `${row.completedTaskCount}/${row.tasks.length}`],
                      ["Generated", `${row.generatedCount}/${row.blueprints.length}`],
                      ["Locked", `${row.lockedCount}/${row.blueprints.length}`],
                      ["Solved", `${row.solvedCount}/${row.blueprints.length}`],
                    ].map(([label, value]) => (
                      <div key={`${row.decision.id}-${label}`} className="rounded-md border border-[#dcd5c7] bg-white p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">{label}</p>
                        <p className="mt-1 text-sm font-black text-[#13251d]">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid min-w-0 gap-3">
                  <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Release gate</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">{row.decision.releaseGate}</p>
                  </div>
                  <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Student signal</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">{row.decision.studentSignal}</p>
                  </div>
                  <Link
                    href={row.evidence?.route ?? row.priority?.targetRoute ?? "#prelims-2027-build-queue"}
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
                  >
                    Open owner surface <Route className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="prelims-2027-course-correction-packet"
          data-testid="prelims-2027-course-correction-packet"
          data-track-count={reallocationRows.length}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">2027 course correction packet</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">What changes inside the course and software after the final PDF</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This is the copyable operator note for the next cycle: which modules become new builds, which get
                deeper source treatment, which only need current tags, and where time should be reduced.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              <button
                type="button"
                data-testid="prelims-2027-copy-course-packet"
                onClick={() => void copyCourseCorrectionPacket()}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1d9e75] bg-[#1d9e75] px-4 text-xs font-black uppercase tracking-[0.1em] text-white transition hover:bg-[#126245]"
              >
                <Clipboard className="mr-2 h-4 w-4" />
                {copiedCoursePacket ? "Course packet copied" : "Copy course packet"}
              </button>
              <Link
                href="/upsc/source-library#upsc-morning-batch-archive-intake"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-4 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition hover:bg-[#e7f5ee]"
              >
                <FileSearch className="mr-2 h-4 w-4" />
                Open source intake
              </Link>
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Decision tracks", reallocationRows.length],
              ["New builds", reallocationTotals.buildFromScratch],
              ["Depth upgrades", reallocationTotals.depthUpgrade],
              ["Patch/tag", reallocationTotals.patchAndTag],
              ["Maintain/reduce", reallocationTotals.maintainOrReduce],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="grid gap-3">
              {(["Build from scratch", "Depth upgrade", "Patch and tag", "Maintain", "Reduce"] as const).map(
                (decision) => {
                  const groupRows = reallocationRows.filter((row) => row.decision.decision === decision);

                  return (
                    <article key={decision} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", reallocationDecisionTone(decision))}>
                          {decision}
                        </span>
                        <span className="rounded-md border border-[#dcd5c7] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#746f66]">
                          {groupRows.length} tracks
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2">
                        {groupRows.length ? (
                          groupRows.map((row) => (
                            <div key={`${decision}-${row.decision.id}`} className="rounded-md border border-[#dcd5c7] bg-white p-3">
                              <p className="text-sm font-black text-[#13251d]">{row.priority?.subject ?? row.decision.priorityId}</p>
                              <p className="mt-1 text-xs font-semibold leading-5 text-[#5d675f]">{row.decision.allocation}</p>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-md border border-[#dcd5c7] bg-white p-3 text-xs font-semibold text-[#746f66]">
                            No track assigned in this decision group.
                          </p>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>

            <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Copy-ready operator packet</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#5d675f]">
                    Use this inside the software plan before changing yearly planner hours, MCQ targets or public website copy.
                  </p>
                </div>
                <Badge className="rounded-md bg-[#e7f5ee] text-[#085041] hover:bg-[#e7f5ee]">
                  74/97 signal retained
                </Badge>
              </div>
              <pre className="max-h-[34rem] overflow-auto whitespace-pre-wrap break-words rounded-md border border-[#dcd5c7] bg-white p-4 text-xs font-semibold leading-6 text-[#31443a]">
                {courseCorrectionPacketText}
              </pre>
            </div>
          </div>
        </section>

        <section id="prelims-2027-build-queue" data-testid="prelims-2027-build-queue" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">2027 build queue</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Priority matrix from the final PDF</h2>
            </div>
            <ClipboardCheck className="h-6 w-6 text-[#1a3a2a]" />
          </div>

          <div className="grid gap-3">
            {resolvedPriorities.map((priority) => (
              <article
                key={priority.id}
                className="grid gap-4 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 md:grid-cols-[0.9fr_1.15fr_0.9fr] md:items-start"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", priorityTone(priority.priority))}>
                      {priority.priority}
                    </span>
                    <span className="rounded-md border border-[#dcd5c7] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#746f66]">
                      {priority.accuracy}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-black tracking-tight text-[#13251d]">{priority.subject}</h3>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#746f66]">{priority.window}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#5d675f]">{priority.evidence}</p>
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Action</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#31443a]">{priority.action}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {priority.gapTypes.map((gap) => (
                      <span key={`${priority.id}-${gap}`} className="rounded-md border border-[#dcd5c7] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#31443a]">
                        {gap}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#746f66]">{priority.ownerSurface}</p>
                  <div className="mt-3 grid grid-cols-3 gap-1 rounded-md bg-[#f7f4ee] p-1">
                    {statusOptions.map((status) => (
                      <button
                        key={`${priority.id}-${status}`}
                        type="button"
                        onClick={() => setPriorityStatus(priority.id, status)}
                        className={cn(
                          "min-h-9 rounded-md px-2 text-[10px] font-black uppercase tracking-[0.08em] transition",
                          priority.status === status
                            ? statusTone(status)
                            : "border border-transparent text-[#746f66] hover:bg-white"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  <Link
                    href={priority.targetRoute}
                    className="mt-3 inline-flex min-h-10 items-center rounded-md border border-[#1d9e75] bg-white px-3 text-xs font-black text-[#085041]"
                  >
                    Open owner surface <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="prelims-2027-evidence-ledger" data-testid="prelims-2027-evidence-ledger" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Evidence ledger</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Make every 2027 change defensible before it becomes a public claim</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This layer converts the PDF's findings into proof rules: what the paper exposed, how our coverage should
                be read, what source standard is required, and which software action must happen before release.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:min-w-[34rem]">
              {[
                ["Claim ready", evidenceTotals.claimReady],
                ["Source packs", evidenceTotals.needsSource],
                ["Page proof", evidenceTotals.needsPageProof],
                ["Internal only", evidenceTotals.internalOnly],
                ["Proof tasks", `${evidenceTotals.completedProofTasks}/${evidenceTotals.totalProofTasks}`],
                ["Ledger rows", evidenceRows.length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {evidenceRows.map(({ entry, priority, proofPercent, proofTasks }) => (
              <article
                key={entry.id}
                data-testid="prelims-2027-evidence-row"
                data-priority-id={entry.priorityId}
                data-proof-status={entry.proofStatus}
                className="grid gap-4 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 xl:grid-cols-[0.8fr_1.1fr_0.85fr] xl:items-start"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", evidenceStatusTone(entry.proofStatus))}>
                      {entry.proofStatus}
                    </span>
                    <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", priorityTone(priority?.priority ?? "Medium"))}>
                      {priority?.priority ?? "Medium"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-black tracking-tight text-[#13251d]">{priority?.subject ?? "2027 priority"}</h3>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#746f66]">
                    {entry.questionWindow}
                  </p>
                  <div className="mt-4 rounded-md border border-[#dcd5c7] bg-white p-3">
                    <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#746f66]">
                      <span>Source/proof tasks</span>
                      <span>{proofPercent}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f7f4ee]">
                      <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${proofPercent}%` }} />
                    </div>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#5d675f]">
                      {proofTasks.length ? `${proofTasks.length} proof-linked tasks in the execution ledger.` : "No proof task linked yet."}
                    </p>
                  </div>
                </div>

                <div className="grid min-w-0 gap-3">
                  {[
                    ["Audit signal", entry.auditSignal],
                    ["Coverage read", entry.coverageRead],
                    ["Exam surprise", entry.examSurprise],
                    ["Software decision", entry.softwareDecision],
                  ].map(([label, value]) => (
                    <div key={`${entry.id}-${label}`} className="rounded-md border border-[#dcd5c7] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">{label}</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid min-w-0 gap-3">
                  <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Source standard</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">{entry.sourceStandard}</p>
                  </div>
                  <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Public claim rule</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">{entry.publicClaimRule}</p>
                  </div>
                  <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Next proof action</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">{entry.nextProofAction}</p>
                  </div>
                  <Link
                    href={entry.route}
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
                  >
                    Open proof surface <FileSearch className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="prelims-2026-website-publish-packet" data-testid="prelims-2026-website-publish-packet" data-release-count={publicClaimReleaseTotals.readyClaims} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Main website publish packet</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">One copy-ready block for the public website handoff</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This packet combines the corrected audit, proof-lock wording, and only the released MCQ claim lines that
                already passed the proof-packet gate.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyWebsitePublishPacket()}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1d9e75] bg-[#1d9e75] px-4 text-xs font-black uppercase tracking-[0.1em] text-white transition hover:bg-[#126245]"
            >
              <Clipboard className="mr-2 h-4 w-4" />
              {copiedPublishPacket ? "Packet copied" : "Copy publish packet"}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="grid gap-3">
              {[
                ["Corrected audit", "76%"],
                ["Scorable advantage", "74/97"],
                ["Released claims", publicClaimReleaseTotals.readyClaims],
                ["Proof owner", "Release board"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
            <pre className="max-h-[30rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 text-sm font-semibold leading-6 text-[#31443a]">
              {websitePublishPacketText}
            </pre>
          </div>
        </section>

        <section
          id="prelims-2026-main-website-manifest-contract"
          data-testid="prelims-2026-main-website-manifest-contract"
          data-version={showcaseManifest.version}
          data-review-command-endpoint={showcaseManifest.api.reviewCommand}
          data-release-decision-endpoint={showcaseManifest.api.releaseDecision}
          data-main-site-handoff-endpoint={showcaseManifest.api.mainSiteHandoff}
          data-manifest-endpoint={showcaseManifest.api.manifest}
          data-match-accountability-endpoint={showcaseManifest.api.matchAccountability}
          data-question-ledger-endpoint={showcaseManifest.api.questionLedger}
          data-proof-feed-endpoint={showcaseManifest.api.proofFeed}
          data-course-action-endpoint={showcaseManifest.api.courseAction}
          data-source-archive-summary-endpoint={showcaseManifest.api.sourceArchiveSummary}
          data-build-readiness-endpoint={showcaseManifest.api.buildReadiness}
          data-public-route={showcaseManifest.publicRoute}
          data-effective-coverage={showcaseManifest.audit.corrected.effectiveCoveragePercent}
          data-corrected-direct={showcaseManifest.audit.corrected.direct}
          data-corrected-partial={showcaseManifest.audit.corrected.partial}
          data-corrected-misses={showcaseManifest.audit.corrected.misses}
          data-corrected-dropped={showcaseManifest.audit.corrected.dropped}
          data-source-direct={showcaseManifest.audit.sourceLead.directTextLeads}
          data-source-conceptual={showcaseManifest.audit.sourceLead.conceptualLeads}
          data-question-count={showcaseManifest.questionLedger.completeQuestionCards}
          data-statement-coverage-rows={showcaseManifest.questionLedger.statementCoverageRows}
          data-strategy-task-count={showcaseManifest.strategy.taskCount}
          data-phase-source={showcaseManifest.strategy.phaseCounts.Source}
          data-phase-capsule={showcaseManifest.strategy.phaseCounts.Capsule}
          data-phase-mcq={showcaseManifest.strategy.phaseCounts.MCQ}
          data-phase-proof={showcaseManifest.strategy.phaseCounts.Proof}
          data-phase-release={showcaseManifest.strategy.phaseCounts.Release}
          data-phase-planner={showcaseManifest.strategy.phaseCounts.Planner}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Main website manifest contract</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">One API contract controls the public page handoff</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This is the software-facing checklist for the main site: corrected audit numbers, proof policy,
                route map, website copy blocks, question-ledger counts and 2027 execution totals all come from the same manifest.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyManifestEndpoint()}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-4 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition hover:bg-[#e7f5ee]"
            >
              <Clipboard className="mr-2 h-4 w-4" />
              {copiedManifestEndpoint ? "Endpoint copied" : "Copy manifest endpoint"}
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
            <div className="grid gap-3">
              {[
                ["Review command endpoint", showcaseManifest.api.reviewCommand],
                ["Release-decision endpoint", showcaseManifest.api.releaseDecision],
                ["Main-site handoff endpoint", showcaseManifest.api.mainSiteHandoff],
                ["Manifest endpoint", showcaseManifest.api.manifest],
                ["Match-accountability endpoint", showcaseManifest.api.matchAccountability],
                ["Question ledger endpoint", showcaseManifest.api.questionLedger],
                ["Proof feed endpoint", showcaseManifest.api.proofFeed],
                ["2027 course action endpoint", showcaseManifest.api.courseAction],
                ["Source archive summary endpoint", showcaseManifest.api.sourceArchiveSummary],
                ["Build readiness endpoint", showcaseManifest.api.buildReadiness],
                ["Public page", showcaseManifest.publicRoute],
                ["Portal owner", showcaseManifest.strategyRoute],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 break-words text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  {
                    label: "Corrected audit",
                    value: `${showcaseManifest.audit.corrected.effectiveCoveragePercent}%`,
                    detail: `${showcaseManifest.audit.corrected.direct} direct / ${showcaseManifest.audit.corrected.partial} partial / ${showcaseManifest.audit.corrected.misses} misses / ${showcaseManifest.audit.corrected.dropped} dropped`,
                  },
                  {
                    label: "Source leads",
                    value: `${showcaseManifest.audit.sourceLead.directTextLeads}/${showcaseManifest.audit.sourceLead.conceptualLeads}`,
                    detail: "Direct text leads / conceptual leads",
                  },
                  {
                    label: "Question ledger",
                    value: String(showcaseManifest.questionLedger.completeQuestionCards),
                    detail: `${showcaseManifest.questionLedger.statementCoverageRows} statement coverage rows`,
                  },
                  {
                    label: "2027 tasks",
                    value: String(showcaseManifest.strategy.taskCount),
                    detail: `${showcaseManifest.strategy.priorityCount} priorities / ${showcaseManifest.strategy.practiceBlueprintCount} blueprints`,
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                    <p className="text-2xl font-black tracking-tight text-[#13251d]">{item.value}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{item.label}</p>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#5d675f]">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-lg border border-[#dcd5c7] bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Proof policy</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#31443a]">{showcaseManifest.proofPolicy}</p>
                </div>
                <div className="rounded-lg border border-[#dcd5c7] bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Execution phase split</p>
                  <p className="mt-2 text-sm font-black leading-6 text-[#31443a]">
                    {strategyTaskPhaseOrder
                      .map((phase) => `${phase}: ${showcaseManifest.strategy.phaseCounts[phase]}`)
                      .join(" / ")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={showcaseManifest.publicRoute}
                  className="inline-flex min-h-10 items-center rounded-md border border-[#1d9e75] bg-[#e7f5ee] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
                >
                  Open public showcase <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
                <Link
                  href={`${showcaseManifest.publicRoute}#main-website-manifest-contract`}
                  className="inline-flex min-h-10 items-center rounded-md border border-[#ef9f27] bg-[#fff4df] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#6f4a12]"
                >
                  Public contract block <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          id="prelims-2026-build-readiness-api-readiness"
          data-testid="prelims-2026-build-readiness-api-readiness"
          data-api-status={buildReadinessApi.status}
          data-version={buildReadinessApi.readiness?.version ?? "pending"}
          data-build-status={buildReadinessApi.readiness?.status ?? "pending"}
          data-requirement-count={buildReadinessApi.readiness?.summary.requirementCount ?? 0}
          data-complete-count={buildReadinessApi.readiness?.summary.completeCount ?? 0}
          data-proof-locked-count={buildReadinessApi.readiness?.summary.proofLockedCount ?? 0}
          data-portal-owned-count={buildReadinessApi.readiness?.summary.portalOwnedCount ?? 0}
          data-question-count={buildReadinessApi.readiness?.summary.questionCount ?? 0}
          data-complete-question-cards={buildReadinessApi.readiness?.summary.completeQuestionCards ?? 0}
          data-option-set-count={buildReadinessApi.readiness?.summary.optionSetCount ?? 0}
          data-statement-coverage-rows={buildReadinessApi.readiness?.summary.statementCoverageRows ?? 0}
          data-priority-count={buildReadinessApi.readiness?.summary.priorityCount ?? 0}
          data-strategy-task-count={buildReadinessApi.readiness?.summary.strategyTaskCount ?? 0}
          data-practice-blueprint-count={buildReadinessApi.readiness?.summary.practiceBlueprintCount ?? 0}
          data-format-rule-count={buildReadinessApi.readiness?.summary.formatRuleCount ?? 0}
          data-api-endpoint-count={buildReadinessApi.readiness?.summary.apiEndpointCount ?? 0}
          data-verifier-count={buildReadinessApi.readiness?.summary.verifierCount ?? 0}
          data-gate-count={buildReadinessApi.readiness?.gates.length ?? 0}
          data-rendered-requirement-count={buildReadinessRequirementRows.length}
          data-rendered-gate-count={buildReadinessGateRows.length}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Build-readiness API readiness</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Audit the final public-page handoff from inside the software</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This checkpoint reads the build-readiness endpoint and shows whether the standalone page, MCQ ledger,
                source archive summary, proof feed, public copy and 2027 execution path are ready for main-site integration.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyBuildReadinessEndpoint()}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-4 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition hover:bg-[#e7f5ee]"
            >
              <Clipboard className="mr-2 h-4 w-4" />
              {copiedBuildReadinessEndpoint ? "Endpoint copied" : "Copy readiness endpoint"}
            </button>
          </div>

          <div
            className={cn(
              "mb-4 rounded-lg border p-4 text-sm font-bold leading-6",
              buildReadinessApi.status === "ready"
                ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                : buildReadinessApi.status === "error"
                  ? "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]"
                  : "border-[#dcd5c7] bg-[#fdfaf3] text-[#5d675f]"
            )}
          >
            API mode: {buildReadinessApi.status} / {buildReadinessApi.message}
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
            <div className="grid gap-3">
              {[
                ["Endpoint", buildReadinessApi.readiness?.api.buildReadiness ?? showcaseManifest.api.buildReadiness],
                ["Review command API", buildReadinessApi.readiness?.api.reviewCommand ?? showcaseManifest.api.reviewCommand],
                ["Version", buildReadinessApi.readiness?.version ?? "checking"],
                ["Public page", buildReadinessApi.readiness?.publicRoute ?? showcaseManifest.publicRoute],
                ["Strategy owner", buildReadinessApi.readiness?.strategyRoute ?? showcaseManifest.strategyRoute],
                ["Release-decision API", buildReadinessApi.readiness?.api.releaseDecision ?? showcaseManifest.api.releaseDecision],
                ["Main-site handoff API", buildReadinessApi.readiness?.api.mainSiteHandoff ?? showcaseManifest.api.mainSiteHandoff],
                ["Manifest API", buildReadinessApi.readiness?.api.manifest ?? showcaseManifest.api.manifest],
                ["Match-accountability API", buildReadinessApi.readiness?.api.matchAccountability ?? showcaseManifest.api.matchAccountability],
                ["Question ledger API", buildReadinessApi.readiness?.api.questionLedger ?? showcaseManifest.api.questionLedger],
                ["Proof feed API", buildReadinessApi.readiness?.api.proofFeed ?? showcaseManifest.api.proofFeed],
                ["Course action API", buildReadinessApi.readiness?.api.courseAction ?? showcaseManifest.api.courseAction],
                ["Source summary API", buildReadinessApi.readiness?.api.sourceArchiveSummary ?? showcaseManifest.api.sourceArchiveSummary],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 break-words text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Requirements",
                    value: String(buildReadinessApi.readiness?.summary.requirementCount ?? 0),
                    detail: `${buildReadinessApi.readiness?.summary.completeCount ?? 0} complete / ${buildReadinessApi.readiness?.summary.proofLockedCount ?? 0} proof locked`,
                  },
                  {
                    label: "Question evidence",
                    value: String(buildReadinessApi.readiness?.summary.completeQuestionCards ?? 0),
                    detail: `${buildReadinessApi.readiness?.summary.optionSetCount ?? 0} option sets / ${buildReadinessApi.readiness?.summary.statementCoverageRows ?? 0} statement rows`,
                  },
                  {
                    label: "2027 execution",
                    value: String(buildReadinessApi.readiness?.summary.strategyTaskCount ?? 0),
                    detail: `${buildReadinessApi.readiness?.summary.priorityCount ?? 0} priorities / ${buildReadinessApi.readiness?.summary.practiceBlueprintCount ?? 0} blueprints`,
                  },
                  {
                    label: "API and tests",
                    value: String(buildReadinessApi.readiness?.summary.apiEndpointCount ?? 0),
                    detail: `${buildReadinessApi.readiness?.summary.verifierCount ?? 0} verifier scripts`,
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                    <p className="text-2xl font-black tracking-tight text-[#13251d]">{item.value}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{item.label}</p>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#5d675f]">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-lg border border-[#dcd5c7] bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Proof policy from API</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#31443a]">
                    {buildReadinessApi.readiness?.proofPolicy ?? "Waiting for the build-readiness proof policy."}
                  </p>
                </div>
                <div className="rounded-lg border border-[#dcd5c7] bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Build status</p>
                  <p className="mt-2 text-sm font-black leading-6 text-[#31443a]">
                    {buildReadinessApi.readiness?.status ?? "Waiting for build status"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {buildReadinessGateRows.map((gate) => (
                  <article
                    key={`strategy-build-readiness-gate-${gate.id}`}
                    data-testid="prelims-2026-build-readiness-gate"
                    data-gate-id={gate.id}
                    data-gate-status={gate.status}
                    className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn("rounded-md border", buildReadinessStatusTone(gate.status))}>
                        {gate.status}
                      </Badge>
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-[#746f66]">{gate.id}</span>
                    </div>
                    <h3 className="mt-3 text-base font-black tracking-tight text-[#13251d]">{gate.label}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{gate.rule}</p>
                  </article>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`${showcaseManifest.publicRoute}#build-readiness`}
                  className="inline-flex min-h-10 items-center rounded-md border border-[#1d9e75] bg-[#e7f5ee] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
                >
                  Public readiness preview <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
                <Link
                  href="#prelims-2026-main-website-manifest-contract"
                  className="inline-flex min-h-10 items-center rounded-md border border-[#ef9f27] bg-[#fff4df] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#6f4a12]"
                >
                  Manifest contract <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {buildReadinessRequirementRows.map((requirement) => (
              <article
                key={`strategy-build-readiness-requirement-${requirement.id}`}
                data-testid="prelims-2026-build-readiness-requirement"
                data-requirement-id={requirement.id}
                data-status={requirement.status}
                data-public-anchor={requirement.publicAnchor}
                data-portal-owner={requirement.portalOwner}
                data-api-evidence={requirement.apiEvidence}
                data-verifier={requirement.verifier}
                className="grid gap-4 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 xl:grid-cols-[0.75fr_0.45fr_1fr_0.9fr] xl:items-start"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn("rounded-md border", buildReadinessStatusTone(requirement.status))}>
                      {requirement.status}
                    </Badge>
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#746f66]">{requirement.id}</span>
                  </div>
                  <h3 className="mt-3 text-base font-black tracking-tight text-[#13251d]">{requirement.label}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{requirement.proof}</p>
                </div>

                <div className="min-w-0 rounded-md border border-[#dcd5c7] bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">API evidence</p>
                  <p className="mt-1 break-words text-xs font-black leading-5 text-[#31443a]">{requirement.apiEvidence}</p>
                </div>

                <div className="min-w-0 rounded-md border border-[#dcd5c7] bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Public anchor</p>
                  <p className="mt-1 break-words text-xs font-semibold leading-5 text-[#31443a]">{requirement.publicAnchor}</p>
                  <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Portal owner</p>
                  <p className="mt-1 break-words text-xs font-semibold leading-5 text-[#31443a]">{requirement.portalOwner}</p>
                </div>

                <div className="min-w-0 rounded-md border border-[#dcd5c7] bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Verifier</p>
                  <p className="mt-1 break-words text-xs font-semibold leading-5 text-[#31443a]">{requirement.verifier}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="prelims-2026-question-ledger-api-readiness"
          data-testid="prelims-2026-question-ledger-api-readiness"
          data-api-status={questionLedgerApi.status}
          data-version={questionLedgerApi.ledger?.version ?? "pending"}
          data-question-count={questionLedgerApi.ledger?.summary.totalQuestions ?? 0}
          data-option-set-count={questionLedgerApi.ledger?.summary.optionSets ?? 0}
          data-statement-coverage-rows={questionLedgerApi.ledger?.summary.statementCoverageRows ?? 0}
          data-source-signal-rows={questionLedgerApi.ledger?.summary.sourceSignalRows ?? 0}
          data-concept-signal-rows={questionLedgerApi.ledger?.summary.conceptSignalRows ?? 0}
          data-manual-check-rows={questionLedgerApi.ledger?.summary.manualCheckRows ?? 0}
          data-multi-statement-count={questionLedgerApi.ledger?.summary.multiStatementQuestions ?? 0}
          data-direct-text-leads={questionLedgerApi.ledger?.sourceLeadLedger.directTextLeads ?? 0}
          data-conceptual-leads={questionLedgerApi.ledger?.sourceLeadLedger.conceptualLeads ?? 0}
          data-preview-card-count={questionLedgerPreviewQuestions.length}
          data-preview-question-number={questionLedgerPreviewQuestions[0]?.number ?? 0}
          data-preview-option-count={questionLedgerPreviewQuestions[0]?.question.options.length ?? 0}
          data-preview-coverage-count={questionLedgerPreviewQuestions[0]?.match.statementCoverage.length ?? 0}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Question ledger API readiness</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Validate complete MCQs before the main website uses them</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This software checkpoint reads the live question-ledger endpoint and confirms the full MCQ text,
                options, answer key, statement-level matching and proof-lock policy are available for the public site.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyQuestionLedgerEndpoint()}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-4 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition hover:bg-[#e7f5ee]"
            >
              <Clipboard className="mr-2 h-4 w-4" />
              {copiedQuestionLedgerEndpoint ? "Endpoint copied" : "Copy ledger endpoint"}
            </button>
          </div>

          <div
            className={cn(
              "mb-4 rounded-lg border p-4 text-sm font-bold leading-6",
              questionLedgerApi.status === "ready"
                ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                : questionLedgerApi.status === "error"
                  ? "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]"
                  : "border-[#dcd5c7] bg-[#fdfaf3] text-[#5d675f]"
            )}
          >
            API mode: {questionLedgerApi.status} / {questionLedgerApi.message}
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="grid gap-3">
              {[
                ["Endpoint", showcaseManifest.api.questionLedger],
                ["Version", questionLedgerApi.ledger?.version ?? "checking"],
                ["Public preview", `${showcaseManifest.publicRoute}#main-website-question-ledger-preview`],
                ["Full ledger block", questionLedgerApi.ledger?.publicAnchor ?? `${showcaseManifest.publicRoute}#question-ledger`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 break-words text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Questions",
                    value: String(questionLedgerApi.ledger?.summary.totalQuestions ?? 0),
                    detail: `${questionLedgerApi.ledger?.summary.optionSets ?? 0} option sets`,
                  },
                  {
                    label: "Statement rows",
                    value: String(questionLedgerApi.ledger?.summary.statementCoverageRows ?? 0),
                    detail: `${questionLedgerApi.ledger?.summary.multiStatementQuestions ?? 0} multi-statement questions`,
                  },
                  {
                    label: "Signal split",
                    value: `${questionLedgerApi.ledger?.summary.sourceSignalRows ?? 0}/${questionLedgerApi.ledger?.summary.conceptSignalRows ?? 0}`,
                    detail: `${questionLedgerApi.ledger?.summary.manualCheckRows ?? 0} manual-check rows`,
                  },
                  {
                    label: "Source leads",
                    value: `${questionLedgerApi.ledger?.sourceLeadLedger.directTextLeads ?? 0}/${questionLedgerApi.ledger?.sourceLeadLedger.conceptualLeads ?? 0}`,
                    detail: "Direct text leads / conceptual leads",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                    <p className="text-2xl font-black tracking-tight text-[#13251d]">{item.value}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{item.label}</p>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#5d675f]">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-lg border border-[#dcd5c7] bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Proof policy from API</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#31443a]">
                    {questionLedgerApi.ledger?.proofPolicy ?? "Waiting for the ledger endpoint to respond."}
                  </p>
                </div>
                <div className="rounded-lg border border-[#dcd5c7] bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Corrected audit from API</p>
                  <p className="mt-2 text-sm font-black leading-6 text-[#31443a]">
                    {questionLedgerApi.ledger
                      ? `${questionLedgerApi.ledger.correctedAudit.direct} direct / ${questionLedgerApi.ledger.correctedAudit.partial} partial / ${questionLedgerApi.ledger.correctedAudit.misses} misses / ${questionLedgerApi.ledger.correctedAudit.dropped} dropped`
                      : "Waiting for counts"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`${showcaseManifest.publicRoute}#main-website-question-ledger-preview`}
                  className="inline-flex min-h-10 items-center rounded-md border border-[#1d9e75] bg-[#e7f5ee] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
                >
                  Public API preview <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
                <Link
                  href={questionLedgerApi.ledger?.publicAnchor ?? `${showcaseManifest.publicRoute}#question-ledger`}
                  className="inline-flex min-h-10 items-center rounded-md border border-[#ef9f27] bg-[#fff4df] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#6f4a12]"
                >
                  Full public ledger <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {questionLedgerPreviewQuestions.map((question) => (
              <article
                key={`question-ledger-api-${question.number}`}
                data-testid="prelims-2026-question-ledger-api-card"
                data-question-number={question.number}
                data-option-count={question.question.options.length}
                data-coverage-count={question.match.statementCoverage.length}
                data-proof-locked={String(question.proofLocked)}
                data-answer={question.answer}
                className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-md border border-[#1d9e75] bg-[#e7f5ee] text-[#085041]">
                    Q{question.number}
                  </Badge>
                  <Badge className="rounded-md border border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]">
                    {question.statusLabel}
                  </Badge>
                  <Badge className="rounded-md border border-[#dcd5c7] bg-white text-[#31443a]">
                    {question.proofLocked ? "Proof locked" : "Proof pending"}
                  </Badge>
                </div>
                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                  {question.subject}
                </p>
                <p className="mt-2 text-sm font-black leading-6 text-[#13251d]">{question.question.stem}</p>

                {question.question.statements.length ? (
                  <div className="mt-3 space-y-2">
                    {question.question.statements.map((statement, index) => (
                      <p
                        key={`api-statement-${question.number}-${index}`}
                        data-testid="prelims-2026-question-ledger-api-statement"
                        className="rounded-md border border-[#dcd5c7] bg-white p-3 text-xs font-semibold leading-5 text-[#31443a]"
                      >
                        {index + 1}. {statement}
                      </p>
                    ))}
                  </div>
                ) : null}

                {question.question.instruction && question.question.instruction !== question.question.stem ? (
                  <div className="mt-3 rounded-md border border-[#dcd5c7] bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Instruction</p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-[#31443a]">{question.question.instruction}</p>
                  </div>
                ) : null}

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {question.question.options.map((option) => (
                    <p
                      key={`api-option-${question.number}-${option.letter}`}
                      data-testid="prelims-2026-question-ledger-api-option"
                      className="rounded-md border border-[#dcd5c7] bg-white p-3 text-xs font-bold leading-5 text-[#31443a]"
                    >
                      <span className="font-black text-[#1d9e75]">{option.letter}.</span> {option.text}
                    </p>
                  ))}
                </div>

                <div className="mt-3 rounded-md border border-[#1d9e75] bg-white p-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#085041]">Answer: {question.answer}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#31443a]">{question.match.matchScope}</p>
                </div>

                <div className="mt-3 space-y-2">
                  {question.match.statementCoverage.map((coverage) => (
                    <div
                      key={`api-coverage-${question.number}-${coverage.label}`}
                      data-testid="prelims-2026-question-ledger-api-coverage"
                      className="rounded-md border border-[#dcd5c7] bg-white p-3"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">
                        {coverage.label} / {coverage.coverageLabel}
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#31443a]">{coverage.text}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {coverage.matchedSignals.length ? (
                          coverage.matchedSignals.map((signal) => (
                            <mark key={`${coverage.label}-${signal}`} className="rounded bg-[#fff4df] px-1.5 py-0.5 text-[#6f4a12]">
                              {signal}
                            </mark>
                          ))
                        ) : (
                          <span className="text-xs font-bold text-[#746f66]">Manual teacher check required</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="prelims-2026-match-accountability-api-readiness"
          data-testid="prelims-2026-match-accountability-api-readiness"
          data-api-status={matchAccountabilityApi.status}
          data-version={matchAccountabilityApi.accountability?.version ?? "pending"}
          data-question-count={matchAccountabilityApi.accountability?.summary.totalQuestions ?? 0}
          data-complete-question-cards={matchAccountabilityApi.accountability?.summary.completeQuestionCards ?? 0}
          data-option-set-count={matchAccountabilityApi.accountability?.summary.optionSets ?? 0}
          data-portion-row-count={matchAccountabilityApi.accountability?.summary.portionRows ?? 0}
          data-matched-portion-row-count={matchAccountabilityApi.accountability?.summary.matchedPortionRows ?? 0}
          data-source-signal-rows={matchAccountabilityApi.accountability?.summary.sourceSignalRows ?? 0}
          data-concept-signal-rows={matchAccountabilityApi.accountability?.summary.conceptSignalRows ?? 0}
          data-manual-check-rows={matchAccountabilityApi.accountability?.summary.manualCheckRows ?? 0}
          data-fully-matched-question-count={matchAccountabilityApi.accountability?.summary.fullyMatchedQuestions ?? 0}
          data-partial-match-question-count={matchAccountabilityApi.accountability?.summary.partialMatchQuestions ?? 0}
          data-manual-only-question-count={matchAccountabilityApi.accountability?.summary.manualOnlyQuestions ?? 0}
          data-highlighted-question-count={matchAccountabilityApi.accountability?.summary.highlightedQuestions ?? 0}
          data-proof-locked-question-count={matchAccountabilityApi.accountability?.summary.proofLockedQuestions ?? 0}
          data-preview-card-count={matchAccountabilityPreviewQuestions.length}
          data-preview-question-number={matchAccountabilityPreviewQuestions[0]?.number ?? 0}
          data-preview-highest-matched-portion={matchAccountabilityPreviewQuestions[0]?.match.highestMatchedPortion ?? "pending"}
          data-preview-matched-portion-count={matchAccountabilityPreviewQuestions[0]?.match.matchedPortionLabels.length ?? 0}
          data-preview-manual-check-portion-count={matchAccountabilityPreviewQuestions[0]?.match.manualCheckPortionLabels.length ?? 0}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Match-accountability API readiness</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Validate which MCQ portion is actually matched</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This checkpoint reads the live match-accountability endpoint and confirms every question can show its
                highest matched portion, manual-check portions, covered signals and next proof action before a public claim is released.
              </p>
            </div>
            <Link
              href={`${showcaseManifest.publicRoute}#match-accountability`}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-4 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition hover:bg-[#e7f5ee]"
            >
              Public accountability <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div
            className={cn(
              "mb-4 rounded-lg border p-4 text-sm font-bold leading-6",
              matchAccountabilityApi.status === "ready"
                ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                : matchAccountabilityApi.status === "error"
                  ? "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]"
                  : "border-[#dcd5c7] bg-[#fdfaf3] text-[#5d675f]"
            )}
          >
            API mode: {matchAccountabilityApi.status} / {matchAccountabilityApi.message}
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
            <div className="grid gap-3">
              {[
                ["Endpoint", matchAccountabilityApi.accountability?.api.matchAccountability ?? showcaseManifest.api.matchAccountability],
                ["Version", matchAccountabilityApi.accountability?.version ?? "checking"],
                ["Public preview", matchAccountabilityApi.accountability?.publicAnchor ?? `${showcaseManifest.publicRoute}#match-accountability`],
                ["Full ledger", `${showcaseManifest.publicRoute}#question-ledger`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 break-words text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Portion rows",
                    value: String(matchAccountabilityApi.accountability?.summary.portionRows ?? 0),
                    detail: `${matchAccountabilityApi.accountability?.summary.matchedPortionRows ?? 0} matched portions`,
                  },
                  {
                    label: "Signal split",
                    value: `${matchAccountabilityApi.accountability?.summary.sourceSignalRows ?? 0}/${matchAccountabilityApi.accountability?.summary.conceptSignalRows ?? 0}`,
                    detail: `${matchAccountabilityApi.accountability?.summary.manualCheckRows ?? 0} manual-check portions`,
                  },
                  {
                    label: "Question match",
                    value: `${matchAccountabilityApi.accountability?.summary.fullyMatchedQuestions ?? 0}/${matchAccountabilityApi.accountability?.summary.partialMatchQuestions ?? 0}`,
                    detail: "Fully matched / partial match",
                  },
                  {
                    label: "Proof lock",
                    value: String(matchAccountabilityApi.accountability?.summary.proofLockedQuestions ?? 0),
                    detail: `${matchAccountabilityApi.accountability?.summary.highlightedQuestions ?? 0} questions have highlighted signals`,
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                    <p className="text-2xl font-black tracking-tight text-[#13251d]">{item.value}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{item.label}</p>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#5d675f]">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-[#dcd5c7] bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Proof policy from API</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#31443a]">
                  {matchAccountabilityApi.accountability?.proofPolicy ?? "Waiting for the match-accountability proof policy."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {matchAccountabilityPreviewQuestions.map((question) => (
              <article
                key={`match-accountability-api-${question.number}`}
                data-testid="prelims-2026-match-accountability-api-card"
                data-question-number={question.number}
                data-status={question.status}
                data-highest-matched-portion={question.match.highestMatchedPortion}
                data-matched-portion-count={question.match.matchedPortionLabels.length}
                data-manual-check-portion-count={question.match.manualCheckPortionLabels.length}
                data-coverage-score={question.match.coverageScorePercent}
                data-proof-locked={String(question.proofLocked)}
                className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-md border border-[#1d9e75] bg-[#e7f5ee] text-[#085041]">
                    Q{question.number}
                  </Badge>
                  <Badge className="rounded-md border border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]">
                    {question.statusLabel}
                  </Badge>
                  <Badge className="rounded-md border border-[#dcd5c7] bg-white text-[#31443a]">
                    {question.match.coverageScorePercent}% portion coverage
                  </Badge>
                </div>
                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{question.subject}</p>
                <p className="mt-2 text-sm font-black leading-6 text-[#13251d]">{question.question.stem}</p>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Highest matched portion</p>
                    <p className="mt-1 text-xs font-black leading-5 text-[#31443a]">{question.match.highestMatchedPortion}</p>
                  </div>
                  <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Matched portions</p>
                    <p className="mt-1 text-xs font-black leading-5 text-[#31443a]">
                      {question.match.matchedPortionLabels.length ? question.match.matchedPortionLabels.join(", ") : "None"}
                    </p>
                  </div>
                  <div className="rounded-md border border-[#ef9f27] bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6f4a12]">Manual-check portions</p>
                    <p className="mt-1 text-xs font-black leading-5 text-[#31443a]">
                      {question.match.manualCheckPortionLabels.length ? question.match.manualCheckPortionLabels.join(", ") : "None"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {question.match.portionCoverage.map((portion) => (
                    <div
                      key={`match-accountability-portion-${question.number}-${portion.label}`}
                      data-testid="prelims-2026-match-accountability-api-portion"
                      data-coverage={portion.coverage}
                      className="rounded-md border border-[#dcd5c7] bg-white p-3"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">
                        {portion.label} / {portion.coverageLabel}
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#31443a]">{portion.text}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {portion.matchedSignals.length ? (
                          portion.matchedSignals.map((signal) => (
                            <mark key={`${question.number}-${portion.label}-${signal}`} className="rounded bg-[#fff4df] px-1.5 py-0.5 text-[#6f4a12]">
                              {signal}
                            </mark>
                          ))
                        ) : (
                          <span className="text-xs font-bold text-[#746f66]">Manual teacher check required</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-md border border-[#1d9e75] bg-white p-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#085041]">Next proof action</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#31443a]">{question.match.nextProofAction}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="prelims-2027-course-action-api-readiness"
          data-testid="prelims-2027-course-action-api-readiness"
          data-api-status={courseActionApi.status}
          data-version={courseActionApi.courseAction?.version ?? "pending"}
          data-priority-count={courseActionApi.courseAction?.summary.priorityCount ?? 0}
          data-critical-priority-count={courseActionApi.courseAction?.summary.criticalPriorityCount ?? 0}
          data-high-priority-count={courseActionApi.courseAction?.summary.highPriorityCount ?? 0}
          data-medium-priority-count={courseActionApi.courseAction?.summary.mediumPriorityCount ?? 0}
          data-low-priority-count={courseActionApi.courseAction?.summary.lowPriorityCount ?? 0}
          data-minimal-priority-count={courseActionApi.courseAction?.summary.minimalPriorityCount ?? 0}
          data-task-count={courseActionApi.courseAction?.summary.taskCount ?? 0}
          data-sprint-count={courseActionApi.courseAction?.summary.sprintCount ?? 0}
          data-practice-blueprint-count={courseActionApi.courseAction?.summary.practiceBlueprintCount ?? 0}
          data-format-rule-count={courseActionApi.courseAction?.summary.formatRuleCount ?? 0}
          data-reallocation-count={courseActionApi.courseAction?.summary.reallocationDecisionCount ?? 0}
          data-evidence-ledger-count={courseActionApi.courseAction?.summary.evidenceLedgerCount ?? 0}
          data-launch-step-count={courseActionApi.courseAction?.summary.launchStepCount ?? 0}
          data-phase-source={courseActionApi.courseAction?.summary.phaseCounts.Source ?? 0}
          data-phase-capsule={courseActionApi.courseAction?.summary.phaseCounts.Capsule ?? 0}
          data-phase-mcq={courseActionApi.courseAction?.summary.phaseCounts.MCQ ?? 0}
          data-phase-proof={courseActionApi.courseAction?.summary.phaseCounts.Proof ?? 0}
          data-phase-release={courseActionApi.courseAction?.summary.phaseCounts.Release ?? 0}
          data-phase-planner={courseActionApi.courseAction?.summary.phaseCounts.Planner ?? 0}
          data-preview-priority-count={courseActionPreviewPriorities.length}
          data-first-priority-id={courseActionPreviewPriorities[0]?.id ?? "pending"}
          data-first-priority-band={courseActionPreviewPriorities[0]?.priority ?? "pending"}
          data-first-task-count={courseActionPreviewPriorities[0]?.taskCount ?? 0}
          data-first-blueprint-count={courseActionPreviewPriorities[0]?.blueprintCount ?? 0}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">2027 course-action API readiness</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Validate the course correction before the portal consumes it</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This checkpoint reads the live 2027 course-action endpoint and confirms the priorities, sprint windows,
                execution tasks, practice blueprints, format rules and proof gates are available as one software contract.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyCourseActionEndpoint()}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-4 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition hover:bg-[#e7f5ee]"
            >
              <Clipboard className="mr-2 h-4 w-4" />
              {copiedCourseActionEndpoint ? "Endpoint copied" : "Copy course endpoint"}
            </button>
          </div>

          <div
            className={cn(
              "mb-4 rounded-lg border p-4 text-sm font-bold leading-6",
              courseActionApi.status === "ready"
                ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                : courseActionApi.status === "error"
                  ? "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]"
                  : "border-[#dcd5c7] bg-[#fdfaf3] text-[#5d675f]"
            )}
          >
            API mode: {courseActionApi.status} / {courseActionApi.message}
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
            <div className="grid gap-3">
              {[
                ["Endpoint", showcaseManifest.api.courseAction],
                ["Review command API", courseActionApi.courseAction?.api.reviewCommand ?? showcaseManifest.api.reviewCommand],
                ["Version", courseActionApi.courseAction?.version ?? "checking"],
                ["Public preview", `${showcaseManifest.publicRoute}#main-website-course-action-preview`],
                ["Software owner", courseActionApi.courseAction?.publicAnchor ?? `${showcaseManifest.publicRoute}#software-path`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 break-words text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Priorities",
                    value: String(courseActionApi.courseAction?.summary.priorityCount ?? 0),
                    detail: `${courseActionApi.courseAction?.summary.criticalPriorityCount ?? 0} critical / ${courseActionApi.courseAction?.summary.highPriorityCount ?? 0} high`,
                  },
                  {
                    label: "Execution tasks",
                    value: String(courseActionApi.courseAction?.summary.taskCount ?? 0),
                    detail: `${courseActionApi.courseAction?.summary.sprintCount ?? 0} sprint windows`,
                  },
                  {
                    label: "Practice plan",
                    value: String(courseActionApi.courseAction?.summary.practiceBlueprintCount ?? 0),
                    detail: `${courseActionApi.courseAction?.summary.formatRuleCount ?? 0} format rules`,
                  },
                  {
                    label: "Proof gates",
                    value: String(courseActionApi.courseAction?.summary.reallocationDecisionCount ?? 0),
                    detail: `${courseActionApi.courseAction?.summary.evidenceLedgerCount ?? 0} evidence rows`,
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                    <p className="text-2xl font-black tracking-tight text-[#13251d]">{item.value}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{item.label}</p>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#5d675f]">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-lg border border-[#dcd5c7] bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Proof policy from API</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#31443a]">
                    {courseActionApi.courseAction?.proofPolicy ?? "Waiting for the course-action endpoint to respond."}
                  </p>
                </div>
                <div className="rounded-lg border border-[#dcd5c7] bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Execution phase split</p>
                  <p className="mt-2 text-sm font-black leading-6 text-[#31443a]">
                    {courseActionApi.courseAction
                      ? strategyTaskPhaseOrder
                          .map((phase) => `${phase}: ${courseActionApi.courseAction?.summary.phaseCounts[phase] ?? 0}`)
                          .join(" / ")
                      : "Waiting for phase counts"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`${showcaseManifest.publicRoute}#main-website-course-action-preview`}
                  className="inline-flex min-h-10 items-center rounded-md border border-[#1d9e75] bg-[#e7f5ee] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
                >
                  Public course API preview <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
                <Link
                  href="#practice-blueprints"
                  className="inline-flex min-h-10 items-center rounded-md border border-[#ef9f27] bg-[#fff4df] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#6f4a12]"
                >
                  Practice blueprints <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {courseActionPreviewPriorities.map((priority) => (
              <article
                key={`course-action-api-${priority.id}`}
                data-testid="prelims-2027-course-action-api-priority"
                data-priority-id={priority.id}
                data-priority-band={priority.priority}
                data-task-count={priority.taskCount}
                data-blueprint-count={priority.blueprintCount}
                data-proof-status={priority.proofStatus}
                className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-md border border-[#1d9e75] bg-[#e7f5ee] text-[#085041]">
                    {priority.priority}
                  </Badge>
                  <Badge className="rounded-md border border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]">
                    {priority.window}
                  </Badge>
                  <Badge className="rounded-md border border-[#dcd5c7] bg-white text-[#31443a]">
                    {priority.proofStatus}
                  </Badge>
                </div>
                <h3 className="mt-3 text-lg font-black tracking-tight text-[#13251d]">{priority.subject}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{priority.action}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <p className="rounded-md border border-[#dcd5c7] bg-white p-3 text-xs font-black uppercase tracking-[0.1em] text-[#31443a]">
                    {priority.taskCount} tasks / {priority.blueprintCount} blueprints
                  </p>
                  <p className="rounded-md border border-[#dcd5c7] bg-white p-3 text-xs font-black uppercase tracking-[0.1em] text-[#31443a]">
                    {priority.ownerSurface}
                  </p>
                </div>
                <p className="mt-3 rounded-md border border-[#dcd5c7] bg-white p-3 text-xs font-semibold leading-5 text-[#31443a]">
                  Release gate: {priority.releaseGate}
                </p>
                <p className="mt-2 rounded-md border border-[#dcd5c7] bg-white p-3 text-xs font-semibold leading-5 text-[#31443a]">
                  Next proof action: {priority.nextProofAction}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="prelims-2026-source-archive-summary-api-readiness"
          data-testid="prelims-2026-source-archive-summary-api-readiness"
          data-api-status={sourceArchiveSummaryApi.status}
          data-version={sourceArchiveSummaryApi.summary?.version ?? "pending"}
          data-root-connected={String(sourceArchiveSummaryApi.summary?.scan.rootConnected ?? false)}
          data-total-files={sourceArchiveSummaryApi.summary?.scan.totalFiles ?? 0}
          data-total-directories={sourceArchiveSummaryApi.summary?.scan.totalDirectories ?? 0}
          data-total-bytes={sourceArchiveSummaryApi.summary?.scan.totalBytes ?? 0}
          data-pdf-count={sourceArchiveSummaryApi.summary?.scan.pdfCount ?? 0}
          data-docx-count={sourceArchiveSummaryApi.summary?.scan.docxCount ?? 0}
          data-image-count={sourceArchiveSummaryApi.summary?.scan.imageCount ?? 0}
          data-extension-type-count={sourceArchiveSummaryApi.summary?.scan.extensionTypeCount ?? 0}
          data-folder-bucket-count={sourceArchiveSummaryApi.summary?.scan.folderBucketCount ?? 0}
          data-track-count={sourceArchiveSummaryApi.summary?.scan.trackCount ?? 0}
          data-rendered-track-count={sourceArchiveSummaryPreviewTracks.length}
          data-rendered-folder-count={sourceArchiveSummaryPreviewFolders.length}
          data-rendered-extension-count={sourceArchiveSummaryPreviewExtensions.length}
          data-strongest-track-id={sourceArchiveSummaryApi.summary?.scan.strongestTrackId ?? "pending"}
          data-proof-policy="sanitized-summary-no-raw-paths"
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Source archive summary API readiness</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Validate the archive summary before the main website uses it</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This checkpoint reads the safe archive-summary endpoint: public pages receive counts, track decisions
                and rebuild actions, while raw file names, folder paths and page-level proof stay inside the operator portal.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copySourceArchiveSummaryEndpoint()}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-4 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition hover:bg-[#e7f5ee]"
            >
              <Clipboard className="mr-2 h-4 w-4" />
              {copiedSourceArchiveSummaryEndpoint ? "Endpoint copied" : "Copy archive endpoint"}
            </button>
          </div>

          <div
            className={cn(
              "mb-4 rounded-lg border p-4 text-sm font-bold leading-6",
              sourceArchiveSummaryApi.status === "ready"
                ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                : sourceArchiveSummaryApi.status === "error"
                  ? "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]"
                  : "border-[#dcd5c7] bg-[#fdfaf3] text-[#5d675f]"
            )}
          >
            API mode: {sourceArchiveSummaryApi.status} / {sourceArchiveSummaryApi.message}
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
            <div className="grid gap-3">
              {[
                ["Endpoint", sourceArchiveSummaryApi.summary?.api.sourceArchiveSummary ?? showcaseManifest.api.sourceArchiveSummary],
                ["Version", sourceArchiveSummaryApi.summary?.version ?? "checking"],
                ["Public preview", sourceArchiveSummaryApi.summary?.publicAnchor ?? `${showcaseManifest.publicRoute}#source-archive-summary`],
                ["Internal source intake", sourceArchiveSummaryApi.summary?.internalIntakeRoute ?? "/upsc/source-library#upsc-morning-batch-archive-intake"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 break-words text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Files scanned",
                    value: String(sourceArchiveSummaryApi.summary?.scan.totalFiles ?? 0),
                    detail: `${sourceArchiveSummaryApi.summary?.scan.totalDirectories ?? 0} folders`,
                  },
                  {
                    label: "PDF base",
                    value: String(sourceArchiveSummaryApi.summary?.scan.pdfCount ?? 0),
                    detail: `${sourceArchiveSummaryApi.summary?.scan.docxCount ?? 0} DOCX / ${sourceArchiveSummaryApi.summary?.scan.imageCount ?? 0} images`,
                  },
                  {
                    label: "Archive size",
                    value: formatArchiveBytes(sourceArchiveSummaryApi.summary?.scan.totalBytes ?? 0),
                    detail: `${sourceArchiveSummaryApi.summary?.scan.extensionTypeCount ?? 0} file types`,
                  },
                  {
                    label: "Tracks",
                    value: String(sourceArchiveSummaryApi.summary?.scan.trackCount ?? 0),
                    detail: sourceArchiveSummaryApi.summary?.scan.strongestTrackLabel ?? "Waiting for strongest track",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                    <p className="text-2xl font-black tracking-tight text-[#13251d]">{item.value}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{item.label}</p>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#5d675f]">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-lg border border-[#dcd5c7] bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Proof boundary from API</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#31443a]">
                    {sourceArchiveSummaryApi.summary?.proofPolicy ?? "Waiting for the archive summary proof boundary."}
                  </p>
                </div>
                <div className="rounded-lg border border-[#dcd5c7] bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Scan message</p>
                  <p className="mt-2 text-sm font-black leading-6 text-[#31443a]">
                    {sourceArchiveSummaryApi.summary?.scan.message || "Waiting for scan message"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={sourceArchiveSummaryApi.summary?.publicAnchor ?? `${showcaseManifest.publicRoute}#source-archive-summary`}
                  className="inline-flex min-h-10 items-center rounded-md border border-[#1d9e75] bg-[#e7f5ee] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
                >
                  Public archive preview <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
                <Link
                  href={sourceArchiveSummaryApi.summary?.internalIntakeRoute ?? "/upsc/source-library#upsc-morning-batch-archive-intake"}
                  className="inline-flex min-h-10 items-center rounded-md border border-[#ef9f27] bg-[#fff4df] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#6f4a12]"
                >
                  Open source intake <FileSearch className="ml-2 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="grid gap-3">
              {sourceArchiveSummaryPreviewTracks.map((track) => (
                <article
                  key={`strategy-source-archive-summary-track-${track.id}`}
                  data-testid="prelims-2026-source-archive-summary-track"
                  data-track-id={track.id}
                  data-decision={track.decision}
                  data-hit-count={track.hitCount}
                  data-sample-count={track.sampleCount}
                  className="grid gap-3 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 md:grid-cols-[0.7fr_0.5fr_1fr] md:items-start"
                >
                  <div>
                    <p className="text-sm font-black text-[#13251d]">{track.label}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#746f66]">{track.id}</p>
                  </div>
                  <div>
                    <Badge className={cn("rounded-md border", reallocationDecisionTone(track.decision))}>
                      {track.decision}
                    </Badge>
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.1em] text-[#31443a]">
                      {track.hitCount} hits / {track.sampleCount} samples
                    </p>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-[#5d675f]">{track.nextAction}</p>
                </article>
              ))}
            </div>

            <div className="grid gap-4">
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Top public folder buckets</p>
                <div className="mt-3 grid gap-2">
                  {sourceArchiveSummaryPreviewFolders.map((folder) => (
                    <div
                      key={`strategy-source-summary-folder-${folder.name}`}
                      data-testid="prelims-2026-source-archive-summary-folder"
                      data-folder-name={folder.name}
                      data-file-count={folder.fileCount}
                      className="flex items-center justify-between gap-3 rounded-md border border-[#dcd5c7] bg-white p-3"
                    >
                      <span className="min-w-0 break-words text-xs font-bold text-[#31443a]">{folder.name}</span>
                      <span className="text-xs font-black text-[#13251d]">{folder.fileCount}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">File type summary</p>
                <div className="mt-3 grid gap-2">
                  {sourceArchiveSummaryPreviewExtensions.map((extension) => (
                    <div
                      key={`strategy-source-summary-extension-${extension.extension}`}
                      data-testid="prelims-2026-source-archive-summary-extension"
                      data-extension={extension.extension}
                      data-count={extension.count}
                      className="flex items-center justify-between gap-3 rounded-md border border-[#dcd5c7] bg-white p-3"
                    >
                      <span className="text-xs font-black uppercase tracking-[0.1em] text-[#31443a]">{extension.extension || "none"}</span>
                      <span className="text-xs font-black text-[#13251d]">{extension.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="prelims-2026-public-proof-feed"
          data-testid="prelims-2026-public-proof-feed"
          data-claim-count={publicProofFeed.releasedClaims.length}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Public proof feed</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Structured claim data for the main website</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This JSON feed exposes the same released claims with complete question text, matched portions, proof
                references and teacher notes, so the main website can render verified claim cards later.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[24rem]">
              <button
                type="button"
                onClick={() => void copyPublicProofFeed()}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-4 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition hover:bg-[#e7f5ee]"
              >
                <Clipboard className="mr-2 h-4 w-4" />
                {copiedProofFeed ? "Feed copied" : "Copy proof feed"}
              </button>
              <button
                type="button"
                onClick={() => void publishPublicProofFeed()}
                disabled={feedApiStatus === "saving"}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1d9e75] bg-[#1d9e75] px-4 text-xs font-black uppercase tracking-[0.1em] text-white transition hover:bg-[#126245] disabled:cursor-wait disabled:opacity-70"
              >
                <FileCheck2 className="mr-2 h-4 w-4" />
                {feedApiStatus === "saving" ? "Publishing" : "Publish feed"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="grid gap-3">
              {[
                ["Feed version", publicProofFeed.version.replace("upsc-prelims-2026-", "")],
                ["Released claims", publicProofFeed.releasedClaims.length],
                ["Coverage basis", "74/97"],
                ["Last update", formatProofFeedUpdateLabel(publicProofFeed.lastUpdatedAt)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 break-words text-lg font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
            <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 text-xs font-semibold leading-6 text-[#31443a] md:text-sm">
              {publicProofFeedJson}
            </pre>
          </div>
          <div
            data-testid="prelims-2026-public-proof-feed-api-status"
            data-api-status={feedApiStatus}
            data-api-mode={feedApiMode ?? "not-published"}
            className={cn(
              "mt-4 rounded-lg border p-4 text-sm font-bold leading-6",
              feedApiStatus === "saved"
                ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                : feedApiStatus === "error"
                  ? "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]"
                  : "border-[#dcd5c7] bg-[#fdfaf3] text-[#5d675f]"
            )}
          >
            API mode: {feedApiMode ?? "not published"} / {feedApiMessage}
          </div>
          <div
            data-testid="prelims-2026-public-proof-feed-live-api"
            data-api-status={publicProofFeedApi.status}
            data-api-mode={publicProofFeedApiPayload?.mode ?? "checking"}
            data-live-claim-count={publicProofFeedApiPayload?.claimCount ?? 0}
            data-local-claim-count={publicProofFeed.releasedClaims.length}
            data-feed-in-sync={publicProofFeedEndpointInSync ? "true" : "false"}
            className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                  Live API checkpoint
                </p>
                <h3 className="mt-1 text-lg font-black tracking-tight text-[#13251d]">
                  Public feed endpoint vs local approval draft
                </h3>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                  This check reads the endpoint the main website will consume and compares it with the approved proof
                  packets currently selected in this browser.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void refreshPublicProofFeedApi()}
                disabled={publicProofFeedApi.status === "loading"}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition hover:bg-[#e7f5ee] disabled:cursor-wait disabled:opacity-70"
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                {publicProofFeedApi.status === "loading" ? "Checking" : "Refresh endpoint"}
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ["Endpoint", "/api/upsc/prelims-2026/public-proof-feed"],
                ["Live mode", publicProofFeedApiPayload?.mode ?? publicProofFeedApi.status],
                ["Live claims", publicProofFeedApiPayload?.claimCount ?? 0],
                ["Local draft", publicProofFeed.releasedClaims.length],
                ["Sync", publicProofFeedEndpointInSync ? "In sync" : "Needs publish"],
                ["Persistence", publicProofFeedPersistenceLabel],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#dcd5c7] bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 break-words text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>

            <p
              className={cn(
                "mt-3 rounded-md border p-3 text-sm font-bold leading-6",
                publicProofFeedEndpointInSync
                  ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                  : publicProofFeedApi.status === "error"
                    ? "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]"
                    : "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]"
              )}
            >
              {publicProofFeedApi.message}
            </p>
          </div>
        </section>

        <section id="prelims-2026-public-claim-release-board" data-testid="prelims-2026-public-claim-release-board" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Public claim release board</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Only approved proof packets become website-safe claims</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This board is the final release filter between internal MCQ matching and the main website. A claim appears
                here only after the question is approved and its source, page/location, teacher note and public claim line are complete.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[36rem]">
              {[
                ["Ready claims", publicClaimReleaseTotals.readyClaims],
                ["Subjects", publicClaimReleaseTotals.subjects],
                ["Direct", publicClaimReleaseTotals.direct],
                ["Partial", publicClaimReleaseTotals.partial],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {publicClaimReleaseRows.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {publicClaimReleaseRows.map((row) => (
                <article
                  key={`release-${row.question.number}`}
                  data-testid="prelims-2026-public-claim-row"
                  data-question-number={row.question.number}
                  data-audit-status={row.question.status}
                  className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#13251d] text-xs font-black text-white">
                          Q{row.question.number}
                        </span>
                        <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", auditStatusTone(row.question.status))}>
                          {row.question.statusLabel}
                        </span>
                        <span className="rounded-md border border-[#1d9e75] bg-[#e7f5ee] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">
                          Release ready
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-black tracking-tight text-[#13251d]">{row.question.subject}</h3>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#746f66]">
                        {row.matchedPortions} matched / {row.pendingPortions} manual
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyReleaseClaim(row)}
                      className="inline-flex min-h-10 items-center rounded-md border border-[#1d9e75] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
                    >
                      <Clipboard className="mr-2 h-3.5 w-3.5" />
                      {copiedReleaseId === String(row.question.number) ? "Copied" : "Copy claim"}
                    </button>
                  </div>

                  <p className="mt-4 rounded-md border border-[#dcd5c7] bg-white p-3 text-sm font-black leading-6 text-[#31443a]">
                    {row.packet.publicClaim}
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Proof retained</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">
                        {row.packet.sourceRef} / {row.packet.pageRef}
                      </p>
                    </div>
                    <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Question logic</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">{row.question.formatLabel}</p>
                    </div>
                  </div>
                  <p className="mt-3 rounded-md border border-[#dcd5c7] bg-white p-3 text-sm font-semibold leading-6 text-[#5d675f]">
                    {row.packet.teacherNote}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#6f4a12]">No public claims released yet</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                Complete a proof packet in the question proof queue and approve it to make it available here.
              </p>
            </div>
          )}
        </section>

        <section
          id="prelims-2026-archive-proof-triage"
          data-testid="prelims-2026-archive-proof-triage"
          data-source-status={sourceArchiveStatus}
          data-candidate-rows={archiveProofTriageTotals.rowsWithCandidates}
          data-needs-proof-with-candidates={archiveProofTriageTotals.needsProofWithCandidates}
          data-blind-spots={archiveProofTriageTotals.blindSpots}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Archive proof triage</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Find which MCQs already have source-file candidates</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This board scans all 100 MCQ evidence rows against the Morning Batch archive. Use it to decide which
                proof packets can be completed quickly and which questions still need manual archive research.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[40rem]">
              {[
                ["Source status", sourceArchiveStatus],
                ["With files", archiveProofTriageTotals.rowsWithCandidates],
                ["Needs proof", archiveProofTriageTotals.needsProofWithCandidates],
                ["Blind spots", archiveProofTriageTotals.blindSpots],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 break-words text-2xl font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {sourceArchiveStatus === "loading" ? (
            <p className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-5 text-sm font-bold text-[#5d675f]">
              Loading archive triage from the local source intake...
            </p>
          ) : archiveProofTriageRows.length ? (
            <div className="grid gap-3">
              {archiveProofTriageRows.slice(0, 14).map((row) => (
                <article
                  key={`archive-triage-${row.question.number}`}
                  data-testid="prelims-2026-archive-triage-row"
                  data-question-number={row.question.number}
                  data-proof-decision={row.decision}
                  data-candidate-count={row.archiveFiles.length}
                  data-top-source={row.topFile?.relativePath ?? ""}
                  className="grid gap-4 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 xl:grid-cols-[0.72fr_1.08fr_0.9fr] xl:items-start"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#13251d] text-xs font-black text-white">
                        Q{row.question.number}
                      </span>
                      <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", questionProofDecisionTone(row.decision))}>
                        {row.decision}
                      </span>
                      <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", row.archiveFiles.length ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]" : "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]")}>
                        {row.archiveFiles.length ? `${row.archiveFiles.length} candidates` : "No candidate"}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-black tracking-tight text-[#13251d]">{row.question.subject}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{row.question.stemPreview}</p>
                  </div>

                  <div className="min-w-0 rounded-md border border-[#dcd5c7] bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Top archive source</p>
                    {row.topFile ? (
                      <>
                        <p className="mt-2 break-words text-sm font-black leading-6 text-[#13251d]">{row.topFile.name}</p>
                        <p className="mt-1 break-words text-xs font-semibold leading-5 text-[#5d675f]">{row.topFile.relativePath}</p>
                        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">
                          {row.topFile.extension} / {formatArchiveBytes(row.topFile.sizeBytes)} / {formatArchiveDate(row.topFile.lastModified)}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#6f4a12]">
                        No candidate file matched from the archive intake yet.
                      </p>
                    )}
                  </div>

                  <div className="grid min-w-0 gap-3">
                    <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Matched tracks</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {row.archiveTracks.length ? (
                          row.archiveTracks.slice(0, 3).map((track) => (
                            <span key={`${row.question.number}-${track.id}`} className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em]", reallocationDecisionTone(track.decision))}>
                              {track.label}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#746f66]">
                            Manual search
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href="#prelims-2026-question-proof-queue"
                      onClick={() => setSelectedProofQuestionNumber(row.question.number)}
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
                    >
                      Open proof editor <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-[#ef9f27] bg-[#fff4df] p-5 text-sm font-bold leading-6 text-[#6f4a12]">
              Archive triage is not available yet. Open the source intake page and confirm the Morning Batch archive is connected.
            </p>
          )}
        </section>

        <section
          id="prelims-2026-archive-blind-spot-remediation"
          data-testid="prelims-2026-archive-blind-spot-remediation"
          data-blind-spot-count={archiveBlindSpotRows.length}
          data-needs-proof-count={archiveBlindSpotTotals.needsProof}
          data-build-gap-count={archiveBlindSpotTotals.buildGaps}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#d95f43]">Archive blind-spot remediation</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Turn no-source MCQs into explicit 2027 build actions</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                These questions did not match any current Morning Batch archive file. Keep them out of public claims,
                mark them as build gaps where needed, and create source rows or new module work before 2027.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 xl:min-w-[28rem]">
              {[
                ["Blind spots", archiveBlindSpotRows.length],
                ["Needs proof", archiveBlindSpotTotals.needsProof],
                ["Build gaps", archiveBlindSpotTotals.buildGaps],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#d95f43]">{label}</p>
                  <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {archiveBlindSpotRows.length ? (
            <div className="grid gap-3">
              {archiveBlindSpotRows.map((row) => (
                <article
                  key={`archive-blind-spot-${row.question.number}`}
                  data-testid="prelims-2026-archive-blind-spot-row"
                  data-question-number={row.question.number}
                  data-proof-decision={row.decision}
                  data-work-order-status={
                    sourceGapWorkOrders[sourceGapWorkOrderId(row.question.number)]?.status ?? "Not queued"
                  }
                  className="grid gap-4 rounded-lg border border-[#ef9f27] bg-[#fff4df] p-4 xl:grid-cols-[0.75fr_1.05fr_0.9fr] xl:items-start"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#13251d] text-xs font-black text-white">
                        Q{row.question.number}
                      </span>
                      <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", questionProofDecisionTone(row.decision))}>
                        {row.decision}
                      </span>
                      <span className="rounded-md border border-[#ef9f27] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#6f4a12]">
                        No archive candidate
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-black tracking-tight text-[#13251d]">{row.question.subject}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{row.question.stemPreview}</p>
                  </div>

                  <div className="grid min-w-0 gap-3">
                    <div className="rounded-md border border-[#ef9f27] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#d95f43]">Current evidence read</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">{row.question.sourceLead}</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{row.question.conceptLead}</p>
                    </div>
                    <div className="rounded-md border border-[#ef9f27] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#d95f43]">Remediation rule</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">
                        Do not release a public question-level claim. Either create a new source row in the archive or
                        keep this MCQ as a documented 2027 build gap.
                      </p>
                    </div>
                  </div>

                  <div className="grid min-w-0 gap-2">
                    <button
                      type="button"
                      data-testid="prelims-2026-queue-source-work"
                      onClick={() => setSourceGapWorkOrderStatus(row.question, "Queued")}
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#d95f43] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#9d3824] transition hover:bg-[#fff0ec]"
                    >
                      Queue source work
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionProofDecision(row.question.number, "Build gap")}
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#1f5d8f] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#1f5d8f] transition hover:bg-[#eef5ff]"
                    >
                      Mark build gap
                    </button>
                    <Link
                      href="#prelims-2026-question-proof-queue"
                      onClick={() => setSelectedProofQuestionNumber(row.question.number)}
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
                    >
                      Open proof editor <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/upsc/source-library#upsc-morning-batch-archive-intake"
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#d95f43] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#9d3824]"
                    >
                      Open source intake <FileSearch className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-[#1d9e75] bg-[#e7f5ee] p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#085041]">No blind spots in current scan</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                Every current MCQ row has at least one archive source candidate. Continue page-level proof review before public release.
              </p>
            </div>
          )}
        </section>

        <section
          id="prelims-2026-source-gap-work-orders"
          data-testid="prelims-2026-source-gap-work-orders"
          data-source-status={sourceArchiveStatus}
          data-blind-spot-count={sourceGapWorkOrderTotals.blindSpots}
          data-work-order-count={sourceGapWorkOrderTotals.workOrders}
          data-unqueued-count={sourceGapWorkOrderTotals.unqueued}
          data-drafted-count={sourceGapWorkOrderTotals.drafted}
          data-resolved-count={sourceGapWorkOrderTotals.resolved}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5 grid gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#d95f43]">Source-gap work orders</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Convert no-source MCQs into owned archive and content tasks</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This board turns every archive blind spot into a concrete 2027 action: create or rename a source row,
                draft the missing proof location, then resolve only when the MCQ can re-enter the proof queue.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                ["Blind spots", sourceGapWorkOrderTotals.blindSpots],
                ["Queued", sourceGapWorkOrderTotals.queued],
                ["Unqueued", sourceGapWorkOrderTotals.unqueued],
                ["Drafted", sourceGapWorkOrderTotals.drafted],
                ["Resolved", sourceGapWorkOrderTotals.resolved],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#d95f43]">{label}</p>
                  <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {sourceArchiveStatus === "loading" ? (
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#6f4a12]">Archive scan loading</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                Source-gap work orders will appear after the Morning Batch archive scan finishes. No MCQ is marked as a
                no-source gap while candidate files are still loading.
              </p>
            </div>
          ) : sourceArchiveStatus === "error" ? (
            <div className="rounded-lg border border-[#d95f43] bg-[#fff0ec] p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#9d3824]">Archive scan unavailable</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#6b463c]">
                The source archive must be connected before no-source MCQ work orders can be generated. Open the source
                intake route, reconnect the archive, then return to this board.
              </p>
              <Link
                href="/upsc/source-library#upsc-morning-batch-archive-intake"
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md border border-[#d95f43] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#9d3824]"
              >
                Open source intake <FileSearch className="ml-2 h-3.5 w-3.5" />
              </Link>
            </div>
          ) : sourceGapWorkOrderRows.length ? (
            <div className="grid gap-3">
              {sourceGapWorkOrderRows.map((row) => {
                const status = row.workOrder?.status ?? "Not queued";

                return (
                  <article
                    key={`source-gap-work-order-${row.question.number}`}
                    data-testid="prelims-2026-source-gap-work-order-row"
                    data-question-number={row.question.number}
                    data-work-order-status={status}
                    className="grid gap-4 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 xl:grid-cols-[0.72fr_1.08fr_0.95fr] xl:items-start"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#13251d] text-xs font-black text-white">
                          Q{row.question.number}
                        </span>
                        <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", sourceGapWorkOrderTone(status))}>
                          {status}
                        </span>
                        <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", questionProofDecisionTone(row.decision))}>
                          {row.decision}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-black tracking-tight text-[#13251d]">{row.question.subject}</h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{row.question.stemPreview}</p>
                    </div>

                    <div className="grid min-w-0 gap-3">
                      <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#d95f43]">Source action</p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">{row.displayOrder.sourceAction}</p>
                      </div>
                      <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#d95f43]">Public rule</p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-[#5d675f]">{row.displayOrder.publicRule}</p>
                      </div>
                    </div>

                    <div className="grid min-w-0 gap-3">
                      <button
                        type="button"
                        data-testid="prelims-2026-source-gap-queue-button"
                        onClick={() => setSourceGapWorkOrderStatus(row.question, "Queued")}
                        className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#d95f43] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#9d3824] transition hover:bg-[#fff0ec]"
                      >
                        {row.workOrder ? "Refresh source work" : "Queue source work"}
                      </button>
                      {row.workOrder ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1">
                          {sourceGapWorkOrderStatusOptions.map((option) => (
                            <button
                              key={`${row.question.number}-${option}`}
                              type="button"
                              data-testid={`prelims-2026-source-gap-status-${option.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                              aria-pressed={row.workOrder?.status === option}
                              onClick={() => setSourceGapWorkOrderStatus(row.question, option)}
                              className={cn(
                                "inline-flex min-h-10 items-center justify-center rounded-md border px-2 text-[10px] font-black uppercase tracking-[0.08em] transition",
                                row.workOrder?.status === option
                                  ? sourceGapWorkOrderTone(option)
                                  : "border-[#dcd5c7] bg-white text-[#746f66] hover:border-[#d95f43]"
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-md border border-[#ef9f27] bg-[#fff4df] p-3 text-xs font-bold leading-5 text-[#6f4a12]">
                          Queue this item before assigning source-row drafting or resolving the gap.
                        </p>
                      )}
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                        <Link
                          href="#prelims-2026-question-proof-queue"
                          onClick={() => setSelectedProofQuestionNumber(row.question.number)}
                          className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
                        >
                          Proof queue <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href="/upsc/source-library#upsc-morning-batch-archive-intake"
                          className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#d95f43] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#9d3824]"
                        >
                          Source intake <FileSearch className="ml-2 h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-[#1d9e75] bg-[#e7f5ee] p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#085041]">No source-gap work orders needed</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                The archive triage currently has source candidates for every MCQ row. Continue exact page proof review
                before releasing any question-level claim.
              </p>
            </div>
          )}
        </section>

        <section id="prelims-2026-question-proof-queue" data-testid="prelims-2026-question-proof-queue" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">2026 question proof queue</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Review every MCQ match before it becomes a public claim</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This queue reads the same full MCQ evidence used on the public page and gives the operator a decision
                state for each question: proof needed, approved, rejected or accepted as a build gap.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:min-w-[34rem]">
              {[
                ["Candidate claims", `${questionProofTotals.approvedWithPacket}/${questionProofTotals.candidateClaims}`],
                ["Unlock", `${questionProofTotals.unlockPercent}%`],
                ["Needs proof", questionProofTotals.needsProof],
                ["Approved", questionProofTotals.approved],
                ["Packets", questionProofTotals.packetsComplete],
                ["Missing packet", questionProofTotals.approvedMissingPacket],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {selectedProofRow ? (
            <div
              data-testid="prelims-2026-proof-packet-editor"
              data-selected-question={selectedProofRow.question.number}
              data-packet-complete={proofPacketComplete(selectedProofPacket) ? "true" : "false"}
              className="mb-5 grid gap-4 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 lg:grid-cols-[0.8fr_1.2fr]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#13251d] text-xs font-black text-white">
                    Q{selectedProofRow.question.number}
                  </span>
                  <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", questionProofDecisionTone(selectedProofRow.decision))}>
                    {selectedProofRow.decision}
                  </span>
                  <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", proofPacketComplete(selectedProofPacket) ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]" : "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]")}>
                    {proofPacketComplete(selectedProofPacket) ? "Packet complete" : "Packet pending"}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-black tracking-tight text-[#13251d]">{selectedProofRow.question.subject}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{selectedProofRow.question.stemPreview}</p>
                <p className="mt-3 rounded-md border border-[#dcd5c7] bg-white p-3 text-sm font-bold leading-6 text-[#31443a]">
                  {selectedProofRow.question.matchScope}
                </p>
              </div>

              <div className="grid min-w-0 gap-3">
                <div
                  data-testid="prelims-2026-archive-candidate-panel"
                  data-source-status={sourceArchiveStatus}
                  data-track-count={selectedArchiveCandidates.tracks.length}
                  data-candidate-count={selectedArchiveCandidates.files.length}
                  className="rounded-lg border border-[#dcd5c7] bg-white p-4"
                >
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                        Archive source candidates
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[#5d675f]">
                        Candidate files from the Morning Batch archive. Use one to prefill the source reference, then
                        verify the exact page or slide manually before approval.
                      </p>
                    </div>
                    <Link
                      href="/upsc/source-library#upsc-morning-batch-archive-intake"
                      className="inline-flex min-h-9 items-center rounded-md border border-[#1d9e75] bg-[#e7f5ee] px-3 text-[10px] font-black uppercase tracking-[0.1em] text-[#085041]"
                    >
                      Intake <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {sourceArchiveStatus === "loading" ? (
                    <p className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-3 text-xs font-bold text-[#5d675f]">
                      Loading archive candidates...
                    </p>
                  ) : selectedArchiveCandidates.files.length ? (
                    <div className="grid gap-2">
                      <div className="flex flex-wrap gap-2">
                        {selectedArchiveCandidates.tracks.map((track) => (
                          <span key={`${selectedProofRow.question.number}-${track.id}`} className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em]", reallocationDecisionTone(track.decision))}>
                            {track.label}: {track.hitCount}
                          </span>
                        ))}
                      </div>
                      {selectedArchiveCandidates.files.map((file) => (
                        <article
                          key={`${selectedProofRow.question.number}-${file.relativePath}`}
                          data-testid="prelims-2026-archive-candidate-row"
                          data-source-path={file.relativePath}
                          className="grid gap-3 rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-3 md:grid-cols-[1fr_auto] md:items-center"
                        >
                          <div className="min-w-0">
                            <p className="break-words text-sm font-black text-[#13251d]">{file.name}</p>
                            <p className="mt-1 break-words text-xs font-semibold leading-5 text-[#5d675f]">
                              {file.relativePath}
                            </p>
                            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">
                              {file.extension} / {formatArchiveBytes(file.sizeBytes)} / {formatArchiveDate(file.lastModified)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => useArchiveCandidateForProof(file)}
                            className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-3 text-[10px] font-black uppercase tracking-[0.1em] text-[#085041] transition hover:bg-[#e7f5ee]"
                          >
                            Use source
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-md border border-[#ef9f27] bg-[#fff4df] p-3 text-xs font-bold leading-5 text-[#6f4a12]">
                      No archive candidate matched this question yet. Use the source intake page to add clearer file
                      names or subject folders, then rescan.
                    </p>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Source reference</span>
                    <input
                      value={selectedProofPacket.sourceRef}
                      onChange={(event) => updateProofPacket(selectedProofRow.question.number, { sourceRef: event.target.value })}
                      className="min-h-11 rounded-md border border-[#dcd5c7] bg-white px-3 text-sm font-bold text-[#13251d] outline-none focus:border-[#1d9e75]"
                      placeholder={selectedProofRow.question.sourceLead}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Page or location</span>
                    <input
                      value={selectedProofPacket.pageRef}
                      onChange={(event) => updateProofPacket(selectedProofRow.question.number, { pageRef: event.target.value })}
                      className="min-h-11 rounded-md border border-[#dcd5c7] bg-white px-3 text-sm font-bold text-[#13251d] outline-none focus:border-[#1d9e75]"
                      placeholder="Page, slide, timestamp or file section"
                    />
                  </label>
                </div>
                <label className="grid gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Teacher note</span>
                  <textarea
                    value={selectedProofPacket.teacherNote}
                    onChange={(event) => updateProofPacket(selectedProofRow.question.number, { teacherNote: event.target.value })}
                    className="min-h-24 rounded-md border border-[#dcd5c7] bg-white p-3 text-sm font-bold leading-6 text-[#13251d] outline-none focus:border-[#1d9e75]"
                    placeholder="Why this source makes the MCQ answerable, or why it remains only conceptual."
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Public claim line</span>
                  <textarea
                    value={selectedProofPacket.publicClaim}
                    onChange={(event) => updateProofPacket(selectedProofRow.question.number, { publicClaim: event.target.value })}
                    className="min-h-20 rounded-md border border-[#dcd5c7] bg-white p-3 text-sm font-bold leading-6 text-[#13251d] outline-none focus:border-[#1d9e75]"
                    placeholder="Short claim that can be used only after proof review."
                  />
                </label>
                <button
                  type="button"
                  disabled={!proofPacketComplete(selectedProofPacket)}
                  onClick={() => setQuestionProofDecision(selectedProofRow.question.number, "Approved")}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-xs font-black uppercase tracking-[0.1em] transition",
                    proofPacketComplete(selectedProofPacket)
                      ? "border border-[#1d9e75] bg-[#1d9e75] text-white hover:bg-[#126245]"
                      : "cursor-not-allowed border border-[#dcd5c7] bg-white text-[#9b9489]"
                  )}
                >
                  Approve with packet
                </button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3">
            {questionProofRows.map(({ question, decision, packetComplete, matchedPortions, pendingPortions }) => (
              <article
                key={question.number}
                data-testid="prelims-2026-question-proof-row"
                data-question-number={question.number}
                data-audit-status={question.status}
                data-proof-decision={decision}
                data-proof-packet-complete={packetComplete ? "true" : "false"}
                className="grid gap-4 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 xl:grid-cols-[0.72fr_1.15fr_0.9fr] xl:items-start"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#13251d] text-xs font-black text-white">
                      Q{question.number}
                    </span>
                    <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", auditStatusTone(question.status))}>
                      {question.statusLabel}
                    </span>
                    <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", questionProofDecisionTone(decision))}>
                      {decision}
                    </span>
                    <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", packetComplete ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]" : "border-[#dcd5c7] bg-white text-[#746f66]")}>
                      {packetComplete ? "Packet" : "No packet"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-black tracking-tight text-[#13251d]">{question.subject}</h3>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#746f66]">
                    Score {Math.round(question.bestScore * 100)} / {question.formatLabel}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Matched</p>
                      <p className="mt-1 text-xl font-black text-[#13251d]">{matchedPortions.length}</p>
                    </div>
                    <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6f4a12]">Manual</p>
                      <p className="mt-1 text-xl font-black text-[#13251d]">{pendingPortions.length}</p>
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-6 text-[#31443a]">{question.stemPreview}</p>
                  <p className="mt-3 rounded-md border border-[#dcd5c7] bg-white p-3 text-sm font-bold leading-6 text-[#31443a]">
                    {question.matchScope}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {question.statementCoverage.slice(0, 4).map((coverage) => (
                      <div key={`${question.number}-${coverage.label}`} className="rounded-md border border-[#dcd5c7] bg-white p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">{coverage.label}</p>
                          <span className="rounded-md bg-[#f7f4ee] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#746f66]">
                            {coverage.coverageLabel}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-bold leading-5 text-[#5d675f]">
                          {coverage.matchedSignals.length ? coverage.matchedSignals.join(", ") : "No searchable hit"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid min-w-0 gap-3">
                  <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Source lead</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#31443a]">{question.sourceLead}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {questionProofOptions.map((option) => (
                      <button
                        key={`${question.number}-${option}`}
                        type="button"
                        onClick={() => setQuestionProofDecision(question.number, option)}
                        className={cn(
                          "min-h-10 rounded-md border px-2 text-[10px] font-black uppercase tracking-[0.08em] transition",
                          decision === option
                            ? questionProofDecisionTone(option)
                            : "border-[#dcd5c7] bg-white text-[#746f66] hover:border-[#1d9e75]"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProofQuestionNumber(question.number)}
                    className={cn(
                      "inline-flex min-h-10 items-center justify-center rounded-md border px-3 text-xs font-black uppercase tracking-[0.1em]",
                      selectedProofQuestionNumber === question.number
                        ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                        : "border-[#dcd5c7] bg-white text-[#31443a]"
                    )}
                  >
                    Edit proof packet
                  </button>
                  <Link
                    href={`/upsc-prelims-2026-showcase#question-ledger`}
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#1d9e75] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
                  >
                    Open full MCQ ledger <FileSearch className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="prelims-2027-task-ledger"
          data-testid="prelims-2027-task-ledger"
          data-task-count={strategyExecutionTasks.length}
          data-completed-task-count={totals.completedTaskCount}
          data-priority-count={tasksByPriority.length}
          data-source-count={taskPhaseCounts.Source ?? 0}
          data-capsule-count={taskPhaseCounts.Capsule ?? 0}
          data-mcq-count={taskPhaseCounts.MCQ ?? 0}
          data-proof-count={taskPhaseCounts.Proof ?? 0}
          data-release-count={taskPhaseCounts.Release ?? 0}
          data-planner-count={taskPhaseCounts.Planner ?? 0}
          data-proof-rule="pdf-priority-to-source-capsule-mcq-proof-release-planner"
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Execution task ledger</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Break every priority into source, capsule, MCQ, proof and release work</h2>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-[#dcd5c7] bg-[#fdfaf3] px-3 py-2">
              <FileCheck2 className="h-5 w-5 text-[#085041]" />
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[#085041]">
                {totals.completedTaskCount}/{strategyExecutionTasks.length} done
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            {tasksByPriority.map(({ priority, tasks, completedCount, percent }) => (
              <details
                key={priority.id}
                data-testid="prelims-2027-task-priority-group"
                data-priority-id={priority.id}
                data-task-count={tasks.length}
                data-completed-count={completedCount}
                data-completion-percent={percent}
                className="group rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
              >
                <summary className="grid cursor-pointer list-none gap-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", priorityTone(priority.priority))}>
                        {priority.priority}
                      </span>
                      <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#746f66]">
                        {completedCount}/{tasks.length} tasks
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-black tracking-tight text-[#13251d]">{priority.subject}</h3>
                  </div>
                  <div className="min-w-0 md:w-64">
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.12em] text-[#746f66]">
                      <span>Task completion</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </summary>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {tasks.map((task) => {
                    const checked = completedTasks.includes(task.id);

                    return (
                      <div
                        key={task.id}
                        data-testid="prelims-2027-execution-task"
                        data-task-id={task.id}
                        data-priority-id={task.priorityId}
                        data-phase={task.phase}
                        data-owner-surface={task.ownerSurface}
                        data-route={task.route}
                        data-completed={checked ? "true" : "false"}
                        className={cn(
                          "rounded-lg border p-3 transition",
                          checked ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#dcd5c7] bg-white"
                        )}
                      >
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            data-testid="prelims-2027-execution-task-checkbox"
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTask(task.id)}
                            className="mt-1 h-4 w-4 accent-[#1d9e75]"
                          />
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-black leading-5 text-[#13251d]">{task.title}</span>
                              <span className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#6f4a12]">
                                {task.phase}
                              </span>
                            </span>
                            <span className="mt-2 block text-sm font-semibold leading-6 text-[#5d675f]">{task.output}</span>
                          </span>
                        </label>
                        <Link
                          data-testid="prelims-2027-execution-task-owner-link"
                          href={task.route}
                          className="mt-3 inline-flex min-h-9 items-center rounded-md border border-[#1d9e75] bg-white px-3 text-[11px] font-black uppercase tracking-[0.1em] text-[#085041]"
                        >
                          {task.ownerSurface}
                          <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section id="practice-blueprints" data-testid="prelims-2027-practice-blueprints" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Practice blueprint queue</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Convert each gap into UPSC-format drills</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                These are the first practice-engine templates to build from the audit: every drill states the gap,
                the UPSC format, expected output and the software surface where it should be generated.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-80">
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Queued</p>
                <p className="mt-1 text-3xl font-black text-[#13251d]">
                  {totals.queuedBlueprintCount}/{strategyPracticeBlueprints.length}
                </p>
              </div>
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Practice load</p>
                <p className="mt-1 text-3xl font-black text-[#13251d]">{totals.queuedMinutes}m</p>
              </div>
              <div className="col-span-2 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Generated handoffs</p>
                <p className="mt-1 text-3xl font-black text-[#13251d]">
                  {totals.generatedBlueprintCount}/{strategyPracticeBlueprints.length}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {practiceBlueprintsByPriority.map(({ priority, blueprints, queuedCount }) => (
              <details
                key={`${priority.id}-practice`}
                open={priority.priority === "Critical" || queuedCount > 0}
                className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
              >
                <summary className="grid cursor-pointer list-none gap-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", priorityTone(priority.priority))}>
                        {priority.priority}
                      </span>
                      <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#746f66]">
                        {queuedCount}/{blueprints.length} queued
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-black tracking-tight text-[#13251d]">{priority.subject}</h3>
                  </div>
                  <BookOpenCheck className="h-5 w-5 text-[#085041]" />
                </summary>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {blueprints.map((blueprint) => {
                    const generatorHref = blueprint.handoff
                      ? `/upsc/mcq-command?subject=${blueprint.handoff.subjectSlug}&day=${blueprint.handoff.day}&strategyBlueprint=${blueprint.id}`
                      : blueprint.route;

                    return (
                      <article
                        key={blueprint.id}
                        className={cn(
                          "rounded-lg border p-4 transition",
                          blueprint.handoff
                            ? "border-[#1a3a2a] bg-[#e7f5ee]"
                            : blueprint.queued
                              ? "border-[#1d9e75] bg-[#e7f5ee]"
                              : "border-[#dcd5c7] bg-white"
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#085041]">
                                {blueprint.format}
                              </span>
                              <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em]", difficultyTone(blueprint.difficulty))}>
                                {blueprint.difficulty}
                              </span>
                              <span className="rounded-md bg-[#f7f4ee] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#746f66]">
                                {blueprint.minutes} min
                              </span>
                              {blueprint.handoff ? (
                                <span className="rounded-md bg-[#1a3a2a] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-white">
                                  Generated
                                </span>
                              ) : null}
                            </div>
                            <h4 className="mt-3 text-base font-black tracking-tight text-[#13251d]">{blueprint.title}</h4>
                          </div>
                          {blueprint.handoff || blueprint.queued ? <CheckCircle2 className="h-5 w-5 text-[#085041]" /> : null}
                        </div>

                        <p className="mt-3 text-sm font-semibold leading-6 text-[#5d675f]">{blueprint.instruction}</p>
                        <div className="mt-3 grid gap-2">
                          <p className="rounded-md bg-[#fdfaf3] p-3 text-xs font-bold leading-5 text-[#31443a]">
                            Gap: {blueprint.matchedGap}
                          </p>
                          <p className="rounded-md bg-[#fdfaf3] p-3 text-xs font-bold leading-5 text-[#31443a]">
                            Output: {blueprint.expectedOutput}
                          </p>
                          {blueprint.handoff ? (
                            <p className="rounded-md bg-white p-3 text-xs font-bold leading-5 text-[#085041]">
                              Handoff: {blueprint.handoff.plannedQuestions} {blueprint.handoff.difficulty.replace("_", " ")}
                              questions for Day {blueprint.handoff.day}.
                            </p>
                          ) : null}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            aria-pressed={blueprint.queued}
                            onClick={() => toggleBlueprint(blueprint.id)}
                            className={cn(
                              "inline-flex min-h-10 items-center rounded-md px-3 text-xs font-black uppercase tracking-[0.1em] transition",
                              blueprint.queued
                                ? "border border-[#1d9e75] bg-[#1d9e75] text-white"
                                : "border border-[#1d9e75] bg-white text-[#085041] hover:bg-[#e7f5ee]"
                            )}
                          >
                            {blueprint.queued ? "Queued" : "Queue practice"}
                          </button>
                          <button
                            type="button"
                            onClick={() => generateBlueprint(blueprint.id)}
                            className="inline-flex min-h-10 items-center rounded-md bg-[#1a3a2a] px-3 text-xs font-black uppercase tracking-[0.1em] text-white transition hover:bg-[#10291d]"
                          >
                            {blueprint.handoff ? "Regenerate set" : "Generate practice set"}
                          </button>
                          <Link
                            href={generatorHref}
                            className="inline-flex min-h-10 items-center rounded-md border border-[#dcd5c7] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#31443a]"
                          >
                            Open generator <ArrowRight className="ml-2 h-3.5 w-3.5" />
                          </Link>
                          {blueprint.handoff ? (
                            <Link
                              href={`/upsc/question-bank?subject=${blueprint.handoff.subjectSlug}&strategyBlueprint=${blueprint.id}`}
                              className="inline-flex min-h-10 items-center rounded-md border border-[#1f5d8f] bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#1f5d8f]"
                            >
                              Student practice <ArrowRight className="ml-2 h-3.5 w-3.5" />
                            </Link>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section id="prelims-2027-delivery-dashboard" data-testid="prelims-2027-delivery-dashboard" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Blueprint delivery dashboard</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Track every recommendation from queue to solved practice</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This review layer reads the actual local evidence: queued blueprint state, generated strategy handoffs,
                MCQ Command batch locks, and Question Bank attempts saved by students.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                ["Queued", `${deliveryTotals.queued}/${strategyPracticeBlueprints.length}`],
                ["Generated", `${deliveryTotals.generated}/${strategyPracticeBlueprints.length}`],
                ["MCQ locked", `${deliveryTotals.locked}/${strategyPracticeBlueprints.length}`],
                ["Solved", `${deliveryTotals.solved}/${strategyPracticeBlueprints.length}`],
                ["Attempts", deliveryTotals.totalSolvedAttempts],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {deliveryRows.map((row) => {
              const generatorHref = row.handoff
                ? `/upsc/mcq-command?subject=${row.handoff.subjectSlug}&day=${row.handoff.day}&strategyBlueprint=${row.blueprint.id}`
                : "#practice-blueprints";
              const practiceHref = row.handoff
                ? `/upsc/question-bank?subject=${row.handoff.subjectSlug}&strategyBlueprint=${row.blueprint.id}`
                : "#practice-blueprints";
              const accuracy = row.solvedCount ? Math.round((row.correctCount / row.solvedCount) * 100) : null;

              return (
                <article
                  key={`${row.blueprint.id}-delivery`}
                  data-testid="prelims-2027-delivery-row"
                  data-blueprint-id={row.blueprint.id}
                  data-delivery-stage={row.stage}
                  data-generated={row.handoff ? "true" : "false"}
                  data-locked={row.lockedBatches.length ? "true" : "false"}
                  data-solved-count={row.solvedCount}
                  className="grid gap-4 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 lg:grid-cols-[0.85fr_1.1fr_0.75fr] lg:items-start"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", deliveryStageTone(row.stage))}>
                        {row.stage}
                      </span>
                      <span className={cn("rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", priorityTone(row.priority?.priority ?? "Medium"))}>
                        {row.priority?.priority ?? "Medium"}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-black tracking-tight text-[#13251d]">{row.blueprint.title}</h3>
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#746f66]">
                      {row.priority?.subject ?? "Strategy"} / {row.format}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-6 text-[#5d675f]">{row.blueprint.matchedGap}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-4">
                      {[
                        ["Queued", queuedBlueprints.includes(row.blueprint.id) ? "Yes" : "No"],
                        ["Generated", row.handoff ? `${row.handoff.plannedQuestions} Q` : "No"],
                        ["Locked", row.lockedBatches.length ? row.lockedBatches[0]?.[0] : "No"],
                        ["Solved", row.solvedCount ? `${row.solvedCount} / ${accuracy}%` : "No"],
                      ].map(([label, value]) => (
                        <div key={`${row.blueprint.id}-${label}`} className="rounded-md border border-[#dcd5c7] bg-white p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">{label}</p>
                          <p className="mt-1 break-words text-sm font-black text-[#13251d]">{value}</p>
                        </div>
                      ))}
                    </div>
                    {row.latestSolvedAt ? (
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#085041]">
                        Last solved {new Date(row.latestSolvedAt).toLocaleDateString("en-IN")}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex min-w-0 flex-wrap gap-2 lg:justify-end">
                    <Link
                      href={generatorHref}
                      className={cn(
                        "inline-flex min-h-10 items-center rounded-md px-3 text-xs font-black uppercase tracking-[0.1em]",
                        row.handoff
                          ? "border border-[#1d9e75] bg-white text-[#085041]"
                          : "border border-[#dcd5c7] bg-white text-[#746f66]"
                      )}
                    >
                      {row.handoff ? "MCQ command" : "Generate first"}
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={practiceHref}
                      className={cn(
                        "inline-flex min-h-10 items-center rounded-md px-3 text-xs font-black uppercase tracking-[0.1em]",
                        row.handoff
                          ? "border border-[#1f5d8f] bg-white text-[#1f5d8f]"
                          : "border border-[#dcd5c7] bg-white text-[#746f66]"
                      )}
                    >
                      Student practice
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="gap-radar" data-testid="prelims-2027-gap-radar" className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Gap radar</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">Classify the reason before building the fix</h2>
              </div>
              <Radar className="h-6 w-6 text-[#1a3a2a]" />
            </div>
            <div className="grid gap-3">
              {strategyGapTypes.map((gap) => (
                <article key={gap.id} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-base font-black tracking-tight">{gap.title}</h3>
                    <span className="rounded-md bg-[#e7f5ee] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#085041]">
                      {gap.targetSurface}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{gap.signal}</p>
                  <p className="mt-2 rounded-md bg-white p-3 text-sm font-bold leading-6 text-[#31443a]">{gap.softwareAction}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Format rebuilder</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">Hard rule for every 2027 MCQ bank</h2>
              </div>
              <Layers3 className="h-6 w-6 text-[#1a3a2a]" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {formatRebuildRules.map((rule) => (
                <article key={rule.id} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-black tracking-tight">{rule.format}</h3>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-[#085041]">{rule.targetPercent}%</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{rule.reason}</p>
                  <p className="mt-2 rounded-md bg-white p-3 text-xs font-bold leading-5 text-[#31443a]">{rule.generatorPrompt}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="simulator" data-testid="prelims-2027-student-simulator" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Student readiness simulator</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Select completed modules and see 2027 exposure</h2>
            </div>
            <Gauge className="h-6 w-6 text-[#1a3a2a]" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">Estimated readiness</p>
              <p className="mt-2 text-6xl font-black tracking-tight text-[#13251d]">{simulator.score}%</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${Math.min(100, simulator.score)}%` }} />
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-[#5d675f]">
                This is a planning score, not an exam prediction. It estimates whether the student's completed modules
                cover the PDF's known 2027 risk areas.
              </p>
              <div className="mt-4 rounded-md bg-white p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#6f4a12]">Top exposure if unchanged</p>
                <div className="mt-2 grid gap-2">
                  {simulator.topExposure.map((module) => (
                    <p key={module.id} className="text-sm font-bold leading-6 text-[#31443a]">
                      {module.exposedIfMissing}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {simulatorModules.map((module) => {
                const checked = completedModules.includes(module.id);

                return (
                  <label
                    key={module.id}
                    className={cn(
                      "cursor-pointer rounded-lg border p-4 transition",
                      checked ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#dcd5c7] bg-[#fdfaf3] hover:border-[#1d9e75]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleModule(module.id)}
                        className="mt-1 h-4 w-4 accent-[#1d9e75]"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black tracking-tight text-[#13251d]">{module.label}</h3>
                          <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black text-[#085041]">
                            +{module.weight}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{module.strength}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </section>

        <section data-testid="prelims-2027-launch-steps" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Course of action</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Next steps inside the software</h2>
            </div>
            <Target className="h-6 w-6 text-[#1a3a2a]" />
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {strategyLaunchSteps.map((step, index) => (
              <Link
                key={step.id}
                href={step.route}
                className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 transition hover:border-[#1d9e75] hover:bg-white"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-xs font-black text-white">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="text-base font-black tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{step.output}</p>
                <ArrowRight className="mt-3 h-4 w-4 text-[#085041]" />
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {summaryCards.map((card) => (
            <article key={card.title} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
              <card.icon className="mb-4 h-5 w-5 text-[#1d9e75]" />
              <h3 className="text-lg font-black tracking-tight">{card.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{card.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
