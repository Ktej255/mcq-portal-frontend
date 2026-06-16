import Link from "next/link";
import { ArrowRight, CalendarDays, FileText, Layers, Newspaper } from "lucide-react";

import { PageShell, PageHero, StartFreeCta } from "@/components/marketing/PageShell";
import { JsonLd } from "@/components/marketing/JsonLd";
import {
  currentAffairsCategories,
  currentAffairsDailyFormat,
  currentAffairsSamples,
  monthlyMagazineMonths,
} from "@/components/marketing/site-data";
import { pageMeta, SITE_URL, ORG_NAME } from "@/lib/seo";

export const metadata = pageMeta({
  title: "UPSC Current Affairs — Daily News, Editorials & Monthly Magazine | Sarit Learn",
  description:
    "Exam-filtered UPSC current affairs every day — Prelims bytes, Mains articles, editorial gist, schemes and a daily quiz — plus monthly consolidation. Less noise, more signal.",
  path: "/current-affairs",
});

export default function CurrentAffairsPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Current Affairs", item: `${SITE_URL}/current-affairs` },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "UPSC Current Affairs",
    description:
      "Daily, exam-filtered current affairs for UPSC: Prelims bytes, Mains articles, editorial gist, PIB and schemes, with a daily quiz and monthly consolidation.",
    url: `${SITE_URL}/current-affairs`,
    isPartOf: { "@type": "WebSite", name: ORG_NAME, url: SITE_URL },
  };

  return (
    <PageShell>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={collectionSchema} />

      <PageHero
        eyebrow="Current affairs"
        title="The news that matters for UPSC — filtered, daily."
        sub="Thousands of headlines appear every day; only a fraction is exam-relevant. We filter the noise into a focused daily briefing and consolidate it monthly for revision."
      />

      {/* Daily format */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-[#1d9e75]" />
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">What you get every day</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {currentAffairsDailyFormat.map((d) => (
            <div key={d.title} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <h3 className="text-base font-black text-[#13251d]">{d.title}</h3>
              <p className="mt-1.5 text-sm font-semibold leading-6 text-[#536259]">{d.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-[#dcd5c7] bg-[#fffdf8] py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-[#1d9e75]" />
            <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Organised by syllabus area</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentAffairsCategories.map((c) => (
              <div key={c.name} className="rounded-2xl border border-[#dcd5c7] bg-[#f7f4ee] p-5">
                <h3 className="text-base font-black text-[#13251d]">{c.name}</h3>
                <p className="mt-1.5 text-sm font-semibold leading-6 text-[#536259]">{c.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample briefing */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="flex items-center gap-3">
          <Newspaper className="h-5 w-5 text-[#1d9e75]" />
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">A sample daily briefing</h2>
        </div>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#536259]">
          Examples of the daily format using recurring, high-frequency exam themes — the live briefing updates every morning.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {currentAffairsSamples.map((s) => (
            <div key={s.title} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <span className="rounded-full bg-[#e7f5ee] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#085041]">
                {s.tag}
              </span>
              <h3 className="mt-3 text-base font-black text-[#13251d]">{s.title}</h3>
              <p className="mt-1.5 text-sm font-semibold leading-6 text-[#536259]">{s.summary}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Monthly magazine */}
      <section className="border-y border-[#dcd5c7] bg-[#fffdf8] py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-[#1d9e75]" />
            <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Monthly magazine & consolidation</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#536259]">
            Every month is consolidated into a single, revision-ready magazine so nothing slips through the cracks.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {monthlyMagazineMonths.map((m) => (
              <Link
                key={m}
                href="/login?redirect=/upsc"
                className="group flex items-center justify-between rounded-xl border border-[#dcd5c7] bg-[#f7f4ee] p-4 transition hover:-translate-y-1 hover:shadow-md"
              >
                <span className="text-sm font-black text-[#13251d]">{m}</span>
                <ArrowRight className="h-4 w-4 text-[#085041] transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:px-8">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-[#1a3a2a] to-[#0c1f17] px-8 py-12 text-center text-white">
          <h2 className="max-w-2xl text-2xl font-black tracking-tight md:text-3xl">
            Read the daily briefing, then test yourself in one tap.
          </h2>
          <p className="max-w-xl text-sm font-semibold text-white/75">
            Current affairs flow straight into your daily loop and daily quiz — so reading turns into retention.
          </p>
          <div className="mt-2">
            <StartFreeCta />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
