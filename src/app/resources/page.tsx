import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { PageShell, PageHero, StartFreeCta } from "@/components/marketing/PageShell";
import { resourceGroups } from "@/components/marketing/site-data";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Free UPSC Study Resources — NCERTs, Current Affairs & Mains Toolkit | Sarit Learn",
  description:
    "Free, curated UPSC study resources — NCERT booklist, standard references, daily current affairs, mind maps, PYQs and Mains answer-writing frameworks.",
  path: "/resources",
});

export default function ResourcesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Free resources"
        title="Curated, not cluttered."
        sub="The problem isn't a lack of material — it's too much of it. Here's a clean, exam-focused set of free resources, in the order you actually need them."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {resourceGroups.map((group) => (
            <div key={group.heading} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f5ee] text-[#085041]">
                  <BookOpen className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-black tracking-tight text-[#13251d]">{group.heading}</h2>
              </div>
              <ul className="mt-5 space-y-4">
                {group.items.map((it) => (
                  <li key={it.title}>
                    <Link
                      href="/login?redirect=/upsc"
                      className="group flex items-start gap-3 rounded-xl border border-transparent p-2 transition hover:border-[#dcd5c7] hover:bg-[#f7f4ee]"
                    >
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75] transition group-hover:translate-x-1" />
                      <span>
                        <span className="block text-sm font-black text-[#13251d]">{it.title}</span>
                        <span className="mt-0.5 block text-sm font-semibold leading-6 text-[#536259]">{it.detail}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-[#1a3a2a] to-[#0c1f17] px-8 py-12 text-center text-white">
          <h2 className="max-w-2xl text-2xl font-black tracking-tight md:text-3xl">
            Resources are better when they&apos;re part of a plan.
          </h2>
          <p className="max-w-xl text-sm font-semibold text-white/75">
            Take the 2-minute diagnostic and we&apos;ll sequence these into a personalized study plan for you.
          </p>
          <div className="mt-2">
            <StartFreeCta />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
