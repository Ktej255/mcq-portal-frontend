"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Map as MapIcon, PenTool, Sparkles, TrendingUp } from "lucide-react";

const SECTIONS = [
  { key: "basics", short: "Basics", icon: BookOpen, title: "Basics first", body: "Foundation definitions and the simplest framing of the topic — the starting point before depth. This is where a beginner builds the mental model before any advanced layer." },
  { key: "concepts", short: "Core concepts", icon: BookOpen, title: "Core concepts & mechanisms", body: "The key processes, models, scholars and cause-effect chains expected at optional depth. Worked explanations and the 'why', not just the 'what'." },
  { key: "mapping", short: "Mapping", icon: MapIcon, title: "Mapping", body: "Where this topic appears on the map — features to mark and link in answers, with the official India map as the base." },
  { key: "diagrams", short: "Diagrams", icon: PenTool, title: "Diagrams", body: "Labelled diagrams that raise marks. AI-generated handwritten / 3D diagrams will render here per topic." },
  { key: "trend", short: "PYQ trend", icon: TrendingUp, title: "PYQ trend (15 years)", body: "How many times this topic was asked, and the shift from direct → conceptual → applied framing across years." },
  { key: "predict", short: "Likely next", icon: Sparkles, title: "Likely next questions", body: "Predicted 1-2 year question framing for this topic, based on the trend pattern." },
];

export function GeographyReadContent() {
  const params = useSearchParams();
  const topic = params.get("topic") ?? "Topic";
  const subject = params.get("subject") ?? "geography";
  const [step, setStep] = useState(0);
  const section = SECTIONS[step];
  const Icon = section.icon;
  const isFirst = step === 0;
  const isLast = step === SECTIONS.length - 1;


  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
        <Link href={`/upsc/optional-subjects/${subject}`} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#1a3a2a]">
          <ArrowLeft className="h-4 w-4" /> Back to course
        </Link>

        <div className="mt-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Geography optional · Read</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">{topic}</h1>
        </div>

        {/* Horizontal stepper */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {SECTIONS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStep(i)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] transition ${
                i === step
                  ? "bg-[#1a3a2a] text-white"
                  : i < step
                    ? "bg-[#e7f5ee] text-[#085041]"
                    : "border border-[#dcd5c7] bg-white text-[#8a8174]"
              }`}
            >
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${i === step ? "bg-white/20" : i < step ? "bg-[#1d9e75] text-white" : "bg-[#dcd5c7] text-white"}`}>{i + 1}</span>
              {s.short}
            </button>
          ))}
        </div>

        {/* Current section */}
        <section className="mt-3 min-h-[40vh] rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
            <Icon className="h-4 w-4" /> Step {step + 1} of {SECTIONS.length}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">{section.title}</h2>
          <p className="mt-3 text-base font-semibold leading-7 text-[#49675e]">{section.body}</p>
          <p className="mt-4 rounded-md border border-[#e7e0d2] bg-[#fdfaf3] p-3 text-xs font-semibold leading-6 text-[#8a8174]">
            Founder-verified notes, visuals and examples for &ldquo;{topic}&rdquo; will fill this section.
          </p>
        </section>

        {/* Bottom navigation */}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-black text-[#1a3a2a] transition hover:bg-[#f2eadc] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {isLast ? (
            <Link href={`/upsc/optional-subjects/${subject}`} className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1d9e75] px-5 text-sm font-black text-white transition hover:bg-[#168864]">
              Finish topic <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(SECTIONS.length - 1, s + 1))}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1a3a2a] px-5 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              Next: {SECTIONS[step + 1]?.short} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
