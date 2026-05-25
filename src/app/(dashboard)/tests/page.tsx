"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, ListChecks } from "lucide-react";

export default function TestsPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Practice</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Start with today&apos;s MCQ only</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                The old batch grid is hidden for students. For now, practice stays attached to the active Geography class day.
              </p>
            </div>
            <Link
              href="/upsc/geography/mcq-readiness?day=1"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              Open MCQ Room <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black tracking-tight">Fresh practice</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">
              Attempt the questions for Earth as a System after watching and explaining the concept.
            </p>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#fff4df] text-[#6f4a12]">
              <ListChecks className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black tracking-tight">After attempt</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">
              Wrong answers will feed Learning Gaps and Revise. That is the main loop.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
