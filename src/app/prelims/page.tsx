import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Target,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Globe,
  Landmark,
  TrendingUp,
  Leaf,
  Atom,
  Newspaper,
  Calculator,
} from "lucide-react";

import { PageShell, PageHero } from "@/components/marketing/PageShell";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "UPSC Prelims Preparation — Crack GS Paper I & CSAT | Sarit Classes",
  description:
    "Complete UPSC Prelims preparation with AI-powered concept learning, MCQ practice, gap analysis and spaced revision. Browse 10 years of PYQs free. Start preparing today.",
  path: "/prelims",
});

const gsTopics = [
  { icon: BookOpen, label: "History of India & Indian National Movement" },
  { icon: Globe, label: "Indian & World Geography" },
  { icon: Landmark, label: "Indian Polity & Governance" },
  { icon: TrendingUp, label: "Economic & Social Development" },
  { icon: Leaf, label: "Environment, Ecology & Biodiversity" },
  { icon: Atom, label: "General Science & Technology" },
  { icon: Newspaper, label: "Current Events & Affairs" },
];

const csatTopics = [
  "Comprehension & Communication",
  "Logical Reasoning & Analytical Ability",
  "Decision Making & Problem Solving",
  "Basic Numeracy & Data Interpretation",
  "English Language Comprehension (Class X level)",
];

const approach = [
  {
    icon: Brain,
    title: "AI Discussion for Concept Clarity",
    desc: "Talk through concepts with our AI tutor. Ask follow-ups, get analogies, and build genuine understanding — not rote memorisation.",
  },
  {
    icon: Target,
    title: "MCQ Practice with Per-Type Scoring",
    desc: "Practice topic-wise and full-length with real-time scoring broken down by question type — factual, application, elimination, and mapping.",
  },
  {
    icon: BarChart3,
    title: "Gap Analysis Showing Weak Areas",
    desc: "After every session, see exactly which topics and sub-topics need more work. No guessing — data-driven prioritisation.",
  },
  {
    icon: RefreshCw,
    title: "Spaced Revision System",
    desc: "Concepts you struggle with reappear at scientifically optimal intervals. Memory is built, not crammed.",
  },
];

export default function PrelimsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="UPSC Prelims"
        title="UPSC Prelims Preparation — Crack GS Paper I & CSAT"
        sub="The Preliminary exam is the gateway to Mains. Master 7 subjects, develop elimination instincts, and build the accuracy needed to clear the cutoff — with AI-powered daily practice."
      />

      {/* What is Prelims */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <h2 className="text-2xl font-black tracking-tight text-[#13251d]">What is the UPSC Prelims?</h2>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-[#536259]">
          The Civil Services Preliminary Examination is the first stage of the UPSC selection process. It is an objective-type (MCQ) screening test conducted every June.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Papers", value: "2", note: "GS Paper I + CSAT" },
            { label: "Total Marks", value: "400", note: "200 marks each paper" },
            { label: "Duration", value: "2 hours", note: "Per paper" },
            { label: "Negative Marking", value: "−⅓", note: "For wrong answers in GS" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{s.label}</p>
              <p className="mt-2 text-2xl font-black text-[#13251d]">{s.value}</p>
              <p className="mt-1 text-xs font-semibold text-[#536259]">{s.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#ef9f27]/30 bg-[#fef8ec] p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#8c5d14]" />
          <p className="text-sm font-semibold text-[#8c5d14]">
            CSAT is qualifying (33% cutoff) but GS Paper I marks alone determine your Prelims rank. Focus accordingly.
          </p>
        </div>
      </section>

      {/* Syllabus Breakdown */}
      <section className="border-t border-[#dcd5c7] bg-[#fffdf8]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">GS Paper I — Syllabus Breakdown</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gsTopics.map((t) => (
              <div key={t.label} className="flex items-start gap-3 rounded-xl border border-[#dcd5c7] bg-white p-4">
                <t.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#1d9e75]" />
                <p className="text-sm font-bold text-[#13251d]">{t.label}</p>
              </div>
            ))}
          </div>

          <h3 className="mt-12 text-xl font-black tracking-tight text-[#13251d]">CSAT — Paper II Topics</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {csatTopics.map((t) => (
              <div key={t} className="flex items-start gap-3 rounded-xl border border-[#dcd5c7] bg-white p-4">
                <Calculator className="mt-0.5 h-5 w-5 shrink-0 text-[#8c5d14]" />
                <p className="text-sm font-bold text-[#13251d]">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="border-t border-[#dcd5c7]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">How Sarit Classes Helps You Crack Prelims</h2>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[#536259]">
            Our AI-driven system connects what traditional coaching leaves disconnected — learning, practice, tracking, and revision in one daily loop.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {approach.map((a) => (
              <div key={a.title} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f5ee]">
                  <a.icon className="h-5 w-5 text-[#1d9e75]" />
                </div>
                <h3 className="mt-4 text-base font-black text-[#13251d]">{a.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#536259]">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free PYQ Section */}
      <section className="border-t border-[#dcd5c7] bg-[#fffdf8]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-[#1d9e75]/30 bg-[#e7f5ee] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-[#085041]">Free Previous Year Questions</h3>
              <p className="mt-1 text-sm font-semibold text-[#085041]/80">
                Browse 10 years of Prelims questions free — categorised by topic, year, and difficulty.
              </p>
            </div>
            <Link
              href="/pyqs"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-md border border-[#1a3a2a] bg-white px-5 text-sm font-black text-[#1a3a2a] transition hover:bg-[#1a3a2a] hover:text-white"
            >
              Browse PYQs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#dcd5c7]">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Start your Prelims preparation</h2>
          <p className="mx-auto mt-3 max-w-xl text-base font-semibold leading-7 text-[#536259]">
            Take our free diagnostic, get a personalised study plan, and begin practising in under 2 minutes.
          </p>
          <Link
            href="/start"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-[#1a3a2a] px-6 text-sm font-black text-white transition hover:bg-[#10291d]"
          >
            Start your Prelims preparation
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
