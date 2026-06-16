"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Map as MapIcon, PenTool, Sparkles, TrendingUp } from "lucide-react";

const SECTIONS = [
  { icon: BookOpen, title: "Basics first", body: "Foundation definitions and the simplest framing of the topic — the starting point before depth." },
  { icon: BookOpen, title: "Core concepts & mechanisms", body: "The key processes, models, scholars and cause-effect chains expected at optional depth." },
  { icon: MapIcon, title: "Mapping", body: "Where this topic appears on the map — features to mark and link in answers." },
  { icon: PenTool, title: "Diagrams", body: "Labelled diagrams that raise marks (AI-generated handwritten / 3D diagrams planned here)." },
  { icon: TrendingUp, title: "PYQ trend (15 years)", body: "How many times asked, and the shift from direct -> conceptual -> applied for this topic." },
  { icon: Sparkles, title: "Likely next questions", body: "Predicted 1-2 year question framing based on the trend pattern." },
];

export function GeographyReadContent() {
  const params = useSearchParams();
  const topic = params.get("topic") ?? "Topic";

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
        <Link href="/upsc/optional-subjects/geography" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#1a3a2a]">
          <ArrowLeft className="h-4 w-4" /> Back to course
        </Link>
        <section className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Geography optional · Read</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">{topic}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">Structured study page. Content is seeded and will be filled with founder-verified notes, maps and diagrams.</p>
        </section>
        <div className="mt-4 space-y-3">
          {SECTIONS.map(({ icon: Icon, title, body }) => (
            <section key={title} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
              <p className="inline-flex items-center gap-2 text-sm font-black tracking-tight text-[#13251d]"><Icon className="h-4 w-4 text-[#1d9e75]" /> {title}</p>
              <p className="mt-1.5 text-sm font-semibold leading-6 text-[#5d675f]">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
