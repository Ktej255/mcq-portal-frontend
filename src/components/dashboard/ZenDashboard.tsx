"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  LockKeyhole,
  Sparkles,
  Sun,
  Moon,
  CloudSun,
} from "lucide-react";

import { useDashboardData } from "@/hooks/useDashboardData";
import { BrainDumpButton } from "@/components/dashboard/BrainDumpButton";
import { WelcomeVideoOverlay, InductionChecklist } from "@/components/upsc/OnboardingFlow";
import {
  defaultStudentProfile,
  studentLevelForPreparationStage,
  type PreparationStage,
  type StudentProfile,
} from "@/lib/upsc/studentProfile";
import { getGuidedStudyEntryRoute } from "@/lib/upsc/guidedStudy";
import type { GeographyMeTimeMood } from "@/lib/upsc/useGeographyProgress";

/* ──── Greeting helpers ────────────────────────────────────────────────────── */

function getTimeGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", icon: Sun };
  if (hour < 17) return { text: "Good afternoon", icon: CloudSun };
  return { text: "Good evening", icon: Moon };
}

/* ──── Mood pill data ──────────────────────────────────────────────────────── */

const moodOptions: Array<{ value: GeographyMeTimeMood; emoji: string; label: string }> = [
  { value: "calm", emoji: "😌", label: "Calm" },
  { value: "focused", emoji: "🎯", label: "Focused" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "overloaded", emoji: "🤯", label: "Heavy" },
  { value: "low-confidence", emoji: "😟", label: "Low" },
  { value: "exam-stress", emoji: "😰", label: "Stressed" },
];

/* ──── Preparation stage options ──────────────────────────────────────────── */

const preparationOptions: Array<{
  value: PreparationStage;
  level: string;
  label: string;
  emoji: string;
}> = [
  {
    value: "not-started",
    level: "Beginner",
    label: "I'm starting my UPSC preparation now",
    emoji: "🌱",
  },
  {
    value: "coaching-complete",
    level: "Intermediate",
    label: "I completed coaching, ready for self-study",
    emoji: "📚",
  },
  {
    value: "multiple-attempts",
    level: "Advanced",
    label: "I've attempted Prelims 2+ times",
    emoji: "🎯",
  },
];

/* ──── Main Component ──────────────────────────────────────────────────────── */

