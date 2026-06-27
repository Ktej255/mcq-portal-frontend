"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, UserRoundCheck } from "lucide-react";

import { upscLearnerStateClearedEvent } from "@/lib/upsc/learnerPersistence";
import { isLocalMockMasterSession, isMasterEmail } from "@/lib/auth/master-access";
import { useAuth } from "@/lib/contexts/AuthContext";
import { activateUpscMasterPass, upscMasterPassActivatedEvent } from "@/lib/upsc/masterPass";
import {
  readStudentProfile,
  readSyncedStudentProfile,
  saveStudentProfile,
} from "@/lib/upsc/studentProfile";

const DIAGNOSTIC_STORAGE_KEY = "sarit-diagnostic-plan-v1";

/**
 * Attempt to auto-create a student profile from diagnostic questionnaire data.
 * If the student completed /start before signing up, their answers are in localStorage.
 * This removes the "Set up your account" friction entirely.
 */
function tryAutoCreateProfileFromDiagnostic(): boolean {
  try {
    const raw = localStorage.getItem(DIAGNOSTIC_STORAGE_KEY);
    if (!raw) return false;
    const diagnostic = JSON.parse(raw);
    if (!diagnostic.name) return false;

    // Map diagnostic answers to a minimal student profile
    const levelMap: Record<string, string> = {
      "Fresh start — beginning from scratch": "Beginner",
      "Self-study (6+ months in)": "Intermediate",
      "Coaching student (online/offline)": "Intermediate",
      "Repeat attempt (appeared before)": "Advanced",
    };
    const hoursMap: Record<string, number> = {
      "2–3 hours": 150,
      "4–5 hours": 270,
      "6–8 hours": 420,
      "8+ hours": 540,
    };

    const profile = {
      name: diagnostic.name,
      targetYear: diagnostic.year || "2027",
      level: levelMap[diagnostic.stage] || "Beginner",
      studyWindow: hoursMap[diagnostic.hours] || 270,
      optional: diagnostic.optional === "Not decided yet" ? null : diagnostic.optional,
      weakSubjects: diagnostic.subjects || [],
      createdAt: new Date().toISOString(),
      autoCreated: true,
    };

    saveStudentProfile(profile as any);
    return true;
  } catch {
    return false;
  }
}

export function UpscProfileGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [state, setState] = useState<"checking" | "ready" | "missing">("checking");
  const profileCheckId = useRef(0);

  useEffect(() => {
    if (loading) return;

    let cancelled = false;
    const refreshProfileGate = async () => {
      const checkId = profileCheckId.current + 1;
      profileCheckId.current = checkId;

      if (isMasterEmail(user?.email) || isLocalMockMasterSession()) {
        activateUpscMasterPass(user?.email, { notify: false });
        setState("ready");
        return;
      }

      if (readStudentProfile()) {
        setState("ready");
        void readSyncedStudentProfile();
        return;
      }

      setState("checking");
      const profile = await readSyncedStudentProfile();
      if (!cancelled && checkId === profileCheckId.current) {
        if (profile) {
          setState("ready");
        } else {
          // Try to auto-create from diagnostic data (removes friction)
          const autoCreated = tryAutoCreateProfileFromDiagnostic();
          setState(autoCreated ? "ready" : "missing");
        }
      }
    };

    const timer = window.setTimeout(() => void refreshProfileGate(), 0);
    const recheckProfileGate = () => void refreshProfileGate();
    window.addEventListener("online", recheckProfileGate);
    window.addEventListener(upscLearnerStateClearedEvent, recheckProfileGate);
    window.addEventListener(upscMasterPassActivatedEvent, recheckProfileGate);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("online", recheckProfileGate);
      window.removeEventListener(upscLearnerStateClearedEvent, recheckProfileGate);
      window.removeEventListener(upscMasterPassActivatedEvent, recheckProfileGate);
    };
  }, [loading, user?.email]);

  if (state === "checking") {
    return (
      <main className="min-h-[60vh] bg-[#f7f4ee] p-4 text-[#13251d]">
        <div className="mx-auto mt-12 max-w-xl rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 text-sm font-black shadow-sm">
          Checking self-study profile...
        </div>
      </main>
    );
  }

  if (state === "missing") {
    // Instead of showing a blocker, redirect to the LMS onboarding
    // which handles new student setup properly. This prevents the
    // "complete your setup" dead-end loop.
    return (
      <main className="min-h-[70vh] bg-[#f7f4ee] p-4 text-[#13251d]">
        <section
          data-testid="upsc-profile-required"
          className="mx-auto mt-10 max-w-2xl rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm md:p-8"
        >
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
            <UserRoundCheck className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Quick setup</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Let&apos;s set up your study plan</h1>
          <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-[#5d675f]">
            Takes 30 seconds — pick your level and daily study time, then you&apos;re straight into your first topic.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/upsc/geography/lms/onboarding"
              data-testid="upsc-profile-required-action"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-5 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              Start setup <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                // Quick skip: create a default profile and proceed
                const defaultProfile = {
                  name: "Student",
                  targetYear: "2027",
                  level: "Beginner",
                  studyWindow: 90,
                  createdAt: new Date().toISOString(),
                  autoCreated: true,
                };
                saveStudentProfile(defaultProfile as any);
                setState("ready");
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#dcd5c7] px-5 text-sm font-black text-[#536259] transition hover:border-[#1d9e75] hover:text-[#1a3a2a]"
            >
              Skip for now
            </button>
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
