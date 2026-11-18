"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BrainCircuit, CalendarClock, Clock3, RefreshCcw, Target } from "lucide-react";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import {
  defaultStudentProfile,
  preparationStageForLevel,
  readStudentProfile,
  readSyncedStudentProfile,
  saveStudentProfileAndWait,
  type LearningStyle,
  type StudentLevel,
  type StudentProfile,
  type StudyTime,
  type StudyWindow,
  type WeakSignal,
} from "@/lib/upsc/studentProfile";

type Option<T extends string> = { value: T; label: string };

const levelOptions: Option<StudentLevel>[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];
const studyWindowOptions: Option<StudyWindow>[] = [
  { value: "60", label: "60 minutes" },
  { value: "90", label: "90 minutes" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours or more" },
];
const learningStyleOptions: Option<LearningStyle>[] = [
  { value: "watch-first", label: "Watch first" },
  { value: "talk-first", label: "Talk first" },
  { value: "practice-first", label: "Practice first" },
  { value: "mixed", label: "Mixed" },
];
const weakSignalOptions: Option<WeakSignal>[] = [
  { value: "retention", label: "Remembering what I studied" },
  { value: "concept-clarity", label: "Understanding concepts" },
  { value: "mcq-traps", label: "MCQ traps" },
  { value: "answer-writing", label: "Answer writing" },
];
const studyTimeOptions: Option<StudyTime>[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "late-night", label: "Late night" },
];

type Draft = Pick<StudentProfile, "level" | "studyWindow" | "learningStyle" | "weakSignal" | "studyTime">;

function draftFrom(profile: StudentProfile | null): Draft {
  const source = profile ?? defaultStudentProfile;
  return {
    level: source.level,
    studyWindow: source.studyWindow,
    learningStyle: source.learningStyle,
    weakSignal: source.weakSignal,
    studyTime: source.studyTime,
  };
}

/**
 * Learning preferences. This page used to be read-only and sent students to
 * the Geography onboarding wizard to change anything, which needs beta access
 * and re-runs the whole setup. The choices are now edited and saved here.
 */
export default function SettingsPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(() => readStudentProfile());
  const [draft, setDraft] = useState<Draft>(() => draftFrom(readStudentProfile()));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "warn"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void readSyncedStudentProfile().then((syncedProfile) => {
      if (cancelled || !syncedProfile) return;
      setProfile(syncedProfile);
      setDraft(draftFrom(syncedProfile));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const saved = draftFrom(profile);
  const changed = (Object.keys(draft) as (keyof Draft)[]).some((key) => draft[key] !== saved[key]);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setNotice(null);
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    const base = profile ?? defaultStudentProfile;
    const next: StudentProfile = {
      ...base,
      ...draft,
      // The stored level is derived from the preparation stage, so both move together.
      preparationStage:
        draft.level === base.level ? base.preparationStage : preparationStageForLevel(draft.level),
      updatedAt: new Date().toISOString(),
    };
    const persisted = await saveStudentProfileAndWait(next);
    setProfile(readStudentProfile() ?? next);
    setSaving(false);
    setNotice(
      persisted
        ? { kind: "ok", text: "Saved. Today's plan uses your new preferences." }
        : {
            kind: "warn",
            text: "Saved on this device. We couldn't reach your account just now, so it will sync the next time you're online.",
          },
    );
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#f7f4ee] px-4 py-6 text-[#13251d] sm:px-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-5xl">
          <Link href="/upsc" className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-[#085041] hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Today
          </Link>

          <section
            data-testid="student-settings-learning-preferences"
            className="mt-6 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm sm:p-6 md:p-7"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Settings</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Learning preferences</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
              These choices keep your daily plan focused. Change them whenever your study routine changes.
            </p>
          </section>

          <section className="mt-5 grid gap-4 sm:grid-cols-2">
            <PreferenceSelect
              id="settings-level"
              label="Level"
              icon={BrainCircuit}
              value={draft.level}
              options={levelOptions}
              onChange={(value) => update("level", value)}
            />
            <PreferenceSelect
              id="settings-study-window"
              label="Daily study time"
              icon={Clock3}
              value={draft.studyWindow}
              options={studyWindowOptions}
              onChange={(value) => update("studyWindow", value)}
            />
            <PreferenceSelect
              id="settings-learning-style"
              label="Learning style"
              icon={RefreshCcw}
              value={draft.learningStyle}
              options={learningStyleOptions}
              onChange={(value) => update("learningStyle", value)}
            />
            <PreferenceSelect
              id="settings-weak-signal"
              label="What needs the most work"
              icon={Target}
              value={draft.weakSignal}
              options={weakSignalOptions}
              onChange={(value) => update("weakSignal", value)}
            />
            <PreferenceSelect
              id="settings-study-time"
              label="Best time to study"
              icon={CalendarClock}
              value={draft.studyTime}
              options={studyTimeOptions}
              onChange={(value) => update("studyTime", value)}
            />
          </section>

          <section className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm sm:p-6 md:p-7">
            <div className="min-w-0">
              {notice ? (
                <p
                  role="status"
                  data-testid="settings-save-notice"
                  className={`text-sm font-bold leading-6 ${notice.kind === "ok" ? "text-[#085041]" : "text-[#8c5d14]"}`}
                >
                  {notice.text}
                </p>
              ) : (
                <p className="text-sm font-medium leading-6 text-[#657066]">
                  {changed ? "You have unsaved changes." : "Your preferences are up to date."}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void save()}
              disabled={!changed || saving}
              data-testid="settings-save"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-5 text-sm font-black text-white transition hover:bg-[#10291d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save preferences"}
            </button>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function PreferenceSelect<T extends string>({
  id,
  label,
  icon: Icon,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  icon: typeof BrainCircuit;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm sm:p-6">
      <Icon className="h-5 w-5 text-[#085041]" />
      <label
        htmlFor={id}
        className="mt-4 block text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="mt-2 h-11 w-full rounded-md border border-[#cfc6b6] bg-white px-3 text-base font-black text-[#13251d] focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
