"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Eye,
  LockKeyhole,
  MessageSquareText,
  ShieldAlert,
  UserPlus,
  UsersRound,
} from "lucide-react";

import {
  readGeographyPilotFeedback,
  updateGeographyPilotFeedbackStatus,
  type GeographyPilotFeedbackEntry,
  type GeographyPilotFeedbackSeverity,
} from "@/lib/upsc/geographyPilotFeedback";
import {
  geographyFounderReviewItems,
  isGeographyFounderReviewComplete,
  readGeographyFounderReview,
  readGeographyPilotRelease,
  toggleGeographyFounderReviewItem,
  updateGeographyPilotRelease,
} from "@/lib/upsc/geographyPilotRelease";
import {
  addGeographyPilotTester,
  GEOGRAPHY_PILOT_TESTER_CAP,
  readGeographyPilotRoster,
  updateGeographyPilotTesterStatus,
  type GeographyPilotTesterEntry,
  type GeographyPilotTesterStatus,
} from "@/lib/upsc/geographyPilotRoster";
import {
  readGeographyPilotWaveDecision,
  updateGeographyPilotWaveDecision,
  type GeographyPilotWaveDecisionStatus,
} from "@/lib/upsc/geographyPilotWaveDecision";
import { buildGeographyLaunchReadiness } from "@/lib/upsc/geographyLaunchReadiness";
import {
  getLiveContinuityReceiptSummary,
  readLiveContinuityReceipts,
} from "@/lib/upsc/liveContinuityReceipts";
import {
  getGeographyDay1ReleasePackReceiptSummary,
  readGeographyDay1ReleasePackReceipts,
} from "@/lib/upsc/geographyDay1ReleasePackReceipts";
import { cn } from "@/lib/utils";

const severityTone: Record<GeographyPilotFeedbackSeverity, string> = {
  Blocker: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100",
  Confusing: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
  "Small fix": "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100",
  Positive: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100",
};

