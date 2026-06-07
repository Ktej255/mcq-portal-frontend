"use client";

import Link from "next/link";
import { ArrowRight, Focus, Target, TriangleAlert } from "lucide-react";

import { useGeographyStudentOverview } from "@/lib/upsc/useGeographyStudentOverview";

export default function ReportsPage() {
  const overview = useGeographyStudentOverview();
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
