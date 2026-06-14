"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileCheck2,
  FileSearch,
  Gauge,
  Layers3,
  LineChart,
  Radar,
  Route,
  ShieldCheck,
  Target,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buildPrelims2026ArchiveProofReadiness } from "@/lib/upsc/prelims2026ArchiveProofReadiness";
import { buildPrelims2026BuildReadiness } from "@/lib/upsc/prelims2026BuildReadiness";
import { buildPrelims2026QuestionLedgerPublic } from "@/lib/upsc/prelims2026QuestionLedgerPublic";
import { buildPrelims2026ShowcaseManifest } from "@/lib/upsc/prelims2026ShowcaseManifest";
import { buildPrelims2027CourseActionPublic } from "@/lib/upsc/prelims2027CourseActionPublic";
import type { SourceArchiveIntakeResponse } from "@/lib/upsc/sourceArchiveIntake";
import { cn } from "@/lib/utils";

type ArchiveReadiness = ReturnType<typeof buildPrelims2026ArchiveProofReadiness>;

type SourceReadinessState = {
  status: "loading" | "ready" | "error";
  message: string;
  data: ArchiveReadiness | null;
};

type CommandLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  tone: string;
};

const phaseOrder = ["Source", "Capsule", "MCQ", "Proof", "Release", "Planner"] as const;

const commandLinks: CommandLink[] = [
  {
    label: "Open public showcase",
    href: "/upsc-prelims-2026-showcase",
    icon: BarChart3,
    tone: "border-[#1b6b4a]/30 bg-[#eef7f1] text-[#154f39]",
  },
  {
    label: "Open strategy command",
    href: "/upsc/prelims-2027-strategy",
    icon: Route,
    tone: "border-[#315f86]/30 bg-[#edf5fb] text-[#234e70]",
  },
  {
    label: "Open question proof queue",
    href: "/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue",
    icon: ClipboardCheck,
    tone: "border-[#b97817]/30 bg-[#fff6e7] text-[#754b10]",
  },
];

const actionLaneIcons: LucideIcon[] = [ShieldCheck, FileCheck2, Database, Target, BookOpenCheck, Gauge];

function formatNumber(value: number | string | null | undefined) {
  if (value === null || typeof value === "undefined") return "Checking";
  if (typeof value === "string") return value;
  return new Intl.NumberFormat("en-IN").format(value);
}

function priorityTone(priority: string) {
  if (priority === "Critical") return "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]";
  if (priority === "High") return "border-[#ef9f27] bg-[#fff5df] text-[#74500f]";
  if (priority === "Medium") return "border-[#3f7ea5] bg-[#eef7fb] text-[#235a77]";
  if (priority === "Low") return "border-[#6d8b74] bg-[#f1f7ef] text-[#38583d]";
  return "border-[#a19a8d] bg-[#f7f4ee] text-[#5f574b]";
}

