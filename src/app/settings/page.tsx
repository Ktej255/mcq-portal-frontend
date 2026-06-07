"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BrainCircuit, Clock3, RefreshCcw, Target } from "lucide-react";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import {
  readStudentProfile,
  readSyncedStudentProfile,
  type StudentProfile,
} from "@/lib/upsc/studentProfile";

const copy = {
  level: {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  },
  learningStyle: {
    "watch-first": "Watch first",
    "talk-first": "Talk first",
    "practice-first": "Practice first",
    mixed: "Mixed",
  },
  weakSignal: {
    retention: "Retention",
    "concept-clarity": "Concept clarity",
    "mcq-traps": "MCQ traps",
    "answer-writing": "Answer writing",
  },
} as const;

export default function SettingsPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProfile(readStudentProfile());
    void readSyncedStudentProfile().then((syncedProfile) => {
      if (!cancelled) setProfile(syncedProfile);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const preferences = [
    {
      label: "Level",
      value: profile ? copy.level[profile.level] : "Not set",
      icon: BrainCircuit,
    },
    {
      label: "Daily time",
      value: profile ? `${profile.studyWindow} minutes` : "Not set",
      icon: Clock3,
    },
    {
      label: "Learning style",
      value: profile ? copy.learningStyle[profile.learningStyle] : "Not set",
      icon: RefreshCcw,
    },
    {
      label: "Weakest signal",
      value: profile ? copy.weakSignal[profile.weakSignal] : "Not set",
      icon: Target,
    },
  ];

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#f7f4ee] px-4 py-6 text-[#13251d] md:px-8 md:py-10">
        <div className="mx-auto max-w-5xl">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-[#085041] hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Today
          </Link>

          <section
            data-testid="student-settings-learning-preferences"
            className="mt-6 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Settings</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Learning preferences</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
              These choices help the portal keep your daily plan focused. Update them when your study routine changes.
            </p>
          </section>

          <section className="mt-5 grid gap-4 sm:grid-cols-2">
            {preferences.map((item) => (
              <div key={item.label} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
                <item.icon className="h-5 w-5 text-[#085041]" />
                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">{item.label}</p>
                <h2 className="mt-2 text-xl font-black tracking-tight">{item.value}</h2>
              </div>
            ))}
          </section>

          <section className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-black tracking-tight">Adjust your plan</h2>
              <p className="mt-1 text-sm font-medium leading-6 text-[#657066]">
                Review the setup questions, then return to the one next action on Today.
              </p>
            </div>
            <Link
              href="/upsc#upsc-intake"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              Review preferences <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
