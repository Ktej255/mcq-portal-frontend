"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  MessageSquareText,
  PlayCircle,
  type LucideIcon,
  Send,
  ShieldCheck,
  TriangleAlert,
  UserCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  readGeographyPilotCheckIn,
  writeGeographyPilotCheckIn,
  type GeographyPilotCheckIn,
} from "@/lib/upsc/geographyPilotCheckIn";
import {
  appendGeographyPilotFeedback,
  readGeographyPilotFeedback,
  type GeographyPilotFeedbackSeverity,
  type GeographyPilotFeedbackStage,
} from "@/lib/upsc/geographyPilotFeedback";
import { readGeographyPilotRelease } from "@/lib/upsc/geographyPilotRelease";
import {
  readGeographyPilotRoster,
  updateGeographyPilotTesterStatus,
  type GeographyPilotTesterEntry,
} from "@/lib/upsc/geographyPilotRoster";
import { getGeographyDayReadiness } from "@/lib/upsc/geographyReadiness";
import { buildGeographyLaunchReadiness } from "@/lib/upsc/geographyLaunchReadiness";
import { geographySessions } from "@/lib/upsc/plan";
import { useGeographyProgress } from "@/lib/upsc/useGeographyProgress";
import { cn } from "@/lib/utils";

const feedbackStages: GeographyPilotFeedbackStage[] = [
  "Access",
  "Watch",
  "Talk",
  "Visual Lab",
  "MCQ",
  "Track",
  "Revisit",
  "Navigation",
  "Content",
];

const severities: GeographyPilotFeedbackSeverity[] = ["Confusing", "Small fix", "Positive", "Blocker"];

