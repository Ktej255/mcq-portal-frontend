"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { gsLmsService, type LearnerProfile } from "@/services/api/gsLmsService";
import { gsExamService, type ExamOut } from "@/services/api/gsExamService";

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50";

/** "Exam I'm preparing for": active exams only, saved to the learner profile. */
export function ExamPicker() {
  const [exams, setExams] = useState<ExamOut[] | null>(null);
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [choice, setChoice] = useState("upsc");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    Promise.all([gsExamService.getExams(), gsLmsService.getLearnerProfile()])
      .then(([e, p]) => {
        if (cancelled) return;
        setExams(e);
        setProfile(p);
        setChoice(p.exam_code || "upsc");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // One active exam (UPSC) means nothing to choose: stay out of the way.
  if (!exams || !profile || exams.length < 2) return null;

  const saved = profile.exam_code || "upsc";
  const save = async () => {
    setState("saving");
    try {
      const next = await gsExamService.saveExam(profile, choice);
      setProfile(next);
      setState("saved");
    } catch {
      setState("error");
    }
  };

  return (
    <section
      aria-label="Exam I'm preparing for"
      data-testid="exam-picker"
      className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-4 md:p-5"
    >
      <h2 className="text-lg font-black text-[#1a3a2a]">Exam I&apos;m preparing for</h2>
      <div role="radiogroup" aria-label="Exam I'm preparing for" className="mt-3 flex flex-wrap gap-2">
        {exams.map((e) => (
          <label
            key={e.code}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold ${
              choice === e.code ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#dcd5c7] bg-white hover:bg-[#f7f4ee]"
            }`}
          >
            <input
              type="radio"
              name="exam-code"
              value={e.code}
              checked={choice === e.code}
              onChange={() => {
                setChoice(e.code);
                setState("idle");
              }}
              className="accent-[#1d9e75]"
            />
            {e.name}
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          data-testid="exam-picker-save"
          className={PRIMARY_BUTTON}
          disabled={state === "saving" || choice === saved}
          onClick={() => void save()}
        >
          Save
        </button>
        <span className="text-xs text-[#5d675f]" role="status" aria-live="polite">
          {state === "saving" ? "Saving…" : null}
          {state === "error" ? <span className="text-red-700">Couldn&apos;t save. Try again.</span> : null}
          {state === "saved" ? "Saved" : null}
        </span>
        {state === "saved" ? (
          <Link href={`/${saved}`} data-testid="exam-picker-go" className="text-sm font-bold text-[#1d9e75] hover:underline">
            Go to {exams.find((e) => e.code === saved)?.name ?? saved.toUpperCase()}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
