import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  MessageSquare,
  Target,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Users,
  FileText,
  Layers,
  Quote,
} from "lucide-react";

import { PageShell, PageHero } from "@/components/marketing/PageShell";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Our Results & Methodology — Built by an Aspirant, for Aspirants | Sarit Classes",
  description:
    "Sarit Classes was built by someone who lived the chaos of UPSC preparation. Learn how our 6-step AI-driven loop — Watch, Discuss, Practice, Track, Revisit, Improve — transforms scattered study into systematic progress.",
  path: "/results",
});

const loopSteps = [
  { icon: BookOpen, step: "Watch", desc: "Engage with curated video lessons and concept explainers for each sub-topic." },
  { icon: MessageSquare, step: "Discuss", desc: "Talk through the concept with AI — ask doubts, get analogies, solidify understanding." },
  { icon: Target, step: "Practice", desc: "Attempt MCQs and answer-writing prompts calibrated to your current level." },
  { icon: BarChart3, step: "Track", desc: "See concept-level scores, question-type breakdowns, and gap heatmaps." },
  { icon: RefreshCw, step: "Revisit", desc: "Weak concepts reappear at spaced intervals — building long-term memory." },
  { icon: TrendingUp, step: "Improve", desc: "Weekly retros show growth over time. Celebrate progress, attack weaknesses." },
];

const stats = [
  { label: "Topics Authored", value: "500+" },
  { label: "PYQs Mapped", value: "3,000+" },
  { label: "Practice Questions", value: "10,000+" },
  { label: "Subjects Covered", value: "9 GS + Optionals" },
];

const testimonials = [
  {
    quote: "The AI discussion feature is like having a patient tutor available 24/7. I finally understand Constitutional provisions instead of just memorising them.",
    name: "Aarav M.",
    role: "Early tester — UPSC 2027 aspirant",
  },
  {
    quote: "Gap analysis changed how I study. I stopped wasting time on topics I already knew and focused on what actually needed work.",
    name: "Priya S.",
    role: "Early tester — 2nd attempt",
  },
  {
    quote: "The spaced revision is subtle but powerful. Facts I struggled with months ago now come to me instantly during mock tests.",
    name: "Rohan K.",
    role: "Early tester — working professional",
  },
];

export default function ResultsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Our story"
        title="Our Results & Methodology — Built by an Aspirant, for Aspirants"
        sub="We didn't build another content dump. We built the system we wished existed when we were preparing — one that connects learning, practice, tracking, and revision into a single daily loop."
      />

      {/* Our Story */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Our Story</h2>
        <div className="mt-6 max-w-3xl space-y-4 text-base font-semibold leading-7 text-[#536259]">
          <p>
            Sarit Classes was built by someone who experienced the scattered chaos of UPSC preparation firsthand — juggling multiple apps, losing track of revisions, never knowing which gaps to fill first.
          </p>
          <p>
            The AI-driven system connects what traditional platforms leave disconnected. Instead of separate silos for videos, notes, tests, and revision, everything feeds into one adaptive loop that knows where you are and what you need next.
          </p>
          <p>
            This isn&apos;t about replacing hard work. It&apos;s about making sure the hard work you do is aimed at the right things, at the right time, with clear feedback on whether it&apos;s working.
          </p>
        </div>
      </section>

      {/* Methodology — 6-Step Loop */}
      <section className="border-t border-[#dcd5c7] bg-[#fffdf8]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">The 6-Step Learning Loop</h2>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[#536259]">
            Every study session follows this loop. AI concept scoring ensures each step feeds into the next — creating compounding progress over weeks and months.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loopSteps.map((s, i) => (
              <div key={s.step} className="rounded-2xl border border-[#dcd5c7] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7f5ee] text-xs font-black text-[#1d9e75]">
                    {i + 1}
                  </span>
                  <s.icon className="h-5 w-5 text-[#1d9e75]" />
                </div>
                <h3 className="mt-4 text-base font-black text-[#13251d]">{s.step}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#536259]">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-[#dcd5c7] bg-[#f7f4ee] p-6">
            <h3 className="text-base font-black text-[#13251d]">The science behind it</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#536259]">
              Spaced repetition is backed by decades of cognitive science research. By revisiting concepts at expanding intervals (1 day → 3 days → 7 days → 21 days), your brain converts short-term familiarity into permanent recall. Combined with active retrieval through practice questions, this approach builds the exam-ready knowledge that survives under pressure.
            </p>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-t border-[#dcd5c7]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Platform at a Glance</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{s.label}</p>
                <p className="mt-2 text-2xl font-black text-[#13251d]">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-[#dcd5c7] bg-[#fffdf8]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">What Early Testers Say</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="flex flex-col rounded-2xl border border-[#dcd5c7] bg-white p-6 shadow-sm">
                <Quote className="h-6 w-6 text-[#1d9e75]/40" />
                <p className="mt-3 flex-1 text-sm font-semibold leading-6 text-[#536259]">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 border-t border-[#dcd5c7] pt-4">
                  <p className="text-sm font-black text-[#13251d]">{t.name}</p>
                  <p className="text-xs font-semibold text-[#536259]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#dcd5c7]">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Start your journey</h2>
          <p className="mx-auto mt-3 max-w-xl text-base font-semibold leading-7 text-[#536259]">
            Take our 2-minute diagnostic, get a personalised study plan, and experience the loop for yourself — free.
          </p>
          <Link
            href="/start"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-[#1a3a2a] px-6 text-sm font-black text-white transition hover:bg-[#10291d]"
          >
            Start your journey
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
