import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";

import { PageShell, StartFreeCta } from "@/components/marketing/PageShell";
import { JsonLd } from "@/components/marketing/JsonLd";
import { getGuide, guides } from "@/components/marketing/guides-data";
import { pageMeta, SITE_URL, ORG_NAME } from "@/lib/seo";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide not found — Sarit Learn" };
  return pageMeta({ title: guide.metaTitle, description: guide.excerpt, path: `/guides/${guide.slug}` });
}

const relatedLinks = [
  { label: "Explore subjects", href: "/subjects" },
  { label: "Free PYQs", href: "/pyqs" },
  { label: "Current affairs", href: "/current-affairs" },
  { label: "Tests & practice", href: "/tests" },
];

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt,
    url: `${SITE_URL}/guides/${guide.slug}`,
    inLanguage: "en-IN",
    author: { "@type": "Organization", name: ORG_NAME, url: SITE_URL },
    publisher: { "@type": "EducationalOrganization", name: ORG_NAME, url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
      { "@type": "ListItem", position: 3, name: guide.title, item: `${SITE_URL}/guides/${guide.slug}` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <PageShell>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />

      <article className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <Link href="/guides" className="text-sm font-bold text-[#536259] hover:text-[#13251d]">
          ← All guides
        </Link>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[#8c5d14]">{guide.cluster}</p>
        <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-[#13251d] md:text-4xl">{guide.title}</h1>
        <div className="mt-3 flex items-center gap-4 text-xs font-bold text-[#536259]">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {guide.readMins} min read
          </span>
          <span>Updated {guide.updated}</span>
        </div>

        <p className="mt-6 text-lg font-semibold leading-8 text-[#3a4f45]">{guide.intro}</p>

        {guide.sections.map((s) => (
          <section key={s.heading} className="mt-8">
            <h2 className="text-xl font-black tracking-tight text-[#13251d]">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-3 text-base font-semibold leading-8 text-[#536259]">
                {p}
              </p>
            ))}
          </section>
        ))}

        <section className="mt-10">
          <h2 className="text-xl font-black tracking-tight text-[#13251d]">Frequently asked questions</h2>
          <div className="mt-4 space-y-4">
            {guide.faqs.map((f) => (
              <div key={f.q}>
                <h3 className="text-base font-black text-[#13251d]">{f.q}</h3>
                <p className="mt-1.5 text-base font-semibold leading-8 text-[#536259]">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-2">
          {relatedLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dcd5c7] bg-[#fffdf8] px-3 py-1.5 text-sm font-bold text-[#085041] transition hover:bg-[#e7f5ee]"
            >
              {l.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-[#1a3a2a] to-[#0c1f17] px-8 py-12 text-center text-white">
          <h2 className="max-w-xl text-2xl font-black tracking-tight">Put this into a personalized plan.</h2>
          <p className="max-w-md text-sm font-semibold text-white/75">
            Take the 2-minute diagnostic and turn this advice into a daily plan built around you.
          </p>
          <div className="mt-2">
            <StartFreeCta />
          </div>
        </div>
      </article>
    </PageShell>
  );
}
