"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  LineChart,
  Map,
  MessageSquareText,
  PenLine,
  PlayCircle,
  Repeat2,
  Route,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import { JsonLd } from "./JsonLd";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const loopSteps: { label: string; detail: string; icon: LucideIcon }[] = [
  { label: "Watch", detail: "Structured lesson room", icon: PlayCircle },
  { label: "Talk", detail: "Ask the AI teacher", icon: MessageSquareText },
  { label: "Visual Lab", detail: "Maps & concept boards", icon: Map },
  { label: "MCQ", detail: "Fresh daily practice", icon: ClipboardCheck },
  { label: "Track", detail: "Weakness signals", icon: Route },
  { label: "Revisit", detail: "Spaced revision", icon: BookOpenCheck },
];

const noisySources = [
  "12 open browser tabs",
  "5 current-affairs PDFs",
  "Random YouTube playlists",
  "A test on another app",
  "Notes scattered everywhere",
  "Endless Telegram forwards",
];

const features: { title: string; detail: string; icon: LucideIcon; tag: string }[] = [
  {
    title: "Personalized daily plan",
    detail: "A 2-minute diagnostic maps your weak areas and builds a plan that adapts as you improve.",
    icon: Target,
    tag: "Most free tiers don't",
  },
  {
    title: "Ask-the-teacher AI",
    detail: "Stuck on a concept? Discuss it conversationally, right beside the lesson — no extra tab.",
    icon: MessageSquareText,
    tag: "New",
  },
  {
    title: "Weakness map & analytics",
    detail: "Every quiz becomes a diagnosis, not just a score. See exactly what to fix next.",
    icon: LineChart,
    tag: "Beyond a score",
  },
  {
    title: "Spaced revision engine",
    detail: "We resurface what you're about to forget — repetition beats adding more sources.",
    icon: Repeat2,
    tag: "Retention",
  },
  {
    title: "Previous year questions",
    detail: "Full PYQ browser with year-wise & subject-wise filters and clean explanations.",
    icon: ClipboardCheck,
    tag: "Parity",
  },
  {
    title: "Mains answer evaluation",
    detail: "Write answers and get structured feedback — others give prompts, we give feedback.",
    icon: PenLine,
    tag: "Rare",
  },
  {
    title: "Visual Lab & maps",
    detail: "Geography, environment and more taught through interactive maps and concept boards.",
    icon: Map,
    tag: "Visual",
  },
  {
    title: "Daily current affairs",
    detail: "Filtered to what actually matters for the exam — less noise, more signal.",
    icon: CalendarDays,
    tag: "Daily",
  },
];

const retentionItems: { title: string; detail: string; icon: LucideIcon }[] = [
  { title: "Daily streaks", detail: "Don't break the chain — small daily targets build the habit.", icon: Flame },
  { title: "Your second brain", detail: "Notes, bookmarks, weakness map & revision queue live in one place.", icon: BrainCircuit },
  { title: "Peer percentile", detail: "See where you stand against other aspirants — momentum, not isolation.", icon: Users },
];

const freePerks = [
  "2-min diagnostic + personalized plan",
  "1 active subject (full daily loop)",
  "10 personalized MCQs every day",
  "Daily current affairs + quiz",
  "Basic previous-year-question browser",
  "Streaks & progress tracking",
  "Ask-the-teacher AI — up to 5 doubts/day",
];

const proPerks = [
  "All subjects unlocked",
  "Unlimited ask-the-teacher AI",
  "Mains answer evaluation",
  "Deep analytics + weakness recovery",
  "Spaced revision scheduler",
  "Full PYQ + full-length test series",
  "All-India rank + mentor check-ins",
];

const comparison: { label: string; typical: string; sarit: string }[] = [
  { label: "Experience", typical: "Scattered across tabs & apps", sarit: "One connected daily loop" },
  { label: "Personalization", typical: "Same content for everyone", sarit: "Adapts to your weak areas" },
  { label: "Practice", typical: "A score and nothing more", sarit: "A diagnosis + a fix plan" },
  { label: "Doubts", typical: "Wait, or pay extra", sarit: "Ask-the-teacher, inline" },
  { label: "Results", typical: "Hidden / marketing claims", sarit: "Honest question-wise coverage" },
];

