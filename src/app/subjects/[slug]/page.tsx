import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  MessageSquareText,
  PlayCircle,
  Route,
} from "lucide-react";

import { PageShell } from "@/components/marketing/PageShell";
import { StartFreeCta } from "@/components/marketing/PageShell";
import { getSubject, subjects, type Subject } from "@/components/marketing/site-data";

export function generateStaticParams() {
  return subjects.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const subject = getSubject(slug);
  if (!subject) return { title: "Subject not found — Sarit Learn" };
  return {
    title: `${subject.name} for UPSC — Sarit Learn`,
    description: subject.tagline,
  };
}

const statusStyles: Record<Subject["status"], string> = {
  Live: "bg-[#e7f5ee] text-[#085041]",
  Building: "bg-[#fff2dd] text-[#8c5d14]",
  Planned: "bg-[#eef0ee] text-[#6b7a70]",
};

const loopApplied = [
  { icon: PlayCircle, label: "Watch", detail: "Concept-first lessons mapped to the syllabus." },
  { icon: MessageSquareText, label: "Talk", detail: "Clear doubts with the ask-the-teacher AI." },
  { icon: ClipboardCheck, label: "Practise", detail: "Fresh MCQs tuned to the topic and your gaps." },
  { icon: BookOpenCheck, label: "Revise", detail: "Spaced revision resurfaces it before you forget." },
];

export default async function SubjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const subject = getSubject(slug);
  if (!subject) notFound();

  const Icon = subject.icon;
  const related = subjects.filter((s) => s.category === subject.category && s.slug !== subject.slug).slice(0, 3);

  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-[#dcd5c7]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_60%_at_85%_0%,rgba(29,158,117,0.12),transparent)]" />
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
          <Link href="/subjects" className="text-sm font-bold text-[#536259] hover:text-[#13251d]">
            ← All subjects
          </Link>
          <div className="mt-5 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a3a2a] text-white">
              <Icon className="h-7 w-7" />
            </span>
            <div>
              <div className="flex items-center gap-3">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8c5d14]">
                  {subject.category === "GS" ? "General Studies" : "Optional subject"}
                </p>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusStyles[subject.status]}`}>
                  {subject.status}
                </span>
              </div>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-[#13251d] md:text-4xl">{subject.name}</h1>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-[#536259]">{subject.tagline}</p>
          <div className="mt-7">
            <StartFreeCta label={subject.status === "Live" ? "Start this subject free" : "Get notified at launch"} />
          </div>
        </div>
      </section>

      {subject.topics && subject.topics.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">What this subject covers</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {subject.topics.map((t) => (
              <div key={t} className="flex items-start gap-2 rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 text-sm font-bold leading-6 text-[#33443b]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                {t}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-y border-[#dcd5c7] bg-[#fffdf8] py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Route className="h-5 w-5 text-[#1d9e75]" />
            <h2 className="text-2xl font-black tracking-tight text-[#13251d]">How you&apos;ll study it</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loopApplied.map((step) => {
              const StepIcon = step.icon;
              return (
                <div key={step.label} className="rounded-2xl border border-[#dcd5c7] bg-[#f7f4ee] p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a3a2a] text-white">
                    <StepIcon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-black text-[#13251d]">{step.label}</h3>
                  <p className="mt-1.5 text-sm font-semibold leading-6 text-[#536259]">{step.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Related subjects</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {related.map((r) => {
              const RIcon = r.icon;
              return (
                <Link
                  key={r.slug}
                  href={`/subjects/${r.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-4 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f5ee] text-[#085041]">
                    <RIcon className="h-5 w-5" />
                  </span>
                  <span className="flex-1 text-sm font-black text-[#13251d]">{r.name}</span>
                  <ArrowRight className="h-4 w-4 text-[#085041] transition group-hover:translate-x-1" />
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
