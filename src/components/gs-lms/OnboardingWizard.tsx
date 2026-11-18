"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { SyllabusNodeOut } from "@/services/api/gsLmsService";
import { triggerWelcomeEngagement } from "@/lib/engagement/triggerWelcome";
import { useSubjectLms } from "./SubjectLmsContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { activeAuthProvider } from "@/env";
import { diagnosticStorageKey, DIAGNOSTIC_STORAGE_KEY } from "@/lib/auth/identity-storage";
import {
  defaultStudentProfile,
  readStudentProfile,
  saveStudentProfile,
  type StudentProfile,
} from "@/lib/upsc/studentProfile";

const STEPS = [
  { label: "Welcome" },
  { label: "Your Profile" },
  { label: "Get Started" },
];

type LearnerLevel = "beginner" | "intermediate" | "advanced";

interface StudyWindowOption {
  minutes: number;
  topicsPerDay: number;
  label: string;
}

// A full topic runs through several sittings (content, recall, practice and
// review), so these are pacing slots rather than a promise that a topic is
// finished inside one study window.
const STUDY_WINDOW_OPTIONS: StudyWindowOption[] = [
  { minutes: 60, topicsPerDay: 1, label: "1 slot/day" },
  { minutes: 90, topicsPerDay: 2, label: "2 slots/day" },
  { minutes: 120, topicsPerDay: 3, label: "3 slots/day" },
  { minutes: 180, topicsPerDay: 4, label: "4 slots/day" },
];

const LEARNER_LEVELS: {
  value: LearnerLevel;
  title: string;
  description: string;
}[] = [
  {
    value: "beginner",
    title: "Beginner",
    description:
      "I'm starting fresh. Walk me through everything step by step.",
  },
  {
    value: "intermediate",
    title: "Intermediate",
    description:
      "I've studied with coaching. I know basics but need UPSC depth.",
  },
  {
    value: "advanced",
    title: "Advanced",
    description:
      "I can explain most topics. I need gap-filling and exam patterns.",
  },
];

interface StartingLeafSummary {
  topic: SyllabusNodeOut | null;
  openLeaves: number;
  lockedLeaves: number;
  totalLeaves: number;
}

/**
 * Pick the same starting topic the server would default to.
 *
 * When the paid-beta scope is active, the syllabus annotates every leaf with
 * `beta_ready` and the backend refuses a locked first topic. The wizard must
 * mirror that rule instead of always taking the first reviewed leaf, which can
 * be a topic whose content or practice is still in preparation.
 */
