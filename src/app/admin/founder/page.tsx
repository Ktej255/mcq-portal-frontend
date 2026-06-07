import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { geographyDay1Recommendation } from "@/lib/upsc/geographyDay1ContentIntake";
import { geographyFounderReviewItems } from "@/lib/upsc/geographyPilotRelease";
import { releaseGates } from "@/lib/upsc/featureInventory";

export default function FounderReviewPage() {
  const completedGates = releaseGates.filter((gate) => gate.complete).length;

  return (
    <div className="space-y-6" data-testid="admin-founder-review-page">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-6">
        <div className="max-w-3xl">
          <Badge variant="outline" className="mb-3 h-7 rounded-md border-emerald-200 bg-emerald-50 px-2 font-bold text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            Founder Review
          </Badge>
          <h1 className="text-3xl font-black text-zinc-950">Geography Pilot Review Center</h1>
          <p className="mt-3 text-base leading-7 text-zinc-600">
            Human review checklist for the first learner path. This screen intentionally shows review work and open
            gates, not fabricated institutional-health percentages.
          </p>
        </div>
        <Link
          href="/admin/launch-plan"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-800"
        >
          Open Launch Plan <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Founder surfaces</p>
          <p className="mt-3 text-3xl font-black text-emerald-950">{geographyFounderReviewItems.length}</p>
          <p className="mt-2 text-sm leading-6 text-emerald-800">
            Landing, Watch, Talk, Visual Lab, MCQ intake, Track/Revisit, and mobile fit.
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Release gate</p>
          <p className="mt-3 text-3xl font-black text-amber-950">
            {completedGates}/{releaseGates.length}
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Live Supabase, Google OAuth continuity, real Day 1 assets, and the first tester wave remain open.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" data-testid="admin-founder-surface-checklist">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
            <ClipboardCheck className="h-5 w-5 text-emerald-700" />
            Seven-Point Founder Checklist
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Use the Launch Plan to save the actual review completion state before sharing.
          </p>
        </div>
        <div className="mt-4 divide-y divide-zinc-100">
          {geographyFounderReviewItems.map((item, index) => (
            <div key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black text-zinc-950">
                  {index + 1}. {item.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{item.detail}</p>
              </div>
              <Link
                href={item.href}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50"
              >
                Open Surface <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm" data-testid="admin-founder-day1-decision">
        <h2 className="flex items-center gap-2 text-xl font-black text-emerald-950">
          <BookOpenCheck className="h-5 w-5 text-emerald-700" />
          Day 1 Content Decision
        </h2>
        <p className="mt-3 text-sm font-black leading-6 text-emerald-950">
          Day 1: {geographyDay1Recommendation.proposedDay1}
        </p>
        <p className="mt-1 text-sm font-black leading-6 text-emerald-950">
          Day 2: {geographyDay1Recommendation.proposedDay2}
        </p>
        <p className="mt-3 text-sm leading-6 text-emerald-800">{geographyDay1Recommendation.decision}</p>
        <Link
          href="/admin/feature-inventory"
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-emerald-300 bg-white px-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-100"
        >
          Inspect Founder Sources <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" data-testid="admin-founder-release-gates">
        <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          Open Release Boundary
        </h2>
        <div className="mt-4 divide-y divide-zinc-100">
          {releaseGates.map((gate) => {
            const Icon = gate.complete ? CheckCircle2 : CircleDashed;
            return (
              <div key={gate.title} className="flex gap-3 py-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${gate.complete ? "text-emerald-600" : "text-amber-600"}`} />
                <div>
                  <p className="text-sm font-black text-zinc-950">{gate.title}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">{gate.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
