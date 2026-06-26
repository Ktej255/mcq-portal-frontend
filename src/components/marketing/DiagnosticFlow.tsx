"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, RotateCcw, Sparkles, Target } from "lucide-react";

import { gsSubjects } from "./site-data";

type Answers = {
  year: string;
  stage: string;
  subjects: string[];
  hours: string;
  optional: string;
};

type Contact = { name: string; email: string; phone: string };

const yearOptions = ["2027", "2028", "2029", "2030"];
const stageOptions = ["Fresh start — beginning from scratch", "Self-study (6+ months in)", "Coaching student (online/offline)", "Repeat attempt (appeared before)"];
const hoursOptions = ["2–3 hours", "4–5 hours", "6–8 hours", "8+ hours"];
const optionalOptions = [
  "Geography", "Sociology", "PSIR", "Public Administration", "Anthropology",
  "History", "Philosophy", "Economics", "Law", "Mathematics",
  "Commerce & Accountancy", "Medical Science", "Management", "Psychology",
  "Hindi Literature", "English Literature", "Sanskrit Literature",
  "Electrical Engineering", "Mechanical Engineering", "Civil Engineering",
  "Agriculture", "Animal Husbandry", "Botany", "Chemistry", "Physics",
  "Zoology", "Statistics", "Geology", "Not decided yet",
];

const STORAGE_KEY = "sarit-diagnostic-plan-v1";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const dailyMcqByHours: Record<string, number> = {
  "2–3 hours": 15,
  "4–5 hours": 25,
  "6–8 hours": 35,
  "8+ hours": 50,
};

const totalSteps = 5;

type Phase = "questions" | "capture" | "result";