export function GeographyTestingObservationPanel() {
  const [feedback, setFeedback] = useState<GeographyPilotFeedbackEntry[]>([]);
  const [roster, setRoster] = useState<GeographyPilotTesterEntry[]>([]);
  const [releaseDecision, setReleaseDecision] = useState(() => readGeographyPilotRelease());
  const [waveDecision, setWaveDecision] = useState(() => readGeographyPilotWaveDecision());
  const [founderReview, setFounderReview] = useState(() => readGeographyFounderReview());
  const [liveContinuityState, setLiveContinuityState] = useState(() => readLiveContinuityReceipts());
  const [day1ReleasePackState, setDay1ReleasePackState] = useState(() => readGeographyDay1ReleasePackReceipts());
  const [reviewerName, setReviewerName] = useState(releaseDecision.reviewerName);
  const [releaseNote, setReleaseNote] = useState(releaseDecision.note);
  const [testerName, setTesterName] = useState("");
  const [testerContact, setTesterContact] = useState("");
  const [launchGateRefresh, setLaunchGateRefresh] = useState(0);
  const origin = typeof window === "undefined" ? "http://127.0.0.1:3001" : window.location.origin;
  const testingLink = `${origin}/upsc/geography/pilot`;

  const reloadFeedback = () => setFeedback(readGeographyPilotFeedback());
  const reloadRoster = () => setRoster(readGeographyPilotRoster());
  const reloadRelease = () => setReleaseDecision(readGeographyPilotRelease());
  const reloadWaveDecision = () => setWaveDecision(readGeographyPilotWaveDecision());
  const reloadFounderReview = () => setFounderReview(readGeographyFounderReview());
  const reloadLiveContinuity = () => setLiveContinuityState(readLiveContinuityReceipts());
  const reloadDay1ReleasePack = () => setDay1ReleasePackState(readGeographyDay1ReleasePackReceipts());
  const reloadLaunchReadiness = () => setLaunchGateRefresh(Date.now());

  useEffect(() => {
    reloadFeedback();
    reloadRoster();
    reloadRelease();
    reloadWaveDecision();
    reloadFounderReview();
    reloadLiveContinuity();
    reloadDay1ReleasePack();
    reloadLaunchReadiness();
    window.addEventListener("storage", reloadFeedback);
    window.addEventListener("storage", reloadRoster);
    window.addEventListener("storage", reloadRelease);
    window.addEventListener("storage", reloadWaveDecision);
    window.addEventListener("storage", reloadFounderReview);
    window.addEventListener("storage", reloadLiveContinuity);
    window.addEventListener("storage", reloadDay1ReleasePack);
    window.addEventListener("storage", reloadLaunchReadiness);
    window.addEventListener("geography-pilot-feedback-updated", reloadFeedback);
    window.addEventListener("geography-pilot-roster-updated", reloadRoster);
    window.addEventListener("geography-pilot-release-updated", reloadRelease);
    window.addEventListener("geography-pilot-wave-decision-updated", reloadWaveDecision);
    window.addEventListener("geography-founder-review-updated", reloadFounderReview);
    window.addEventListener("upsc-live-continuity-receipts-updated", reloadLiveContinuity);
    window.addEventListener("geography-day1-release-pack-receipts-updated", reloadDay1ReleasePack);
    return () => {
      window.removeEventListener("storage", reloadFeedback);
      window.removeEventListener("storage", reloadRoster);
      window.removeEventListener("storage", reloadRelease);
      window.removeEventListener("storage", reloadWaveDecision);
      window.removeEventListener("storage", reloadFounderReview);
      window.removeEventListener("storage", reloadLiveContinuity);
      window.removeEventListener("storage", reloadDay1ReleasePack);
      window.removeEventListener("storage", reloadLaunchReadiness);
      window.removeEventListener("geography-pilot-feedback-updated", reloadFeedback);
      window.removeEventListener("geography-pilot-roster-updated", reloadRoster);
      window.removeEventListener("geography-pilot-release-updated", reloadRelease);
      window.removeEventListener("geography-pilot-wave-decision-updated", reloadWaveDecision);
      window.removeEventListener("geography-founder-review-updated", reloadFounderReview);
      window.removeEventListener("upsc-live-continuity-receipts-updated", reloadLiveContinuity);
      window.removeEventListener("geography-day1-release-pack-receipts-updated", reloadDay1ReleasePack);
    };
  }, []);

  const summary = useMemo(() => {
    const open = feedback.filter((entry) => entry.status === "open");
    return {
      total: feedback.length,
      open: open.length,
      blockers: open.filter((entry) => entry.severity === "Blocker").length,
      confusing: open.filter((entry) => entry.severity === "Confusing").length,
      positive: feedback.filter((entry) => entry.severity === "Positive").length,
    };
  }, [feedback]);
  const rosterSummary = useMemo(
    () => ({
      planned: roster.filter((tester) => tester.status === "planned").length,
      invited: roster.filter((tester) => tester.status === "invited").length,
      completed: roster.filter((tester) => tester.status === "completed").length,
      blocked: roster.filter((tester) => tester.status === "blocked").length,
    }),
    [roster],
  );
  const testerEvidence = useMemo(
    () =>
      roster.map((tester) => {
        const testerName = tester.name.trim().toLowerCase();
        const entries = feedback
          .filter((entry) => {
            const entryName = entry.testerName.trim().toLowerCase();
            return entry.inviteCode ? entry.inviteCode === tester.inviteCode : entryName === testerName;
          })
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
        const openBlockers = entries.filter((entry) => entry.status === "open" && entry.severity === "Blocker").length;
        const latest = entries[0];
        const evidenceStatus =
          openBlockers > 0 || tester.status === "blocked"
            ? "Repair required"
            : tester.status === "completed" && entries.length > 0
              ? "Evidence complete"
              : tester.status === "completed"
                ? "Missing feedback note"
                : tester.status === "invited"
                  ? "Awaiting feedback"
                  : "Not invited yet";

        return {
          tester,
          entries,
          latest,
          openBlockers,
          evidenceStatus,
        };
      }),
    [feedback, roster],
  );
  const feedbackCoverageCount = testerEvidence.filter((item) => item.entries.length > 0).length;
  const sharingBlockedByFeedback = summary.blockers > 0;
  const pilotOutcomeReadyToWiden =
    roster.length > 0 &&
    rosterSummary.completed === roster.length &&
    feedbackCoverageCount === roster.length &&
    rosterSummary.blocked === 0 &&
    summary.blockers === 0;
  const firstWaveEvidenceStatus =
    roster.length === 0
      ? "No first wave evidence yet"
      : rosterSummary.blocked > 0 || summary.blockers > 0
        ? "Evidence shows repair needed"
        : pilotOutcomeReadyToWiden && feedbackCoverageCount === roster.length
          ? "Evidence clean for second wave"
          : feedbackCoverageCount > 0
            ? "Evidence collection in progress"
            : "Waiting for first tester evidence";
  const firstWaveEvidenceAction =
    roster.length === 0
      ? "Add the first controlled testers before sharing the student pilot link."
      : rosterSummary.blocked > 0 || summary.blockers > 0
        ? "Review blocker feedback, repair the route, and keep widening locked."
        : pilotOutcomeReadyToWiden && feedbackCoverageCount === roster.length
          ? "Founder can use this evidence to approve the next tiny testing wave."
          : feedbackCoverageCount > 0
            ? "Wait for remaining tester feedback before changing the pilot scope."
            : "Share only invite-coded access and wait for the first feedback receipt.";
  const pilotOutcomeStatus = pilotOutcomeReadyToWiden
    ? "Ready for second testing wave"
    : rosterSummary.blocked > 0 || summary.blockers > 0
      ? "Repair before widening"
      : roster.length === 0
        ? "No tester wave started"
        : "First tester wave in progress";
  const pilotOutcomeAction = pilotOutcomeReadyToWiden
    ? "Keep Geography stable and invite the next tiny batch only after reviewing all tester evidence."
    : rosterSummary.blocked > 0 || summary.blockers > 0
      ? "Pause widening, repair the blocker, then rerun the same Day 1 path."
      : roster.length === 0
        ? "Add up to three testers and share only their invite codes after the pre-share gate is green."
        : "Wait for every tester to complete the route and submit feedback before changing scope.";
  const displayedWaveDecisionStatus =
    waveDecision.status === "second-wave" && !pilotOutcomeReadyToWiden
      ? "Second wave locked by live gate"
      : waveDecision.status === "second-wave"
        ? "Second wave ready"
        : waveDecision.status === "repair"
          ? "Repair before next wave"
          : "Hold first wave";
  const displayedWaveDecisionNote =
    waveDecision.status === "second-wave" && !pilotOutcomeReadyToWiden
      ? "The saved second-wave decision is overridden until every tester is completed, every feedback receipt exists, and no blocker feedback is open."
      : waveDecision.note;
  const displayedReleaseStatus = sharingBlockedByFeedback
    ? "Stop sharing: blocker feedback open"
    : releaseDecision.status === "approved" ? "Approved for controlled testing" : "Paused before sharing";
  const displayedReleaseNote = sharingBlockedByFeedback
    ? "Open blocker feedback overrides prior approval until the item is reviewed and resolved."
    : releaseDecision.note;

  const markReviewed = (id: string) => {
    setFeedback(updateGeographyPilotFeedbackStatus(id, "reviewed"));
  };
  const rosterCapReached = roster.length >= GEOGRAPHY_PILOT_TESTER_CAP;
  const founderReviewComplete = isGeographyFounderReviewComplete(founderReview);
  const checkedFounderItems = founderReview.checkedIds.length;
  const nextFounderItem = geographyFounderReviewItems.find((item) => !founderReview.checkedIds.includes(item.id));
  const liveContinuitySummary = getLiveContinuityReceiptSummary(liveContinuityState);
  const day1ReleasePackSummary = getGeographyDay1ReleasePackReceiptSummary(day1ReleasePackState);
  const launchReadiness = buildGeographyLaunchReadiness({
    founderReviewComplete,
    releaseApproved: releaseDecision.status === "approved",
    openBlockerCount: summary.blockers,
    rosterCount: roster.length,
    completedTesterCount: rosterSummary.completed,
    feedbackReceiptCount: feedbackCoverageCount,
    blockedTesterCount: rosterSummary.blocked,
    liveContinuityComplete: liveContinuitySummary.complete,
    liveContinuityReceiptCount: liveContinuitySummary.completedCount,
    liveContinuityTotal: liveContinuitySummary.total,
    day1ReleasePackComplete: day1ReleasePackSummary.complete,
    day1ReleasePackReceiptCount: day1ReleasePackSummary.completedCount,
    day1ReleasePackTotal: day1ReleasePackSummary.total,
  });
  void launchGateRefresh;
  const readyToSharePilot = launchReadiness.canShareControlledPilot;
  const preShareGateChecks = [
    {
      label: "Fresh MCQ set",
      value: launchReadiness.mcqGate.value,
      passed: launchReadiness.mcqGate.passed,
      detail: launchReadiness.mcqGate.detail,
    },
    {
      label: "Founder checklist",
      value: `${checkedFounderItems}/${geographyFounderReviewItems.length} checked`,
      passed: founderReviewComplete,
      detail: founderReviewComplete
        ? "Manual review is complete."
        : "Complete every founder review surface before sharing.",
    },
    {
      label: "Blocker feedback",
      value: sharingBlockedByFeedback ? `${summary.blockers} open blocker` : "0 open blockers",
      passed: !sharingBlockedByFeedback,
      detail: sharingBlockedByFeedback
        ? "Stop sharing until blocker feedback is marked reviewed."
        : "No active blocker is stopping the link.",
    },
    {
      label: "Release decision",
      value: releaseDecision.status === "approved" ? "Approved" : "Paused",
      passed: releaseDecision.status === "approved",
      detail:
        releaseDecision.status === "approved"
          ? "Controlled pilot window is approved."
          : "Approve the pilot window after review is complete.",
    },
  ];
  const toggleFounderItem = (id: (typeof geographyFounderReviewItems)[number]["id"]) => {
    setFounderReview(toggleGeographyFounderReviewItem(id, reviewerName));
  };
  const addTester = () => {
    setRoster(addGeographyPilotTester({ name: testerName, contact: testerContact }));
    setTesterName("");
    setTesterContact("");
  };
  const setTesterStatus = (id: string, status: GeographyPilotTesterStatus) => {
    setRoster(updateGeographyPilotTesterStatus(id, status));
  };
  const setWaveStatus = (status: GeographyPilotWaveDecisionStatus) => {
    const reviewer = reviewerName.trim() || "Founder";
    if (status === "second-wave" && !pilotOutcomeReadyToWiden) {
      setWaveDecision(
        updateGeographyPilotWaveDecision({
          status: "hold",
          reviewerName: reviewer,
          note: "Second wave remains locked until the first tester wave has complete feedback evidence and is blocker-free.",
        }),
      );
      return;
    }

    const note =
      status === "second-wave"
        ? "First tester wave has complete feedback evidence and is blocker-free. Geography can move to the next tiny testing wave."
        : status === "repair"
          ? "Pause widening and repair the observed issue before inviting another tester wave."
          : "Hold Geography after the first tester wave until founder review confirms the next step.";
    setWaveDecision(updateGeographyPilotWaveDecision({ status, reviewerName: reviewer, note }));
  };
  const approvePilotWindow = () => {
    if (summary.blockers > 0) {
      setReleaseDecision(
        updateGeographyPilotRelease({
          status: "paused",
          reviewerName: reviewerName.trim() || "Founder",
          note: "Pilot remains paused because open blocker feedback exists.",
        })
      );
      return;
    }

    if (!founderReviewComplete) {
      setReleaseDecision(
        updateGeographyPilotRelease({
          status: "paused",
          reviewerName: reviewerName.trim() || "Founder",
          note: `Pilot remains paused until founder review is complete (${checkedFounderItems}/${geographyFounderReviewItems.length}).`,
        })
      );
      return;
    }

    if (!launchReadiness.mcqGate.passed) {
      setReleaseDecision(
        updateGeographyPilotRelease({
          status: "paused",
          reviewerName: reviewerName.trim() || "Founder",
          note: `Pilot remains paused until GEO-D01 has ${launchReadiness.mcqGate.detail}`,
        })
      );
      return;
    }

    setReleaseDecision(
      updateGeographyPilotRelease({
        status: "approved",
        reviewerName: reviewerName.trim() || "Founder",
        note: releaseNote.trim() || "Approved for a small controlled Geography Day 1 pilot window.",
        maxTesters: 3,
        testWindow: "25-35 minutes",
      })
    );
  };
  const pausePilotWindow = () => {
    setReleaseDecision(
      updateGeographyPilotRelease({
        status: "paused",
        reviewerName: reviewerName.trim() || "Founder",
        note: releaseNote.trim() || "Paused until the next local review pass is complete.",
      })
    );
  };

  return (
    <section
      data-testid="admin-geography-testing-observation"
      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
            <Eye className="h-3.5 w-3.5" />
            Controlled Geography Testing
          </div>
          <h2 className="text-xl font-black text-zinc-950 dark:text-zinc-50">Student Testing Link and Observation Board</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Share this route only for the controlled local pilot. Feedback saved in the testing cockpit appears here for review.
          </p>
          <p className="mt-3 break-all rounded-md bg-zinc-50 px-3 py-2 font-mono text-xs font-black text-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
            {testingLink}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/upsc/geography/pilot"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Open Student Pilot <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/upsc/geography/watch?day=1"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Day 1 Class <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {[
          { label: "Total feedback", value: summary.total, icon: MessageSquareText },
          { label: "Open items", value: summary.open, icon: ClipboardList },
          { label: "Blockers", value: summary.blockers, icon: ShieldAlert },
          { label: "Confusing", value: summary.confusing, icon: ClipboardList },
          { label: "Positive", value: summary.positive, icon: CheckCircle2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
          <div key={item.label} className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <Icon className="mb-3 h-4 w-4 text-emerald-700 dark:text-emerald-300" />
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-zinc-950 dark:text-zinc-50">{item.value}</p>
          </div>
          );
        })}
      </div>

      <div data-testid="admin-pilot-release-panel" className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Pilot release decision</p>
            <h3 data-testid="admin-pilot-release-status" className="mt-2 text-lg font-black text-zinc-950 dark:text-zinc-50">
              {displayedReleaseStatus}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{displayedReleaseNote}</p>
            <p className="mt-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Reviewer: {releaseDecision.reviewerName} / Max testers: {releaseDecision.maxTesters} / Window: {releaseDecision.testWindow}
            </p>
          </div>
          <div className="grid min-w-[260px] gap-2">
            <input
              aria-label="Release reviewer"
              value={reviewerName}
              onChange={(event) => setReviewerName(event.target.value)}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <input
              aria-label="Release note"
              value={releaseNote}
              onChange={(event) => setReleaseNote(event.target.value)}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="admin-pilot-approve"
                onClick={approvePilotWindow}
                className="inline-flex min-h-9 items-center justify-center rounded-md bg-emerald-700 px-3 text-xs font-black text-white transition hover:bg-emerald-800"
              >
                Approve pilot window
              </button>
              <button
                type="button"
                data-testid="admin-pilot-pause"
                onClick={pausePilotWindow}
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-xs font-black text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                Pause sharing
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        data-testid="admin-geography-launch-readiness"
        data-launch-status={launchReadiness.status}
        data-can-share-controlled-pilot={launchReadiness.canShareControlledPilot ? "true" : "false"}
        data-fresh-mcq-count={launchReadiness.mcqGate.questionCount}
        className={cn(
          "mt-5 rounded-md border p-4 shadow-sm",
          launchReadiness.canShareControlledPilot
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
            : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-600 dark:text-zinc-300">
              Geography launch readiness
            </p>
            <h3 className="mt-2 text-lg font-black text-zinc-950 dark:text-zinc-50">{launchReadiness.status}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              One proof snapshot for Day 1: lesson mode, 25-question MCQ gate, founder review, release, blocker state,
              and tester receipts.
            </p>
          </div>
          <span className="rounded-md border border-white/70 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
            {launchReadiness.canShareControlledPilot ? "Controlled link open" : "Hold link"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {launchReadiness.gates.map((gate) => (
            <div
              key={gate.id}
              data-launch-gate={gate.id}
              data-passed={gate.passed ? "true" : "false"}
              className={cn(
                "rounded-md border bg-white p-3 dark:bg-zinc-950",
                gate.passed ? "border-emerald-200 dark:border-emerald-900" : "border-amber-200 dark:border-amber-900"
              )}
            >
              <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                {gate.label}
              </p>
              <p className="mt-2 text-sm font-black text-zinc-950 dark:text-zinc-50">{gate.value}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-zinc-600 dark:text-zinc-300">{gate.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div
        data-testid="admin-geography-public-launch-boundary"
        data-public-launch-ready={launchReadiness.publicLaunchReady ? "true" : "false"}
        data-controlled-pilot-ready={launchReadiness.canShareControlledPilot ? "true" : "false"}
        data-release-asset-pair-ready={launchReadiness.releaseAssetPairReady ? "true" : "false"}
        data-first-wave-evidence-complete={launchReadiness.firstWaveEvidenceComplete ? "true" : "false"}
        className={cn(
          "mt-5 rounded-md border p-4 shadow-sm",
          launchReadiness.publicLaunchReady
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
            : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-600 dark:text-zinc-300">
              Public launch boundary
            </p>
            <h3 className="mt-2 text-lg font-black text-zinc-950 dark:text-zinc-50">
              {launchReadiness.publicLaunchReady ? "Public launch ready" : "Public launch still locked"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Controlled tester sharing is not the same as public student launch. Public launch needs the controlled
              pilot gate, final Day 1 release pack, clean first-wave receipts, and live continuity proof.
            </p>
          </div>
          <span
            className={cn(
              "rounded-md border px-3 py-2 text-xs font-black uppercase tracking-[0.14em]",
              launchReadiness.publicLaunchReady
                ? "border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                : "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
            )}
          >
            {launchReadiness.publicLaunchReady ? "Ready" : "Do not widen"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {launchReadiness.publicLaunchGates.map((gate) => (
            <div
              key={gate.id}
              data-public-launch-gate={gate.id}
              data-passed={gate.passed ? "true" : "false"}
              className={cn(
                "rounded-md border bg-white p-3 dark:bg-zinc-950",
                gate.passed ? "border-emerald-200 dark:border-emerald-900" : "border-amber-200 dark:border-amber-900",
              )}
            >
              <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                {gate.label}
              </p>
              <p className="mt-2 text-sm font-black text-zinc-950 dark:text-zinc-50">{gate.value}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-zinc-600 dark:text-zinc-300">{gate.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div
        data-testid="admin-pre-share-gate"
        className={cn(
          "mt-5 rounded-md border p-4 shadow-sm",
          readyToSharePilot
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
            : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-600 dark:text-zinc-300">
              Pre-share gate
            </p>
            <h3
              data-testid="admin-pre-share-gate-status"
              className="mt-2 flex items-center gap-2 text-lg font-black text-zinc-950 dark:text-zinc-50"
            >
              {readyToSharePilot ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              ) : (
                <LockKeyhole className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              )}
              {readyToSharePilot ? "Safe to share with controlled testers" : "Do not share yet"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Geography is locally built, but the student link should only be sent when every launch gate is green.
            </p>
          </div>
          <Link
            href="/upsc/geography/pilot"
            className={cn(
              "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-black transition",
              readyToSharePilot
                ? "bg-emerald-700 text-white hover:bg-emerald-800"
                : "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
            )}
          >
            Open student link <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {preShareGateChecks.map((item) => (
            <div
              key={item.label}
              className={cn(
                "rounded-md border bg-white p-3 dark:bg-zinc-950",
                item.passed
                  ? "border-emerald-200 dark:border-emerald-900"
                  : "border-amber-200 dark:border-amber-900"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-black text-zinc-950 dark:text-zinc-50">{item.value}</p>
                </div>
                <span
                  className={cn(
                    "rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]",
                    item.passed
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                      : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
                  )}
                >
                  {item.passed ? "Green" : "Hold"}
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold leading-5 text-zinc-600 dark:text-zinc-300">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div
        data-testid="admin-share-packet"
        className="mt-5 rounded-md border border-zinc-200 bg-zinc-950 p-4 text-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Student share packet</p>
            <h3 className="mt-2 text-lg font-black">Controlled Geography pilot handoff</h3>
            <p className="mt-2 break-all rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs font-black text-zinc-100">
              {testingLink}
            </p>
          </div>
          <span
            className={cn(
              "rounded-md border px-3 py-2 text-xs font-black uppercase tracking-[0.14em]",
              sharingBlockedByFeedback
                ? "border-red-400 bg-red-400/10 text-red-100"
                : releaseDecision.status === "approved"
                ? "border-emerald-400 bg-emerald-400/10 text-emerald-100"
                : "border-amber-300 bg-amber-300/10 text-amber-100"
            )}
          >
            {sharingBlockedByFeedback ? "Stop sharing" : releaseDecision.status === "approved" ? "Share approved" : "Sharing paused"}
          </span>
        </div>

        {sharingBlockedByFeedback ? (
          <div
            data-testid="admin-share-blocker-alert"
            className="mt-4 rounded-md border border-red-400/40 bg-red-400/10 p-3 text-sm font-bold leading-6 text-red-100"
          >
            {summary.blockers} open blocker feedback item{summary.blockers === 1 ? "" : "s"} found. Stop sharing the
            pilot link until the blocker is marked reviewed.
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Max testers",
              value: `${releaseDecision.maxTesters} students`,
              detail: "Keep the first window intentionally small.",
            },
            {
              label: "Start instruction",
              value: "Start lesson",
              detail: "Open the link and begin with the visible Start lesson action.",
            },
            {
              label: "Stop rule",
              value: "Stop sharing",
              detail: sharingBlockedByFeedback
                ? `${summary.blockers} open blocker item${summary.blockers === 1 ? "" : "s"} need review before widening.`
                : "Pause immediately if any Blocker feedback appears.",
            },
            {
              label: "Feedback rule",
              value: "Review open feedback",
              detail: "Every tester saves one observation before the pilot is widened.",
            },
          ].map((item) => (
            <div key={item.label} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">{item.label}</p>
              <p className="mt-2 text-sm font-black text-zinc-50">{item.value}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-zinc-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div
        data-testid="admin-controlled-tester-roster"
        className="mt-5 rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
              <UsersRound className="h-4 w-4" />
              Controlled tester roster
            </p>
            <h3 className="mt-2 text-lg font-black text-zinc-950 dark:text-zinc-50">
              First pilot window: {roster.length}/{GEOGRAPHY_PILOT_TESTER_CAP} testers
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Keep this list tiny. Add names before the call, then mark each student as invited, completed, or blocked after the pilot run.
            </p>
          </div>
          <span
            data-testid="admin-controlled-roster-cap"
            className={cn(
              "rounded-md border px-3 py-2 text-xs font-black uppercase tracking-[0.14em]",
              rosterCapReached
                ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100"
            )}
          >
            {rosterCapReached ? "Cap reached" : "Cap open"}
          </span>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <input
            aria-label="Tester name"
            value={testerName}
            onChange={(event) => setTesterName(event.target.value)}
            placeholder="Tester name"
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <input
            aria-label="Tester contact"
            value={testerContact}
            onChange={(event) => setTesterContact(event.target.value)}
            placeholder="Phone, email, or batch note"
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            type="button"
            data-testid="admin-add-controlled-tester"
            onClick={addTester}
            disabled={!testerName.trim() || rosterCapReached}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
          >
            <UserPlus className="h-4 w-4" />
            Add tester
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {roster.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No controlled testers added yet. Keep the first run to three students or fewer.
            </div>
          ) : (
            roster.map((tester, index) => (
              <div key={tester.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-zinc-950 dark:text-zinc-50">
                      {index + 1}. {tester.name}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{tester.contact}</p>
                    <p
                      data-testid={`admin-controlled-tester-code-${index + 1}`}
                      className="mt-2 inline-flex rounded-md border border-emerald-200 bg-white px-2 py-1 font-mono text-xs font-black uppercase tracking-[0.14em] text-emerald-900 dark:border-emerald-900 dark:bg-zinc-950 dark:text-emerald-100"
                    >
                      Code {tester.inviteCode}
                    </p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-zinc-600 dark:text-zinc-300">{tester.note}</p>
                  </div>
                  <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                    {tester.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["invited", "completed", "blocked"] satisfies GeographyPilotTesterStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setTesterStatus(tester.id, status)}
                      className={cn(
                        "inline-flex min-h-8 items-center justify-center rounded-md px-3 text-xs font-black capitalize transition",
                        tester.status === status
                          ? "bg-emerald-700 text-white"
                          : "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-800"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        data-testid="admin-first-wave-evidence-summary"
        className="mt-5 rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              First-wave evidence summary
            </p>
            <h3 data-testid="admin-first-wave-evidence-status" className="mt-2 text-lg font-black text-zinc-950 dark:text-zinc-50">
              {firstWaveEvidenceStatus}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{firstWaveEvidenceAction}</p>
          </div>
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {feedbackCoverageCount}/{roster.length || GEOGRAPHY_PILOT_TESTER_CAP} receipts
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            { label: "Roster complete", value: `${rosterSummary.completed}/${roster.length || GEOGRAPHY_PILOT_TESTER_CAP}` },
            { label: "Feedback receipts", value: `${feedbackCoverageCount}/${roster.length || GEOGRAPHY_PILOT_TESTER_CAP}` },
            { label: "Open blockers", value: summary.blockers },
            { label: "Wave decision", value: displayedWaveDecisionStatus },
          ].map((item) => (
            <div key={item.label} className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">{item.label}</p>
              <p className="mt-2 text-sm font-black text-zinc-950 dark:text-zinc-50">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2">
          {testerEvidence.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No tester evidence yet. Add a controlled tester, share the invite code, then collect the first receipt here.
            </div>
          ) : (
            testerEvidence.map((item, index) => (
              <div
                key={item.tester.id}
                data-testid={`admin-first-wave-evidence-row-${index + 1}`}
                className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-zinc-950 dark:text-zinc-50">{item.tester.name}</p>
                    <p className="mt-1 font-mono text-xs font-black uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                      {item.tester.inviteCode}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-md border px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
                      item.evidenceStatus === "Repair required"
                        ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100"
                        : item.evidenceStatus === "Evidence complete"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
                          : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
                    )}
                  >
                    {item.evidenceStatus}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs font-semibold leading-5 text-zinc-600 dark:text-zinc-300 md:grid-cols-3">
                  <span>{item.entries.length} feedback receipt{item.entries.length === 1 ? "" : "s"}</span>
                  <span>{item.openBlockers} open blocker{item.openBlockers === 1 ? "" : "s"}</span>
                  <span>{item.latest ? `${item.latest.stage} / ${item.latest.severity}` : "No feedback stage yet"}</span>
                </div>
                {item.latest ? (
                  <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-zinc-500 dark:text-zinc-400">
                    {item.latest.note}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      <div
        data-testid="admin-pilot-outcome-gate"
        className={cn(
          "mt-5 rounded-md border p-4 shadow-sm",
          pilotOutcomeReadyToWiden
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
            : rosterSummary.blocked > 0 || summary.blockers > 0
              ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
              : "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-600 dark:text-zinc-300">
              Pilot outcome gate
            </p>
            <h3 data-testid="admin-pilot-outcome-status" className="mt-2 text-lg font-black text-zinc-950 dark:text-zinc-50">
              {pilotOutcomeStatus}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{pilotOutcomeAction}</p>
          </div>
          <span
            className={cn(
              "rounded-md border px-3 py-2 text-xs font-black uppercase tracking-[0.14em]",
              pilotOutcomeReadyToWiden
                ? "border-emerald-300 bg-white text-emerald-900 dark:border-emerald-800 dark:bg-zinc-950 dark:text-emerald-100"
                : rosterSummary.blocked > 0 || summary.blockers > 0
                  ? "border-red-300 bg-white text-red-900 dark:border-red-800 dark:bg-zinc-950 dark:text-red-100"
                  : "border-blue-300 bg-white text-blue-900 dark:border-blue-800 dark:bg-zinc-950 dark:text-blue-100"
            )}
          >
            {rosterSummary.completed}/{roster.length || GEOGRAPHY_PILOT_TESTER_CAP} completed
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            { label: "Planned", value: rosterSummary.planned, tone: "text-zinc-700 dark:text-zinc-200" },
            { label: "Invited", value: rosterSummary.invited, tone: "text-blue-700 dark:text-blue-200" },
            { label: "Completed", value: rosterSummary.completed, tone: "text-emerald-700 dark:text-emerald-200" },
            { label: "Blocked", value: rosterSummary.blocked, tone: "text-red-700 dark:text-red-200" },
          ].map((item) => (
            <div key={item.label} className="rounded-md border border-white/70 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">{item.label}</p>
              <p className={cn("mt-2 text-2xl font-black tabular-nums", item.tone)}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div
        data-testid="admin-wave-decision-lock"
        className="mt-5 rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Wave decision lock
            </p>
            <h3 data-testid="admin-wave-decision-status" className="mt-2 text-lg font-black text-zinc-950 dark:text-zinc-50">
              {displayedWaveDecisionStatus}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{displayedWaveDecisionNote}</p>
          </div>
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {waveDecision.reviewerName}
          </span>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {[
            {
              status: "hold",
              label: "Hold first wave",
              description: "Keep testing closed while founder review continues.",
              disabled: false,
            },
            {
              status: "repair",
              label: "Repair before widening",
              description: "Use this when a blocker or incomplete feedback needs work.",
              disabled: false,
            },
            {
              status: "second-wave",
              label: "Ready for second wave",
              description: "Only unlocks after all first-wave testers complete with feedback and no blockers.",
              disabled: !pilotOutcomeReadyToWiden,
            },
          ].map((item) => (
            <button
              key={item.status}
              type="button"
              data-testid={`admin-wave-decision-${item.status}`}
              onClick={() => setWaveStatus(item.status as GeographyPilotWaveDecisionStatus)}
              disabled={item.disabled}
              className={cn(
                "rounded-md border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                waveDecision.status === item.status && !(item.status === "second-wave" && !pilotOutcomeReadyToWiden)
                  ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-100"
                  : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
              )}
            >
              <span className="block text-sm font-black">{item.label}</span>
              <span className="mt-1 block text-xs font-semibold leading-5 opacity-75">{item.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div data-testid="admin-founder-review-panel" className="mt-5 rounded-md border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-200">Founder review pass</p>
            <h3 className="mt-2 text-lg font-black text-zinc-950 dark:text-zinc-50">
              {founderReviewComplete ? "Human review complete" : "Human review pending"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Check these surfaces manually before approving the controlled pilot link. This is the last launch judgment layer after automated tests.
            </p>
          </div>
          <span
            data-testid="admin-founder-review-count"
            className="rounded-md border border-emerald-300 bg-white px-3 py-2 text-xs font-black text-emerald-900 dark:border-emerald-800 dark:bg-zinc-950 dark:text-emerald-100"
          >
            {checkedFounderItems}/{geographyFounderReviewItems.length} checked
          </span>
        </div>

        <div
          data-testid="admin-founder-review-runner"
          className="mt-4 rounded-md border border-emerald-300 bg-white p-4 shadow-sm dark:border-emerald-800 dark:bg-zinc-950"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-200">
                Next review step
              </p>
              <h4 className="mt-2 text-lg font-black text-zinc-950 dark:text-zinc-50">
                {nextFounderItem ? nextFounderItem.label : "All review surfaces checked"}
              </h4>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {nextFounderItem
                  ? nextFounderItem.detail
                  : "The founder checklist is complete. If no blockers are open, the controlled pilot window can be approved for a tiny tester group."}
              </p>
            </div>
            {nextFounderItem ? (
              <div className="flex flex-wrap gap-2">
                <Link
                  data-testid="admin-founder-review-open-next"
                  href={nextFounderItem.href}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-3 text-xs font-black text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  Open review surface <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  data-testid="admin-founder-review-mark-next"
                  onClick={() => toggleFounderItem(nextFounderItem.id)}
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-700 px-3 text-xs font-black text-white transition hover:bg-emerald-800"
                >
                  Mark this step checked
                </button>
              </div>
            ) : null}
          </div>
          {nextFounderItem ? (
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {nextFounderItem.passCriteria.map((criterion) => (
                <div
                  key={criterion}
                  className="rounded-md border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100"
                >
                  {criterion}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {geographyFounderReviewItems.map((item) => {
            const checked = founderReview.checkedIds.includes(item.id);
            return (
              <div
                key={item.id}
                data-testid={`admin-founder-review-${item.id}`}
                className={cn(
                  "rounded-md border p-3 text-left transition",
                  checked
                    ? "border-emerald-300 bg-white text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"
                    : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">{item.label}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 opacity-80">{item.detail}</p>
                  </div>
                  <span className="shrink-0 rounded bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] dark:bg-zinc-950/60">
                    {checked ? "Checked" : "Review"}
                  </span>
                </div>
                <ul className="mt-3 grid gap-1">
                  {item.passCriteria.map((criterion) => (
                    <li key={criterion} className="text-xs font-semibold leading-5 opacity-80">
                      {criterion}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={item.href}
                    className="inline-flex min-h-8 items-center justify-center gap-2 rounded-md border border-current/20 bg-white/70 px-3 text-xs font-black transition hover:bg-white dark:bg-zinc-950/60 dark:hover:bg-zinc-950"
                  >
                    Open surface <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    aria-pressed={checked}
                    onClick={() => toggleFounderItem(item.id)}
                    className={cn(
                      "inline-flex min-h-8 items-center justify-center rounded-md px-3 text-xs font-black transition",
                      checked
                        ? "border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-950 dark:text-emerald-100 dark:hover:bg-emerald-950/30"
                        : "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                    )}
                  >
                    {checked ? "Uncheck" : "Mark checked"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div data-testid="admin-geography-feedback-list" className="mt-5 grid gap-3">
        {feedback.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-5 text-sm font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            No pilot feedback has been captured yet. Open the testing cockpit and save one observation during the test run.
          </div>
        ) : (
          feedback.slice(0, 6).map((entry) => (
            <div key={entry.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-md border px-2 py-1 text-[11px] font-black", severityTone[entry.severity])}>
                    {entry.severity}
                  </span>
                  <span className="rounded-md bg-white px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                    {entry.stage}
                  </span>
                  <span className="rounded-md bg-white px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                    {entry.status}
                  </span>
                  {entry.inviteCode ? (
                    <span className="rounded-md bg-white px-2 py-1 font-mono text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:bg-zinc-900 dark:text-emerald-300">
                      {entry.inviteCode}
                    </span>
                  ) : null}
                </div>
                {entry.status === "open" ? (
                  <button
                    type="button"
                    onClick={() => markReviewed(entry.id)}
                    className="inline-flex min-h-8 items-center justify-center rounded-md bg-zinc-950 px-3 text-xs font-black text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                  >
                    Mark reviewed
                  </button>
                ) : null}
              </div>
              <p className="text-sm font-bold leading-6 text-zinc-700 dark:text-zinc-200">{entry.note}</p>
              <p className="mt-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {entry.testerName} / Day {entry.day} / {new Date(entry.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
