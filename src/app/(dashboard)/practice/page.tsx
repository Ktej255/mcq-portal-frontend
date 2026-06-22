"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, LockKeyhole } from "lucide-react";

import { useGeographyStudentOverview } from "@/lib/upsc/useGeographyStudentOverview";

export default function TestsPage() {
  const overview = useGeographyStudentOverview();
  const practiceReady = overview.loopState.room === "mcq";

  return (
    <main className="text-[#13251d]">
      <div>
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Practice</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                {practiceReady ? "Your fresh MCQ is ready" : "Practice opens after proof"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                MCQs stay attached to the active class day. Complete the next learning step and the correct practice set opens automatically.
              </p>
            </div>
            <Link
              href={overview.loopState.href}
              data-testid="student-practice-primary-action"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              {overview.loopState.cta} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <ClipboardCheck className="h-5 w-5 text-[#085041]" />
            <h2 className="mt-4 text-xl font-black tracking-tight">Day {overview.activeSession.day}: {overview.activeSession.title}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">
              {practiceReady ? "The fresh set is connected to your current proof." : `Current gate: ${overview.loopState.label}.`}
            </p>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <LockKeyhole className="h-5 w-5 text-[#6f4a12]" />
            <h2 className="mt-4 text-xl font-black tracking-tight">No batch browsing</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">
              Students see one relevant set only. Wrong answers flow into Learning Gaps and Revise.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