export function ZenDashboard() {
  const router = useRouter();
  const {
    isLoaded,
    profile,
    draft,
    setDraft,
    saveProfile,
    isWelcomeVideoCompleted,
    handleCompleteWelcomeVideo,
    updateInductionStep,
    completeInduction,
    activeMissionSubject,
    activeMissionDay,
    activeMissionSession,
    activeMissionReadiness,
    activeMissionHref,
    activeMissionProgress,
    meTimeDone,
    saveMeTimeCheck,
    streakCount,
  } = useDashboardData();

  const [moodExpanded, setMoodExpanded] = useState(false);
  const greeting = getTimeGreeting();
  const GreetingIcon = greeting.icon;

  /* ──── Loading state ─────────────────────────────────────────────────────── */

  if (!isLoaded) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center bg-[#f7f4ee]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-[#1d9e75]/20" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#1a3a2a]">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-sm font-bold text-[#5d675f] animate-pulse">
            Preparing your workspace…
          </p>
        </div>
      </main>
    );
  }

  /* ──── Welcome video gate ────────────────────────────────────────────────── */

  if (!isWelcomeVideoCompleted) {
    return <WelcomeVideoOverlay onComplete={handleCompleteWelcomeVideo} />;
  }

  /* ──── Profile setup (first time) ────────────────────────────────────────── */

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-12 md:py-20">
          {/* Greeting */}
          <div className="mb-8 flex items-center gap-2.5 text-[#1d9e75]">
            <GreetingIcon className="h-5 w-5" />
            <span className="text-sm font-bold">{greeting.text}</span>
          </div>

          <h1 className="text-center text-3xl font-black tracking-tight text-[#13251d] md:text-4xl">
            Where are you in your UPSC journey?
          </h1>
          <p className="mt-3 text-center text-sm font-semibold leading-6 text-[#5d675f]">
            One answer opens your personalized study path.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3">
            {preparationOptions.map(({ value, level, label, emoji }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  const nextDraft: StudentProfile = {
                    ...defaultStudentProfile,
                    level: studentLevelForPreparationStage(value),
                    preparationStage: value,
                    attemptHistory:
                      value === "multiple-attempts" ? "two-plus-attempts" : "no-attempt",
                    updatedAt: new Date().toISOString(),
                  };
                  setDraft(nextDraft);
                  saveProfile(nextDraft);
                  window.setTimeout(() => {
                    router.push(
                      getGuidedStudyEntryRoute(nextDraft.level, 1)
                    );
                  }, 0);
                }}
                className="group relative flex items-start gap-4 rounded-xl border-2 border-[#dcd5c7] bg-[#fffdf8] p-5 text-left transition-all duration-300 hover:border-[#1d9e75] hover:shadow-md hover:shadow-[#1d9e75]/10 active:scale-[0.98]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#f7f4ee] text-2xl transition-transform duration-300 group-hover:scale-110">
                  {emoji}
                </span>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                    {level}
                  </span>
                  <span className="mt-1 block text-base font-black leading-6 text-[#13251d]">
                    {label}
                  </span>
                </div>
                <ArrowRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#dcd5c7] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#1d9e75]" />
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  /* ──── Zen dashboard (main student view) ─────────────────────────────────── */

  const currentMood = activeMissionProgress?.meTimeMood;

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-xl flex-col px-4 py-8 md:px-8 md:py-12">

        {/* ─── Greeting + Streak ──────────────────────────────────────── */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GreetingIcon className="h-5 w-5 text-[#1d9e75]" />
            <span className="text-sm font-bold text-[#5d675f]">{greeting.text}</span>
          </div>
          {streakCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#1a3a2a] px-3 py-1.5 text-white">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs font-black">{streakCount} day streak</span>
            </div>
          )}
        </div>

        {/* ─── Induction gate ─────────────────────────────────────────── */}
        {!profile.inductionCompleted && (
          <div className="mb-6 rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <InductionChecklist
              profile={profile}
              onUpdateStep={updateInductionStep}
              onComplete={completeInduction}
            />
          </div>
        )}

        {/* ─── Today's Task Card ──────────────────────────────────────── */}
        <div className="rounded-2xl border-2 border-[#b9d9cd] bg-gradient-to-b from-[#e7f5ee] to-[#f0faf4] p-6 shadow-sm md:p-8">

          {/* Eyebrow */}
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-2 w-2 rounded-full bg-[#1d9e75] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#085041]">
              Today&apos;s study
            </span>
          </div>

          {/* Subject + Day */}
          <h1 className="text-2xl font-black tracking-tight text-[#13251d] md:text-3xl">
            {activeMissionSubject.title}
          </h1>
          <p className="mt-1 text-lg font-black text-[#1d9e75]">
            Day {activeMissionDay}: {activeMissionSession.title}
          </p>

          {/* Readiness detail */}
          <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-[#49675e]">
            {activeMissionReadiness.detail}
          </p>

          {/* Step flow indicator */}
          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]/70">
            <span>Day {activeMissionDay}</span>
            <span className="text-[#b9d9cd]">·</span>
            <span>{activeMissionDay} of {activeMissionSubject.sessions.length}</span>
            <span className="text-[#b9d9cd]">·</span>
            <span>{activeMissionReadiness.statusLabel}</span>
          </div>

          {/* ─── Main CTA ─────────────────────────────────────────────── */}
          <div className="mt-6">
            {!profile.inductionCompleted ? (
              <button
                type="button"
                disabled
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#dcd5c7] px-6 py-4 text-base font-black text-[#756f64] cursor-not-allowed"
              >
                <LockKeyhole className="h-4.5 w-4.5" />
                Complete Induction to Start
              </button>
            ) : (
              <Link
                href={activeMissionHref}
                className="group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#1a3a2a] px-6 py-4 text-base font-black text-white shadow-lg shadow-[#1a3a2a]/20 transition-all duration-300 hover:bg-[#10291d] hover:shadow-xl hover:shadow-[#1a3a2a]/30 active:scale-[0.98]"
              >
                {activeMissionReadiness.actionLabel}
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>

        {/* ─── Mood Check (inline, optional) ──────────────────────────── */}
        <div className="mt-4 rounded-xl border border-[#dcd5c7] bg-[#fffdf8] px-5 py-4">
          <button
            type="button"
            onClick={() => setMoodExpanded(!moodExpanded)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                How are you feeling?
              </span>
              {currentMood && (
                <span className="flex items-center gap-1 rounded-full bg-[#e7f5ee] px-2 py-0.5 text-[10px] font-black text-[#085041]">
                  <CheckCircle2 className="h-3 w-3" />
                  {currentMood.replace("-", " ")}
                </span>
              )}
            </div>
            <span className="text-xs text-[#b0a898]">{moodExpanded ? "▲" : "▼"}</span>
          </button>

          {moodExpanded && (
            <div className="mt-3 flex flex-wrap gap-2">
              {moodOptions.map(({ value, emoji, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    saveMeTimeCheck(value);
                    setMoodExpanded(false);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                    currentMood === value
                      ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                      : "border-[#dcd5c7] bg-white text-[#31443a] hover:border-[#1d9e75] hover:bg-[#f0faf4]"
                  }`}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          )}

          {currentMood && activeMissionProgress?.meTimeResetPlan && !moodExpanded && (
            <p className="mt-2 text-xs font-semibold leading-5 text-[#657066]">
              {activeMissionProgress.meTimeResetPlan}
            </p>
          )}
        </div>

        {/* ─── Quick links (secondary actions) ────────────────────────── */}
        {profile.inductionCompleted && (
          <div className="mt-4 flex gap-3">
            <Link
              href={`/upsc/${activeMissionSubject.slug}/retro`}
              className="flex-1 rounded-xl border border-[#dcd5c7] bg-[#fffdf8] px-4 py-3 text-center text-xs font-black text-[#31443a] transition-all duration-200 hover:border-[#1d9e75]/60 hover:bg-[#f0faf4]"
            >
              Sunday AI Retro
            </Link>
            <Link
              href="/upsc/answer-upload"
              className="flex-1 rounded-xl border border-[#dcd5c7] bg-[#fffdf8] px-4 py-3 text-center text-xs font-black text-[#31443a] transition-all duration-200 hover:border-[#1d9e75]/60 hover:bg-[#f0faf4]"
            >
              Mains Upload
            </Link>
          </div>
        )}

        {/* ─── Progress summary bar ───────────────────────────────────── */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-[#dcd5c7] bg-[#fffdf8] px-5 py-3.5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
              {activeMissionSubject.title} progress
            </p>
            <p className="mt-0.5 text-sm font-black text-[#13251d]">
              Day {activeMissionDay} of {activeMissionSubject.sessions.length}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress bar */}
            <div className="h-2 w-24 overflow-hidden rounded-full bg-[#e7f5ee]">
              <div
                className="h-full rounded-full bg-[#1d9e75] transition-all duration-700"
                style={{
                  width: `${Math.round(
                    (activeMissionDay / activeMissionSubject.sessions.length) * 100
                  )}%`,
                }}
              />
            </div>
            <span className="text-xs font-black text-[#085041]">
              {Math.round(
                (activeMissionDay / activeMissionSubject.sessions.length) * 100
              )}%
            </span>
          </div>
        </div>
      </div>

      {/* ─── Floating Brain Dump Button ───────────────────────────────── */}
      <BrainDumpButton />
    </main>
  );
}
