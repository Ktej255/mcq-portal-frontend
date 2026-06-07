"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, BrainCircuit, CheckCircle2, Route } from "lucide-react";

import { useGeographyStudentOverview } from "@/lib/upsc/useGeographyStudentOverview";

export default function HistoryPage() {
  const overview = useGeographyStudentOverview();
  const cards = [
    {
      label: "Current Path",
      value: `Geography Day ${overview.activeSession.day}`,
      detail: overview.activeSession.title,
      icon: Route,
    },
    {
      label: "Recall Evidence",
      value:
        typeof overview.metrics.latestTalkScore === "number"
          ? `${overview.metrics.latestTalkScore}/100`
          : "Not measured",
      detail: overview.loopState.label,
      icon: BarChart3,
    },
    {
      label: "Practice Trend",
      value:
        typeof overview.metrics.averageMcqScore === "number"
          ? `${overview.metrics.averageMcqScore}% average`
          : "No MCQ result yet",
      detail: `${overview.metrics.mcqCompletedCount} practice set completed`,
      icon: CheckCircle2,
    },
    {
      label: "Session Readiness",
      value: overview.metrics.latestMeTimeMood ? overview.metrics.latestMeTimeMood : "Not checked",
      detail: `${overview.metrics.meTimeCount} start check${overview.metrics.meTimeCount === 1 ? "" : "s"} saved`,
      icon: BrainCircuit,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Progress</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                {overview.metrics.startedCount ? "Your learning evidence" : "Your path is just starting"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Progress grows from completed learning loops, not screen time. Follow the one next action and the trend updates automatically.
              </p>
            </div>
            <Link
              href={overview.loopState.href}
              data-testid="student-progress-primary-action"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              {overview.loopState.cta} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <card.icon className="h-5 w-5 text-[#085041]" />
              <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">{card.label}</p>
              <h2 className="mt-2 text-xl font-black tracking-tight">{card.value}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">{card.detail}</p>
            </div>
          ))}
        </section>

        <section className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <h2 className="text-lg font-black tracking-tight">Geography evidence</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Started", overview.metrics.startedCount],
              ["Watched", overview.metrics.watchedCount],
              ["Command", overview.metrics.commandCount],
              ["Recovery", overview.metrics.revisitCount],
              ["Start checks", overview.metrics.meTimeCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-[#e4dccf] bg-[#f7f4ee] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                <p className="mt-2 text-2xl font-black">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section data-testid="student-question-bank-entry" className="mt-5 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">Custom practice</p>
              <h2 className="mt-1 text-xl font-black tracking-tight">Build an MCQ set from your evidence</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#49675e]">
                Difficulty is recommended from recall, MCQ marks, recovery queue, consistency, and command days.
              </p>
            </div>
            <Link
              href="/upsc/question-bank"
              className="inline-flex min-h-11 items-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              Open question bank <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
