import Link from "next/link";
import { ArrowRight, CheckCircle2, FileSearch, ListChecks, ScanSearch, ShieldCheck } from "lucide-react";

import { PageShell, PageHero, StartFreeCta } from "@/components/marketing/PageShell";
import { JsonLd } from "@/components/marketing/JsonLd";
import { pageMeta, SITE_URL, ORG_NAME } from "@/lib/seo";

export const metadata = pageMeta({
  title: "How We Measure Coverage — Our Transparency Method | Sarit Learn",
  description:
    "Exactly how Sarit Learn measures and reports exam coverage: how we classify direct vs partial matches, our verification process, and what the numbers do and don't mean.",
  path: "/methodology",
});

const classifications = [
  { icon: CheckCircle2, label: "Direct match", detail: "The question maps to something we taught explicitly — the concept and its specifics were covered." },
  { icon: ListChecks, label: "Partial match", detail: "We taught the underlying concept, but not the exact framing or detail the question asked for." },
  { icon: ScanSearch, label: "Not covered", detail: "We did not cover it. We count and publish these honestly instead of hiding them." },
];

const process = [
  { icon: FileSearch, title: "Archive the materials", detail: "We collect everything we actually taught — lessons, notes, MCQs and handouts — for the period being measured." },
  { icon: ScanSearch, title: "Map to each question", detail: "Every exam question is compared against that archive and tagged direct, partial, or not covered." },
  { icon: ShieldCheck, title: "Verify before publishing", detail: "Matches are reviewed so a loose connection isn't counted as a direct hit." },
  { icon: ListChecks, title: "Publish — including gaps", detail: "We share the full breakdown, including where we fell short, and turn gaps into next year's content." },
];

const faqs = [
  { q: "What does a coverage percentage actually mean?", a: "It's the share of exam questions our taught materials addressed (direct + partial), measured after the exam against what we actually covered. It is a transparency metric, not a score or a prediction." },
  { q: "Does high coverage guarantee a good result?", a: "No. Coverage measures what we taught versus what was asked; your result depends on your practice, revision and exam-day performance. We never guarantee ranks." },
  { q: "Why publish the gaps at all?", a: "Because honest gaps are how we improve. Hiding them would make the number meaningless — and you deserve to judge us on evidence." },
];

export default function MethodologyPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "How we measure coverage", item: `${SITE_URL}/methodology` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How we measure exam coverage",
    description:
      "Sarit Learn's transparent method for measuring and reporting UPSC exam coverage, including classification rules and verification.",
    url: `${SITE_URL}/methodology`,
    author: { "@type": "Organization", name: ORG_NAME, url: SITE_URL },
    publisher: { "@type": "EducationalOrganization", name: ORG_NAME, url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/methodology`,
  };

  return (
    <PageShell>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={articleSchema} />

      <PageHero
        eyebrow="Transparency"
        title="How we measure coverage."
        sub="Most institutes show a number and hope you don't ask how it was calculated. Here's exactly how we measure it — and what it does and doesn't mean."
      />

      {/* Classifications */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <h2 className="text-2xl font-black tracking-tight text-[#13251d]">How we classify each question</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {classifications.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f5ee] text-[#085041]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-black text-[#13251d]">{c.label}</h3>
                <p className="mt-1.5 text-sm font-semibold leading-6 text-[#536259]">{c.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-[#dcd5c7] bg-[#fffdf8] py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Our process, step by step</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="rounded-2xl border border-[#dcd5c7] bg-[#f7f4ee] p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a3a2a] text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-black text-[#8c5d14]">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-4 text-base font-black text-[#13251d]">{p.title}</h3>
                  <p className="mt-1.5 text-sm font-semibold leading-6 text-[#536259]">{p.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Honest caveats */}
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <div className="rounded-2xl border border-[#1d9e75]/30 bg-[#e7f5ee] p-6">
          <h2 className="text-xl font-black tracking-tight text-[#13251d]">What the number does — and doesn&apos;t — mean</h2>
          <ul className="mt-4 space-y-2.5">
            {[
              "It measures what we taught versus what was asked — not your personal score.",
              "It is calculated after the exam, not a prediction of the next one.",
              "Partial matches are counted separately from direct matches, never blended to inflate the figure.",
              "We never use it to guarantee ranks or selections.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm font-bold leading-6 text-[#33443b]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-black tracking-tight text-[#13251d]">Questions about the method</h2>
          <div className="mt-4 space-y-4">
            {faqs.map((f) => (
              <div key={f.q}>
                <h3 className="text-base font-black text-[#13251d]">{f.q}</h3>
                <p className="mt-1.5 text-sm font-semibold leading-7 text-[#536259]">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/upsc-prelims-2026-showcase"
            className="inline-flex h-12 items-center justify-center rounded-md border border-[#1a3a2a] px-6 text-sm font-black text-[#1a3a2a] transition hover:bg-[#1a3a2a] hover:text-white"
          >
            See the full Prelims 2026 analysis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <StartFreeCta />
        </div>
      </section>
    </PageShell>
  );
}
