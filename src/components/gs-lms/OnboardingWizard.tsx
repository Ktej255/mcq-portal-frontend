"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import { triggerWelcomeEngagement } from "@/lib/engagement/triggerWelcome";
import { useSubjectLms } from "./SubjectLmsContext";

const DIAGNOSTIC_STORAGE_KEY = "sarit-diagnostic-plan-v1";

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

const STUDY_WINDOW_OPTIONS: StudyWindowOption[] = [
  { minutes: 60, topicsPerDay: 1, label: "1 topic/day" },
  { minutes: 90, topicsPerDay: 2, label: "2 topics/day" },
  { minutes: 120, topicsPerDay: 3, label: "3 topics/day" },
  { minutes: 180, topicsPerDay: 4, label: "4 topics/day" },
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

export function OnboardingWizard() {
  const router = useRouter();
  const { subject, lmsBase } = useSubjectLms();
  const [step, setStep] = useState(0);
  const [learnerLevel, setLearnerLevel] = useState<LearnerLevel>("beginner");
  const [studyWindowMinutes, setStudyWindowMinutes] = useState(90);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticName, setDiagnosticName] = useState<string | null>(null);
  const [diagnosticEmail, setDiagnosticEmail] = useState<string | null>(null);

  // Pre-fill from diagnostic data if available
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DIAGNOSTIC_STORAGE_KEY);
      if (!raw) return;
      const diagnostic = JSON.parse(raw);

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
    } catch {
      // No diagnostic data — start from Step 0
    }
  }, []);

  // Derive bandwidth from study window
  const bandwidth =
    STUDY_WINDOW_OPTIONS.find((o) => o.minutes === studyWindowMinutes)
      ?.topicsPerDay ?? 2;

  const handleGetStarted = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await gsLmsService.completeOnboarding(
        subject,
        bandwidth,
        undefined,
        learnerLevel,
        studyWindowMinutes,
      );

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
        {step === 0 && <StepWelcome />}
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
          />
        )}

        {/* Error */}
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
              disabled={submitting}
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

function StepWelcome() {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold text-[#1a3a2a]">
        Welcome to Geography LMS
      </h2>
      <p className="text-sm text-[#13251d]/70 leading-relaxed">
        This guided learning system helps you master UPSC Geography through a
        structured, research-backed method:
      </p>
      <ol className="text-left text-sm text-[#13251d]/80 space-y-2 pl-4">
        <li className="flex items-start gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1d9e75]/10 text-[#1d9e75] text-xs font-bold flex items-center justify-center mt-0.5">
            1
          </span>
          <span>
            <strong>AI Discussion</strong> — Engage with an AI tutor to recall
            what you already know
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
}: {
  bandwidth: number;
  learnerLevel: LearnerLevel;
  studyWindowMinutes: number;
}) {
  const levelLabel =
    LEARNER_LEVELS.find((l) => l.value === learnerLevel)?.title ?? "Beginner";

  return (
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold text-[#1a3a2a]">
        You&apos;re All Set!
      </h2>
      <p className="text-sm text-[#13251d]/70 leading-relaxed">
        Your daily target is set to{" "}
        <span className="font-semibold text-[#1d9e75]">{bandwidth}</span>{" "}
        {bandwidth === 1 ? "topic" : "topics"} per day ({studyWindowMinutes}{" "}
        min). The syllabus will guide you through Geography starting from
        Physical Geography fundamentals.
      </p>
      <div className="mt-4 p-4 rounded-xl border border-[#1d9e75]/20 bg-[#1d9e75]/5 space-y-2">
        <p className="text-sm font-medium text-[#1a3a2a]">
          Level: {levelLabel}
        </p>
        <p className="text-sm font-medium text-[#1a3a2a]">
          First topic: Physical Geography — Geomorphology
        </p>
        <p className="text-xs text-[#13251d]/50 mt-1">
          Click &quot;Get Started&quot; to begin your journey
        </p>
      </div>
    </div>
  );
}
