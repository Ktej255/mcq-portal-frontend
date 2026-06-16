import type { Metadata } from "next";
import { Compass, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";

import { PageShell, PageHero, StartFreeCta } from "@/components/marketing/PageShell";

export const metadata: Metadata = {
  title: "About — Sarit Learn UPSC Command",
  description:
    "Sarit Learn exists to cut the noise and cost of UPSC preparation with one connected, honest, personalized learning system.",
};

const values = [
  { icon: Compass, title: "Clarity over clutter", detail: "One connected loop instead of a hundred scattered sources. Less noise, more retention." },
  { icon: ShieldCheck, title: "Honesty over hype", detail: "We publish our real coverage — strengths and gaps — instead of marketing claims." },
  { icon: HeartHandshake, title: "Access over exclusivity", detail: "Quality prep shouldn't be locked behind expensive bundles. Free should be genuinely useful." },
  { icon: Sparkles, title: "Personal over generic", detail: "Your plan should adapt to your weak areas, not hand everyone the same content." },
];

export default function AboutPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About us"
        title="UPSC prep, the way it should have been."
        sub="Millions of aspirants work incredibly hard, yet drown in scattered content and opaque promises. We're building the calm, honest, personalized alternative."
      />

      <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <div className="space-y-6 text-base font-semibold leading-8 text-[#536259]">
          <p>
            The UPSC ecosystem isn&apos;t short on material — it&apos;s drowning in it. Endless PDFs, videos, apps and forwards
            leave aspirants busier but not better prepared. The hard part isn&apos;t finding content; it&apos;s knowing what to
            study, when to revise, and whether it&apos;s actually working.
          </p>
          <p>
            Sarit Learn brings the whole journey into one place: watch a concept, discuss your doubt, practise it, see your
            weak areas, and revise them before you forget. MCQs are one action in that loop — not the entire product.
          </p>
          <p>
            And we hold ourselves accountable. We publish our real question-by-question coverage so you can judge us on
            evidence, not slogans.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f5ee] text-[#085041]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-black text-[#13251d]">{v.title}</h3>
                <p className="mt-1.5 text-sm font-semibold leading-6 text-[#536259]">{v.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <StartFreeCta />
        </div>
      </section>
    </PageShell>
  );
}
