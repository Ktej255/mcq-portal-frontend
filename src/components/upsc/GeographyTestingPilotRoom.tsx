"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  MessageSquareText,
  MonitorCheck,
  PlayCircle,
  RefreshCcw,
  Send,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buildGeographyReadinessSnapshot, getGeographyDayReadiness } from "@/lib/upsc/geographyReadiness";
import {
  appendGeographyPilotFeedback,
  readGeographyPilotFeedback,
  type GeographyPilotFeedbackSeverity,
  type GeographyPilotFeedbackStage,
} from "@/lib/upsc/geographyPilotFeedback";
import { readGeographyPilotRelease } from "@/lib/upsc/geographyPilotRelease";
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

const severities: GeographyPilotFeedbackSeverity[] = ["Blocker", "Confusing", "Small fix", "Positive"];

const severityTone: Record<GeographyPilotFeedbackSeverity, string> = {
  Blocker: "border-red-200 bg-red-50 text-red-800",
  Confusing: "border-amber-200 bg-amber-50 text-amber-800",
  "Small fix": "border-blue-200 bg-blue-50 text-blue-800",
  Positive: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function gateTone(isDone: boolean) {
  return isDone ? "border-[#1d9e75]/45 bg-[#e7f5ee] text-[#085041]" : "border-[#ef9f27]/50 bg-[#fff4df] text-[#6f4a12]";
}

export function GeographyTestingPilotRoom() {
  const { getDayProgress, isLoaded, progress } = useGeographyProgress();
  const [testerName, setTesterName] = useState("Pilot student");
  const [stage, setStage] = useState<GeographyPilotFeedbackStage>("Navigation");
  const [severity, setSeverity] = useState<GeographyPilotFeedbackSeverity>("Confusing");
  const [note, setNote] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [feedbackEntries, setFeedbackEntries] = useState(() =>
    typeof window === "undefined" ? [] : readGeographyPilotFeedback()
  );
  const [releaseDecision] = useState(() =>
    typeof window === "undefined" ? readGeographyPilotRelease() : readGeographyPilotRelease()
  );

  const dayOne = geographySessions[0];
  const dayOneProgress = getDayProgress(1);
  const readinessSnapshot = buildGeographyReadinessSnapshot(progress, { isLoaded });
  const dayOneReadiness = getGeographyDayReadiness(dayOne, dayOneProgress, { isLoaded, labSlug: "earth-layers" });
  const origin = typeof window === "undefined" ? "http://127.0.0.1:3001" : window.location.origin;
  const testingLink = `${origin}/upsc/geography/pilot`;
  const watchProofCount = Math.min(dayOneProgress?.watchSceneCompletedIds?.length ?? 0, 5);
  const labProofCount = Math.min(dayOneProgress?.labProofCompletedIds?.length ?? 0, 5);
  const openFeedbackCount = feedbackEntries.filter((entry) => entry.status === "open").length;
  const blockerCount = feedbackEntries.filter((entry) => entry.severity === "Blocker" && entry.status === "open").length;

  const pilotGates = useMemo(
    () => [
      {
        label: "Local access",
        detail: "Student pilot route opens with localhost/local auth bypass active.",
        done: isLoaded,
        icon: MonitorCheck,
        href: "/upsc/geography/pilot",
      },
      {
        label: "Watch proof",
        detail: `${watchProofCount}/5 Day 1 class scenes saved.`,
        done: dayOneReadiness.watchComplete,
        icon: PlayCircle,
        href: "/upsc/geography/watch?day=1",
      },
      {
        label: "Talk verdict",
        detail:
          typeof dayOneProgress?.talkScore === "number"
            ? `${dayOneProgress.talkScore}/100 ${dayOneProgress.talkBand ?? "Talk"} verdict.`
            : "AI teacher verdict pending.",
        done: dayOneReadiness.talkClear,
        icon: MessageSquareText,
        href: "/upsc/geography/talk?day=1",
      },
      {
        label: "Visual Lab proof",
        detail: `${labProofCount}/5 visual proof stages saved.`,
        done: dayOneReadiness.labComplete,
        icon: Compass,
        href: "/upsc/geography/lab?mode=earth-layers&day=1",
      },
      {
        label: "MCQ command",
        detail: dayOneProgress?.mcqCompleted
          ? `${dayOneProgress.mcqCorrectCount ?? 0}/${dayOneProgress.mcqTotal ?? 0} correct, ${dayOneProgress.mcqOutcome ?? "Pending"} outcome.`
          : "Fresh practice not completed in this browser.",
        done: dayOneReadiness.mcqCommand,
        icon: ClipboardCheck,
        href: "/upsc/geography/mcq-readiness?day=1",
      },
      {
        label: "Track and Revisit",
        detail: "Student can inspect outcome and recovery route after practice.",
        done: dayOneReadiness.mcqCommand,
        icon: RefreshCcw,
        href: "/upsc/geography/track?day=1",
      },
    ],
    [dayOneProgress, dayOneReadiness, isLoaded, labProofCount, watchProofCount]
  );

  const completedGateCount = pilotGates.filter((gate) => gate.done).length;
  const releaseApproved = releaseDecision.status === "approved" && completedGateCount === pilotGates.length && blockerCount === 0;
  const saveFeedback = () => {
    const cleanNote = note.trim();
    if (cleanNote.length < 8) {
      setSavedMessage("Write a little more detail before saving.");
      return;
    }

    const saved = appendGeographyPilotFeedback({
      testerName: testerName.trim() || "Pilot student",
      stage,
      severity,
      day: 1,
      note: cleanNote,
      currentRoute: typeof window === "undefined" ? "/upsc/geography/testing" : window.location.pathname + window.location.search,
    });
    setFeedbackEntries(readGeographyPilotFeedback());
    setNote("");
    setSavedMessage(`Saved ${saved.severity.toLowerCase()} feedback for ${saved.stage}.`);
  };

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1b2f27]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid gap-5 xl:grid-cols-[1fr_0.72fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Controlled test</Badge>
              <span className="text-sm font-bold text-[#776f64]">Geography Day 1 pilot</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">Student testing cockpit</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
              One clean route for the first Geography tester.
            </h1>
            <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-[#5d675f]">
              Use this page before sharing the pilot. It gives the exact student route, shows Day 1 gate status, and captures tester friction in the local admin observation board.
            </p>

            <div data-testid="geography-testing-link-card" className="mt-6 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Testing link</p>
                  <p className="mt-2 break-all rounded-md bg-white/75 px-3 py-2 font-mono text-sm font-black text-[#085041]">
                    {testingLink}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/upsc/geography/pilot"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
                  >
                    Open pilot link <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/admin/launch-plan"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-black text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                  >
                    Admin view <ShieldCheck className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Day 1 gates", `${completedGateCount}/${pilotGates.length}`],
                ["Open feedback", openFeedbackCount],
                ["Subject readiness", `${readinessSnapshot.score}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-2 text-2xl font-black leading-none text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            data-testid="geography-pilot-release-state"
            className={cn(
              "rounded-lg border p-5 shadow-sm",
              releaseApproved ? "border-[#cfe5dc] bg-[#e7f5ee]" : "border-[#ef9f27]/50 bg-[#fff4df]"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-white", releaseApproved ? "bg-[#1d9e75]" : "bg-[#9a6a16]")}>
                {releaseApproved ? <CheckCircle2 className="h-5 w-5" /> : <TriangleAlert className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Pilot release state</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-[#13251d]">
                  {releaseApproved ? "Approved for controlled local testing" : "Operator sign-off required"}
                </h2>
                <p className="mt-3 text-sm font-bold leading-6 text-[#49675e]">
                  {releaseApproved
                    ? `Share with up to ${releaseDecision.maxTesters} testers for ${releaseDecision.testWindow}. Keep feedback capture open while they move through Day 1.`
                    : blockerCount > 0
                      ? `${blockerCount} open blocker exists in local feedback. Review it before sharing the link again.`
                      : "Admin must approve the next pilot window before this link is shared outside the operator system."}
                </p>
                <div className="mt-4 grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#6f4a12]">
                  <span>Decision: {releaseDecision.status}</span>
                  <span>Reviewer: {releaseDecision.reviewerName}</span>
                  <span>Window: {releaseDecision.testWindow}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <div data-testid="geography-pilot-sharing-rules" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Share rules</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">Do not widen the pilot casually.</h2>
            <div className="mt-4 grid gap-3">
              {[
                `Maximum testers: ${releaseDecision.maxTesters}`,
                `Timebox: ${releaseDecision.testWindow}`,
                "Stop sharing if any Blocker feedback appears.",
                "Every tester must save one feedback entry, even if it is Positive.",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3 text-sm font-bold leading-6 text-[#34453b]">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div data-testid="geography-pilot-script" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Tester script</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">Exact path for the first student.</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                "Open the testing link and start Geography Day 1.",
                "Watch all five class scenes and save the Talk handoff.",
                "Explain the concept in Talk and answer the peer challenge.",
                "Complete all five Visual Lab proof stages.",
                "Attempt the local MCQ practice only after the fresh batch gate is ready.",
                "Open Track and Revisit, then save feedback from the cockpit.",
              ].map((item, index) => (
                <div key={item} className="rounded-md border border-[#cfe5dc] bg-[#e7f5ee] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">Step {index + 1}</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#085041]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Pilot gate checklist</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">What the tester must be able to do</h2>
              </div>
              <Badge variant="outline" className="rounded-md border-[#1d9e75]/40 text-[#085041]">
                {completedGateCount}/{pilotGates.length}
              </Badge>
            </div>

            <div data-testid="geography-testing-gates" className="grid gap-3">
              {pilotGates.map((gate) => (
                <Link
                  key={gate.label}
                  href={gate.href}
                  data-testid={`testing-gate-${gate.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                  className={cn("rounded-md border p-4 transition hover:-translate-y-0.5", gateTone(gate.done))}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/75">
                        <gate.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black">{gate.label}</p>
                        <p className="mt-1 break-words text-xs font-bold leading-5 opacity-80">{gate.detail}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                      {gate.done ? "Done" : "Check"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-[#13251d]">Tester feedback capture</p>
                <p className="text-xs font-semibold text-[#746f66]">Stored locally for the admin observation board</p>
              </div>
            </div>

            <div data-testid="testing-feedback-form" className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Tester name</span>
                <input
                  value={testerName}
                  onChange={(event) => setTesterName(event.target.value)}
                  className="h-11 rounded-md border border-[#dcd5c7] bg-[#fdfaf3] px-3 text-sm font-bold text-[#25382f] outline-none transition focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
                />
              </label>

              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Stage</p>
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
                          : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Severity</p>
                <div className="grid gap-2 sm:grid-cols-4">
                  {severities.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={severity === item}
                      onClick={() => setSeverity(item)}
                      className={cn(
                        "min-h-10 rounded-md border px-3 text-xs font-black transition",
                        severity === item ? severityTone[item] : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
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
                  placeholder="Write what confused the student, what broke, or what felt strong."
                  className="resize-none rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-3 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  data-testid="testing-feedback-save"
                  onClick={saveFeedback}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  <Send className="h-4 w-4" /> Save feedback
                </button>
                {savedMessage ? <p className="text-sm font-bold text-[#085041]">{savedMessage}</p> : null}
              </div>
            </div>

            <div data-testid="testing-feedback-list" className="mt-5 grid gap-2">
              {feedbackEntries.length === 0 ? (
                <div className="rounded-md border border-dashed border-[#dcd5c7] bg-[#f7f4ee] p-4 text-sm font-bold text-[#746f66]">
                  No pilot feedback saved yet.
                </div>
              ) : (
                feedbackEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className={cn("rounded-md border px-2 py-1 text-[11px] font-black", severityTone[entry.severity])}>
                        {entry.severity}
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#746f66]">
                        {entry.stage} / {entry.testerName}
                      </span>
                    </div>
                    <p className="break-words text-sm font-bold leading-6 text-[#34453b]">{entry.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
