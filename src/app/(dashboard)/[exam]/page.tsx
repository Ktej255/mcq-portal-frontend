"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";

import { EXAM_BRAND, isExamRouteCode } from "@/lib/exams/examRoutes";
import { gsLmsService, type GsSubjectAvailabilityOut } from "@/services/api/gsLmsService";
import { gsExamService } from "@/services/api/gsExamService";

type State =
  | { status: "loading" }
  | { status: "soon" }
  | { status: "ready"; subjects: GsSubjectAvailabilityOut[] };

/** /neet and /jee: the exam's subjects, or "coming soon" until it is switched on and has an open subject. */
export default function ExamHomePage() {
  const params = useParams<{ exam: string }>();
  const exam = isExamRouteCode(params.exam) ? params.exam : "neet";
  const brand = EXAM_BRAND[exam];
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const active = await gsExamService.getExams();
        if (!active.some((e) => e.code === exam)) return { status: "soon" } as const;
        const subjects = await gsLmsService.getSubjects(exam);
        return subjects.some((s) => s.available)
          ? ({ status: "ready", subjects } as const)
          : ({ status: "soon" } as const);
      } catch {
        return { status: "soon" } as const;
      }
    };
    void load().then((next) => !cancelled && setState(next));
    return () => {
      cancelled = true;
    };
  }, [exam]);

  if (state.status === "loading") {
    return <div className="p-6 text-sm text-[#5d675f]">Loading…</div>;
  }

  if (state.status === "soon") {
    return (
      <div
        data-testid="exam-coming-soon"
        className="mx-auto mt-10 max-w-lg space-y-3 rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-8 text-center"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7b7469]">{brand}</p>
        <h1 className="text-2xl font-black tracking-tight text-[#1a3a2a]">{brand} is coming soon</h1>
        <p className="text-sm text-[#5d675f]">
          We are still preparing the {brand} lessons. Check back soon, or keep studying for UPSC meanwhile.
        </p>
        <Link href="/upsc" className="inline-block text-sm font-bold text-[#1d9e75] hover:underline">
          Go to UPSC
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="exam-home" className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7b7469]">{brand}</p>
        <h1 className="text-2xl font-black tracking-tight text-[#1a3a2a] md:text-3xl">Choose a subject</h1>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {state.subjects.map((s) =>
          s.available ? (
            <li key={s.slug}>
              <Link
                href={`/${exam}/${s.slug}/lms`}
                className="flex items-center justify-between rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-4 text-sm font-black text-[#13251d] hover:bg-[#f7f4ee]"
              >
                {s.name}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </li>
          ) : (
            <li
              key={s.slug}
              className="flex items-center justify-between rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-4 text-sm font-bold text-[#a59f93]"
            >
              <span className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4" aria-hidden />
                {s.name}
              </span>
              <span className="rounded-full border border-[#dcd5c7] bg-[#f2eadc] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#8c5d14]">
                Soon
              </span>
            </li>
          ),
        )}
      </ul>
      <Link href={`/${exam}/study`} className="inline-block text-sm font-bold text-[#1d9e75] hover:underline">
        Search and study any topic
      </Link>
    </div>
  );
}
