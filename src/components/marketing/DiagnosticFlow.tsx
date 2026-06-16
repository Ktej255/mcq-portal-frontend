"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Sparkles, Target } from "lucide-react";

import { gsSubjects } from "./site-data";

type Answers = {
  year: string;
  stage: string;
  subjects: string[];
  hours: string;
  optional: string;
};

const yearOptions = ["2026", "2027", "2028 or later"];
const stageOptions = ["Just starting out", "Built my NCERT foundation", "In revision mode", "Heavy test practice"];
const hoursOptions = ["Under 2 hours", "2–4 hours", "4–6 hours", "6+ hours"];
const optionalOptions = ["Still undecided", "Sociology", "PSIR", "Public Administration", "Anthropology", "Geography", "Already chosen"];

const STORAGE_KEY = "sarit-diagnostic-plan-v1";

const dailyMcqByHours: Record<string, number> = {
  "Under 2 hours": 10,
  "2–4 hours": 20,
  "4–6 hours": 30,
  "6+ hours": 40,
};

const totalSteps = 5;

export function DiagnosticFlow() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<Answers>({
    year: "",
    stage: "",
    subjects: [],
    hours: "",
    optional: "",
  });

  const focusSubjects = gsSubjects.map((s) => s.name);

  function toggleSubject(name: string) {
    setAnswers((a) => ({
      ...a,
      subjects: a.subjects.includes(name) ? a.subjects.filter((s) => s !== name) : [...a.subjects, name],
    }));
  }

  const canAdvance =
    (step === 0 && answers.year) ||
    (step === 1 && answers.stage) ||
    (step === 2 && answers.subjects.length > 0) ||
    (step === 3 && answers.hours) ||
    (step === 4 && answers.optional);

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...answers, createdAt: new Date().toISOString() }));
    } catch {
      // ignore storage errors (private mode etc.)
    }
    setDone(true);
  }

  function restart() {
    setAnswers({ year: "", stage: "", subjects: [], hours: "", optional: "" });
    setStep(0);
    setDone(false);
  }

  if (done) {
    const focus = answers.subjects[0] ?? "Geography";
    const dailyMcqs = dailyMcqByHours[answers.hours] ?? 10;
    const planItems = [
      `Start with ${focus} — your first connected daily loop (Watch → Talk → Visual Lab → MCQ → Track → Revisit).`,
      `Daily target: ${dailyMcqs} personalized MCQs + a short current-affairs quiz to build the habit.`,
      "Keep a light daily current-affairs routine instead of hoarding magazines.",
      "Take a weekly mock and turn every mistake into a spaced re-test.",
      answers.optional === "Still undecided"
        ? "Explore optional subjects before committing — we'll help you compare."
        : `Optional: ${answers.optional} — we'll factor this into your Mains roadmap.`,
    ];

    return (
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <div className="rounded-3xl border border-[#1d9e75]/30 bg-[#e7f5ee] p-7 md:p-9">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-[#085041]">
            <Sparkles className="h-3.5 w-3.5" /> Your personalized starting plan
          </span>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#13251d] md:text-4xl">
            Here&apos;s your plan for the {answers.year} attempt.
          </h1>
          <p className="mt-3 text-sm font-semibold leading-7 text-[#3a4f45]">
            Built from your answers — {answers.stage.toLowerCase()}, {answers.hours.toLowerCase()} a day. This is a
            starting point; the plan adapts as you practise.
          </p>

          <ul className="mt-6 space-y-3">
            {planItems.map((p) => (
              <li key={p} className="flex items-start gap-2.5 rounded-xl bg-white p-4 text-sm font-bold leading-6 text-[#33443b]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login?redirect=/upsc"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-md bg-[#1a3a2a] px-6 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              Continue to the portal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={restart}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#1d9e75]/40 bg-white px-5 text-sm font-black text-[#085041] transition hover:bg-[#d8f0e6]"
            >
              <RotateCcw className="h-4 w-4" />
              Retake
            </button>
          </div>
          <Link href="/demo" className="mt-4 inline-flex items-center text-sm font-black text-[#085041] underline-offset-4 hover:underline">
            Preview your daily dashboard
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs font-semibold text-[#6b7a70]">No card required. Your plan is saved on this device.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 md:px-8">
      {/* progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wide text-[#536259]">
          <span>Step {step + 1} of {totalSteps}</span>
          <span className="inline-flex items-center gap-1.5 text-[#085041]">
            <Target className="h-3.5 w-3.5" /> 2-minute diagnostic
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#e1d8ca]">
          <div
            className="h-full rounded-full bg-[#1d9e75] transition-all duration-300"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {step === 0 && (
        <Question title="Which attempt are you targeting?" subtitle="This sets the pace of your plan.">
          <OptionGrid options={yearOptions} value={answers.year} onSelect={(v) => setAnswers((a) => ({ ...a, year: v }))} />
        </Question>
      )}

      {step === 1 && (
        <Question title="Where are you right now?" subtitle="Be honest — it helps us start you at the right point.">
          <OptionGrid options={stageOptions} value={answers.stage} onSelect={(v) => setAnswers((a) => ({ ...a, stage: v }))} />
        </Question>
      )}

      {step === 2 && (
        <Question title="Which areas feel weakest?" subtitle="Pick one or more — we'll prioritise these.">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {focusSubjects.map((name) => {
              const active = answers.subjects.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleSubject(name)}
                  className={`rounded-xl border p-3 text-left text-sm font-bold transition ${
                    active ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]" : "border-[#dcd5c7] bg-[#fffdf8] text-[#33443b] hover:border-[#1d9e75]/50"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </Question>
      )}

      {step === 3 && (
        <Question title="How much can you study daily?" subtitle="We'll size your daily targets to fit.">
          <OptionGrid options={hoursOptions} value={answers.hours} onSelect={(v) => setAnswers((a) => ({ ...a, hours: v }))} />
        </Question>
      )}

      {step === 4 && (
        <Question title="Have you picked an optional?" subtitle="We'll factor this into your Mains roadmap.">
          <OptionGrid options={optionalOptions} value={answers.optional} onSelect={(v) => setAnswers((a) => ({ ...a, optional: v }))} columns="grid-cols-2 sm:grid-cols-3" />
        </Question>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-black text-[#536259] transition enabled:hover:text-[#13251d] disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {step < totalSteps - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1a3a2a] px-6 text-sm font-black text-white transition enabled:hover:bg-[#10291d] disabled:opacity-40"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={!canAdvance}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1a3a2a] px-6 text-sm font-black text-white transition enabled:hover:bg-[#10291d] disabled:opacity-40"
          >
            See my plan
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}

function Question({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-black leading-tight tracking-tight text-[#13251d] md:text-3xl">{title}</h1>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#536259]">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function OptionGrid({
  options,
  value,
  onSelect,
  columns = "grid-cols-1 sm:grid-cols-2",
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  columns?: string;
}) {
  return (
    <div className={`grid gap-2.5 ${columns}`}>
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onSelect(o)}
            className={`flex items-center justify-between rounded-xl border p-4 text-left text-sm font-bold transition ${
              active ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]" : "border-[#dcd5c7] bg-[#fffdf8] text-[#33443b] hover:border-[#1d9e75]/50"
            }`}
          >
            {o}
            {active ? <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" /> : null}
          </button>
        );
      })}
    </div>
  );
}
