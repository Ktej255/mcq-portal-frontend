"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";

const STEPS = [
  { label: "Welcome" },
  { label: "Bandwidth" },
  { label: "Get Started" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [bandwidth, setBandwidth] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetStarted = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await gsLmsService.completeOnboarding(bandwidth);
      router.push("/upsc/geography/lms/syllabus");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data
              ?.message ?? "Failed to complete onboarding")
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
          <StepBandwidth bandwidth={bandwidth} setBandwidth={setBandwidth} />
        )}
        {step === 2 && <StepConfirmation bandwidth={bandwidth} />}

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
            <strong>Track</strong> — Daily planner, streak tracking, and weak-area
            identification
          </span>
        </li>
      </ol>
    </div>
  );
}

function StepBandwidth({
  bandwidth,
  setBandwidth,
}: {
  bandwidth: number;
  setBandwidth: (v: number) => void;
}) {
  return (
    <div className="text-center space-y-5">
      <h2 className="text-xl font-semibold text-[#1a3a2a]">
        Set Your Daily Pace
      </h2>
      <p className="text-sm text-[#13251d]/70 leading-relaxed">
        How many topics per day would you like to cover? You can always change
        this later from the Planner page.
      </p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <input
          type="number"
          min={1}
          max={10}
          value={bandwidth}
          onChange={(e) => {
            const val = Math.min(10, Math.max(1, Number(e.target.value) || 1));
            setBandwidth(val);
          }}
          className="w-20 px-3 py-2 text-lg text-center border border-[#dcd5c7] rounded-lg focus:border-[#1d9e75] outline-none"
        />
        <span className="text-sm text-[#13251d]/60">topics / day</span>
      </div>
      <p className="text-xs text-[#13251d]/50">
        Recommended: 2–4 topics/day for steady UPSC preparation
      </p>
    </div>
  );
}

function StepConfirmation({ bandwidth }: { bandwidth: number }) {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold text-[#1a3a2a]">
        You&apos;re All Set!
      </h2>
      <p className="text-sm text-[#13251d]/70 leading-relaxed">
        Your daily target is set to{" "}
        <span className="font-semibold text-[#1d9e75]">{bandwidth}</span>{" "}
        {bandwidth === 1 ? "topic" : "topics"} per day. The syllabus will guide
        you through Geography starting from Physical Geography fundamentals.
      </p>
      <div className="mt-4 p-4 rounded-xl border border-[#1d9e75]/20 bg-[#1d9e75]/5">
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
