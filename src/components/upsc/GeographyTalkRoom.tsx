"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  Lightbulb,
  Lock,
  MapPinned,
  MessageCircle,
  RefreshCcw,
  Save,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { geographySessions, type GeographySession } from "@/lib/upsc/plan";
import {
  assessGeographyExplanation,
  buildGeographyChallengeScaffold,
  buildGeographyMaicDiscussion,
  buildGeographyWatchScenes,
  getCompressedGeographyRecap,
  getGeographyTalkUnlockStage,
  labSlugForGeographySession,
  type GeographyAssessment,
  type GeographyMaicDiscussion,
} from "@/lib/upsc/geographyLearning";
import { useGeographyProgress } from "@/lib/upsc/useGeographyProgress";
import { cn } from "@/lib/utils";

function resolveSession(day?: number): GeographySession {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
}

function nextRouteFor(session: GeographySession, assessment: GeographyAssessment, labCompleted: boolean) {
  const stage = getGeographyTalkUnlockStage(assessment);
  const labSlug = labSlugForGeographySession(session.lab);

  if (stage === "revisit" || stage === "retry") {
    return {
      href: `/upsc/geography/revisit?day=${session.day}`,
      label: "Open short revision",
      title: "Revise before moving ahead",
      detail: "The explanation needs a smaller recap before Visual or MCQ opens.",
      tone: "border-[#ef9f27]/55 bg-[#fff4df] text-[#6f4a12]",
    };
  }

  if (stage === "lab" || !labCompleted) {
    return {
      href: `/upsc/geography/lab?mode=${labSlug}&day=${session.day}`,
      label: "Open visual proof",
      title: "Visual is next",
      detail: "The explanation is good enough. Now prove it through map or mechanism.",
      tone: "border-[#8db7d8] bg-[#edf7ff] text-[#23406f]",
    };
  }

  return {
    href: `/upsc/geography/mcq-readiness?day=${session.day}`,
    label: "Open MCQ",
    title: "MCQ is next",
    detail: "The concept and visual proof are ready. Move into fresh practice.",
    tone: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
  };
}

