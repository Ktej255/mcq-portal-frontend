import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";

import { PageShell, PageHero } from "@/components/marketing/PageShell";
import { JsonLd } from "@/components/marketing/JsonLd";
import { guides, guideClusters } from "@/components/marketing/guides-data";
import { pageMeta, SITE_URL, ORG_NAME } from "@/lib/seo";

export const metadata = pageMeta({
  title: "UPSC Guides — Strategy, Syllabus & Resources | Sarit Learn",
  description:
    "Practical, no-fluff UPSC guides: how to start preparation, the syllabus explained, the best books, current-affairs strategy and a Prelims study plan.",
  path: "/guides",
});

export default function GuidesPage() {
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "UPSC Guides — Sarit Learn",
    url: `${SITE_URL}/guides`,
    publisher: { "@type": "EducationalOrganization", name: ORG_NAME, url: SITE_URL },
    blogPost: guides.map((g) => ({
      "@type": "BlogPosting",
      headline: g.title,
      description: g.excerpt,
      url: `${SITE_URL}/guides/${g.slug}`,
    })),
  };

  return (
    <PageShell>
      <JsonLd data={blogSchema} />
      <PageHero
        eyebrow="Guides"
        title="UPSC guides, without the noise."
        sub="Clear, practical answers to the questions every aspirant asks — built to help you decide what to study and how, then get back to studying."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        {guideClusters.map((cluster) => {
          const items = guides.filter((g) => g.cluster === cluster);
          if (items.length === 0) return null;
          return (
            <div key={cluster} className="mb-12 last:mb-0">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">{cluster}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/guides/${g.slug}`}
                    className="group flex flex-col rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f5ee] text-[#085041]">
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-base font-black leading-snug text-[#13251d]">{g.title}</h3>
                    <p className="mt-1.5 flex-1 text-sm font-semibold leading-6 text-[#536259]">{g.excerpt}</p>
                    <span className="mt-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8c5d14]">
                        <Clock className="h-3.5 w-3.5" />
                        {g.readMins} min read
                      </span>
                      <ArrowRight className="h-4 w-4 text-[#085041] transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </PageShell>
  );
}
