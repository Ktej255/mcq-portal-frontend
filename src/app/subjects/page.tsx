import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageShell, PageHero } from "@/components/marketing/PageShell";
import { JsonLd } from "@/components/marketing/JsonLd";
import { gsSubjects, optionalSubjects, subjects, type Subject } from "@/components/marketing/site-data";
import { pageMeta, SITE_URL } from "@/lib/seo";

export const metadata = pageMeta({
  title: "UPSC Subjects — General Studies & Optional Subjects | Sarit Classes",
  description:
    "Explore every UPSC subject — General Studies and Optional subjects like PSIR, Sociology and Public Administration — each taught through one connected daily loop.",
  path: "/subjects",
});

const statusStyles: Record<Subject["status"], string> = {
  Live: "bg-[#e7f5ee] text-[#085041]",
  Building: "bg-[#fff2dd] text-[#8c5d14]",
  Planned: "bg-[#eef0ee] text-[#6b7a70]",
};

function SubjectCard({ s }: { s: Subject }) {
  const Icon = s.icon;
  return (
    <Link
      href={`/subjects/${s.slug}`}
      className="group flex flex-col rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f5ee] text-[#085041]">
          <Icon className="h-5 w-5" />
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusStyles[s.status]}`}>
          {s.status}
        </span>
      </div>
      <h3 className="mt-4 text-base font-black text-[#13251d]">{s.name}</h3>
      <p className="mt-1.5 flex-1 text-sm font-semibold leading-6 text-[#536259]">{s.tagline}</p>
      <span className="mt-4 inline-flex items-center text-sm font-black text-[#085041]">
        Explore
        <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export default function SubjectsPage() {
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "UPSC subjects on Sarit Classes",
    itemListElement: subjects.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      url: `${SITE_URL}/subjects/${s.slug}`,
    })),
  };

  return (
    <PageShell>
      <JsonLd data={itemListSchema} />
      <PageHero
        eyebrow="Subjects"
        title="Every UPSC subject — GS and Optional."
        sub="We perfect one subject loop before opening the next. General Studies is rolling out now; optional subjects are on the roadmap."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">General Studies</h2>
          <span className="text-sm font-bold text-[#536259]">{gsSubjects.length} subjects</span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gsSubjects.map((s) => (
            <SubjectCard key={s.slug} s={s} />
          ))}
        </div>

        <div id="optional" className="mt-16 scroll-mt-24">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Optional subjects</h2>
            <span className="text-sm font-bold text-[#536259]">{optionalSubjects.length} subjects</span>
          </div>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#536259]">
            Your optional can make or break the Mains rank. We&apos;re building dedicated loops for the most-chosen optionals — tell us yours and we&apos;ll prioritise it.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {optionalSubjects.map((s) => (
              <SubjectCard key={s.slug} s={s} />
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