export function GeographyTalkRoom({ initialDay }: { initialDay?: number }) {
  const router = useRouter();
  const { getDayProgress, isLoaded, saveDayProgress } = useGeographyProgress();
  const [activeDay] = useState(resolveSession(initialDay).day);
  const [answerDraft, setAnswerDraft] = useState("");
  const [challengeDraft, setChallengeDraft] = useState("");
  const [assessment, setAssessment] = useState<GeographyAssessment | null>(null);
  const [discussion, setDiscussion] = useState<GeographyMaicDiscussion | null>(null);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const activeSession = resolveSession(activeDay);
  const progress = getDayProgress(activeSession.day);
  const watchScenes = useMemo(() => buildGeographyWatchScenes(activeSession), [activeSession]);
  const watchProofCount = Math.min(progress?.watchSceneCompletedIds?.length ?? (progress?.watched ? watchScenes.length : 0), watchScenes.length);
  const isWatchComplete = Boolean(progress?.watched) && watchProofCount >= watchScenes.length;
  const recap = useMemo(() => getCompressedGeographyRecap(activeSession), [activeSession]);
  const watchHandoff = progress?.watchHandoffSummary?.trim() ?? "";
  const labCompleted = Boolean(progress?.labCompleted);
  const route = assessment ? nextRouteFor(activeSession, assessment, labCompleted) : null;
  const challengeScaffold = assessment ? buildGeographyChallengeScaffold(activeSession, assessment) : "";
  const scoreStage = assessment ? getGeographyTalkUnlockStage(assessment) : null;

  useEffect(() => {
    if (!isLoaded || hydrated) return;

    const savedProgress = getDayProgress(activeSession.day);
    setAnswerDraft(savedProgress?.reflection?.trim() || savedProgress?.watchHandoffSummary || "");
    setChallengeDraft(savedProgress?.talkChallengeResponse ?? "");
    setSaved(false);

    if (typeof savedProgress?.talkScore === "number") {
      const restoredAssessment: GeographyAssessment = {
        score: savedProgress.talkScore,
        band: savedProgress.talkBand ?? "Practice",
        matchedKeywords: [],
        missingKeywords: [],
        summary: savedProgress.assessmentSummary ?? "Saved local assessment.",
        nextAction: savedProgress.talkNextActionLabel ?? "Continue",
        rubric: savedProgress.talkRubric ?? [],
        repairHints: savedProgress.talkRepairHints ?? [],
      };
      setAssessment(restoredAssessment);
      setDiscussion(
        savedProgress.talkTranscript
          ? {
              turns: savedProgress.talkTranscript,
              verdict: savedProgress.talkVerdict ?? restoredAssessment.summary,
              unlockStage: savedProgress.talkUnlockStage ?? getGeographyTalkUnlockStage(restoredAssessment),
              score: restoredAssessment.score,
            }
          : buildGeographyMaicDiscussion(activeSession, savedProgress.reflection ?? "", restoredAssessment)
      );
    }

    setHydrated(true);
  }, [activeSession, getDayProgress, hydrated, isLoaded]);

  const persistTalk = (nextAssessment: GeographyAssessment | null = assessment, nextDiscussion: GeographyMaicDiscussion | null = discussion) => {
    const nextRoute = nextAssessment ? nextRouteFor(activeSession, nextAssessment, labCompleted) : null;
    const stage = nextAssessment ? getGeographyTalkUnlockStage(nextAssessment) : undefined;
    saveDayProgress(activeSession.day, {
      reflection: answerDraft,
      talkChallengeResponse: challengeDraft,
      talkScore: nextAssessment?.score,
      talkBand: nextAssessment?.band,
      assessmentSummary: nextAssessment?.summary,
      talkTranscript: nextDiscussion?.turns,
      talkUnlockStage: stage,
      talkVerdict: nextDiscussion?.verdict,
      talkRubric: nextAssessment?.rubric,
      talkRepairHints: nextAssessment?.repairHints,
      talkNextRoute: nextRoute?.href,
      talkNextActionLabel: nextRoute?.label,
      talkDiscussionStep: challengeOpen ? "challenge" : nextAssessment ? "verdict" : "explain",
      revisitQueued: stage === "revisit" || stage === "retry",
      confidence: nextAssessment?.score && nextAssessment.score >= 85 ? "Command" : nextAssessment?.score && nextAssessment.score < 40 ? "Shaky" : "Working",
      mentorMode: "Cause-effect",
      activePromptLabel: "Explain",
    });
    setSaved(true);
  };

  const assess = (includeChallenge: boolean) => {
    const combinedAnswer = [answerDraft, includeChallenge ? challengeDraft : ""]
      .map((part) => part.trim())
      .filter(Boolean)
      .join("\n\nChallenge repair:\n");
    const nextAssessment = assessGeographyExplanation(activeSession, combinedAnswer);
    const nextDiscussion = buildGeographyMaicDiscussion(activeSession, combinedAnswer, nextAssessment);
    setAssessment(nextAssessment);
    setDiscussion(nextDiscussion);
    setChallengeOpen(!includeChallenge && getGeographyTalkUnlockStage(nextAssessment) !== "revisit");
    persistTalk(nextAssessment, nextDiscussion);
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#13251d]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 text-sm font-black shadow-sm">
          Opening discussion...
        </div>
      </main>
    );
  }

  if (!isWatchComplete) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <section className="rounded-lg border border-[#ef9f27]/55 bg-[#fff4df] p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#9a6a16] text-white">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a16]">Discussion locked</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">Watch the class first</h1>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#6f4a12]">
                  The discussion opens only after the Watch room saves the class proof. Current proof: {watchProofCount}/{watchScenes.length}.
                </p>
                <Link href={`/upsc/geography/watch?day=${activeSession.day}`} className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]">
                  Open Watch <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <Link href={`/upsc/geography?day=${activeSession.day}`} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
            <ArrowLeft className="h-4 w-4" /> Day funnel
          </Link>

          <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-white">Explain</Badge>
                <span className="text-sm font-black text-[#1d9e75]">Day {activeSession.day}</span>
                <span className="text-sm font-semibold text-[#746f66]">AI teacher discussion</span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">{activeSession.title}</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Explain the class once. The app decides whether you revise, open visual proof, or move toward MCQ.
              </p>
            </div>

            <div className={cn("rounded-lg border p-4", route ? route.tone : "border-[#cfe5dc] bg-[#e7f5ee] text-[#085041]")}>
              <p className="text-xs font-black uppercase tracking-[0.18em]">{route ? "Route decided" : "Do this now"}</p>
              <h2 className="mt-2 text-xl font-black tracking-tight">{route?.title ?? "Explain to the AI teacher"}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 opacity-85">{route?.detail ?? activeSession.talk}</p>
              {route && (
                <Link href={route.href} className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]">
                  {route.label} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Student answer</p>
                <h2 className="text-lg font-black tracking-tight">What did you learn?</h2>
              </div>
            </div>

            {watchHandoff && (
              <button
                type="button"
                onClick={() => setAnswerDraft(watchHandoff)}
                className="mb-3 inline-flex min-h-10 items-center justify-center rounded-md border border-[#cfe5dc] bg-[#e7f5ee] px-3 text-sm font-black text-[#085041] transition hover:bg-[#d7efe4]"
              >
                Use Watch recap
              </button>
            )}

            <textarea
              data-testid="talk-answer-draft"
              value={answerDraft}
              onChange={(event) => {
                setAnswerDraft(event.target.value);
                setAssessment(null);
                setDiscussion(null);
                setChallengeOpen(false);
                setSaved(false);
              }}
              placeholder="Explain in your own words: concept, mechanism, map/example, and one UPSC trap."
              className="min-h-56 w-full resize-y rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
            />

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="talk-assess-answer"
                disabled={answerDraft.trim().length < 20}
                onClick={() => assess(false)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Gauge className="h-4 w-4" /> Check answer
              </button>
              <button
                type="button"
                onClick={() => persistTalk()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
              >
                <Save className="h-4 w-4" /> Save
              </button>
              {saved && <span className="text-sm font-black text-[#1d9e75]">Saved</span>}
            </div>

            {challengeOpen && assessment && (
              <div className="mt-5 rounded-lg border border-[#d9d4f0] bg-[#f5f2ff] p-4">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#5b4ba8] text-white">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5b4ba8]">AI challenge</p>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#5f5b73]">{challengeScaffold}</p>
                  </div>
                </div>
                <textarea
                  value={challengeDraft}
                  onChange={(event) => {
                    setChallengeDraft(event.target.value);
                    setSaved(false);
                  }}
                  placeholder="Repair the weak point in 2-3 lines."
                  className="min-h-24 w-full resize-y rounded-lg border border-[#d9d4f0] bg-white p-3 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#5b4ba8] focus:ring-2 focus:ring-[#5b4ba8]/20"
                />
                <button
                  type="button"
                  disabled={challengeDraft.trim().length < 20}
                  onClick={() => assess(true)}
                  className="mt-3 inline-flex h-10 items-center justify-center rounded-md bg-[#5b4ba8] px-3 text-sm font-black text-white transition hover:bg-[#46398b] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Recheck answer
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-5">
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff4df] text-[#6f4a12]">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">AI teacher</p>
                  <h2 className="text-lg font-black tracking-tight">Simple score gate</h2>
                </div>
              </div>

              {assessment ? (
                <div data-testid="talk-score-card" className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Score</p>
                  <p className="mt-2 text-4xl font-black text-[#13251d]">{assessment.score}%</p>
                  <p className="mt-2 text-sm font-black text-[#085041]">{assessment.band}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#49675e]">{assessment.summary}</p>
                  <p className="mt-3 rounded-md bg-white/75 p-3 text-xs font-black uppercase tracking-[0.14em] text-[#085041]">
                    Decision: {scoreStage}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-sm font-semibold leading-6 text-[#5d675f]">
                    The answer must include a concept, mechanism, map/example, and one UPSC trap. Then the app will open the next room.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                  <MapPinned className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Quick recap</p>
                  <h2 className="text-lg font-black tracking-tight">Use if stuck</h2>
                </div>
              </div>
              <div className="space-y-2">
                {recap.slice(0, 3).map((line, index) => (
                  <div key={line} className="flex gap-3 rounded-md bg-[#f7f4ee] p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-xs font-black text-[#1a3a2a]">{index + 1}</span>
                    <p className="text-sm font-semibold leading-6 text-[#4f5e55]">{line}</p>
                  </div>
                ))}
              </div>
              <Link href={`/upsc/geography/watch?day=${activeSession.day}`} className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]">
                Reopen Watch
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
