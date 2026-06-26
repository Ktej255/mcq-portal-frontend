import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { PageShell, PageHero } from "@/components/marketing/PageShell";
import { pricingStats, billingOptions, pricingTiers } from "@/components/marketing/site-data";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Pricing — UPSC Plans from ₹399/mo | Sarit Learn",
  description:
    "Flexible UPSC plans — Foundation, Plus, Pro and Ultimate — starting at ₹399/mo. Deeper discounts on yearly, 2-year and 3-year commitments. Free resources for everyone.",
  path: "/pricing",
});

const faqs = [
  { q: "How do the multi-year discounts work?", a: "Longer commitments cost less per month: Yearly saves 15%, 2-Year saves 25%, and 3-Year saves 35% versus monthly billing." },
  { q: "Can I upgrade later?", a: "Yes — start on any tier and upgrade anytime as your preparation deepens." },
  { q: "What's free without a plan?", a: "Previous year questions, study resources, daily current affairs and our guides are open to everyone, along with the 2-minute diagnostic plan." },
];

export default function PricingPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="UPSC pricing command"
        title="Flexible plans. Transparent value."
        sub="Select a tier to match your preparation level. Get deeper discounts with yearly, 2-year or 3-year commitments. Launch pricing continued till 11/4. Start for ₹399/mo, upgrade anytime."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        {/* stats + billing options */}
        <div className="grid gap-4 md:grid-cols-[1.6fr_1fr]">
          <div className="grid gap-3 sm:grid-cols-3">
            {pricingStats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{s.label}</p>
                <p className="mt-2 text-2xl font-black text-[#13251d]">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-[#dcd5c7] bg-[#f7f4ee] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8c5d14]">Billing options</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {billingOptions.map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#dcd5c7] bg-white px-3 py-1.5 text-sm font-black text-[#13251d]"
                >
                  {b.label}
                  {b.save ? <span className="rounded-full bg-[#e7f5ee] px-1.5 text-xs font-black text-[#085041]">{b.save}</span> : null}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold text-[#536259]">Save up to 35% with a 3-year commitment.</p>
          </div>
        </div>

        {/* tiers */}
        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-3xl border p-6 shadow-sm ${
                tier.featured ? "border-2 border-[#1a3a2a] bg-[#1a3a2a] text-white" : "border-[#dcd5c7] bg-[#fffdf8]"
              }`}
            >
              {tier.featured ? (
                <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-[#ef9f27] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#3a2706]">
                  <Sparkles className="h-3 w-3" /> Popular
                </span>
              ) : null}
              <p className={`text-xs font-black uppercase tracking-[0.18em] ${tier.featured ? "text-[#7fe0bd]" : "text-[#1d9e75]"}`}>
                {tier.name}
              </p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className={`text-3xl font-black ${tier.featured ? "text-white" : "text-[#13251d]"}`}>{tier.price}</span>
                <span className={`text-xs font-bold ${tier.featured ? "text-white/70" : "text-[#536259]"}`}>{tier.cadence}</span>
              </div>
              <p className={`mt-2 text-sm font-semibold leading-6 ${tier.featured ? "text-white/80" : "text-[#536259]"}`}>{tier.tagline}</p>

              <div className={`mt-4 rounded-xl p-3 text-xs font-bold leading-5 ${tier.featured ? "bg-white/10 text-white/85" : "bg-[#e7f5ee] text-[#085041]"}`}>
                {tier.usage}
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-sm font-semibold leading-6 ${tier.featured ? "text-white/90" : "text-[#33443b]"}`}>
                    <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${tier.featured ? "text-[#5fd6ab]" : "text-[#1d9e75]"}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/login?redirect=/upsc"
                className={`mt-6 inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-black transition ${
                  tier.featured
                    ? "bg-[#ef9f27] text-[#3a2706] hover:bg-[#f4b04b]"
                    : "border border-[#1a3a2a] text-[#1a3a2a] hover:bg-[#1a3a2a] hover:text-white"
                }`}
              >
                Choose {tier.name}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* free note */}
        <div className="mt-10 flex flex-col items-start gap-2 rounded-2xl border border-[#1d9e75]/30 bg-[#e7f5ee] p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-[#085041]">
            Free for everyone: previous year questions, study resources, daily current affairs, guides and the 2-minute diagnostic.
          </p>
          <Link href="/start" className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]">
            Take the free diagnostic
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {/* FAQ */}
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
