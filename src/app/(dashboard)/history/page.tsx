"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Clock3, Route } from "lucide-react";

const progressCards = [
  {
    label: "Current Path",
    value: "Geography Day 1",
    detail: "Earth as a System is the active class block.",
    icon: Route,
  },
  {
    label: "Practice Status",
    value: "Not attempted yet",
    detail: "The first score will appear after the fresh MCQ set.",
    icon: CheckCircle2,
  },
  {
    label: "Study Trend",
    value: "Baseline forming",
    detail: "Watch, explain, practice, revise. That loop will build your trend.",
    icon: BarChart3,
  },
];

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Progress</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Your path is just starting</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Once you complete the first Geography practice, this page will show score trend, accuracy trend,
                and whether your revision is actually improving weak topics.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              Back to Today
            </Link>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          {progressCards.map((card) => (
            <div key={card.label} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                <card.icon className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">{card.label}</p>
              <h2 className="mt-2 text-xl font-black tracking-tight">{card.value}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">{card.detail}</p>
            </div>
          ))}
        </section>

        <section className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff4df] text-[#6f4a12]">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Next milestone</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#5d675f]">
                  Finish the Day 1 loop: learn the concept, explain it once, then attempt the fresh practice.
                </p>
              </div>
            </div>
            <Link
              href="/upsc/geography/watch?day=1"
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