const roadmap: { window: string; subject: string; status: string }[] = [
  { window: "June", subject: "Geography", status: "Live pilot" },
  { window: "July", subject: "Environment & Disaster Mgmt", status: "Next" },
  { window: "August", subject: "Economy", status: "Planned" },
  { window: "September", subject: "Science & Tech", status: "Planned" },
  { window: "Later", subject: "Polity & Governance", status: "Mega chapter" },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "Is it really free to start?",
    a: "Yes. You get a personalized plan, one full subject loop, daily MCQs, current affairs and limited AI doubts — free, with no card required.",
  },
  {
    q: "How is this different from other UPSC platforms?",
    a: "Most platforms hand you scattered content. Sarit Learn connects watch, discuss, practice, track and revise into a single daily loop that adapts to you.",
  },
  {
    q: "What do I get when I upgrade?",
    a: "Pro unlocks every subject, unlimited AI doubt-solving, Mains answer evaluation, deep analytics, spaced revision, full tests and all-India rank.",
  },
  {
    q: "Do you cover Hindi medium?",
    a: "Yes — content is being rolled out bilingually (Hindi + English), subject by subject.",
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8c5d14]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-[#13251d] md:text-4xl">{title}</h2>
      {sub ? <p className="mx-auto mt-4 max-w-xl text-base font-semibold leading-7 text-[#536259]">{sub}</p> : null}
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero({ reduce }: { reduce: boolean | null }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setActive((i) => (i + 1) % loopSteps.length), 1600);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36">
      {/* soft background wash */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_10%,rgba(29,158,117,0.14),transparent),radial-gradient(50%_40%_at_5%_0%,rgba(239,159,39,0.10),transparent)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: reduce ? 0 : 0.12 } } }}>
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-[#1d9e75]/30 bg-[#e7f5ee] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#085041]"
          >
            <Sparkles className="h-3.5 w-3.5" /> Built for UPSC CSE 2026 / 2027
          </motion.span>

          <motion.h1 variants={fadeUp} className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-[#13251d] md:text-6xl">
            One connected system to <span className="sl-grad-text">learn, practise & revise</span> for UPSC — honestly.
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-5 max-w-xl text-lg font-semibold leading-8 text-[#536259]">
            Stop juggling tabs, PDFs and apps. Sarit Learn keeps your lessons, doubts, maps, MCQs, tracking and revision in
            one daily loop that adapts to you.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/start"
              className="inline-flex h-12 items-center justify-center rounded-md bg-[#1a3a2a] px-6 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              Start free — no card
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="#loop"
              className="inline-flex h-12 items-center justify-center rounded-md border border-[#1d9e75]/40 bg-[#e7f5ee] px-6 text-sm font-black text-[#085041] transition hover:bg-[#d8f0e6]"
            >
              See the daily loop
            </a>
          </motion.div>

          {/* trust stat strip */}
          <motion.div variants={fadeUp} className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-[#dcd5c7] pt-6">
            {[
              { end: 76, suffix: "%", label: "Honest prelims coverage" },
              { end: 6, suffix: "-step", label: "Daily learning loop" },
              { end: 1, suffix: " plan", label: "Personalized to you" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-black text-[#085041]">
                  <CountUp end={s.end} duration={reduce ? 0 : 1.6} suffix={s.suffix} enableScrollSpy={false} />
                </div>
                <p className="mt-1 text-xs font-bold leading-5 text-[#536259]">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Daily loop visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="relative mx-auto w-full max-w-md rounded-3xl border border-[#cadfd6] bg-[#fffdf8] p-6 shadow-[0_20px_60px_rgba(19,37,29,0.10)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Today&apos;s loop</p>
                <p className="text-lg font-black text-[#13251d]">Geography · Day 12</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff2dd] px-3 py-1 text-sm font-black text-[#8c5d14]">
                <Flame className="h-4 w-4 text-[#ef9f27]" /> 12
              </span>
            </div>

            {/* progress ring */}
            <div className="my-6 flex items-center justify-center">
              <div
                className="relative flex h-40 w-40 items-center justify-center rounded-full"
                style={{
                  background: "conic-gradient(#1d9e75 0% 76%, #e7f5ee 76% 100%)",
                }}
              >
                <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[#fffdf8] text-center">
                  <span className="text-3xl font-black text-[#085041]">
                    {active + 1}/{loopSteps.length}
                  </span>
                  <span className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#536259]">steps today</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {loopSteps.map((step, i) => {
                const isActive = i === active;
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.label}
                    animate={isActive && !reduce ? { scale: 1.04 } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-colors ${
                      isActive
                        ? "border-[#1d9e75] bg-[#e7f5ee]"
                        : "border-[#e1d8ca] bg-[#f7f4ee]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-[#085041]" : "text-[#1a3a2a]"}`} />
                    <span className="text-[11px] font-black text-[#13251d]">{step.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* floating chip — sits just below the card, no overlap */}
          <div
            className="sl-float absolute -bottom-5 right-6 hidden rounded-xl border border-[#dcd5c7] bg-[#fffdf8] px-3 py-2 shadow-md sm:flex"
            style={{ animation: reduce ? undefined : "sl-float 4s ease-in-out infinite" }}
          >
            <span className="flex items-center gap-2 text-xs font-black text-[#33443b]">
              <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" /> Weak area: River systems
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Problem -> Clarity                                                  */
/* ------------------------------------------------------------------ */

function ProblemSection() {
  return (
    <section className="border-y border-[#dcd5c7] bg-[#fffdf8] py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionHeading
          eyebrow="The real problem"
          title="It isn't a lack of effort. It's the noise."
          sub="Aspirants don't fail for studying too little — they drown in scattered sources. Every new tab adds confusion and steals retention."
        />

        <div className="mt-12 grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
          {/* scattered */}
          <div className="relative flex h-64 flex-wrap content-center items-center justify-center gap-2.5 rounded-2xl border border-[#e6c9c0] bg-[#fbf2ee] px-5 pb-5 pt-11">
            <p className="absolute left-4 top-3 text-xs font-black uppercase tracking-wide text-[#b4543a]">Before · scattered</p>
            {noisySources.map((s, i) => (
              <motion.span
                key={s}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-lg border border-[#e6c9c0] bg-white px-3 py-1.5 text-xs font-bold text-[#7a4a3c] shadow-sm"
                style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (2 + (i % 3))}deg)` }}
              >
                {s}
              </motion.span>
            ))}
          </div>

          <div className="flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a3a2a] text-white lg:rotate-0"
            >
              <ArrowRight className="h-5 w-5" />
            </motion.div>
          </div>

          {/* calm */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative flex h-64 flex-col justify-center rounded-2xl border border-[#1d9e75]/30 bg-[#e7f5ee] p-6"
          >
            <p className="absolute left-6 top-3 text-xs font-black uppercase tracking-wide text-[#1d9e75]">After · one system</p>
            <p className="text-xl font-black leading-snug text-[#13251d]">One calm daily loop</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#3a4f45]">
              Watch → Talk → Visual Lab → MCQ → Track → Revisit. Everything in one place, tuned to your weak areas.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {loopSteps.map((s) => (
                <span key={s.label} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[#085041]">
                  {s.label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Daily loop                                                          */
/* ------------------------------------------------------------------ */

function DailyLoopSection() {
  return (
    <section id="loop" className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionHeading
          eyebrow="The daily loop"
          title="Six steps. One habit. Every day."
          sub="MCQ is one action inside the loop — not the whole product. Each step flows into the next so studying compounds."
        />

        <div className="relative mt-14">
          {/* connecting line */}
          <div className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-[#1d9e75]/40 to-transparent lg:block" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {loopSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -6 }}
                  className="group relative rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
                >
                  <div className="relative z-10 mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1a3a2a] text-white transition group-hover:bg-[#1d9e75]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-black text-[#8c5d14]">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-1 text-base font-black text-[#13251d]">{step.label}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#536259]">{step.detail}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Transparency (MINIMAL)                                              */
/* ------------------------------------------------------------------ */

function TransparencySection({ reduce }: { reduce: boolean | null }) {
  return (
    <section id="results" className="border-y border-[#dcd5c7] bg-[#fffdf8] py-20">
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        <SectionHeading eyebrow="Honest results" title="We show our real coverage." />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-7 rounded-2xl border border-[#1d9e75]/30 bg-[#e7f5ee] p-7 sm:flex-row sm:gap-9"
        >
          {/* compact donut */}
          <div
            className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
            style={{ background: "conic-gradient(#1d9e75 0% 76%, #ffffff 76% 100%)" }}
          >
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#e7f5ee]">
              <span className="text-3xl font-black text-[#085041]">
                <CountUp end={76} duration={reduce ? 0 : 1.8} suffix="%" enableScrollSpy />
              </span>
              <span className="text-[10px] font-bold uppercase text-[#1d9e75]">coverage</span>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <p className="text-lg font-black text-[#13251d]">74 of 97 Prelims 2026 questions covered</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-black text-[#085041]">
                <span className="h-2 w-2 rounded-full bg-[#1d9e75]" /> 44 direct
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-black text-[#8c5d14]">
                <span className="h-2 w-2 rounded-full bg-[#ef9f27]" /> 30 partial
              </span>
            </div>
            <Link
              href="/upsc-prelims-2026-showcase"
              className="mt-4 inline-flex items-center text-sm font-black text-[#085041] underline-offset-4 hover:underline"
            >
              See the question-by-question breakdown
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

function FeaturesSection() {
  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionHeading
          eyebrow="What you get"
          title="Everything the big platforms give — plus the gaps they leave."
          sub="Daily current affairs, PYQs and tests are table stakes. The difference is personalization, doubt-solving and revision built into one loop."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.06 }}
                whileHover={{ y: -5 }}
                className="flex flex-col rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f5ee] text-[#085041]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-[#fff2dd] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">
                    {f.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-black text-[#13251d]">{f.title}</h3>
                <p className="mt-1.5 text-sm font-semibold leading-6 text-[#536259]">{f.detail}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Retention band                                                      */
/* ------------------------------------------------------------------ */

function RetentionBand() {
  return (
    <section className="bg-[#13251d] py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ef9f27]">Built to keep you going</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight md:text-4xl">
            The hard part of UPSC is staying consistent. We design for that.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {retentionItems.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1d9e75]/15 text-[#5fd6ab]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-black">{r.title}</h3>
                <p className="mt-1.5 text-sm font-semibold leading-6 text-white/70">{r.detail}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pricing (two segments)                                              */
/* ------------------------------------------------------------------ */

function PricingSection() {
  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Two ways in"
          title="Start free. Stay because it works."
          sub="Free gives you a real, personalized head start. Pro unlocks the full system when you're ready to go all in."
        />

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col rounded-3xl border border-[#dcd5c7] bg-[#fffdf8] p-7 shadow-sm"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Free · your first phase</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-black text-[#13251d]">₹0</span>
              <span className="text-sm font-bold text-[#536259]">/ forever to start</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#536259]">Enough to build the habit and feel the difference.</p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {freePerks.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm font-semibold leading-6 text-[#33443b]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                  {p}
                </li>
              ))}
            </ul>
            <Link
              href="/start"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md border border-[#1a3a2a] px-5 text-sm font-black text-[#1a3a2a] transition hover:bg-[#1a3a2a] hover:text-white"
            >
              Start free
            </Link>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative flex flex-col rounded-3xl border-2 border-[#1a3a2a] bg-[#1a3a2a] p-7 text-white shadow-[0_20px_50px_rgba(19,37,29,0.18)]"
          >
            <span className="absolute right-6 top-6 rounded-full bg-[#ef9f27] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#3a2706]">
              Full system
            </span>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7fe0bd]">Pro · serious aspirants</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-black">₹—</span>
              <span className="text-sm font-bold text-white/70">/ pricing TBD</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-white/70">Everything unlocked, all subjects, full support.</p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {proPerks.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm font-semibold leading-6 text-white/90">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5fd6ab]" />
                  {p}
                </li>
              ))}
            </ul>
            <Link
              href="/login?redirect=/upsc"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#ef9f27] px-5 text-sm font-black text-[#3a2706] transition hover:bg-[#f4b04b]"
            >
              Go Pro
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Comparison                                                          */
/* ------------------------------------------------------------------ */

function ComparisonSection() {
  return (
    <section className="border-y border-[#dcd5c7] bg-[#fffdf8] py-20">
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <SectionHeading eyebrow="The difference" title="Sarit Learn vs a typical UPSC site" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 overflow-hidden rounded-2xl border border-[#dcd5c7]"
        >
          <div className="grid grid-cols-3 bg-[#13251d] text-white">
            <div className="p-4 text-xs font-black uppercase tracking-wide text-white/70" />
            <div className="p-4 text-center text-xs font-black uppercase tracking-wide text-white/70">Typical site</div>
            <div className="p-4 text-center text-xs font-black uppercase tracking-wide text-[#7fe0bd]">Sarit Learn</div>
          </div>
          {comparison.map((row, i) => (
            <div key={row.label} className={`grid grid-cols-3 ${i % 2 ? "bg-[#f7f4ee]" : "bg-[#fffdf8]"}`}>
              <div className="border-t border-[#e5ded0] p-4 text-sm font-black text-[#13251d]">{row.label}</div>
              <div className="border-t border-[#e5ded0] p-4 text-center text-sm font-semibold text-[#8a8173]">{row.typical}</div>
              <div className="flex items-center justify-center gap-2 border-t border-[#e5ded0] p-4 text-center text-sm font-bold text-[#085041]">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#1d9e75]" />
                {row.sarit}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Roadmap                                                             */
/* ------------------------------------------------------------------ */

function RoadmapSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionHeading eyebrow="Subject roadmap" title="Rolling out subject by subject." sub="We perfect one subject loop before opening the next — depth over noise." />

        <div className="mt-12 grid gap-4 md:grid-cols-5">
          {roadmap.map((r, i) => (
            <motion.div
              key={r.subject}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8c5d14]">{r.window}</p>
              <h3 className="mt-3 text-base font-black text-[#13251d]">{r.subject}</h3>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#536259]">
                <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
                {r.status}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-[#dcd5c7] bg-[#fffdf8] py-20">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <SectionHeading eyebrow="FAQ" title="Questions, answered." />
        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="overflow-hidden rounded-xl border border-[#dcd5c7] bg-[#f7f4ee]">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-black text-[#13251d]">{f.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className="text-xl font-black text-[#1d9e75]">
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm font-semibold leading-7 text-[#536259]">{f.a}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA + Footer                                                  */
/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a3a2a] to-[#0c1f17] px-8 py-14 text-center text-white shadow-[0_30px_70px_rgba(19,37,29,0.25)]">
        <h2 className="mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight md:text-4xl">
          Your UPSC prep, finally in one calm place.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base font-semibold text-white/75">
          Take the 2-minute diagnostic and get a personalized plan today — free.
        </p>
        <Link
          href="/start"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-[#ef9f27] px-7 text-sm font-black text-[#3a2706] transition hover:bg-[#f4b04b]"
        >
          Start free
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function SaritHome() {
  const reduce = useReducedMotion();
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f4ee] text-[#13251d]">
      <JsonLd data={faqSchema} />
      <SiteNav />
      <Hero reduce={reduce} />
      <ProblemSection />
      <DailyLoopSection />
      <TransparencySection reduce={reduce} />
      <FeaturesSection />
      <RetentionBand />
      <PricingSection />
      <ComparisonSection />
      <RoadmapSection />
      <FaqSection />
      <FinalCta />
      <SiteFooter />
    </main>
  );
}
