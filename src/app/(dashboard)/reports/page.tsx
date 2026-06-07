"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, BrainCircuit, CalendarDays, FileText, Focus, LibraryBig, Target, TriangleAlert } from "lucide-react";

import { buildGeographyReportSnapshot, type GeographyReportWindow } from "@/lib/upsc/geographyReportEngine";
import {
  buildUpscStudentReportSnapshot,
  readLocalStudentReportProgress,
  studentReportSubjects,
  type StudentReportWindow,
  type StudentReportProgressMap,
} from "@/lib/upsc/studentReportEngine";
import { useGeographyStudentOverview } from "@/lib/upsc/useGeographyStudentOverview";
import { useGeographyProgress } from "@/lib/upsc/useGeographyProgress";

export default function ReportsPage() {
  const overview = useGeographyStudentOverview();
  const { progress } = useGeographyProgress();
  const [progressBySubject, setProgressBySubject] = useState<Record<string, StudentReportProgressMap>>({});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProgressBySubject(
        Object.fromEntries(
          studentReportSubjects.map((subject) => [subject.slug, readLocalStudentReportProgress(subject.slug)])
        )
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const report = buildGeographyReportSnapshot(progress);
  const allSubjectReport = useMemo(
    () => buildUpscStudentReportSnapshot(progressBySubject),
    [progressBySubject]
  );
  const headline = overview.hasUrgentRecovery
    ? `${overview.metrics.revisitCount} recovery item${overview.metrics.revisitCount === 1 ? "" : "s"} need attention`
    : overview.metrics.startedCount
      ? "No queued gap right now"
      : "No real gap yet";

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Learning Gaps</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{headline}</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                The portal measures gaps from your recall and practice evidence. Work on one weak point, then move ahead.
              </p>
            </div>
            <Link
              href={overview.loopState.href}
              data-testid="student-gap-primary-action"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              {overview.loopState.cta} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        <section data-testid="upsc-all-subject-report" className="mt-5 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-7">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <LibraryBig className="h-5 w-5 text-[#085041]" />
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">
                  UPSC all-subject report
                </p>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                {allSubjectReport.totals.growthPercent}% movement across the full plan
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                Started from: {allSubjectReport.growth.startedFrom}. Current position: {allSubjectReport.growth.currentPosition}.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Started", `${allSubjectReport.totals.startedDays}/${allSubjectReport.totals.totalDays}`],
                ["Weekly reports", allSubjectReport.totals.weeklyWindowsGenerated],
                ["Recovery", allSubjectReport.totals.recoveryItems],
                ["AI gaps", allSubjectReport.totals.teacherDoubtCount],
                ["Recall", allSubjectReport.totals.averageRecall === null ? "Not measured" : `${allSubjectReport.totals.averageRecall}/100`],
                ["MCQ", allSubjectReport.totals.averageMcq === null ? "No score" : `${allSubjectReport.totals.averageMcq}%`],
                ["Me-time", allSubjectReport.totals.meTimeChecks],
                ["Current affairs", allSubjectReport.totals.currentAffairsUnlocked],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#b9d9cd] bg-white/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#085041]">{label}</p>
                  <p className="mt-1 text-lg font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {allSubjectReport.subjects.map((subject) => (
              <Link
                key={subject.slug}
                href={subject.route}
                data-testid="upsc-subject-report-card"
                data-subject-slug={subject.slug}
                className="rounded-lg border border-[#b9d9cd] bg-white/70 p-4 transition hover:border-[#1d9e75]"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#085041]">{subject.window}</p>
                    <h3 className="mt-1 text-base font-black tracking-tight text-[#13251d]">{subject.title}</h3>
                  </div>
                  <span className="rounded-md bg-[#e7f5ee] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">
                    {subject.monthlyVerdict}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    ["Start", `${subject.startedDays}/${subject.totalDays}`],
                    ["Cmd", subject.commandDays],
                    ["Fix", subject.recoveryItems],
                    ["AI", subject.teacherDoubtCount],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-[#f7f4ee] p-2">
                      <p className="text-sm font-black text-[#13251d]">{value}</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#657066]">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-[#d7e8df] bg-white/80 p-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#657066]">Readiness</p>
                    <p className="mt-1 text-xs font-black leading-4 text-[#13251d]">{subject.readinessSignal}</p>
                  </div>
                  <div className="rounded-md border border-[#d7e8df] bg-white/80 p-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#657066]">Covered News</p>
                    <p className="mt-1 text-xs font-black leading-4 text-[#13251d]">{subject.currentAffairsUnlocked} hook{subject.currentAffairsUnlocked === 1 ? "" : "s"}</p>
                  </div>
                </div>
                {subject.latestTeacherDoubtCategory && subject.latestTeacherDoubtAction ? (
                  <div className="mt-3 rounded-md border border-[#ef9f27]/35 bg-[#fff8e8] p-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9a6a16]">
                      Latest AI gap: {subject.latestTeacherDoubtCategory}
                    </p>
                    <p className="mt-1 text-xs font-bold leading-5 text-[#5d3a05]">{subject.latestTeacherDoubtAction}</p>
                  </div>
                ) : null}
                <p className="mt-3 text-xs font-semibold leading-5 text-[#49675e]">{subject.nextAction}</p>
              </Link>
            ))}
          </div>
        </section>

        <section
          data-testid="upsc-all-subject-report-windows"
          className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Generated reports
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Weekly and monthly UPSC command reports</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                These windows are generated from all subject progress, not only Geography. AI gaps, recovery, recall,
                MCQ, me-time, and covered news all affect the verdict.
              </p>
            </div>
            <CalendarDays className="h-6 w-6 text-[#1a3a2a]" />
          </div>
          <div className="grid gap-3 xl:grid-cols-[1fr_0.9fr]">
            <AllSubjectReportWindowCard report={allSubjectReport.monthly} variant="monthly" />
            <div className="grid gap-3 md:grid-cols-2">
              {allSubjectReport.weekly.slice(0, 4).map((week) => (
                <AllSubjectReportWindowCard key={week.id} report={week} variant="weekly" />
              ))}
            </div>
          </div>
        </section>

        <section data-testid="upsc-report-evidence-streams" className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Auto report</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Weekly and monthly evidence summary</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Reports are generated from recall, MCQ, recovery, me-time, and covered-topic current-affairs evidence.
              </p>
            </div>
            <FileText className="h-6 w-6 text-[#1a3a2a]" />
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {report.evidenceStreams.map((stream) => (
              <div key={stream.label} className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{stream.label}</p>
                <p className="mt-2 text-xl font-black tracking-tight">{stream.value}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#657066]">{stream.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section data-testid="upsc-growth-scale" className="mt-5 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-7">
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <BrainCircuit className="h-5 w-5 text-[#085041]" />
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">Growth scale</p>
              </div>
              <h2 className="text-2xl font-black tracking-tight">{report.growth.growthPercent}% Geography movement</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                Started from: {report.growth.startedFrom}. Current position: {report.growth.currentPosition}.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#b9d9cd] bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#085041]">Strongest signal</p>
                <p className="mt-2 text-lg font-black">{report.growth.strongestSignal}</p>
              </div>
              <div className="rounded-lg border border-[#b9d9cd] bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#085041]">Needs attention</p>
                <p className="mt-2 text-lg font-black">{report.growth.weakestSignal}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <TriangleAlert className="h-5 w-5 text-[#6f4a12]" />
            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Recovery Queue</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">{overview.metrics.revisitCount} topic</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">Only measured weak points enter this list.</p>
          </div>
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <Focus className="h-5 w-5 text-[#085041]" />
            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Current Focus</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">Day {overview.activeSession.day}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">{overview.activeSession.title}</p>
          </div>
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <Target className="h-5 w-5 text-[#085041]" />
            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Next Step</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">{overview.loopState.label}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">{overview.loopState.shortDetail}</p>
          </div>
        </section>

        <section data-testid="upsc-weekly-reports" className="mt-5 grid gap-4 lg:grid-cols-2">
          {report.weekly.map((week) => (
            <ReportWindowCard key={week.id} report={week} variant="weekly" />
          ))}
        </section>

        <section data-testid="upsc-monthly-report" className="mt-5">
          <ReportWindowCard report={report.monthly} variant="monthly" />
        </section>

        <section className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <h2 className="text-lg font-black tracking-tight">Your recovery list</h2>
          <div className="mt-4 space-y-3">
            {overview.gapRows.map((row) => (
              <div
                key={row.day}
                className="grid gap-3 rounded-md border border-[#e4dccf] bg-[#f7f4ee] p-4 md:grid-cols-[0.2fr_0.8fr_0.8fr_1.1fr_auto] md:items-center"
              >
                <p className="text-xs font-black uppercase text-[#1d9e75]">D{row.day}</p>
                <p className="text-sm font-black">{row.topic}</p>
                <p className="text-sm font-semibold text-[#6f4a12]">{row.status}</p>
                <p className="text-sm font-medium leading-6 text-[#657066]">{row.detail}</p>
                <Link href={row.href} className="text-sm font-black text-[#085041] hover:underline">
                  {row.label}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function AllSubjectReportWindowCard({
  report,
  variant,
}: {
  report: StudentReportWindow;
  variant: "weekly" | "monthly";
}) {
  return (
    <article
      data-testid={variant === "monthly" ? "upsc-all-subject-monthly-report" : "upsc-all-subject-weekly-report"}
      data-report-id={report.id}
      className={`rounded-lg border p-4 shadow-sm ${
        variant === "monthly" ? "border-[#b9d9cd] bg-[#e7f5ee]" : "border-[#dcd5c7] bg-[#f7f4ee]"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{report.range}</p>
          <h3 className="mt-1 text-lg font-black tracking-tight">{report.title}</h3>
        </div>
        <span className="rounded-md border border-[#b9d9cd] bg-white/80 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">
          {report.verdict}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ["Started", `${report.startedDays}/${report.totalDays}`],
          ["Recall", report.averageRecall === null ? "Not measured" : `${report.averageRecall}/100`],
          ["MCQ", report.averageMcq === null ? "No score" : `${report.averageMcq}%`],
          ["AI gaps", report.teacherDoubtCount],
          ["Me-time", report.meTimeChecks],
          ["News", report.currentAffairsUnlocked],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-[#dcd5c7] bg-white/75 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
            <p className="mt-1 text-base font-black">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-md border border-[#dcd5c7] bg-white/75 p-3 text-xs font-bold leading-5 text-[#4f5e55]">
        {report.nextAction}
      </p>
    </article>
  );
}

function ReportWindowCard({
  report,
  variant,
}: {
  report: GeographyReportWindow;
  variant: "weekly" | "monthly";
}) {
  return (
    <article
      data-testid={variant === "weekly" ? "upsc-weekly-report" : "upsc-monthly-report-card"}
      className={`rounded-lg border p-5 shadow-sm ${
        variant === "monthly" ? "border-[#b9d9cd] bg-[#e7f5ee]" : "border-[#dcd5c7] bg-[#fffdf8]"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">{report.range}</p>
          <h2 className="mt-1 text-xl font-black tracking-tight">{report.title}</h2>
        </div>
        {variant === "monthly" ? <BarChart3 className="h-5 w-5 text-[#085041]" /> : <CalendarDays className="h-5 w-5 text-[#085041]" />}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ["Started", `${report.startedDays}/${report.totalDays}`],
          ["Recall", report.averageRecall === null ? "Not measured" : `${report.averageRecall}/100`],
          ["MCQ", report.averageMcq === null ? "No score" : `${report.averageMcq}%`],
          ["Recovery", report.recoveryItems],
          ["Me-time", report.meTimeChecks],
          ["Current affairs", report.currentAffairsUnlocked],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-[#dcd5c7] bg-white/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
            <p className="mt-1 text-base font-black">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-md border border-[#dcd5c7] bg-white/70 p-3">
        <p className="text-sm font-black text-[#13251d]">{report.verdict}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-[#657066]">{report.nextAction}</p>
      </div>
    </article>
  );
}