const severityTone: Record<GeographyPilotFeedbackSeverity, string> = {
  Blocker: "border-red-200 bg-red-50 text-red-800",
  Confusing: "border-amber-200 bg-amber-50 text-amber-800",
  "Small fix": "border-blue-200 bg-blue-50 text-blue-800",
  Positive: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function gateTone(isDone: boolean) {
  return isDone ? "border-[#1d9e75]/45 bg-[#e7f5ee] text-[#085041]" : "border-[#dcd5c7] bg-[#fffdf8] text-[#34453b]";
}

type PilotAction = {
  label: string;
  detail: string;
  href: string;
  icon: LucideIcon;
};

export function GeographyStudentPilotRoom() {
  const { getDayProgress, isLoaded } = useGeographyProgress();
  const [checkIn, setCheckIn] = useState<GeographyPilotCheckIn | null>(() =>
    typeof window === "undefined" ? null : readGeographyPilotCheckIn(),
  );
  const [checkInName, setCheckInName] = useState(() => checkIn?.testerName || "");
  const [checkInContact, setCheckInContact] = useState(() => checkIn?.contact || "");
  const [checkInCode, setCheckInCode] = useState(() => checkIn?.inviteCode || "");
  const [checkInMessage, setCheckInMessage] = useState("");
  const [roster, setRoster] = useState<GeographyPilotTesterEntry[]>(() =>
    typeof window === "undefined" ? [] : readGeographyPilotRoster(),
  );
  const [testerName, setTesterName] = useState("Pilot student");
  const [stage, setStage] = useState<GeographyPilotFeedbackStage>("Navigation");
  const [severity, setSeverity] = useState<GeographyPilotFeedbackSeverity>("Confusing");
  const [note, setNote] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [feedbackEntries, setFeedbackEntries] = useState(() =>
    typeof window === "undefined" ? [] : readGeographyPilotFeedback(),
  );
  const [releaseDecision, setReleaseDecision] = useState(() => readGeographyPilotRelease());
  const [launchGateRefresh, setLaunchGateRefresh] = useState(0);

  useEffect(() => {
    const reloadFeedback = () => setFeedbackEntries(readGeographyPilotFeedback());
    const reloadRelease = () => setReleaseDecision(readGeographyPilotRelease());
    const reloadRoster = () => setRoster(readGeographyPilotRoster());
    const reloadLaunchReadiness = () => setLaunchGateRefresh(Date.now());
    const reloadCheckIn = () => {
      const nextCheckIn = readGeographyPilotCheckIn();
      setCheckIn(nextCheckIn);
      if (nextCheckIn?.testerName) {
        setTesterName(nextCheckIn.testerName);
        setCheckInName(nextCheckIn.testerName);
        setCheckInContact(nextCheckIn.contact);
        setCheckInCode(nextCheckIn.inviteCode);
      }
    };

    reloadFeedback();
    reloadRelease();
    reloadRoster();
    reloadCheckIn();
    reloadLaunchReadiness();
    window.addEventListener("storage", reloadFeedback);
    window.addEventListener("storage", reloadRelease);
    window.addEventListener("storage", reloadRoster);
    window.addEventListener("storage", reloadCheckIn);
    window.addEventListener("storage", reloadLaunchReadiness);
    window.addEventListener("geography-pilot-feedback-updated", reloadFeedback);
    window.addEventListener("geography-pilot-release-updated", reloadRelease);
    window.addEventListener("geography-pilot-roster-updated", reloadRoster);
    window.addEventListener("geography-pilot-check-in-updated", reloadCheckIn);
    return () => {
      window.removeEventListener("storage", reloadFeedback);
      window.removeEventListener("storage", reloadRelease);
      window.removeEventListener("storage", reloadRoster);
      window.removeEventListener("storage", reloadCheckIn);
      window.removeEventListener("storage", reloadLaunchReadiness);
      window.removeEventListener("geography-pilot-feedback-updated", reloadFeedback);
      window.removeEventListener("geography-pilot-release-updated", reloadRelease);
      window.removeEventListener("geography-pilot-roster-updated", reloadRoster);
      window.removeEventListener("geography-pilot-check-in-updated", reloadCheckIn);
    };
  }, []);

  const dayOne = geographySessions[0];
  const dayOneProgress = getDayProgress(1);
  const dayOneReadiness = getGeographyDayReadiness(dayOne, dayOneProgress, { isLoaded, labSlug: "india-map" });
  const openBlockerCount = feedbackEntries.filter((entry) => entry.status === "open" && entry.severity === "Blocker").length;
  const releaseBlockedByFeedback = openBlockerCount > 0;
  const completedTesterCount = roster.filter((tester) => tester.status === "completed").length;
  const blockedTesterCount = roster.filter((tester) => tester.status === "blocked").length;
  const launchReadiness = buildGeographyLaunchReadiness({
    founderReviewComplete: true,
    releaseApproved: releaseDecision.status === "approved",
    openBlockerCount,
    rosterCount: roster.length,
    completedTesterCount,
    feedbackReceiptCount: feedbackEntries.length,
    blockedTesterCount,
  });
  void launchGateRefresh;
  const releaseApproved = releaseDecision.status === "approved" && !releaseBlockedByFeedback && launchReadiness.mcqGate.passed;
  const hasPilotCheckIn = Boolean(checkIn?.testerName.trim());
  const pilotNavigationUnlocked = releaseApproved && hasPilotCheckIn;

  const journeySteps = useMemo(
    () => [
      {
        label: "Learn",
        detail: "Complete the focused Day 1 lesson and save the discussion handoff.",
        done: dayOneReadiness.watchComplete,
        icon: PlayCircle,
        href: "/upsc/geography/watch?day=1",
      },
      {
        label: "Discuss",
        detail: "Explain the topic to the AI teacher and build recall to 95%.",
        done: dayOneReadiness.talkClear,
        icon: MessageSquareText,
        href: "/upsc/geography/talk?day=1",
      },
      {
        label: "MCQ",
        detail: "Attempt fresh practice after the discussion clears the recall target.",
        done: dayOneReadiness.mcqCommand,
        icon: ClipboardCheck,
        href: "/upsc/geography/mcq-readiness?day=1",
      },
    ],
    [dayOneReadiness],
  );

  const completedStepCount = journeySteps.filter((step) => step.done).length;
  const activeStepIndex = journeySteps.findIndex((step) => !step.done);
  const currentAction: PilotAction = releaseBlockedByFeedback
    ? {
        label: "Pilot paused for review",
        detail: "A blocker was reported. Wait for the admin to review it before continuing the student test.",
        href: "/upsc/geography/pilot",
        icon: TriangleAlert,
      }
    : !launchReadiness.mcqGate.passed
    ? {
        label: "Wait for fresh MCQs",
        detail: "The Day 1 route opens only after the reviewed 25-question practice set is ready.",
        href: "/upsc/geography/pilot",
        icon: ShieldCheck,
      }
    : !releaseApproved
    ? {
        label: "Wait for final approval",
        detail: "The pilot is visible for setup, but the student test window is not open yet.",
        href: "/upsc/geography/pilot",
        icon: ShieldCheck,
      }
    : !hasPilotCheckIn
      ? {
          label: "Check in before starting",
          detail: "Save your name and contact so the pilot feedback can be traced during the controlled test.",
          href: "/upsc/geography/pilot",
          icon: UserCheck,
        }
    : !dayOneReadiness.watchComplete
      ? {
          label: "Start lesson",
          detail: "Complete the focused Day 1 lesson and save the discussion handoff before moving ahead.",
          href: "/upsc/geography/watch?day=1",
          icon: PlayCircle,
        }
      : !dayOneReadiness.talkClear
        ? {
            label: "Continue discussion",
            detail: "Explain the topic, answer the peer challenge, and build your recall score to 95%.",
            href: "/upsc/geography/talk?day=1",
            icon: MessageSquareText,
          }
        : !dayOneReadiness.mcqCommand
            ? {
                label: "Open MCQ practice",
                detail: "Your discussion cleared the recall target. Attempt the fresh Day 1 practice now.",
                href: "/upsc/geography/mcq-readiness?day=1",
                icon: ClipboardCheck,
              }
            : {
                label: "Save final feedback",
                detail: "Your core loop is complete. Save one observation below; Track and Revisit remain available when needed.",
                href: "/upsc/geography/pilot#pilot-feedback",
                icon: CheckCircle2,
              };
  const CurrentActionIcon = currentAction.icon;
  const testerScript = [
    {
      label: "Step 1: Learn",
      detail: "Finish the focused 10-15 minute lesson and save the discussion handoff.",
      done: dayOneReadiness.watchComplete,
    },
    {
      label: "Step 2: Discuss",
      detail: "Explain the topic, answer the peer challenge, and build recall to 95%.",
      done: dayOneReadiness.talkClear,
    },
    {
      label: "Step 3: MCQ",
      detail: "Attempt fresh practice, then return here to submit one observation.",
      done: dayOneReadiness.mcqCommand,
    },
  ];

  const saveCheckIn = () => {
    const normalizedCode = checkInCode.trim().toUpperCase();
    const matchedTester = roster.find((tester) => tester.inviteCode === normalizedCode);
    if (!matchedTester) {
      setCheckInMessage(
        roster.length === 0
          ? "Ask the admin to add your name to the controlled tester roster first."
          : "Enter the invite code shared by the admin before starting."
      );
      return;
    }

    const nextCheckIn = writeGeographyPilotCheckIn({
      testerName: checkInName.trim() || matchedTester.name,
      contact: checkInContact.trim() || matchedTester.contact,
      inviteCode: normalizedCode,
    });
    if (!nextCheckIn) {
      setCheckInMessage("Enter your name before starting the pilot.");
      return;
    }
    setRoster(updateGeographyPilotTesterStatus(matchedTester.id, "invited"));
    setCheckIn(nextCheckIn);
    setTesterName(nextCheckIn.testerName);
    setCheckInMessage("Check-in saved for this pilot session.");
  };

  const saveFeedback = () => {
    const cleanNote = note.trim();
    if (cleanNote.length < 8) {
      setSavedMessage("Add one clear sentence before saving feedback.");
      return;
    }

    appendGeographyPilotFeedback({
      testerName: testerName.trim() || "Pilot student",
      stage,
      severity,
      day: 1,
      note: cleanNote,
      currentRoute: typeof window === "undefined" ? "/upsc/geography/pilot" : window.location.pathname + window.location.search,
      inviteCode: checkIn?.inviteCode || "",
    });
    const checkedInTester = checkIn?.inviteCode
      ? roster.find((tester) => tester.inviteCode === checkIn.inviteCode)
      : null;
    if (checkedInTester) {
      setRoster(updateGeographyPilotTesterStatus(checkedInTester.id, severity === "Blocker" ? "blocked" : "completed"));
    }
    setFeedbackEntries(readGeographyPilotFeedback());
    setNote("");
    setSavedMessage(
      severity === "Blocker"
        ? "Blocker saved. Pilot paused until admin review."
        : "Feedback saved for the pilot review board."
    );
  };

  return (
    <div data-testid="geography-student-pilot-room" className="min-h-screen bg-[#f7f4ee] text-[#1b2f27]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid gap-5 xl:grid-cols-[1fr_0.72fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Geography pilot</Badge>
              <span className="text-sm font-bold text-[#776f64]">Day 1 / Geographic thinking</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">Controlled student route</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
              Start Geography Day 1 from one clean path.
            </h1>
            <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-[#5d675f]">
              Follow one short loop: Learn, Discuss, MCQ. Use the India-map visual only when it helps, then save feedback at the end.
            </p>

            {!pilotNavigationUnlocked ? (
              <div className="mt-6">
                <span
                  data-testid="geography-student-pilot-start-locked"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#ef9f27]/55 bg-[#fff4df] px-4 text-sm font-black text-[#6f4a12]"
                >
                  {releaseBlockedByFeedback
                    ? "Pilot paused after blocker feedback"
                    : !launchReadiness.mcqGate.passed
                      ? "Day 1 practice is still being prepared"
                    : !releaseApproved
                      ? "Pilot opens after final approval"
                      : "Check in before starting"}
                </span>
              </div>
            ) : null}
          </div>

          <div
            data-testid="geography-student-pilot-release-state"
            data-fresh-mcq-count={launchReadiness.mcqGate.questionCount}
            data-fresh-mcq-ready={launchReadiness.mcqGate.passed ? "true" : "false"}
            className={cn(
              "rounded-lg border p-5 shadow-sm",
              releaseApproved ? "border-[#cfe5dc] bg-[#e7f5ee]" : "border-[#ef9f27]/50 bg-[#fff4df]",
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-white", releaseApproved ? "bg-[#1d9e75]" : "bg-[#9a6a16]")}>
                {releaseApproved ? <CheckCircle2 className="h-5 w-5" /> : <TriangleAlert className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Pilot state</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-[#13251d]">
                  {releaseBlockedByFeedback
                    ? "Paused after blocker feedback"
                    : !launchReadiness.mcqGate.passed
                      ? "Day 1 practice is still being prepared"
                    : releaseApproved ? "Ready for controlled testing" : "Not open for students yet"}
                </h2>
                <p className="mt-3 text-sm font-bold leading-6 text-[#49675e]">
                  {releaseBlockedByFeedback
                    ? "A blocker has been reported in the pilot feedback board. Wait until the admin marks it reviewed."
                    : !launchReadiness.mcqGate.passed
                    ? launchReadiness.mcqGate.detail
                    : releaseApproved
                    ? `This test is limited to ${releaseDecision.maxTesters} students for ${releaseDecision.testWindow}.`
                    : "Final local review is still being completed before this route is shared."}
                </p>
                <div className="mt-4 grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#6f4a12]">
                  <span>Completed steps: {completedStepCount}/{journeySteps.length}</span>
                  <span>Feedback saved: {feedbackEntries.length}</span>
                </div>
              </div>
            </div>
            {releaseBlockedByFeedback ? (
              <div
                data-testid="geography-student-pilot-blocker-alert"
                className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-bold leading-6 text-red-800"
              >
                Pilot paused until {openBlockerCount} blocker feedback item{openBlockerCount === 1 ? "" : "s"} is reviewed.
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.86fr_1.14fr]">
          <div data-testid="geography-student-pilot-current-action" className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                <CurrentActionIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Current action</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-[#13251d]">{currentAction.label}</h2>
                <p className="mt-2 break-words text-sm font-bold leading-6 text-[#49675e]">{currentAction.detail}</p>
                {pilotNavigationUnlocked ? (
                  <Link
                    href={currentAction.href}
                    data-testid="geography-student-pilot-start"
                    className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </div>

            <div
              data-testid="geography-student-pilot-session-guide"
              className="mt-5 grid gap-2 border-t border-[#1d9e75]/20 pt-4 sm:grid-cols-3"
            >
              {[
                {
                  label: "Time window",
                  value: releaseBlockedByFeedback ? "Paused" : releaseApproved ? releaseDecision.testWindow : "After approval",
                  detail: "Keep this as one focused Day 1 pilot session.",
                },
                {
                  label: "Resume rule",
                  value: "Return here",
                  detail: "This page will reopen the correct next step if you pause.",
                },
                {
                  label: "Finish rule",
                  value: "Save feedback",
                  detail: "Submit one observation after MCQ before closing.",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-[#cfe5dc] bg-[#fffdf8]/80 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{item.label}</p>
                  <p className="mt-1 text-sm font-black text-[#13251d]">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#49675e]">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div data-testid="geography-student-pilot-check-in" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">
                  <UserCheck className="h-4 w-4" />
                  Pilot check-in
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">
                  {checkIn ? `Checked in: ${checkIn.testerName}` : "Save your name before feedback."}
                </h2>
              </div>
              <span className={cn(
                "rounded-md border px-3 py-2 text-xs font-black uppercase tracking-[0.14em]",
                checkIn ? "border-[#cfe5dc] bg-[#e7f5ee] text-[#085041]" : "border-[#ef9f27]/45 bg-[#fff4df] text-[#6f4a12]",
              )}>
                {checkIn ? "Session named" : "Name pending"}
              </span>
            </div>
            <p className="mb-4 text-sm font-bold leading-6 text-[#5d675f]">
              This keeps the first controlled pilot feedback tied to the actual tester. Use the invite code shared by the admin before starting.
            </p>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.72fr_auto]">
              <input
                aria-label="Pilot check-in name"
                value={checkInName}
                onChange={(event) => setCheckInName(event.target.value)}
                placeholder="Your name"
                className="h-11 rounded-md border border-[#dcd5c7] bg-[#fdfaf3] px-3 text-sm font-bold text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
              />
              <input
                aria-label="Pilot check-in contact"
                value={checkInContact}
                onChange={(event) => setCheckInContact(event.target.value)}
                placeholder="Phone, email, or batch"
                className="h-11 rounded-md border border-[#dcd5c7] bg-[#fdfaf3] px-3 text-sm font-bold text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
              />
              <input
                aria-label="Pilot invite code"
                value={checkInCode}
                onChange={(event) => setCheckInCode(event.target.value.toUpperCase())}
                placeholder="Invite code"
                className="h-11 rounded-md border border-[#dcd5c7] bg-[#fdfaf3] px-3 font-mono text-sm font-black uppercase text-[#25382f] outline-none transition placeholder:font-sans placeholder:normal-case placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
              />
              <button
                type="button"
                data-testid="geography-student-check-in-save"
                onClick={saveCheckIn}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
              >
                Save check-in
              </button>
            </div>
            {checkInMessage ? <p className="mt-3 text-sm font-bold text-[#085041]">{checkInMessage}</p> : null}
            {checkIn ? (
              <p className="mt-3 text-xs font-semibold text-[#746f66]">
                Checked in at {new Date(checkIn.checkedInAt).toLocaleString()} / {checkIn.contact} / {checkIn.inviteCode}
              </p>
            ) : null}
          </div>
        </section>

        <section className="grid gap-5">
          <div data-testid="geography-student-pilot-script" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">First tester script</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">Follow the steps in order.</h2>
              </div>
              <span className="rounded-md border border-[#cfe5dc] bg-[#e7f5ee] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#085041]">
                Stop if stuck
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {testerScript.map((item, index) => (
                <div
                  key={item.label}
                  data-testid={`geography-student-pilot-script-step-${index + 1}`}
                  className={cn(
                    "rounded-md border p-3",
                    item.done ? "border-[#1d9e75]/45 bg-[#e7f5ee]" : "border-[#dcd5c7] bg-[#f7f4ee]",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">{item.label}</p>
                    <span className="rounded bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#49675e]">
                      {item.done ? "Done" : "Test"}
                    </span>
                  </div>
                  <p className="text-sm font-bold leading-6 text-[#34453b]">{item.detail}</p>
                </div>
              ))}
            </div>
            <div data-testid="geography-student-pilot-stuck-rule" className="mt-4 rounded-md border border-[#ef9f27]/45 bg-[#fff4df] p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a16]">If stuck</p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#6f4a12]">
                Do not skip ahead. Save feedback with the exact step name, then return to the previous completed step.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-[#13251d]">Your Day 1 path</p>
                <p className="text-xs font-semibold text-[#746f66]">Three steps only</p>
              </div>
            </div>

            <div data-testid="geography-student-pilot-gates" className="grid gap-3">
              {journeySteps.map((step, index) => {
                const StepIcon = step.icon;
                const content = (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/75">
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black">Step {index + 1}: {step.label}</p>
                        <p className="mt-1 break-words text-xs font-bold leading-5 opacity-80">{step.detail}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                      {pilotNavigationUnlocked
                        ? step.done
                          ? "Done"
                          : index === activeStepIndex
                            ? "Next"
                            : "Later"
                        : releaseApproved
                          ? "Check in"
                          : "Paused"}
                    </span>
                  </div>
                );

                return (
                  <div
                    key={step.label}
                    data-testid={`geography-student-pilot-step-${index + 1}`}
                    aria-current={pilotNavigationUnlocked && index === activeStepIndex ? "step" : undefined}
                    className={cn(
                      "rounded-md border p-4",
                      pilotNavigationUnlocked ? gateTone(step.done) : "border-[#dcd5c7] bg-[#f7f4ee] text-[#776f64]",
                    )}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
            {pilotNavigationUnlocked ? (
              <Link
                href="/upsc/geography/lab?mode=india-map&day=1"
                data-testid="geography-student-pilot-optional-visual"
                className="mt-4 flex items-center justify-between gap-3 rounded-md border border-dashed border-[#b9d9cd] bg-[#f7f4ee] p-3 text-sm font-bold text-[#49675e] transition hover:border-[#1d9e75]"
              >
                <span>Need a visual explanation? Open the optional India-map support.</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            ) : (
              <div
                data-testid="geography-student-pilot-optional-visual-locked"
                className="mt-4 rounded-md border border-dashed border-[#dcd5c7] bg-[#f7f4ee] p-3 text-sm font-bold text-[#776f64]"
              >
                Optional India-map support opens after pilot check-in.
              </div>
            )}
          </div>

          <div id="pilot-feedback" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-[#13251d]">Pilot feedback</p>
                <p className="text-xs font-semibold text-[#746f66]">Write what happened while using this Day 1 path</p>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Name</span>
                <input
                  aria-label="Pilot student name"
                  value={testerName}
                  onChange={(event) => setTesterName(event.target.value)}
                  className="h-11 rounded-md border border-[#dcd5c7] bg-[#fdfaf3] px-3 text-sm font-bold text-[#25382f] outline-none transition focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
                />
              </label>

              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Where did it happen?</p>
                <div className="flex flex-wrap gap-2">
                  {feedbackStages.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={stage === item}
                      onClick={() => setStage(item)}
                      className={cn(
                        "min-h-9 rounded-md border px-3 text-xs font-black transition",
                        stage === item
                          ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                          : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]",
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Feedback type</p>
                <div className="grid gap-2 sm:grid-cols-4">
                  {severities.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={severity === item}
                      onClick={() => setSeverity(item)}
                      className={cn(
                        "min-h-10 rounded-md border px-3 text-xs font-black transition",
                        severity === item ? severityTone[item] : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]",
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Observation</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={5}
                  placeholder="Example: I completed the lesson and discussion, but I was unsure what to do next."
                  className="resize-none rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-3 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  data-testid="geography-student-feedback-save"
                  onClick={saveFeedback}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  <Send className="h-4 w-4" /> Save feedback
                </button>
                {savedMessage ? <p className="text-sm font-bold text-[#085041]">{savedMessage}</p> : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
