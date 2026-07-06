"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, FileText, Map as MapIcon, PenTool, Sparkles, TrendingUp } from "lucide-react";

import { OPTIONAL_SUBJECTS } from "@/lib/upsc/optionalSubjectsCatalog";

const COMMON_SECTIONS = [
  { key: "basics", short: "Basics", icon: BookOpen, title: "Basics first", body: "Foundation definitions and the simplest framing of the topic - the starting point before depth. This is where a beginner builds the mental model before any advanced layer." },
  { key: "concepts", short: "Core concepts", icon: BookOpen, title: "Core concepts & mechanisms", body: "The key processes, models, scholars and cause-effect chains expected at optional depth. Worked explanations and the why, not just the what." },
  { key: "diagrams", short: "Diagrams", icon: PenTool, title: "Diagrams", body: "Labelled diagrams, flowcharts, typologies, and compact visual frames that raise marks for this optional topic." },
  { key: "trend", short: "PYQ trend", icon: TrendingUp, title: "PYQ trend", body: "How often this topic appears, and the shift from direct to conceptual to applied framing across recent papers." },
  { key: "predict", short: "Likely next", icon: Sparkles, title: "Likely next questions", body: "Likely question framing for this topic, based on the syllabus slot, PYQ trend, and answer-writing demand." },
];

const SUBJECT_SECTION_OVERRIDES: Record<string, typeof COMMON_SECTIONS> = {
  geography: [
    COMMON_SECTIONS[0],
    COMMON_SECTIONS[1],
    { key: "mapping", short: "Mapping", icon: MapIcon, title: "Mapping", body: "Where this topic appears on the map - features to mark and link in answers, with the official India map as the base." },
    COMMON_SECTIONS[2],
    { ...COMMON_SECTIONS[3], title: "PYQ trend (15 years)" },
    COMMON_SECTIONS[4],
  ],
  anthropology: [
    COMMON_SECTIONS[0],
    COMMON_SECTIONS[1],
    { key: "casework", short: "Casework", icon: FileText, title: "Casework and examples", body: "Scholar, tribe, Indian case, policy, fieldwork, or biological example slots for this topic. Uploaded content will fill these examples without copying unlicensed handouts." },
    { key: "diagrams", short: "Diagrams", icon: PenTool, title: "Diagrams and notation", body: "Evolution plates, kinship notation, biological sketches, and tribal-development flowcharts that make Anthropology answers exam-ready." },
    COMMON_SECTIONS[3],
    COMMON_SECTIONS[4],
  ],
};

export function GeographyReadContent() {
  const params = useSearchParams();
  const topic = params.get("topic") ?? "Topic";
  const subject = params.get("subject") ?? "geography";
  const subjectName = useMemo(
    () => OPTIONAL_SUBJECTS.find((item) => item.slug === subject)?.name ?? subject.replace(/-/g, " "),
    [subject],
  );
  const sections = SUBJECT_SECTION_OVERRIDES[subject] ?? COMMON_SECTIONS;
  const [step, setStep] = useState(0);
  const section = sections[Math.min(step, sections.length - 1)];
  const Icon = section.icon;
  const isFirst = step === 0;
  const isLast = step === sections.length - 1;

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
        <Link href={`/upsc/optional-subjects/${subject}`} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#1a3a2a]">
          <ArrowLeft className="h-4 w-4" /> Back to course
        </Link>

        <div className="mt-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">{subjectName} optional - Read</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">{topic}</h1>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {sections.map((s, i) => (
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

        <section className="mt-3 min-h-[40vh] rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
            <Icon className="h-4 w-4" /> Step {step + 1} of {sections.length}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">{section.title}</h2>
          <p className="mt-3 text-base font-semibold leading-7 text-[#49675e]">{section.body}</p>
          <p className="mt-4 rounded-md border border-[#e7e0d2] bg-[#fdfaf3] p-3 text-xs font-semibold leading-6 text-[#8a8174]">
            Founder-verified notes, visuals and examples for &ldquo;{topic}&rdquo; will fill this section after upload.
          </p>
        </section>

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
              onClick={() => setStep((s) => Math.min(sections.length - 1, s + 1))}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1a3a2a] px-5 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              Next: {sections[step + 1]?.short} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}