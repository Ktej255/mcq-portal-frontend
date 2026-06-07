"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gauge,
  Layers3,
  PlayCircle,
  RefreshCcw,
  ShieldCheck,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getUpscMcqBatchStatus,
  isUpscMcqCommandCleared,
  isUpscMcqRevisitOutcome,
} from "@/lib/upsc/mcqCommandStatus";
import { geographySessions } from "@/lib/upsc/plan";
import { getSubjectBatchCode, subjectPlans, type SubjectSession } from "@/lib/upsc/subjectPlans";
import { buildUpscActionQueue } from "@/lib/upsc/upscActionQueue";
import type { SubjectDayProgress } from "@/lib/upsc/useSubjectProgress";
import { cn } from "@/lib/utils";

type AuditSubject = {
  slug: string;
  title: string;
  window: string;
  href: string;
  sessions: SubjectSession[];
};

type ContentState = {
  videoStatus?: "Planned" | "Drafted" | "Ready";
  notesStatus?: "Planned" | "Drafted" | "Ready";
  transcriptStatus?: "Planned" | "Drafted" | "Ready";
};

type McqState = {
  planned?: number;
  drafted?: number;
  status?: "DRAFT" | "READY";
};

type SubjectAudit = AuditSubject & {
  watched: number;
  reflected: number;
  revisit: number;
  contentReady: number;
  mcqBatchReady: number;
  mcqCommand: number;
  mcqPracticePending: number;
  mcqRevisit: number;
  structureRoutes: number;
  localScore: number;
};

const auditSubjects: AuditSubject[] = [
  {
    slug: "geography",
    title: "Geography",
    window: "June",
    href: "/upsc/geography",
    sessions: geographySessions,
  },
  ...[
    subjectPlans.environment,
    subjectPlans["disaster-management"],
    subjectPlans.economy,
    subjectPlans["science-tech"],
    subjectPlans["polity-governance"],
    subjectPlans["internal-security-society"],
    subjectPlans.history,
  ].map((plan) => ({
    slug: plan.slug,
    title: plan.title,
    window: plan.window,
    href: `/upsc/${plan.slug}`,
    sessions: plan.sessions,
  })),
];

const globalModules = [
  { title: "Daily Mission Control", href: "/upsc/daily-command", status: "Ready" },
  { title: "Yearly Planner", href: "/upsc/yearly-planner", status: "Ready" },
  { title: "Pricing Command", href: "/upsc/pricing", status: "Ready" },
  { title: "Optional Subject Command", href: "/upsc/optional-subjects", status: "Ready" },
  { title: "Syllabus and PYQ Library", href: "/upsc/source-library", status: "Ready" },
  { title: "Content Command Center", href: "/upsc/content-command", status: "Ready" },
  { title: "MCQ Command Center", href: "/upsc/mcq-command", status: "Ready" },
  { title: "Revision Command Center", href: "/upsc/revision-command", status: "Ready" },
  { title: "Readiness Audit Center", href: "/upsc/readiness-audit", status: "Ready" },
];

const loopRooms = ["Command", "Watch", "Talk", "Visual Lab", "MCQ Readiness", "Track", "Revisit"];
const contentStorageKey = "sarit-upsc-content-command-v1";
const mcqStorageKey = "sarit-upsc-mcq-command-v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function progressStorageKey(subjectSlug: string) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

function contentKey(subject: AuditSubject, session: SubjectSession) {
  return `${subject.slug}:D${String(session.day).padStart(2, "0")}`;
}

function batchCode(subject: AuditSubject, session: SubjectSession) {
  return getSubjectBatchCode(subject.slug, session.day);
}

function isContentReady(state?: ContentState) {
  return state?.videoStatus === "Ready" && state?.notesStatus === "Ready" && state?.transcriptStatus === "Ready";
}

function toneForPercent(percent: number) {
  if (percent >= 80) return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (percent >= 35) return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]";
}

