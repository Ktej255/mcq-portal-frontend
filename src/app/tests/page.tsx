import { BarChart3, CheckCircle2, ClipboardCheck, Repeat2 } from "lucide-react";

import { PageShell, PageHero, StartFreeCta } from "@/components/marketing/PageShell";
import { JsonLd } from "@/components/marketing/JsonLd";
import { testFormats, testFeatures } from "@/components/marketing/site-data";
import { pageMeta, SITE_URL, ORG_NAME } from "@/lib/seo";

export const metadata = pageMeta({
  title: "UPSC Tests & Daily Practice — Prelims, CSAT & Mains Mock Tests | Sarit Learn",
  description:
    "Daily quizzes, full-length Prelims mocks, CSAT practice and Mains answer writing — with instant solutions, weakness analytics and all-India percentile, inside one daily loop.",
  path: "/tests",
});

export default function TestsPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Tests & Practice", item: `${SITE_URL}/tests` },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "UPSC Tests & Daily Practice",
    description:
      "UPSC practice on Sarit Learn: daily quizzes, Prelims test series, CSAT practice and Mains answer writing with instant solutions and analytics.",
    url: `${SITE_URL}/tests`,
    isPartOf: { "@type": "WebSite", name: ORG_NAME, url: SITE_URL },
  };

  return (
    <PageShell>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={collectionSchema} />

      <PageHero
        eyebrow="Tests & practice"
        title="Practice that diagnoses, not just scores."
        sub="From a 5-minute daily quiz to full-length mocks and Mains answer writing — every attempt feeds your weakness map and revision queue, so practice actually moves the needle."
      />

      {/* Formats */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-5 w-5 text-[#1d9e75]" />
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Ways to practise</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {testFormats.map((t) => (
            <div key={t.title} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <h3 className="text-base font-black text-[#13251d]">{t.title}</h3>
              <p className="mt-1.5 text-sm font-semibold leading-6 text-[#536259]">{t.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-[#dcd5c7] bg-[#fffdf8] py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-[#1d9e75]" />
            <h2 className="text-2xl font-black tracking-tight text-[#13251d]">What makes it different</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {testFeatures.map((f) => (
              <div key={f.title} className="flex flex-col rounded-2xl border border-[#dcd5c7] bg-[#f7f4ee] p-5">
                <CheckCircle2 className="h-5 w-5 text-[#1d9e75]" />
                <h3 className="mt-3 text-base font-black text-[#13251d]">{f.title}</h3>
                <p className="mt-1.5 text-sm font-semibold leading-6 text-[#536259]">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loop tie-in */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:px-8">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-[#1a3a2a] to-[#0c1f17] px-8 py-12 text-center text-white">
          <Repeat2 className="h-8 w-8 text-[#7fe0bd]" />
          <h2 className="max-w-2xl text-2xl font-black tracking-tight md:text-3xl">
            MCQ is one action in the loop — not the whole product.
          </h2>
          <p className="max-w-xl text-sm font-semibold text-white/75">
            Each test updates your weak-topic queue and schedules a spaced re-test, so you stop forgetting what you practise.
          </p>
          <div className="mt-2">
            <StartFreeCta label="Take a free daily quiz" />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