export function UpscPrelimsReviewCommand() {
  const manifest = useMemo(() => buildPrelims2026ShowcaseManifest(), []);
  const readiness = useMemo(() => buildPrelims2026BuildReadiness(), []);
  const questionLedger = useMemo(() => buildPrelims2026QuestionLedgerPublic(), []);
  const courseAction = useMemo(() => buildPrelims2027CourseActionPublic(), []);
  const [sourceReadiness, setSourceReadiness] = useState<SourceReadinessState>({
    status: "loading",
    message: "Checking source archive",
    data: null,
  });

  useEffect(() => {
    let active = true;

    fetch("/api/upsc/source-archive", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as SourceArchiveIntakeResponse;
        if (!response.ok) {
          throw new Error(payload.message || "Source archive is not reachable.");
        }
        return buildPrelims2026ArchiveProofReadiness(payload);
      })
      .then((data) => {
        if (!active) return;
        setSourceReadiness({
          status: "ready",
          message: data.sourceConnected ? "Archive connected" : "Archive unavailable",
          data,
        });
      })
      .catch((error) => {
        if (!active) return;
        setSourceReadiness({
          status: "error",
          message: error instanceof Error ? error.message : "Source archive check failed.",
          data: null,
        });
      });

    return () => {
      active = false;
    };
  }, []);

  const sourceData = sourceReadiness.data;
  const corrected = manifest.audit.corrected;
  const releaseReadyCount = readiness.requirements.filter((requirement) => requirement.status === "Complete").length;
  const proofLockedCount = readiness.requirements.filter((requirement) => requirement.status === "Proof locked").length;
  const buildFromScratchCount = courseAction.reallocationPlan.filter(
    (decision) => decision.decision === "Build from scratch"
  ).length;

  const actionLanes = [
    {
      title: "Website Release",
      status: "Public safe",
      metric: `${corrected.effectiveCoveragePercent}%`,
      detail: "Corrected audit, trend story, source summary and software path can be connected to the main site.",
      href: "/upsc-prelims-2026-showcase#main-website-manifest-contract",
    },
    {
      title: "MCQ Proof Lock",
      status: "Needs packet approval",
      metric: `${questionLedger.summary.completeQuestionCards}/${questionLedger.summary.totalQuestions}`,
      detail: "Every question has complete stem, options, answer, match scope and highlighted candidate portions.",
      href: "/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue",
    },
    {
      title: "Source Archive Triage",
      status: sourceReadiness.status === "ready" ? sourceReadiness.message : "Checking",
      metric: sourceData ? `${sourceData.candidateQuestions}/${sourceData.totalQuestions}` : "Live",
      detail: "Archive candidates are internal signals until source, page and teacher validation are retained.",
      href: "/upsc/prelims-2027-strategy#prelims-2026-source-gap-work-orders",
    },
    {
      title: "2027 Reallocation",
      status: "Action mapped",
      metric: `${courseAction.summary.priorityCount} lanes`,
      detail: "Critical gaps become build-from-scratch or depth-upgrade tracks with owner surfaces.",
      href: "/upsc/prelims-2027-strategy#prelims-2027-reallocation-board",
    },
    {
      title: "Practice Build",
      status: "Blueprint ready",
      metric: `${courseAction.summary.practiceBlueprintCount} sets`,
      detail: "New practice banks move toward multi-statement, pair-list, caselet and how-many-correct formats.",
      href: "/upsc/prelims-2027-strategy#prelims-2027-practice-blueprints",
    },
    {
      title: "Delivery Tracking",
      status: "Portal owned",
      metric: `${courseAction.summary.taskCount} tasks`,
      detail: "Source, capsule, MCQ, proof, release and planner work can be tracked from the strategy board.",
      href: "/upsc/prelims-2027-strategy#prelims-2027-delivery-dashboard",
    },
  ];

  const metricCards = [
    {
      label: "Corrected coverage",
      value: `${corrected.effectiveCoveragePercent}%`,
      detail: `${corrected.preparedQuestions}/${corrected.scorableQuestions} scorable questions prepared directly or partially.`,
      icon: Gauge,
    },
    {
      label: "Complete MCQ cards",
      value: questionLedger.summary.completeQuestionCards,
      detail: `${questionLedger.summary.optionSets} option sets and ${questionLedger.summary.statementCoverageRows} statement rows.`,
      icon: ClipboardCheck,
    },
    {
      label: "Statement-heavy paper",
      value: questionLedger.summary.multiStatementQuestions,
      detail: "Questions used multi-statement or pair-list logic and need format rebuilding.",
      icon: Layers3,
    },
    {
      label: "Archive candidates",
      value: sourceData?.candidateQuestions ?? "Checking",
      detail: sourceData
        ? `${sourceData.blindSpotQuestions} blind spots require source-gap work orders.`
        : sourceReadiness.message,
      icon: Database,
    },
    {
      label: "2027 priorities",
      value: courseAction.summary.priorityCount,
      detail: `${courseAction.summary.criticalPriorityCount} critical lanes and ${buildFromScratchCount} build-from-scratch decisions.`,
      icon: Target,
    },
    {
      label: "Execution tasks",
      value: courseAction.summary.taskCount,
      detail: `${courseAction.summary.formatRuleCount} format rules and ${courseAction.summary.practiceBlueprintCount} practice blueprints.`,
      icon: FileCheck2,
    },
  ];

  return (
    <main
      data-testid="prelims-review-command"
      data-effective-coverage={corrected.effectiveCoveragePercent}
      data-question-count={questionLedger.summary.totalQuestions}
      data-complete-questions={questionLedger.summary.completeQuestionCards}
      data-statement-rows={questionLedger.summary.statementCoverageRows}
      data-multi-statement-questions={questionLedger.summary.multiStatementQuestions}
      data-priority-count={courseAction.summary.priorityCount}
      data-critical-priority-count={courseAction.summary.criticalPriorityCount}
      data-task-count={courseAction.summary.taskCount}
      data-practice-blueprint-count={courseAction.summary.practiceBlueprintCount}
      data-build-from-scratch-count={buildFromScratchCount}
      data-source-status={sourceReadiness.status}
      data-source-candidate-questions={sourceData?.candidateQuestions ?? "loading"}
      data-source-blind-spots={sourceData?.blindSpotQuestions ?? "loading"}
      className="min-h-screen bg-[#f4f7f1] text-[#13251d]"
    >
      <section className="border-b border-[#cbd8ce] bg-[#fffdf8]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="border border-[#1b6b4a]/25 bg-[#eef7f1] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#154f39]">
                2026 Review to 2027 Action
              </Badge>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-[#10251c] md:text-5xl">
                Prelims Review Command
              </h1>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#51645a]">
                One operator board for the corrected 2026 audit, complete MCQ evidence, public website handoff,
                archive proof triage and 2027 course rebuild.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:w-[560px]">
              {commandLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  data-testid="prelims-review-command-quick-link"
                  className={cn(
                    "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-center text-[11px] font-black uppercase tracking-[0.08em] transition hover:bg-white",
                    link.tone
                  )}
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {metricCards.map((card) => (
            <div key={card.label} className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6a756d]">{card.label}</p>
                <card.icon className="h-4 w-4 text-[#1b6b4a]" />
              </div>
              <p className="mt-3 text-3xl font-black tracking-tight text-[#11251d]">{formatNumber(card.value)}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">{card.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#cbd8ce] bg-[#eef6f1]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1b6b4a]">Operating path</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#12251d]">What goes where now</h2>
            </div>
            <p className="max-w-2xl text-sm font-semibold leading-6 text-[#53645b]">
              Public story, internal source proof, MCQ claim release and 2027 rebuild work are separated so the main
              website can publish safely while the portal keeps the evidence work moving.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {actionLanes.map((lane, index) => {
              const Icon = actionLaneIcons[index] ?? Route;

              return (
                <Link
                  key={lane.title}
                  href={lane.href}
                  data-testid="prelims-review-command-action-lane"
                  data-title={lane.title}
                  className="group rounded-lg border border-[#cbd8ce] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1b6b4a]/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef7f1] text-[#1b6b4a]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge className="border border-[#d7c8a9] bg-[#fff7e8] text-[10px] font-black uppercase tracking-[0.12em] text-[#765313]">
                      {lane.status}
                    </Badge>
                  </div>
                  <h3 className="mt-4 text-lg font-black tracking-tight text-[#13251d]">{lane.title}</h3>
                  <p className="mt-2 text-2xl font-black text-[#1b6b4a]">{lane.metric}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">{lane.detail}</p>
                  <span className="mt-4 inline-flex items-center text-xs font-black uppercase tracking-[0.1em] text-[#1b6b4a]">
                    Open owner route
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:px-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1b6b4a]">
                2027 build lanes
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#12251d]">
                Course corrections from the final research
              </h2>
            </div>
            <Link
              href="/upsc/prelims-2027-strategy#prelims-2027-task-ledger"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#1b6b4a]/30 bg-[#eef7f1] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#154f39] transition hover:bg-white"
            >
              Task ledger
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-[#cbd8ce] bg-white shadow-sm">
            {courseAction.priorities.map((priority) => (
              <Link
                key={priority.id}
                href={priority.targetRoute}
                data-testid="prelims-review-command-priority-row"
                data-priority-id={priority.id}
                data-priority={priority.priority}
                data-task-count={priority.taskCount}
                className="grid gap-4 border-b border-[#e1ddd2] p-4 transition last:border-b-0 hover:bg-[#f8fbf7] lg:grid-cols-[0.9fr_1.2fr_0.8fr]"
              >
                <div>
                  <Badge className={cn("border text-[10px] font-black uppercase tracking-[0.12em]", priorityTone(priority.priority))}>
                    {priority.priority}
                  </Badge>
                  <h3 className="mt-3 text-base font-black tracking-tight text-[#12251d]">{priority.subject}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-[#7a7468]">{priority.window}</p>
                </div>
                <p className="text-sm font-semibold leading-6 text-[#53645b]">{priority.action}</p>
                <div className="text-sm font-bold text-[#31453a]">
                  <p>{priority.taskCount} tasks</p>
                  <p>{priority.blueprintCount} blueprints</p>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.1em] text-[#1b6b4a]">Open subject lane</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <section
            data-testid="prelims-review-command-source-readiness"
            data-status={sourceReadiness.status}
            data-candidate-questions={sourceData?.candidateQuestions ?? "loading"}
            data-blind-spots={sourceData?.blindSpotQuestions ?? "loading"}
            className="rounded-lg border border-[#cbd8ce] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1b6b4a]">Archive readiness</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-[#12251d]">Source proof queue</h2>
              </div>
              <FileSearch className="h-5 w-5 text-[#1b6b4a]" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#dfe7de] bg-[#f8fbf7] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#68786d]">Candidates</p>
                <p className="mt-2 text-2xl font-black text-[#12251d]">
                  {formatNumber(sourceData?.candidateQuestions ?? "Checking")}
                </p>
              </div>
              <div className="rounded-lg border border-[#dfe7de] bg-[#f8fbf7] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#68786d]">Blind spots</p>
                <p className="mt-2 text-2xl font-black text-[#12251d]">
                  {formatNumber(sourceData?.blindSpotQuestions ?? "Checking")}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm font-semibold leading-6 text-[#53645b]">
              {sourceData
                ? `${sourceData.needsProofWithCandidates} questions need retained source proof; ${sourceData.sourceGapWorkOrdersRequired} require source-gap work orders.`
                : sourceReadiness.message}
            </p>
            <Link
              href="/upsc/prelims-2027-strategy#prelims-2026-source-gap-work-orders"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-[#1b6b4a]/30 bg-[#eef7f1] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#154f39] transition hover:bg-white"
            >
              Source-gap work orders
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </section>

          <section className="rounded-lg border border-[#cbd8ce] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1b6b4a]">Build phases</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-[#12251d]">Task distribution</h2>
              </div>
              <LineChart className="h-5 w-5 text-[#1b6b4a]" />
            </div>

            <div className="mt-5 space-y-3">
              {phaseOrder.map((phase) => {
                const count = courseAction.summary.phaseCounts[phase];
                const width = `${Math.max(12, (count / courseAction.summary.taskCount) * 100)}%`;

                return (
                  <div key={phase}>
                    <div className="flex items-center justify-between gap-4 text-xs font-black uppercase tracking-[0.12em] text-[#56655d]">
                      <span>{phase}</span>
                      <span>{count}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-[#e4eadf]">
                      <div className="h-2 rounded-full bg-[#1b6b4a]" style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </section>

      <section className="border-t border-[#cbd8ce] bg-[#fffdf8]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-[#cbd8ce] bg-white p-5 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-[#1b6b4a]" />
              <h3 className="mt-3 text-lg font-black tracking-tight text-[#12251d]">Main-site release gate</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">
                {releaseReadyCount} requirements are complete and {proofLockedCount} remain proof-locked before exact
                question-wise claims can be published.
              </p>
              <Link
                href="/api/upsc/prelims-2026/release-decision"
                data-testid="prelims-review-command-main-site-link"
                className="mt-4 inline-flex items-center text-xs font-black uppercase tracking-[0.1em] text-[#1b6b4a]"
              >
                Release-decision API
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-lg border border-[#cbd8ce] bg-white p-5 shadow-sm">
              <Radar className="h-5 w-5 text-[#1b6b4a]" />
              <h3 className="mt-3 text-lg font-black tracking-tight text-[#12251d]">Surprise-to-action matrix</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">
                Critical IR and new-domain S&T gaps now sit beside legal-current, map, source-depth and revision
                decisions for 2027.
              </p>
              <Link
                href="/upsc-prelims-2026-showcase#surprise-action-matrix"
                className="mt-4 inline-flex items-center text-xs font-black uppercase tracking-[0.1em] text-[#1b6b4a]"
              >
                Public matrix
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-lg border border-[#cbd8ce] bg-white p-5 shadow-sm">
              <BookOpenCheck className="h-5 w-5 text-[#1b6b4a]" />
              <h3 className="mt-3 text-lg font-black tracking-tight text-[#12251d]">Practice system handoff</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">
                MCQ rebuilding should flow into subject lanes, question bank, revision command and yearly planner
                tracking.
              </p>
              <Link
                href="/upsc/mcq-command"
                className="mt-4 inline-flex items-center text-xs font-black uppercase tracking-[0.1em] text-[#1b6b4a]"
              >
                MCQ command
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 md:grid-cols-3">
            {[
              ["Review command", readiness.api.reviewCommand],
              ["Build readiness", readiness.api.buildReadiness],
              ["Question ledger", questionLedger.api.questionLedger],
              ["Course action", courseAction.api.courseAction],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-[#dfe7de] bg-white px-3 py-2 text-sm font-bold text-[#34453b] transition hover:border-[#1b6b4a]/45"
              >
                <span>{label}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#1b6b4a]" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