export function UpscReadinessAuditCenter() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoaded(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const subjectAudits = useMemo<SubjectAudit[]>(() => {
    if (!isLoaded) {
      return auditSubjects.map((subject) => ({
        ...subject,
        watched: 0,
        reflected: 0,
        revisit: 0,
        contentReady: 0,
        mcqBatchReady: 0,
        mcqCommand: 0,
        mcqPracticePending: 0,
        mcqRevisit: 0,
        structureRoutes: loopRooms.length,
        localScore: 0,
      }));
    }

    const contentStates = readJson<Record<string, ContentState>>(contentStorageKey, {});
    const mcqStates = readJson<Record<string, McqState>>(mcqStorageKey, {});

    return auditSubjects.map((subject) => {
      const progress = readJson<Record<string, SubjectDayProgress>>(progressStorageKey(subject.slug), {});
      const watched = subject.sessions.filter((session) => progress[String(session.day)]?.watched).length;
      const reflected = subject.sessions.filter((session) => progress[String(session.day)]?.reflection?.trim()).length;
      const revisit = subject.sessions.filter((session) => progress[String(session.day)]?.revisitQueued).length;
      const contentReady = subject.sessions.filter((session) => isContentReady(contentStates[contentKey(subject, session)])).length;
      const mcqCounts = subject.sessions.reduce(
        (counts, session) => {
          const activeBatchCode = batchCode(subject, session);
          const dayProgress = progress[String(session.day)];
          const batchStatus = getUpscMcqBatchStatus(mcqStates[activeBatchCode]);
          const commandCleared = isUpscMcqCommandCleared(dayProgress, activeBatchCode);
          const revisitOutcome = isUpscMcqRevisitOutcome(dayProgress, activeBatchCode);

          if (batchStatus.ready) counts.batchReady += 1;
          if (commandCleared) counts.command += 1;
          else if (revisitOutcome) counts.revisit += 1;
          else if (batchStatus.ready) counts.practicePending += 1;

          return counts;
        },
        { batchReady: 0, command: 0, practicePending: 0, revisit: 0 }
      );
      const localScore = Math.round(
        (watched / subject.sessions.length) * 15 +
          (reflected / subject.sessions.length) * 15 +
          (contentReady / subject.sessions.length) * 20 +
          (mcqCounts.batchReady / subject.sessions.length) * 15 +
          (mcqCounts.command / subject.sessions.length) * 35
      );

      return {
        ...subject,
        watched,
        reflected,
        revisit,
        contentReady,
        mcqBatchReady: mcqCounts.batchReady,
        mcqCommand: mcqCounts.command,
        mcqPracticePending: mcqCounts.practicePending,
        mcqRevisit: mcqCounts.revisit,
        structureRoutes: loopRooms.length,
        localScore,
      };
    });
  }, [isLoaded, refreshTick]);

  const totals = useMemo(() => {
    const totalDays = subjectAudits.reduce((sum, subject) => sum + subject.sessions.length, 0);
    const watched = subjectAudits.reduce((sum, subject) => sum + subject.watched, 0);
    const reflected = subjectAudits.reduce((sum, subject) => sum + subject.reflected, 0);
    const revisit = subjectAudits.reduce((sum, subject) => sum + subject.revisit, 0);
    const contentReady = subjectAudits.reduce((sum, subject) => sum + subject.contentReady, 0);
    const mcqBatchReady = subjectAudits.reduce((sum, subject) => sum + subject.mcqBatchReady, 0);
    const mcqCommand = subjectAudits.reduce((sum, subject) => sum + subject.mcqCommand, 0);
    const mcqPracticePending = subjectAudits.reduce((sum, subject) => sum + subject.mcqPracticePending, 0);
    const mcqRevisit = subjectAudits.reduce((sum, subject) => sum + subject.mcqRevisit, 0);
    const structuralRoutes = subjectAudits.reduce((sum, subject) => sum + subject.structureRoutes, 0) + globalModules.length;

    return {
      totalDays,
      watched,
      reflected,
      revisit,
      contentReady,
      mcqBatchReady,
      mcqCommand,
      mcqPracticePending,
      mcqRevisit,
      structuralRoutes,
      structurePercent: 100,
      contentPercent: totalDays ? Math.round((contentReady / totalDays) * 100) : 0,
      batchPercent: totalDays ? Math.round((mcqBatchReady / totalDays) * 100) : 0,
      mcqPercent: totalDays ? Math.round((mcqCommand / totalDays) * 100) : 0,
      reflectionPercent: totalDays ? Math.round((reflected / totalDays) * 100) : 0,
    };
  }, [subjectAudits]);
  const actionQueue = useMemo(() => (isLoaded ? buildUpscActionQueue(10) : []), [isLoaded, refreshTick, subjectAudits]);

  const launchScore = Math.round(
    totals.structurePercent * 0.45 + totals.contentPercent * 0.2 + totals.mcqPercent * 0.2 + totals.reflectionPercent * 0.15
  );

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#1b2f27]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 text-sm font-black">
          Loading UPSC readiness audit...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-[#f7f4ee] text-[#1b2f27]">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <Link href="/upsc" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
              <ArrowLeft className="h-4 w-4" /> UPSC command home
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Readiness Audit</Badge>
              <span className="text-sm font-bold text-[#776f64]">Local launch report</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">Structural build versus content readiness</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
              Audit the UPSC portal before launch.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#5d675f]">
              This page separates what is built from what still needs local content, fresh MCQ batches, MCQ Command
              outcomes, and classroom progress. It reads the same browser-local state used by Daily Mission, Content
              Command, MCQ Command, and Revision Command.
            </p>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#f2eadc]">
              <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${launchScore}%` }} />
            </div>
            <p className="mt-3 text-sm font-black text-[#085041]">Local launch score: {launchScore}%</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              { label: "Built routes", value: totals.structuralRoutes, icon: Layers3, testId: "routes" },
              { label: "Study days", value: totals.totalDays, icon: Target, testId: "days" },
              { label: "Content ready", value: totals.contentReady, icon: BookOpen, testId: "content" },
              { label: "Batch ready", value: totals.mcqBatchReady, icon: ClipboardCheck, testId: "batch" },
              { label: "MCQ command", value: totals.mcqCommand, icon: CheckCircle2, testId: "mcq-command" },
              { label: "Revisit queue", value: totals.revisit, icon: RefreshCcw, testId: "revisit" },
            ].map((item) => (
              <div
                key={item.label}
                data-testid={`audit-total-${item.testId}`}
                className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{item.label}</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-[#13251d]">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Subject audit</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Per-subject readiness</h2>
              </div>
              <BarChart3 className="h-6 w-6 text-[#085041]" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {subjectAudits.map((subject) => (
                <div key={subject.slug} className={cn("rounded-lg border p-4 shadow-sm", toneForPercent(subject.localScore))}>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{subject.window}</p>
                      <h3 className="mt-2 text-lg font-black leading-6 text-[#13251d]">{subject.title}</h3>
                    </div>
                    <Badge variant="outline" className="rounded-md border-[#1d9e75]/40 text-[#085041]">
                      {subject.localScore}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
                    {[
                      ["Days", subject.sessions.length],
                      ["Watch", subject.watched],
                      ["Talk", subject.reflected],
                      ["Content", subject.contentReady],
                      ["Batch", subject.mcqBatchReady],
                      ["Command", subject.mcqCommand],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md bg-white/75 px-2 py-3">
                        <p className="text-lg font-black text-[#13251d]">{value}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#6f756d]">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div
                    data-testid={`audit-mcq-${subject.slug}`}
                    className="mt-4 border-t border-current/15 pt-3 text-xs font-bold leading-5"
                  >
                    <span className="mr-3 inline-block">Practice pending: {subject.mcqPracticePending}</span>
                    <span className="mr-3 inline-block">MCQ revisit: {subject.mcqRevisit}</span>
                    <span className="inline-block">Command cleared: {subject.mcqCommand}/{subject.sessions.length}</span>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Link
                      href={subject.href}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d]"
                    >
                      Open subject <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`${subject.href}/track`}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                    >
                      Track subject
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid min-w-0 gap-5">
            <div
              data-testid="readiness-next-action-queue"
              className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#13251d]">Global next-action queue</p>
                  <p className="text-xs font-semibold text-[#746f66]">Ranked across every UPSC subject</p>
                </div>
              </div>

              {actionQueue.length === 0 ? (
                <div className="rounded-md border border-dashed border-[#dcd5c7] bg-[#fdfaf3] p-5 text-sm font-bold leading-6 text-[#746f66]">
                  No pending local action found. Refresh after using Watch, Talk, Lab, or MCQ rooms.
                </div>
              ) : (
                <div className="grid gap-3">
                  {actionQueue.map((item, index) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn("rounded-md border p-4 transition hover:-translate-y-0.5", item.tone)}
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-75">
                            {index + 1}. {item.subjectTitle} / Day {item.day}
                          </p>
                          <p className="mt-1 break-words text-sm font-black leading-5">{item.statusLabel}</p>
                        </div>
                        <span className="shrink-0 rounded-md bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                          {item.room}
                        </span>
                      </div>
                      <p className="text-xs font-semibold leading-5 opacity-80">{item.detail}</p>
                      <p className="mt-3 inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.12em]">
                        {item.actionLabel} <ArrowRight className="h-3.5 w-3.5" />
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1d9e75] text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#13251d]">Structural modules</p>
                  <p className="text-xs font-semibold text-[#746f66]">Built and route-wired locally</p>
                </div>
              </div>

              <div className="grid gap-3">
                {globalModules.map((module) => (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="flex items-center justify-between gap-3 rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-4 transition hover:border-[#1d9e75]"
                  >
                    <span>
                      <span className="block text-sm font-black text-[#13251d]">{module.title}</span>
                      <span className="mt-1 block text-xs font-semibold text-[#657066]">{module.status}</span>
                    </span>
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1d9e75]" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <Gauge className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#13251d]">Launch gates</p>
                  <p className="text-xs font-semibold text-[#746f66]">What to finish next</p>
                </div>
              </div>

              <div className="grid gap-3">
                {[
                  ["Structural route wiring", `${totals.structurePercent}%`, "All subject loop rooms and global controls are locally built."],
                  ["Content readiness", `${totals.contentPercent}%`, "Mark class videos, notes, and transcripts ready in Content Command."],
                  ["Fresh batch readiness", `${totals.batchPercent}%`, "Draft and mark fresh question batches ready in MCQ Command."],
                  ["MCQ Command outcome", `${totals.mcqPercent}%`, "Students must clear fresh MCQ practice before a day counts as command-ready."],
                  ["Student progress", `${totals.reflectionPercent}%`, "This increases as the student uses Watch and Talk rooms."],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-[#13251d]">{label}</p>
                      <span className="text-sm font-black text-[#085041]">{value}</span>
                    </div>
                    <p className="text-xs font-semibold leading-5 text-[#657066]">{detail}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setRefreshTick((current) => current + 1)}
                className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d]"
              >
                Refresh local audit
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Audit conclusion</p>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">What is built versus what is still data work</h2>
            </div>
            <FileText className="h-6 w-6 text-[#085041]" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Built", "UPSC route structure, subject loops, daily launcher, content, MCQ, revision, and audit controls."],
              ["Local only", "Progress, MCQ batch state, MCQ outcomes, content readiness, and daily mission state are stored in browser localStorage."],
              ["Pending content", "Real lecture assets, full transcripts, and fresh MCQ files still need authoring/import for launch depth."],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-sm font-black text-[#13251d]">{title}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#657066]">{detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