export function DiagnosticFlow() {
  const [phase, setPhase] = useState<Phase>("questions");
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Answers>({ year: "", stage: "", subjects: [], hours: "", optional: "" });
  const [contact, setContact] = useState<Contact>({ name: "", email: "", phone: "" });

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

  const contactValid = contact.name.trim().length > 1 && EMAIL_RE.test(contact.email.trim());

  async function reveal() {
    if (!contactValid || submitting) return;
    setSubmitting(true);
    const payload = { ...answers, ...contact, source: "diagnostic" };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, createdAt: new Date().toISOString() }));
    } catch {
      // ignore storage errors
    }
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // never block the user on a delivery error
    }
    setSubmitting(false);
    setPhase("result");
  }

  function restart() {
    setAnswers({ year: "", stage: "", subjects: [], hours: "", optional: "" });
    setContact({ name: "", email: "", phone: "" });
    setStep(0);
    setPhase("questions");
  }

  /* ----------------------------- Result ----------------------------- */
  if (phase === "result") {
    const focus = answers.subjects[0] ?? "Geography";
    const dailyMcqs = dailyMcqByHours[answers.hours] ?? 10;

    // Compute months remaining until target Prelims (June of target year)
    const targetYear = parseInt(answers.year) || 2027;
    const targetPrelimsDate = new Date(targetYear, 5, 1); // June 1st
    const now = new Date();
    const monthsRemaining = Math.max(1, Math.round((targetPrelimsDate.getTime() - now.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));

    // Compute daily study plan based on hours
    const hoursNum = answers.hours.startsWith("8") ? 8 : parseInt(answers.hours) || 4;
    const topicsPerDay = Math.max(1, Math.min(4, Math.floor(hoursNum / 2)));

    const planItems = [
      `You have ${monthsRemaining} months until UPSC Prelims ${targetYear}. That's enough time for systematic preparation.`,
      `Start with ${focus} — your first connected daily loop (Discussion → Content → PYQ → Practice → Gap Analysis).`,
      `Daily target: ${topicsPerDay} topic${topicsPerDay > 1 ? "s" : ""}/day (${answers.hours}) + ${dailyMcqs} MCQs + current affairs quiz.`,
      "Week 1–2: Geography (foundation). Week 3–4: Add Polity. Progressive subject loading every 2 weeks.",
      answers.optional === "Not decided yet"
        ? "Explore optional subjects early — we'll help you compare based on your strengths."
        : `Optional: ${answers.optional} — integrated into your Mains roadmap from week 3.`,
      "Spaced revisits auto-scheduled at Day+3, Day+7, Day+21 for every topic you complete.",
    ];

    return (
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <div className="rounded-3xl border border-[#1d9e75]/30 bg-[#e7f5ee] p-7 md:p-9">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-[#085041]">
            <Sparkles className="h-3.5 w-3.5" /> Your personalized starting plan
          </span>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#13251d] md:text-4xl">
            {contact.name ? `${contact.name.split(" ")[0]}, here's` : "Here's"} your plan for the {answers.year} attempt.
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
          <p className="mt-3 text-xs font-semibold text-[#6b7a70]">We&apos;ve saved your plan. We&apos;ll email it and helpful next steps to {contact.email}.</p>
        </div>
      </section>
    );
  }

  /* ----------------------------- Capture ---------------------------- */
  if (phase === "capture") {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 md:px-8">
        <div className="rounded-3xl border border-[#dcd5c7] bg-[#fffdf8] p-7 shadow-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e7f5ee] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#085041]">
            <Lock className="h-3.5 w-3.5" /> Last step
          </span>
          <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight text-[#13251d] md:text-3xl">
            Where should we send your plan?
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#536259]">
            Get your personalized plan on screen now, plus a copy and helpful next steps by email. No spam.
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-wide text-[#8c5d14]">Name</label>
              <input
                value={contact.name}
                onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                placeholder="Your name"
                className="h-11 rounded-md border border-[#dcd5c7] bg-white px-3 text-sm font-semibold text-[#13251d] outline-none focus:border-[#1d9e75]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-wide text-[#8c5d14]">Email</label>
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                placeholder="you@example.com"
                className="h-11 rounded-md border border-[#dcd5c7] bg-white px-3 text-sm font-semibold text-[#13251d] outline-none focus:border-[#1d9e75]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-wide text-[#8c5d14]">WhatsApp (optional)</label>
              <input
                value={contact.phone}
                onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                placeholder="+91…"
                className="h-11 rounded-md border border-[#dcd5c7] bg-white px-3 text-sm font-semibold text-[#13251d] outline-none focus:border-[#1d9e75]"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPhase("questions")}
              className="inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-black text-[#536259] transition hover:text-[#13251d]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={reveal}
              disabled={!contactValid || submitting}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1a3a2a] px-6 text-sm font-black text-white transition enabled:hover:bg-[#10291d] disabled:opacity-40"
            >
              {submitting ? "Building your plan…" : "Reveal my plan"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-4 text-xs font-semibold text-[#6b7a70]">By continuing you agree to receive your plan and occasional UPSC tips. Unsubscribe anytime.</p>
        </div>
      </section>
    );
  }

  /* ---------------------------- Questions --------------------------- */
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 md:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wide text-[#536259]">
          <span>Step {step + 1} of {totalSteps}</span>
          <span className="inline-flex items-center gap-1.5 text-[#085041]">
            <Target className="h-3.5 w-3.5" /> 2-minute diagnostic
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#e1d8ca]">
          <div className="h-full rounded-full bg-[#1d9e75] transition-all duration-300" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
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
        <Question title="Have you picked an optional?" subtitle="Pick your Mains optional subject. You can change this later.">
          <div className="max-h-64 overflow-y-auto rounded-xl border border-[#dcd5c7] p-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {optionalOptions.map((o) => {
                const active = answers.optional === o;
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, optional: o }))}
                    className={`rounded-lg border p-2.5 text-left text-xs font-bold transition ${
                      active ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]" : "border-[#dcd5c7] bg-[#fffdf8] text-[#33443b] hover:border-[#1d9e75]/50"
                    }`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
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
            onClick={() => setPhase("capture")}
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
