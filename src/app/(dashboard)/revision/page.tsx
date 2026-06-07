"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, RefreshCcw, Repeat2 } from "lucide-react";

import { useGeographyStudentOverview } from "@/lib/upsc/useGeographyStudentOverview";

export default function RevisionPage() {
  const overview = useGeographyStudentOverview();
  const primaryHref = overview.hasUrgentRecovery ? overview.revisionHref : overview.loopState.href;
  const primaryLabel = overview.hasUrgentRecovery ? "Open recovery" : overview.loopState.cta;
  const checklist = (overview.revisionSource.subtopics ?? []).slice(0, 3);
  const fallbackChecklist = [
    `Explain ${overview.revisionSource.title} without opening notes.`,
    "Add one map or mechanism proof.",
    "Name one UPSC trap before retesting.",
  ];

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Revise</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                {overview.hasUrgentRecovery ? "Repair the weak point now" : "Your next revision is scheduled"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Revision stays short: recall the weak idea, prove it once, then return to the next step.
              </p>
            </div>
            <Link
              href={primaryHref}
              data-testid="student-revision-primary-action"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              {primaryLabel} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <CalendarClock className="h-5 w-5 text-[#085041]" />
            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Next Recall</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">Day {overview.revisionSource.day}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">
              {overview.hasUrgentRecovery
                ? `${overview.revisionSource.title} needs recovery before new work.`
                : `${overview.revisionSource.title} is due on study Day ${overview.revisionDue.day}.`}
            </p>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <RefreshCcw className="h-5 w-5 text-[#6f4a12]" />
              <h2 className="text-xl font-black tracking-tight">Three-point recovery</h2>
            </div>
            <div className="mt-4 space-y-3">
              {(checklist.length === 3 ? checklist : fallbackChecklist).map((item, index) => (
                <div key={item} className="flex gap-3 rounded-md border border-[#e4dccf] bg-[#f7f4ee] p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-xs font-black text-[#1a3a2a]">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold leading-6 text-[#4f5e55]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Repeat2 className="h-5 w-5 text-[#085041]" />
              <div>
                <h2 className="text-lg font-black tracking-tight">Recovery room</h2>
                <p className="text-sm font-medium text-[#657066]">Open the focused note only when a weak point is queued.</p>
              </div>
            </div>
            <Link
              href={overview.revisionHref}
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
            >
              Open Revisit Room
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
