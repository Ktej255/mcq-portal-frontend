"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { QUESTIONNAIRE_QUESTIONS, QuestionnaireQuestion } from "@/lib/vsl/hermes/questions";

export default function NewFunnelPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Hermes Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [funnelId, setFunnelId] = useState<string | null>(null);

  const stepsText = [
    "Hermes is initiating market intelligence...",
    "Analyzing target niche and emotional triggers...",
    "Mapping buyer objections and exception strategies...",
    "Drafting direct-response copywriting hooks...",
    "Finalizing VSL script sections and follow-up copy..."
  ];

  useEffect(() => {
    // Fetch questions list
    const loadQuestions = async () => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/vsl/hermes/questions", { headers });
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions || QUESTIONNAIRE_QUESTIONS);
        } else {
          setQuestions(QUESTIONNAIRE_QUESTIONS);
        }
      } catch (err) {
        console.warn("NEW_FUNNEL | Failed to load questions API, using fallback:", err);
        setQuestions(QUESTIONNAIRE_QUESTIONS);
      } finally {
        setLoadingQuestions(false);
      }
    };
    loadQuestions();
  }, [getToken]);

  // Cycle generation helper text for aesthetic loading screen
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setGenerationStep((prev) => (prev < stepsText.length - 1 ? prev + 1 : prev));
    }, 4500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Poll Hermes job status
  useEffect(() => {
    if (!jobId || !funnelId) return;

    const pollInterval = setInterval(async () => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`/api/v1/vsl/hermes/status?job_id=${jobId}`, { headers });
        const data = await res.json();
        if (data.status === "completed") {
          clearInterval(pollInterval);
          router.push(`/dashboard/vsl/${funnelId}/edit`);
        } else if (data.status === "failed") {
          clearInterval(pollInterval);
          alert("Hermes blueprint generation failed. Redirecting to editor to configure manually.");
          router.push(`/dashboard/vsl/${funnelId}/edit`);
        }
      } catch (err) {
        console.error("NEW_FUNNEL | Error polling status:", err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [jobId, funnelId, getToken, router]);

  const handleAnswerChange = (value: string) => {
    const q = questions[currentIndex];
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // 1. Create the funnel using the product name as the internal title
      const productName = answers.product_name || "My UPSC Product";
      const createResponse = await fetch("/api/v1/vsl/funnels", {
        method: "POST",
        headers,
        body: JSON.stringify({ title: productName }),
      });

      if (!createResponse.ok) throw new Error("Failed to create funnel");
      const funnel = await createResponse.json();
      setFunnelId(funnel.id);

      // 2. Start the Hermes AI generation job
      const startResponse = await fetch("/api/v1/vsl/hermes/start", {
        method: "POST",
        headers,
        body: JSON.stringify({ funnel_id: funnel.id, answers }),
      });

      if (!startResponse.ok) throw new Error("Failed to trigger Hermes job");
      const job = await startResponse.json();
      setJobId(job.job_id);

    } catch (err) {
      console.error("NEW_FUNNEL | Submission error:", err);
      alert("An error occurred during VSL creation. Please try again.");
      setIsGenerating(false);
    }
  };

  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <p>Loading Hermes questionnaire...</p>
      </div>
    );
  }

  const activeQuestion = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Glow Backdrops */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {isGenerating ? (
        /* Sleek Loading Screen during Hermes AI generation */
        <div className="max-w-md w-full flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-slate-900/40 border border-slate-850/80 backdrop-blur-md shadow-2xl animate-pulse">
          <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-indigo-500/30 text-indigo-400 mb-6 relative">
            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mb-2">Deploying Hermes Coprocessor</h2>
          <p className="text-sm text-slate-400 min-h-[40px] px-4 font-medium transition-all duration-500">
            {stepsText[generationStep]}
          </p>
          <div className="w-full h-1 bg-slate-950 border border-slate-800 rounded-full overflow-hidden mt-6">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
              style={{ width: `${((generationStep + 1) / stepsText.length) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        /* Stepper Questionnaire Form */
        <div className="max-w-xl w-full p-8 rounded-3xl bg-slate-900/40 border border-slate-850/80 backdrop-blur-md shadow-2xl flex flex-col justify-between min-h-[380px]">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between items-center text-xs text-slate-500 mb-3 font-semibold">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{progressPercent}% Complete</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 border border-slate-850 rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Question Box */}
            <div className="space-y-4">
              <label className="block text-lg font-bold text-slate-100 tracking-tight leading-snug">
                {activeQuestion.text}
              </label>

              {activeQuestion.type === "text" ? (
                <input
                  type="text"
                  required
                  placeholder={activeQuestion.placeholder}
                  value={answers[activeQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && answers[activeQuestion.id]?.trim()) {
                      handleNext();
                    }
                  }}
                  className="w-full py-3 px-4 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-sm transition-all"
                  autoFocus
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {activeQuestion.options?.map((option) => {
                    const isSelected = answers[activeQuestion.id] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleAnswerChange(option)}
                        className={`py-3 px-4 text-left rounded-xl text-xs font-semibold border transition-all active:scale-98 cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-md shadow-indigo-600/5"
                            : "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900/60 hover:border-slate-800"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Nav buttons */}
          <div className="flex gap-3 pt-8 mt-4 border-t border-slate-900/50">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="py-2.5 px-5 border border-slate-800 hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!answers[activeQuestion.id]?.trim()}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/10 transition-colors cursor-pointer"
            >
              {currentIndex === questions.length - 1 ? "Submit to Hermes" : "Next Question"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
