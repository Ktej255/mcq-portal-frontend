import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Brain,
  Target,
  BarChart3,
  Zap,
  FileText,
  RefreshCw,
  Clock,
  Sparkles,
} from "lucide-react";

import { PageShell, PageHero } from "@/components/marketing/PageShell";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "UPSC Test Series — AI-Powered Prelims & Mains Practice | Sarit Classes",
  description:
    "AI-powered UPSC test series with instant evaluation, per-question-type analysis, gap tracking, and spaced repetition of missed questions. Included in Plus plan and above.",
  path: "/test-series",
});

const prelimsFeatures = [
  { icon: Target, title: "Topic-wise MCQs", desc: "Practice any GS topic in isolation — build accuracy before attempting full mocks." },
  { icon: FileText, title: "Full-length Mocks", desc: "100-question, 2-hour simulations that mirror the real Prelims exam pattern and difficulty." },
  { icon: BarChart3, title: "Per-Question-Type Analysis", desc: "See your accuracy broken down by factual, application, elimination, and mapping questions." },
  { icon: Sparkles, title: "AI-Generated Fresh Questions Daily", desc: "Never run out of practice material — our AI creates new questions calibrated to your weak areas." },
];

const mainsFeatures = [
  { icon: FileText, title: "Answer Writing Practice", desc: "Structured prompts for 150-word and 250-word answers across all 4 GS papers and Essay." },
  { icon: Brain, title: "AI Evaluation with Structured Feedback", desc: "Instant scoring on structure, content, analysis, and presentation — with specific improvement suggestions." },
  { icon: CheckCircle2, title: "Model Answers", desc: "After submission, see a model answer with annotations explaining what makes it score well." },
  { icon: BarChart3, title: "Per-Paper Coverage Tracking", desc: "Track how many topics you've attempted in each paper — identify coverage gaps before they become blind spots." },
];

const comparison = [
  { feature: "AI-powered evaluation", ours: true, typical: false },
  { feature: "Instant feedback (seconds, not weeks)", ours: true, typical: false },
  { feature: "Per-question-type breakdown", ours: true, typical: false },
  { feature: "Gap analysis & weak area tracking", ours: true, typical: false },
  { feature: "Spaced repetition of missed questions", ours: true, typical: false },
  { feature: "Fresh AI-generated questions daily", ours: true, typical: false },
  { feature: "Full-length mock tests", ours: true, typical: true },
  { feature: "Previous year question practice", ours: true, typical: true },
  { feature: "Answer writing evaluation", ours: true, typical: true },
  { feature: "Rank/percentile among test takers", ours: true, typical: true },
];

export default function TestSeriesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Test series"
        title="UPSC Test Series — AI-Powered Prelims & Mains Practice"
        sub="Not just another mock test platform. Our test series uses AI to evaluate, track, and adapt — turning every practice session into targeted improvement."
      />

      {/* Prelims Test Series */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Prelims Test Series</h2>
        <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[#536259]">
          Build MCQ accuracy with topic-wise practice, full-length mocks, and the kind of per-question analysis that tells you exactly why you&apos;re losing marks.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {prelimsFeatures.map((f) => (
            <div key={f.title} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f5ee]">
                <f.icon className="h-5 w-5 text-[#1d9e75]" />
              </div>
              <h3 className="mt-4 text-base font-black text-[#13251d]">{f.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#536259]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mains Test Series */}
      <section className="border-t border-[#dcd5c7] bg-[#fffdf8]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Mains Test Series</h2>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[#536259]">
            Answer writing is a skill. Our Mains test series gives you the reps and the instant feedback loop needed to build it — no more waiting 2 weeks for a score.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {mainsFeatures.map((f) => (
              <div key={f.title} className="rounded-2xl border border-[#dcd5c7] bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f5ee]">
                  <f.icon className="h-5 w-5 text-[#1d9e75]" />
                </div>
                <h3 className="mt-4 text-base font-black text-[#13251d]">{f.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#536259]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="border-t border-[#dcd5c7]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">How We Compare</h2>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[#536259]">
            Most test series give you a score and a rank. Ours tells you exactly what to fix, tracks whether you fixed it, and resurfaces it until you have.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-[#dcd5c7]">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-[#dcd5c7] bg-[#f7f4ee] px-5 py-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8c5d14]">Feature</p>
              <p className="w-24 text-center text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Sarit Classes</p>
              <p className="w-24 text-center text-xs font-black uppercase tracking-[0.18em] text-[#536259]">Typical</p>
            </div>
            {comparison.map((c) => (
              <div key={c.feature} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-[#dcd5c7] bg-[#fffdf8] px-5 py-3 last:border-b-0">
                <p className="text-sm font-semibold text-[#13251d]">{c.feature}</p>
                <div className="flex w-24 justify-center">
                  {c.ours ? (
                    <CheckCircle2 className="h-5 w-5 text-[#1d9e75]" />
                  ) : (
                    <XCircle className="h-5 w-5 text-[#536259]/40" />
                  )}
                </div>
                <div className="flex w-24 justify-center">
                  {c.typical ? (
                    <CheckCircle2 className="h-5 w-5 text-[#536259]/60" />
                  ) : (
                    <XCircle className="h-5 w-5 text-[#536259]/40" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Info */}
      <section className="border-t border-[#dcd5c7] bg-[#fffdf8]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-[#1d9e75]/30 bg-[#e7f5ee] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-[#085041]">Included in Plus plan and above</h3>
              <p className="mt-1 text-sm font-semibold text-[#085041]/80">
                Full access to Prelims mocks, Mains evaluation, AI-generated questions, and gap tracking — all part of your subscription.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-md border border-[#1a3a2a] bg-white px-5 text-sm font-black text-[#1a3a2a] transition hover:bg-[#1a3a2a] hover:text-white"
            >
              View plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#dcd5c7]">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Take a free sample test</h2>
          <p className="mx-auto mt-3 max-w-xl text-base font-semibold leading-7 text-[#536259]">
            Experience AI-powered evaluation on a sample mock. No signup required — just start practising and see the difference.
          </p>
          <Link
            href="/start"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-[#1a3a2a] px-6 text-sm font-black text-white transition hover:bg-[#10291d]"
          >
            Take a free sample test
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
