"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, BookOpenCheck, CalendarClock, RefreshCcw, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { geographySessions } from "@/lib/upsc/plan";

const today = geographySessions[0];

const quickCards = [
  {
    label: "Learning Gap",
    title: "No weak area recorded yet",
    detail: "Complete today's practice once. Your real weak topics will appear here.",
    href: "/reports",
    icon: Target,
  },
  {
    label: "Next Revision",
    title: "Revise after practice",
    detail: "The first revision will focus on latitude, longitude, Earth movement, and time zones.",
    href: "/revision",
    icon: RefreshCcw,
  },
  {
    label: "Progress",
    title: "Geography sprint started",
    detail: "Day 1 of 30 is active. The path will stay simple: learn, explain, practice, revise.",
    href: "/history",
    icon: BarChart3,
  },
];

const pathSteps = [
  { label: "Learn", href: "/upsc/geography/watch?day=1" },
  { label: "Explain", href: "/upsc/geography/talk?day=1" },
  { label: "Practice", href: "/upsc/geography/mcq-readiness?day=1" },
  { label: "Revise", href: "/upsc/geography/revisit?day=1" },
];

export const DailyWorkspace = () => {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-[#f7f4ee]">Today</Badge>
              <h1 className="text-3xl font-black tracking-tight text-[#13251d] md:text-4xl">
                {today.title}
              </h1>
              <p className="max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                {today.anchor}
              </p>
            </div>
            <Link
              href="/upsc/geography/watch?day=1"
              className="inline-flex h-12 items-center justify-center rounded-md bg-[#1a3a2a] px-5 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              Start Today <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {pathSteps.map((step, index) => (
              <Link
                key={step.label}
                href={step.href}
                className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4 transition hover:border-[#1d9e75]/60 hover:bg-[#eef8f2]"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-white text-sm font-black text-[#1a3a2a] shadow-sm">
                  {index + 1}
                </div>
                <p className="text-base font-black text-[#13251d]">{step.label}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {quickCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm transition hover:border-[#1d9e75]/60 hover:bg-[#fdfaf3]"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                  <card.icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">{card.label}</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-[#13251d]">{card.title}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">{card.detail}</p>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff4df] text-[#6f4a12]">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Today&apos;s Task</h2>
                <p className="text-sm font-medium text-[#756f64]">{today.duration}</p>
              </div>
            </div>
            <p className="text-sm font-semibold leading-6 text-[#4f5e55]">
              Watch the concept, explain it once in your own words, then solve the fresh practice set. Do not open the full portal map first.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/upsc/geography/lab?day=1"
                className="inline-flex h-9 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
              >
                Open Visual
              </Link>
              <Link
                href="/upsc/geography"
                className="inline-flex h-9 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
              >
                Subject Plan
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Next Revision</h2>
                <p className="text-sm font-medium text-[#756f64]">After today&apos;s practice</p>
              </div>
            </div>
            <div className="space-y-2 text-sm font-semibold text-[#4f5e55]">
              <p>1. Redraw latitude and longitude.</p>
              <p>2. Explain rotation and revolution.</p>
              <p>3. Reattempt only wrong MCQs.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
