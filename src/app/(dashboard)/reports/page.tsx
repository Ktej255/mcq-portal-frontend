"use client";

import Link from "next/link";
import { ArrowRight, Focus, Target, TriangleAlert } from "lucide-react";

const gapRows = [
  {
    topic: "Earth as a System",
    status: "Waiting for first attempt",
    action: "Watch the concept and attempt the fresh MCQ set.",
  },
  {
    topic: "Latitude and Longitude",
    status: "Baseline pending",
    action: "Explain the idea once in Talk Room before practice.",
  },
  {
    topic: "Rotation and Revolution",
    status: "Baseline pending",
    action: "Use the visual lab if the concept feels abstract.",
  },
];

export default function ReportsPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Learning Gaps</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">No real gap yet</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Your gap report should be based on answers, not guesswork. Complete the first Geography practice and this
                page will become your recovery list.
              </p>
            </div>
            <Link
              href="/upsc/geography/mcq-readiness?day=1"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              Start MCQ <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#fff4df] text-[#6f4a12]">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Gap</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">Not measured</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">The first practice will reveal weak points.</p>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
              <Focus className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Focus</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">One topic only</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">Today&apos;s focus stays on Earth as a System.</p>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
              <Target className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Recovery</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">After attempt</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">Wrong answers will decide what to revise.</p>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <h2 className="text-lg font-black tracking-tight">What will be checked first</h2>
          <div className="mt-4 space-y-3">
            {gapRows.map((row) => (
              <div key={row.topic} className="grid gap-2 rounded-md border border-[#e4dccf] bg-[#f7f4ee] p-4 md:grid-cols-[0.9fr_0.7fr_1.2fr]">
                <p className="text-sm font-black text-[#13251d]">{row.topic}</p>
                <p className="text-sm font-semibold text-[#6f4a12]">{row.status}</p>
                <p className="text-sm font-medium leading-6 text-[#657066]">{row.action}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
