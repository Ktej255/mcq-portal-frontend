"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Gauge,
  ListChecks,
  Target,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getQuestionBankSubject,
  questionDifficulties,
  questionBankSubjects,
  readLocalQuestionBankProgress,
  selectQuestionBankSet,
  type QuestionBankProgressInput,
  type QuestionDifficulty,
} from "@/lib/upsc/questionBankEngine";
import { readStudentProfile, type StudentProfile } from "@/lib/upsc/studentProfile";
import { cn } from "@/lib/utils";

const questionCounts = [5, 8, 10, 15] as const;

type RecommendationMetric = {
  label: string;
  value: string | number;
  Icon: LucideIcon;
};

function scoreText(value: number | null, suffix: string) {
  return value === null ? "Not measured" : `${value}${suffix}`;
}

export function UpscQuestionBankBuilder() {
  const searchParams = useSearchParams();
  const requestedSubject = searchParams.get("subject") ?? "geography";
  const [subjectSlug, setSubjectSlug] = useState(() => getQuestionBankSubject(requestedSubject).slug);
  const [progress, setProgress] = useState<QuestionBankProgressInput>({});
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const nextSubjectSlug = getQuestionBankSubject(requestedSubject).slug;
    setSubjectSlug(nextSubjectSlug);
    setDifficulty(null);
    setCount(null);
  }, [requestedSubject]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProfile(readStudentProfile());
      setProgress(readLocalQuestionBankProgress(subjectSlug));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [subjectSlug]);

  const selectedSubject = useMemo(() => getQuestionBankSubject(subjectSlug), [subjectSlug]);
  const recommended = useMemo(
    () => selectQuestionBankSet({ subjectSlug: selectedSubject.slug, progress, profile }),
    [profile, progress, selectedSubject.slug]
  );
  const activeDifficulty = difficulty ?? recommended.recommendation.recommendedDifficulty;
  const activeCount = count ?? recommended.recommendation.recommendedCount;
  const selection = useMemo(
    () =>
      selectQuestionBankSet({
        subjectSlug: selectedSubject.slug,
        progress,
        profile,
        difficulty: activeDifficulty,
        count: activeCount,
      }),
    [activeCount, activeDifficulty, profile, progress, selectedSubject.slug]
  );

  const recommendation = selection.recommendation;
  const recommendationMetrics: RecommendationMetric[] = [
    { label: "Subject", value: selectedSubject.title, Icon: ClipboardCheck },
    { label: "Consistency", value: `${recommendation.consistencyPercent}%`, Icon: Gauge },
    { label: "Recovery", value: recommendation.recoveryCount, Icon: Target },
    { label: "AI gaps", value: recommendation.teacherDoubtCount, Icon: CircleAlert },
    { label: "Command", value: recommendation.commandCount, Icon: CheckCircle2 },
    { label: "Level", value: recommendation.learnerLevel, Icon: ClipboardCheck },
  ];

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-8">
        <section
          data-testid="upsc-question-bank-hero"
          data-active-subject={selectedSubject.slug}
          data-active-difficulty={activeDifficulty}
          data-active-count={activeCount}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Custom MCQ builder
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
                Practice adapts to recall, consistency, and marks.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                The builder selects easy, medium, hard, or PYQ-style questions from the selected subject bank. The
                default recommendation comes from Talk score, MCQ score, active recovery, command days, and study
                consistency.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Recommended", recommendation.recommendedDifficulty.replace("_", " ")],
                ["Set size", recommendation.recommendedCount],
                ["Subject", selectedSubject.title],
                ["Recall", scoreText(recommendation.averageRecall, "/100")],
                ["MCQ", scoreText(recommendation.averageMcq, "%")],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-xl font-black capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          data-testid="upsc-question-bank-subjects"
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            {questionBankSubjects.map((subject) => {
              const isActive = selectedSubject.slug === subject.slug;
              return (
                <button
                  key={subject.slug}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    setSubjectSlug(subject.slug);
                    setDifficulty(null);
                    setCount(null);
                  }}
                  className={cn(
                    "min-h-10 rounded-md border px-3 text-sm font-black transition",
                    isActive
                      ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                      : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                  )}
                >
                  {subject.title}
                </button>
              );
            })}
          </div>
        </section>

        <section
          data-testid="upsc-question-bank-recommendation"
          data-recommended-difficulty={recommendation.recommendedDifficulty}
          data-recommended-count={recommendation.recommendedCount}
          data-ai-gap-count={recommendation.teacherDoubtCount}
          data-target-days={recommendation.targetDays.join(",")}
          className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <BrainCircuit className="h-5 w-5 text-[#085041]" />
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">
                  AI selection rule
                </p>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">{recommendation.reason}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                Target days: {recommendation.targetDays.length ? recommendation.targetDays.join(", ") : "fresh baseline"}.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {recommendationMetrics.map(({ label, value, Icon }) => (
                <div key={label} className="rounded-lg border border-[#b9d9cd] bg-white/70 p-4">
                  <Icon className="mb-3 h-4 w-4 text-[#085041]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]">{label}</p>
                  <p className="mt-1 text-lg font-black capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>
          {recommendation.teacherDoubt ? (
            <div
              data-testid="upsc-question-bank-ai-gap"
              className="mt-5 rounded-lg border border-[#ef9f27] bg-[#fff4df] p-4 text-[#6f4a12]"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.16em]">AI teacher repair set</p>
                <Badge className="rounded-md bg-[#6f4a12] px-2 py-1 text-white">
                  Day {recommendation.teacherDoubt.day} / {recommendation.teacherDoubt.category}
                </Badge>
              </div>
              <p className="text-sm font-bold leading-6">{recommendation.teacherDoubt.reason}</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <p className="rounded-md bg-white/80 p-3 text-xs font-bold leading-5">
                  Repair: {recommendation.teacherDoubt.repairAction}
                </p>
                <p className="rounded-md bg-white/80 p-3 text-xs font-bold leading-5">
                  Mastery check: {recommendation.teacherDoubt.masteryCheck}
                </p>
              </div>
            </div>
          ) : null}
        </section>

        <section data-testid="upsc-question-bank-controls" className="grid gap-4 lg:grid-cols-[1fr_0.65fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-[#1a3a2a]" />
              <h2 className="text-xl font-black tracking-tight">Choose difficulty</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              {questionDifficulties.map((item) => {
                const isActive = activeDifficulty === item;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setDifficulty(item)}
                    className={cn(
                      "min-h-12 rounded-md border px-3 text-sm font-black transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    {item.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Gauge className="h-5 w-5 text-[#1a3a2a]" />
              <h2 className="text-xl font-black tracking-tight">Set size</h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {questionCounts.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={activeCount === item}
                  onClick={() => setCount(item)}
                  className={cn(
                    "min-h-12 rounded-md border text-sm font-black transition",
                    activeCount === item
                      ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                      : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section data-testid="upsc-question-bank-set" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Selected set</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight" data-question-count={selection.questions.length}>
                {selection.questions.length} questions generated
              </h2>
            </div>
            <Link
              href={`/upsc/mcq-command?subject=${selectedSubject.slug}`}
              className="inline-flex min-h-10 items-center rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-black text-[#1a3a2a] transition hover:bg-[#f2eadc]"
            >
              Admin batch map <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-3">
            {selection.questions.length ? (
              selection.questions.map((question, index) => (
                <article
                  key={question.id}
                  data-testid="upsc-question-bank-question"
                  data-subject-slug={question.subjectSlug}
                  data-question-difficulty={question.difficulty}
                  data-linked-day={question.linkedDay}
                  className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-md bg-[#1a3a2a] px-2 py-1 text-white">Q{index + 1}</Badge>
                      <Badge variant="outline" className="rounded-md border-[#1d9e75] text-[#085041]">
                        {question.subjectTitle ?? selectedSubject.title}
                      </Badge>
                      <Badge variant="outline" className="rounded-md border-[#1d9e75] text-[#085041]">
                        Day {question.linkedDay}
                      </Badge>
                      <Badge variant="outline" className="rounded-md border-[#dcd5c7] text-[#31443a]">
                        {question.difficulty.replace("_", " ")}
                      </Badge>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                      {question.source.replaceAll("_", " ")}
                    </span>
                  </div>
                  <h3 className="text-lg font-black leading-7 tracking-tight">{question.stem}</h3>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {Object.entries(question.options).map(([option, text]) => (
                      <div key={option} className="rounded-md border border-[#dcd5c7] bg-white p-3 text-sm font-semibold text-[#31443a]">
                        <span className="font-black text-[#085041]">{option}.</span> {text}
                      </div>
                    ))}
                  </div>
                  <details className="mt-4 rounded-md border border-[#cfe5dc] bg-white p-3">
                    <summary className="cursor-pointer list-none text-sm font-black text-[#085041]">
                      Answer and UPSC trap
                    </summary>
                    <p className="mt-3 text-sm font-black text-[#13251d]">Correct: {question.correctOption}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#4f5e55]">{question.explanation}</p>
                    <p className="mt-2 rounded-md bg-[#fff4df] p-3 text-xs font-bold leading-5 text-[#6f4a12]">
                      Trap: {question.trap}
                    </p>
                  </details>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[#dcd5c7] bg-[#f7f4ee] p-5 text-sm font-semibold text-[#657066]">
                No question is available for this exact selection yet. Choose another difficulty or reduce the set size.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
