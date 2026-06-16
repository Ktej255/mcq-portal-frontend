import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { PageShell, PageHero } from "@/components/marketing/PageShell";
import { JsonLd } from "@/components/marketing/JsonLd";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Pricing — Free UPSC Plan & Pro Membership | Sarit Learn",
  description:
    "Start free with a personalized plan, one full subject loop and daily practice. Upgrade to Pro for all subjects, unlimited AI doubt-solving, Mains evaluation and full analytics.",
  path: "/pricing",
});

const freePerks = [
  "2-min diagnostic + personalized plan",
  "1 active subject (full daily loop)",
  "10 personalized MCQs every day",
  "Daily current affairs + quiz",
  "Free previous-year-question browser",
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

const faqs = [
  { q: "Is the free plan really free?", a: "Yes — no card required. You get a personalized plan, one full subject loop, daily MCQs, current affairs and limited AI doubts." },
  { q: "When should I upgrade?", a: "When you want every subject, unlimited doubt-solving, Mains evaluation and full analytics — usually once the habit is set." },
  { q: "Will pricing be student-friendly?", a: "Yes. Our goal is to cut the cost and clutter of UPSC prep, so Pro is designed to be accessible. Final numbers are coming soon." },
];

export default function PricingPage() {
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
    <PageShell>
      <JsonLd data={faqSchema} />
      <PageHero
        eyebrow="Pricing"
        title="Start free. Stay because it works."
        sub="Free gives you a real, personalized head start. Pro unlocks the full system when you're ready to go all in."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="flex flex-col rounded-3xl border border-[#dcd5c7] bg-[#fffdf8] p-7 shadow-sm">
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
          </div>

          <div className="relative flex flex-col rounded-3xl border-2 border-[#1a3a2a] bg-[#1a3a2a] p-7 text-white shadow-[0_20px_50px_rgba(19,37,29,0.18)]">
            <span className="absolute right-6 top-6 rounded-full bg-[#ef9f27] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#3a2706]">
              Full system
            </span>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7fe0bd]">Pro · serious aspirants</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-black">₹—</span>
              <span className="text-sm font-bold text-white/70">/ pricing coming soon</span>
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
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-3xl">
          <h2 className="text-center text-2xl font-black tracking-tight text-[#13251d]">Pricing questions</h2>
          <div className="mt-6 space-y-3">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-5">
                <p className="text-sm font-black text-[#13251d]">{f.q}</p>
                <p className="mt-2 text-sm font-semibold leading-7 text-[#536259]">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
