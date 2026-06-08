import { geographyDay1MediaAttachment } from "./geographyDay1Media";
import { getGeographyBatchCode } from "./mcqContract";
import {
  readLocalMcqCommandQuestionsForBatch,
  readMcqCommandBatchState,
} from "./mcqDraftBank";
import { geographySessions } from "./plan";

export const GEOGRAPHY_DAY1_MINIMUM_FRESH_MCQ_COUNT = 25;

export type GeographyLaunchGate = {
  id: string;
  label: string;
  value: string;
  detail: string;
  passed: boolean;
};

export type GeographyLaunchReadinessInput = {
  founderReviewComplete: boolean;
  releaseApproved: boolean;
  openBlockerCount: number;
  rosterCount: number;
  completedTesterCount: number;
  feedbackReceiptCount: number;
  blockedTesterCount: number;
};

export function readGeographyDay1McqLaunchGate(): GeographyLaunchGate & {
  batchCode: string;
  questionCount: number;
  plannedCount: number;
  draftedCount: number;
  batchStatus: "DRAFT" | "READY" | "EMPTY";
} {
  const dayOne = geographySessions[0];
  const batchCode = getGeographyBatchCode(dayOne);
  const batchState = readMcqCommandBatchState(batchCode);
  const questionCount = readLocalMcqCommandQuestionsForBatch(batchCode).length;
  const plannedCount = Math.max(
    batchState?.planned ?? GEOGRAPHY_DAY1_MINIMUM_FRESH_MCQ_COUNT,
    GEOGRAPHY_DAY1_MINIMUM_FRESH_MCQ_COUNT,
  );
  const draftedCount = Math.max(batchState?.drafted ?? 0, questionCount);
  const batchStatus = batchState?.status ?? "EMPTY";
  const passed =
    batchStatus === "READY" &&
    questionCount >= GEOGRAPHY_DAY1_MINIMUM_FRESH_MCQ_COUNT &&
    draftedCount >= GEOGRAPHY_DAY1_MINIMUM_FRESH_MCQ_COUNT;

  return {
    id: "fresh-mcq",
    label: "Fresh Day 1 MCQs",
    value: `${Math.min(questionCount, GEOGRAPHY_DAY1_MINIMUM_FRESH_MCQ_COUNT)}/${GEOGRAPHY_DAY1_MINIMUM_FRESH_MCQ_COUNT} ready`,
    detail: passed
      ? "The Day 1 practice bank has the required reviewed 25-question set."
      : `Keep practice locked until ${GEOGRAPHY_DAY1_MINIMUM_FRESH_MCQ_COUNT} reviewed questions are loaded and marked READY.`,
    passed,
    batchCode,
    questionCount,
    plannedCount,
    draftedCount,
    batchStatus,
  };
}

export function buildGeographyLaunchReadiness(input: GeographyLaunchReadinessInput) {
  const mcqGate = readGeographyDay1McqLaunchGate();
  const controlledMediaReady =
    geographyDay1MediaAttachment.releaseAssetPairReady ||
    geographyDay1MediaAttachment.status === "portal-native-fallback";
  const firstWaveEvidenceComplete =
    input.rosterCount > 0 &&
    input.completedTesterCount === input.rosterCount &&
    input.feedbackReceiptCount === input.rosterCount &&
    input.blockedTesterCount === 0 &&
    input.openBlockerCount === 0;

  const gates: GeographyLaunchGate[] = [
    {
      id: "day1-media",
      label: "Day 1 lesson",
      value: geographyDay1MediaAttachment.releaseAssetPairReady
        ? "Approved recording"
        : "Portal-native fallback",
      detail: geographyDay1MediaAttachment.releaseAssetPairReady
        ? "Approved recording and transcript are attached."
        : "Controlled testers use the verified portal-native lesson until final media is attached.",
      passed: controlledMediaReady,
    },
    mcqGate,
    {
      id: "founder-review",
      label: "Founder review",
      value: input.founderReviewComplete ? "Complete" : "Pending",
      detail: input.founderReviewComplete
        ? "All founder review surfaces are checked."
        : "Complete the human review checklist before sharing.",
      passed: input.founderReviewComplete,
    },
    {
      id: "release-window",
      label: "Pilot release",
      value: input.releaseApproved ? "Approved" : "Paused",
      detail: input.releaseApproved
        ? "Controlled testing window is approved."
        : "Approve the controlled pilot window after content and review gates pass.",
      passed: input.releaseApproved,
    },
    {
      id: "blockers",
      label: "Blocker feedback",
      value: input.openBlockerCount === 0 ? "0 open" : `${input.openBlockerCount} open`,
      detail: input.openBlockerCount === 0
        ? "No open blocker is stopping the route."
        : "Pause sharing until blocker feedback is reviewed.",
      passed: input.openBlockerCount === 0,
    },
    {
      id: "tester-receipts",
      label: "Tester receipts",
      value: `${input.feedbackReceiptCount}/${input.rosterCount || 3}`,
      detail: firstWaveEvidenceComplete
        ? "First tester wave has complete blocker-free evidence."
        : "Collect every controlled tester receipt before widening beyond the first wave.",
      passed: firstWaveEvidenceComplete,
    },
  ];

  const canShareControlledPilot =
    controlledMediaReady &&
    mcqGate.passed &&
    input.founderReviewComplete &&
    input.releaseApproved &&
    input.openBlockerCount === 0;
  const publicLaunchReady =
    canShareControlledPilot &&
    geographyDay1MediaAttachment.releaseAssetPairReady &&
    firstWaveEvidenceComplete;
  const status = publicLaunchReady
    ? "Public launch ready"
    : canShareControlledPilot
      ? "Controlled pilot ready"
      : mcqGate.passed
        ? "Review gate pending"
        : "Content gate pending";

  return {
    status,
    gates,
    mcqGate,
    canShareControlledPilot,
    firstWaveEvidenceComplete,
    publicLaunchReady,
    mediaStatus: geographyDay1MediaAttachment.status,
    releaseAssetPairReady: geographyDay1MediaAttachment.releaseAssetPairReady,
  };
}
