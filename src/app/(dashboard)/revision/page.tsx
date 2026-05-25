"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, RefreshCcw, Repeat2 } from "lucide-react";

const revisionPlan = [
  "Redraw latitude and longitude without looking at notes.",
  "Explain rotation, revolution, solstice, and equinox in your own words.",
  "Reattempt only the questions you miss in the first MCQ practice.",
];

export default function RevisionPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Revise</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Your next revision is after practice</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Revision should not become another full class. After practice, come back here and recover only the weak
                part of today&apos;s topic.
              </p>
            </div>
            <Link
              href="/upsc/geography/mcq-readiness?day=1"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              Practice First <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
              <CalendarClock className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Timing</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">Today, after MCQ</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">
              First attempt creates the real gap. Then revision becomes precise instead of random.
            </p>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff4df] text-[#6f4a12]">
                <RefreshCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Revision Checklist</p>
                <h2 className="text-xl font-black tracking-tight">Do only these three things</h2>
              </div>
            </div>
            <div className="space-y-3">
              {revisionPlan.map((item, index) => (
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
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                <Repeat2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">After revision</h2>
                <p className="text-sm font-medium text-[#657066]">Reattempt the wrong questions and then move ahead.</p>
              </div>
            </div>
            <Link
              href="/upsc/geography/revisit?day=1"
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