function findStartingLeaf(nodes: SyllabusNodeOut[]): StartingLeafSummary {
  const leaves: SyllabusNodeOut[] = [];
  const collectLeaves = (currentNodes: SyllabusNodeOut[]) => {
    for (const node of currentNodes) {
      if (node.node_type === "LEAF_TOPIC" && node.review_status === "REVIEWED") {
        leaves.push(node);
      }
      collectLeaves(node.children);
    }
  };

  collectLeaves(nodes);
  leaves.sort((a, b) => a.display_order - b.display_order || a.node_id - b.node_id);

  const openLeaves = leaves.filter((node) => node.beta_ready === true).length;
  const lockedLeaves = leaves.filter((node) => node.beta_ready === false).length;
  const scopeActive = openLeaves + lockedLeaves > 0;
  const candidates = scopeActive
    ? leaves.filter((node) => node.beta_ready === true)
    : leaves;

  return {
    topic: candidates[0] ?? null,
    openLeaves,
    lockedLeaves,
    totalLeaves: leaves.length,
  };
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function OnboardingWizard() {
  const router = useRouter();
  const { subject, label, lmsBase } = useSubjectLms();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [learnerLevel, setLearnerLevel] = useState<LearnerLevel>("beginner");
  const [studyWindowMinutes, setStudyWindowMinutes] = useState(90);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The first-topic lookup is keyed by the request that produced it, so a
  // subject change or retry cannot show the previous request's topic, loading
  // flag or error, and the effect never resets state when it starts.
  const [firstTopicRetryKey, setFirstTopicRetryKey] = useState(0);
  const [firstTopicOutcome, setFirstTopicOutcome] = useState<{
    key: string;
    summary: StartingLeafSummary | null;
    error: string | null;
  }>({ key: "", summary: null, error: null });
  const firstTopicKey = `${subject}:${firstTopicRetryKey}`;
  const firstTopicResolved = firstTopicOutcome.key === firstTopicKey;
  const firstTopicLoading = !firstTopicResolved;
  const firstTopic = firstTopicResolved
    ? (firstTopicOutcome.summary?.topic ?? null)
    : null;
  const firstTopicScope = firstTopicResolved
    ? firstTopicOutcome.summary
    : null;
  const firstTopicError = firstTopicResolved ? firstTopicOutcome.error : null;
  const [diagnosticName, setDiagnosticName] = useState<string | null>(null);
  const [diagnosticEmail, setDiagnosticEmail] = useState<string | null>(null);

  // Pre-fill only from a diagnostic plan bound to this authenticated identity.
  // The legacy unscoped plan is accepted once only when its captured email matches
  // the current account, then migrated to the identity-scoped key.
  useEffect(() => {
    const identityEmail = user?.email?.trim().toLowerCase();
    const identityKey = user?.uid
      ? diagnosticStorageKey(activeAuthProvider, user.uid)
      : null;
    if (!identityEmail || !identityKey) return;

    try {
      const scopedRaw = localStorage.getItem(identityKey);
      const legacyRaw = scopedRaw ? null : localStorage.getItem(DIAGNOSTIC_STORAGE_KEY);
      const raw = scopedRaw ?? legacyRaw;
      if (!raw) return;

      const diagnostic = JSON.parse(raw) as {
        email?: string;
        stage?: string;
        hours?: string;
        name?: string;
      };
      const diagnosticEmail = typeof diagnostic.email === "string"
        ? diagnostic.email.trim().toLowerCase()
        : "";
      if (!diagnosticEmail || diagnosticEmail !== identityEmail) return;

      if (!scopedRaw && legacyRaw) {
        localStorage.setItem(identityKey, legacyRaw);
        localStorage.removeItem(DIAGNOSTIC_STORAGE_KEY);
      }

      queueMicrotask(() => {
        // Map diagnostic stage to learner level
        const stageMap: Record<string, LearnerLevel> = {
          "Fresh start — beginning from scratch": "beginner",
          "Self-study (6+ months in)": "intermediate",
          "Coaching student (online/offline)": "intermediate",
          "Repeat attempt (appeared before)": "advanced",
        };
        if (diagnostic.stage && stageMap[diagnostic.stage]) {
          setLearnerLevel(stageMap[diagnostic.stage]);
        }

        // Map hours to study window
        const hoursMap: Record<string, number> = {
          "2–3 hours": 60,
          "4–5 hours": 90,
          "6–8 hours": 120,
          "8+ hours": 180,
        };
        if (diagnostic.hours && hoursMap[diagnostic.hours]) {
          setStudyWindowMinutes(hoursMap[diagnostic.hours]);
        }

        // Store name/email for engagement trigger
        if (diagnostic.name) setDiagnosticName(diagnostic.name);
        if (diagnostic.email) setDiagnosticEmail(diagnostic.email);

        // Skip Step 1 (Welcome) if diagnostic was completed — they already know the method
        setStep(1);
      });
    } catch {
      // No identity-matching diagnostic data — start from Step 0.
    }
  }, [user?.email, user?.uid]);

  // Derive bandwidth from study window
  const bandwidth =
    STUDY_WINDOW_OPTIONS.find((o) => o.minutes === studyWindowMinutes)
      ?.topicsPerDay ?? 2;
  const firstTopicId = firstTopic?.node_id;

  useEffect(() => {
    let cancelled = false;

    gsLmsService
      .getSyllabusTree(subject)
      .then((data) => {
        if (!cancelled) {
          setFirstTopicOutcome({
            key: firstTopicKey,
            summary: findStartingLeaf(data.tree),
            error: null,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFirstTopicOutcome({
            key: firstTopicKey,
            summary: null,
            error: "Failed to load the first topic for this subject",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [subject, firstTopicKey]);

  const retryFirstTopic = () => {
    setFirstTopicRetryKey((key) => key + 1);
  };

  const handleGetStarted = async () => {
    if (firstTopicId == null) {
      setError(
        firstTopicScope && firstTopicScope.lockedLeaves > 0
          ? "No topic is open in the beta yet. Topics unlock as their content, PYQ and practice pass review."
          : "The first topic for this subject is not available yet",
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await gsLmsService.completeOnboarding(
        subject,
        bandwidth,
        firstTopicId,
        learnerLevel,
        studyWindowMinutes
      );

      // The dashboard's profile gate asks for the same level and study window
      // later. Seed the canonical profile from this wizard so a learner answers
      // once, and never overwrite a profile configured on the dashboard.
      try {
        if (!readStudentProfile()) {
          saveStudentProfile({
            ...defaultStudentProfile,
            level: learnerLevel,
            studyWindow: String(studyWindowMinutes) as StudentProfile["studyWindow"],
            updatedAt: new Date().toISOString(),
          });
        }
      } catch {
        // Seeding is a convenience; onboarding must complete even without it.
      }

      // Fire welcome engagement (email + WhatsApp) — fire and forget
      if (diagnosticName || diagnosticEmail) {
        void triggerWelcomeEngagement({
          name: diagnosticName || "Student",
          email: diagnosticEmail || "",
          targetYear: "2027",
          firstTopicUrl: `${lmsBase}/syllabus`,
        });
      }

      // Go directly to syllabus (the first topic is there)
      router.push(`${lmsBase}/syllabus`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? "Failed to complete onboarding")
          : "Failed to complete onboarding";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#dcd5c7] bg-white p-8 shadow-sm">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full transition-colors ${
                  i <= step ? "bg-[#1d9e75]" : "bg-[#dcd5c7]"
                }`}
              />
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 h-0.5 transition-colors ${
                    i < step ? "bg-[#1d9e75]" : "bg-[#dcd5c7]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 0 && <StepWelcome label={label} />}
        {step === 1 && (
          <StepProfile
            learnerLevel={learnerLevel}
            setLearnerLevel={setLearnerLevel}
            studyWindowMinutes={studyWindowMinutes}
            setStudyWindowMinutes={setStudyWindowMinutes}
          />
        )}
        {step === 2 && (
          <StepConfirmation
            bandwidth={bandwidth}
            learnerLevel={learnerLevel}
            studyWindowMinutes={studyWindowMinutes}
            label={label}
            firstTopic={firstTopic}
            firstTopicScope={firstTopicScope}
            firstTopicLoading={firstTopicLoading}
          />
        )}

        {firstTopicError && step === 2 && (
          <div
            role="alert"
            className="mt-4 flex items-center justify-center gap-3 text-sm text-red-600"
          >
            <span>{firstTopicError}</span>
            <button
              type="button"
              onClick={retryFirstTopic}
              disabled={firstTopicLoading}
              className="font-semibold underline hover:no-underline disabled:opacity-60"
            >
              Retry
            </button>
          </div>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="px-4 py-2 text-sm font-medium text-[#1a3a2a] border border-[#dcd5c7] rounded-lg hover:border-[#1d9e75] transition-colors disabled:opacity-0 disabled:pointer-events-none"
          >
            Back
          </button>

          {step < 2 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2 text-sm font-medium text-white bg-[#1d9e75] hover:bg-[#178a65] rounded-lg transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleGetStarted}
              disabled={submitting || firstTopicLoading || firstTopic === null}
              className="px-5 py-2 text-sm font-medium text-white bg-[#1d9e75] hover:bg-[#178a65] rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? "Starting…" : "Get Started"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step sub-components                                                         */
/* -------------------------------------------------------------------------- */

function StepWelcome({ label }: { label: string }) {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold text-[#1a3a2a]">
        Welcome to {label} LMS
      </h2>
      <p className="text-sm text-[#13251d]/70 leading-relaxed">
        This guided learning system helps you master UPSC {label} through a
        structured, research-backed method:
      </p>
      <ol className="text-left text-sm text-[#13251d]/80 space-y-2 pl-4">
        <li className="flex items-start gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1d9e75]/10 text-[#1d9e75] text-xs font-bold flex items-center justify-center mt-0.5">
            1
          </span>
          <span>
            <strong>Optional knowledge check</strong> — A short AI discussion
            that adds recall evidence; it never locks content
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1d9e75]/10 text-[#1d9e75] text-xs font-bold flex items-center justify-center mt-0.5">
            2
          </span>
          <span>
            <strong>Content</strong> — Progressive disclosure from basic to
            examiner-level traps
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1d9e75]/10 text-[#1d9e75] text-xs font-bold flex items-center justify-center mt-0.5">
            3
          </span>
          <span>
            <strong>PYQ Review</strong> — Study real past-year questions mapped
            to each topic
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1d9e75]/10 text-[#1d9e75] text-xs font-bold flex items-center justify-center mt-0.5">
            4
          </span>
          <span>
            <strong>Practice</strong> — MCQ sessions with per-type gap analysis
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1d9e75]/10 text-[#1d9e75] text-xs font-bold flex items-center justify-center mt-0.5">
            5
          </span>
          <span>
            <strong>Track</strong> — Daily planner, streak tracking, and
            weak-area identification
          </span>
        </li>
      </ol>
    </div>
  );
}

function StepProfile({
  learnerLevel,
  setLearnerLevel,
  studyWindowMinutes,
  setStudyWindowMinutes,
}: {
  learnerLevel: LearnerLevel;
  setLearnerLevel: (v: LearnerLevel) => void;
  studyWindowMinutes: number;
  setStudyWindowMinutes: (v: number) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Learner Level Selection */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-[#1a3a2a] text-center">
          What&apos;s Your Level?
        </h2>
        <p className="text-sm text-[#13251d]/70 text-center leading-relaxed">
          This helps us tailor the content flow to your experience.
        </p>
        <div className="space-y-2 pt-1">
          {LEARNER_LEVELS.map((level) => {
            const isSelected = learnerLevel === level.value;
            return (
              <button
                key={level.value}
                type="button"
                onClick={() => setLearnerLevel(level.value)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? "border-[#1d9e75] bg-[#e7f5ee]"
                    : "border-[#dcd5c7] bg-white hover:border-[#1d9e75]/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "border-[#1d9e75]"
                        : "border-[#dcd5c7]"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-[#1d9e75]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1a3a2a]">
                      {level.title}
                    </p>
                    <p className="text-xs text-[#13251d]/60 mt-0.5">
                      {level.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Study Window Picker */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#1a3a2a] text-center">
          Daily Study Window
        </h3>
        <p className="text-xs text-[#13251d]/60 text-center">
          How much time can you dedicate per day?
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
          {STUDY_WINDOW_OPTIONS.map((option) => {
            const isSelected = studyWindowMinutes === option.minutes;
            return (
              <button
                key={option.minutes}
                type="button"
                onClick={() => setStudyWindowMinutes(option.minutes)}
                className={`px-3 py-2 rounded-full text-xs font-medium border transition-colors ${
                  isSelected
                    ? "bg-[#1d9e75] text-white border-[#1d9e75]"
                    : "bg-white text-[#1a3a2a] border-[#dcd5c7] hover:border-[#1d9e75]/50"
                }`}
              >
                {option.minutes} min
                <span className="block text-[10px] opacity-75 mt-0.5">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepConfirmation({
  bandwidth,
  learnerLevel,
  studyWindowMinutes,
  label,
  firstTopic,
  firstTopicScope,
  firstTopicLoading,
}: {
  bandwidth: number;
  learnerLevel: LearnerLevel;
  studyWindowMinutes: number;
  label: string;
  firstTopic: SyllabusNodeOut | null;
  firstTopicScope: StartingLeafSummary | null;
  firstTopicLoading: boolean;
}) {
  const levelLabel =
    LEARNER_LEVELS.find((l) => l.value === learnerLevel)?.title ?? "Beginner";

  const firstTopicTitle =
    firstTopic?.title ?? (firstTopicLoading ? "Loading…" : "Unavailable");
  const evidence = firstTopic
    ? `${plural(firstTopic.prelims_pyq_count, "Prelims PYQ")} + ${plural(
        firstTopic.mains_pyq_count,
        "Mains PYQ",
      )} mapped · ${plural(firstTopic.mcq_count, "practice question")} ready`
    : null;
  const betaScoped = (firstTopicScope?.lockedLeaves ?? 0) > 0;

  return (
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold text-[#1a3a2a]">
        You&apos;re All Set!
      </h2>
      <p className="text-sm text-[#13251d]/70 leading-relaxed">
        Your daily planner will open{" "}
        <span className="font-semibold text-[#1d9e75]">{bandwidth}</span>{" "}
        {bandwidth === 1 ? "topic slot" : "topic slots"} per day (
        {studyWindowMinutes} min). A topic usually spans more than one sitting,
        so these slots set your pace; the funnel records what you actually
        finish. The syllabus guides you through {label} from fundamental
        concepts.
      </p>
      <div className="mt-4 rounded-xl border border-[#1d9e75]/20 bg-[#1d9e75]/5 p-4 text-left space-y-3">
        <div>
          <p className="text-sm font-medium text-[#1a3a2a]">
            Level: {levelLabel}
          </p>
          <p className="mt-1 text-sm font-medium text-[#1a3a2a]">
            First topic: {firstTopicTitle}
          </p>
          {firstTopic && (
            <p className="mt-1 text-xs leading-relaxed text-[#13251d]/60">
              Chosen because it is the first open topic in syllabus order.
              {evidence ? ` ${evidence}.` : ""}
            </p>
          )}
        </div>
        {betaScoped && firstTopicScope && (
          <p className="border-t border-[#1d9e75]/15 pt-2 text-xs leading-relaxed text-[#13251d]/60">
            <span className="font-semibold text-[#085041]">Beta scope:</span>{" "}
            {firstTopicScope.openLeaves} of {firstTopicScope.totalLeaves}{" "}
            {label} topics are open now. The other{" "}
            {firstTopicScope.lockedLeaves} stay visible on the map and unlock as
            their content, PYQ and practice pass review.
          </p>
        )}
        <p className="text-xs text-[#13251d]/50">
          Click &quot;Get Started&quot; to begin your journey
        </p>
      </div>
    </div>
  );
}
