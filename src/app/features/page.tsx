import type { Metadata } from "next";
import {
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  LineChart,
  Map,
  MessageSquareText,
  PenLine,
  PlayCircle,
  Repeat2,
  Route,
  Target,
} from "lucide-react";

import { PageShell, PageHero, StartFreeCta } from "@/components/marketing/PageShell";

export const metadata: Metadata = {
  title: "Features — Sarit Learn UPSC Command",
  description:
    "Everything the big UPSC platforms offer — current affairs, PYQs, tests — plus the gaps they leave: personalization, an AI teacher, weakness tracking and spaced revision in one daily loop.",
};

const groups = [
  {
    heading: "Learn",
    items: [
      { icon: PlayCircle, title: "Structured lesson rooms", detail: "Concept-first lessons organised by the syllabus, not a random video pile." },
      { icon: MessageSquareText, title: "Ask-the-teacher AI", detail: "Discuss any doubt conversationally, right beside the lesson — no extra tab." },
      { icon: Map, title: "Visual Lab & maps", detail: "Geography, environment and more taught through interactive maps and concept boards." },
    ],
  },
  {
    heading: "Practise",
    items: [
      { icon: ClipboardCheck, title: "Fresh daily MCQs", detail: "Practice tuned to what you just learned and to your weak areas." },
      { icon: CalendarDays, title: "Daily current affairs + quiz", detail: "Exam-filtered news with a quick daily quiz and monthly consolidation." },
      { icon: PenLine, title: "Mains answer evaluation", detail: "Write answers and get structured feedback — most platforms only give prompts." },
    ],
  },
  {
    heading: "Track & revise",
    items: [
      { icon: Target, title: "Personalized plan", detail: "A 2-minute diagnostic builds a plan that adapts as you improve." },
      { icon: LineChart, title: "Weakness map & analytics", detail: "Every quiz becomes a diagnosis, not just a score." },
      { icon: Repeat2, title: "Spaced revision engine", detail: "We resurface what you're about to forget — repetition beats more sources." },
    ],
  },
];

const tableStakes = [
  "Previous year questions (year & subject wise)",
  "Daily current affairs & editorials",
  "Monthly current-affairs magazine",
  "Full-length prelims & mains tests",
  "Bilingual content (Hindi + English)",
  "Government schemes & reports",
];

export default function FeaturesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Features"
        title="The complete system — not scattered content."
        sub="We match everything the big platforms give you, then add the personalization, doubt-solving and revision they leave out — all inside one connected daily loop."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        {groups.map((g) => (
          <div key={g.heading} className="mb-12 last:mb-0">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">{g.heading}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((it) => {
                const Icon = it.icon;
                return (
                  <div
                    key={it.title}
                    className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f5ee] text-[#085041]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-base font-black text-[#13251d]">{it.title}</h3>
                    <p className="mt-1.5 text-sm font-semibold leading-6 text-[#536259]">{it.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="border-y border-[#dcd5c7] bg-[#fffdf8] py-16">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Route className="h-5 w-5 text-[#1d9e75]" />
            <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Plus all the table-stakes, included</h2>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tableStakes.map((t) => (
              <div key={t} className="flex items-start gap-2 text-sm font-semibold leading-6 text-[#33443b]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 text-center md:px-8">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-[#1a3a2a] to-[#0c1f17] px-8 py-12 text-white">
          <BrainCircuit className="h-8 w-8 text-[#7fe0bd]" />
          <h2 className="max-w-2xl text-2xl font-black tracking-tight md:text-3xl">
            One calm system that actually knows what you need next.
          </h2>
          <div className="mt-2">
            <StartFreeCta />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
