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
} from "@/lib/upsc/studentProfile";

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
        setState(profile ? "ready" : "missing");
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
    return (
      <main className="min-h-[70vh] bg-[#f7f4ee] p-4 text-[#13251d]">
        <section
          data-testid="upsc-profile-required"
          className="mx-auto mt-10 max-w-2xl rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm md:p-8"
        >
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
            <UserRoundCheck className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Profile required</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Set your UPSC self-study profile first</h1>
          <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-[#5d675f]">
            Tell us whether you are starting fresh, shifting from coaching to self-study, or recovering after repeated
            attempts. Then the portal opens one correct next action without extra clutter.
          </p>
          <Link
            href="/upsc#upsc-intake"
            data-testid="upsc-profile-required-action"
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-5 text-sm font-black text-white transition hover:bg-[#10291d]"
          >
            Complete setup <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
