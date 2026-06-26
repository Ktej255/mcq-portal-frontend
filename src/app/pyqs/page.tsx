import Link from "next/link";
import { ArrowRight, ClipboardCheck, Gift, Layers, Lightbulb, CheckCircle2 } from "lucide-react";

import { PageShell, PageHero, StartFreeCta } from "@/components/marketing/PageShell";
import { pyqYears, pyqBySubject, pyqTips } from "@/components/marketing/site-data";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Free UPSC Previous Year Questions (PYQs) — Prelims & Mains | Sarit Classes",
  description:
    "Browse UPSC Prelims & Mains previous year questions, year-wise and subject-wise, with clean explanations — completely free.",
  path: "/pyqs",
});

const whyFree = [
  "Practise real UPSC questions, not look-alikes",
  "Spot recurring themes and the exam's pattern",
  "Calibrate your prep against the actual standard",
];

export default function PyqsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Free forever"
        title="Previous year questions — free for everyone."
        sub="Every Prelims and Mains question, organised year-wise and subject-wise, with clear explanations. No paywall on PYQs — practising the real exam should never cost anything."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#1d9e75]/30 bg-[#e7f5ee] p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#085041]">
            <Gift className="h-5 w-5" />
          </span>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {whyFree.map((w) => (
              <span key={w} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#33443b]">
                <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
                {w}
              </span>
            ))}
          </div>
        </div>

        {/* By year */}
        <div className="mt-12 flex items-center gap-3">
          <Layers className="h-5 w-5 text-[#1d9e75]" />
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Browse by year</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pyqYears.map((y) => (
            <Link
              key={y.year}
              href="/login?redirect=/upsc"
              className="group rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-[#13251d]">{y.year}</span>
                <span className="rounded-full bg-[#e7f5ee] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#085041]">
                  Free
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-[#33443b]">Prelims: {y.prelims}</p>
              <p className="mt-1 text-sm font-bold text-[#33443b]">Mains: {y.mains}</p>
              <span className="mt-4 inline-flex items-center text-sm font-black text-[#085041]">
                Open papers
                <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>

        {/* By subject */}
        <div className="mt-14 flex items-center gap-3">
          <ClipboardCheck className="h-5 w-5 text-[#1d9e75]" />
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Browse by subject</h2>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pyqBySubject.map((s) => (
            <Link
              key={s.subject}
              href="/login?redirect=/upsc"
              className="flex items-center justify-between rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="text-sm font-black text-[#13251d]">{s.subject}</span>
              <span className="text-xs font-bold text-[#8c5d14]">{s.count}</span>
            </Link>
          ))}
        </div>

        {/* How to use PYQs */}
        <div className="mt-14 flex items-center gap-3">
          <Lightbulb className="h-5 w-5 text-[#1d9e75]" />
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">How to use PYQs the right way</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pyqTips.map((t) => (
            <div key={t.title} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <h3 className="text-base font-black text-[#13251d]">{t.title}</h3>
              <p className="mt-1.5 text-sm font-semibold leading-6 text-[#536259]">{t.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-[#1a3a2a] to-[#0c1f17] px-8 py-12 text-center text-white">
          <h2 className="max-w-2xl text-2xl font-black tracking-tight md:text-3xl">
            Turn PYQ practice into a personalized weakness map.
          </h2>
          <p className="max-w-xl text-sm font-semibold text-white/75">
            Attempt PYQs inside the daily loop and we&apos;ll show you exactly which topics to revise next.
          </p>
          <div className="mt-2">
            <StartFreeCta />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
