"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FunnelQuestion } from "@/lib/funnels/hermes/questions";

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  funnel_type: string;
  tags: string[];
  step_count: number;
}

export default function NewFunnelPage() {
  const router = useRouter();

  // Wizard state: 'template' | 'questions' | 'generating'
  const [wizardStep, setWizardStep] = useState<"template" | "questions" | "generating">("template");

  // Template lists
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>("");
  const [selectedFunnelType, setSelectedFunnelType] = useState<string>("general");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Questions state
  const [questions, setQuestions] = useState<FunnelQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Generating state
  const [generationStatus, setGenerationStatus] = useState("Initializing Hermes...");
  const [generationJobId, setGenerationJobId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch templates and questions on mount
  useEffect(() => {
    // 1. Fetch templates
    fetch("/api/v1/funnels/templates")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTemplates(data))
      .catch((err) => console.error("NewFunnel | Fetch templates error:", err));

    // 2. Fetch questions
    fetch("/api/v1/funnels/hermes/questions")
      .then((res) => (res.ok ? res.json() : { questions: [] }))
      .then((data) => setQuestions(data.questions || []))
      .catch((err) => console.error("NewFunnel | Fetch questions error:", err));
  }, []);

  const handleSelectTemplate = (template: TemplateItem | null) => {
    if (template) {
      setSelectedTemplateId(template.id);
      setSelectedTemplateName(template.name);
      setSelectedFunnelType(template.funnel_type);
      // Pre-fill funnel goal based on template funnel type
      let defaultGoal = "Collect leads";
      if (template.funnel_type === "webinar") defaultGoal = "Register for a webinar";
      if (template.funnel_type === "sales") defaultGoal = "Sell a product or service";
      if (template.funnel_type === "application") defaultGoal = "Book a discovery call";
      setAnswers((prev) => ({ ...prev, funnel_goal: defaultGoal }));
    } else {
      setSelectedTemplateId(null);
      setSelectedTemplateName("Custom Scratch Funnel");
      setSelectedFunnelType("general");
    }
    setWizardStep("questions");
  };

  const handleAnswerSubmit = (value: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Completed all questions, trigger generation
      triggerGeneration({
        ...answers,
        [currentQuestion.id]: value
      });
    }
  };

  const triggerGeneration = async (finalAnswers: Record<string, string>) => {
    setWizardStep("generating");
    setGenerationStatus("Creating funnel database entry...");
    setErrorMsg(null);

    try {
      // 1. Create project
      const projRes = await fetch("/api/v1/funnels/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalAnswers.product_name || `My ${selectedTemplateName || "Funnel"}`,
          funnel_type: selectedFunnelType,
          template_id: selectedTemplateId || undefined
        })
      });

      if (!projRes.ok) {
        throw new Error("Failed to create funnel project layout.");
      }

      const project = await projRes.json();
      const projectId = project.id;

      setGenerationStatus("Invoking Hermes AI copywriting engine...");

      // 2. Start Hermes Job
      const startRes = await fetch("/api/v1/funnels/hermes/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          answers: finalAnswers
        })
      });

      if (!startRes.ok) {
        throw new Error("Failed to initialize Hermes worker job.");
      }

      const { job_id } = await startRes.json();
      setGenerationJobId(job_id);
      setGenerationStatus("Hermes is drafting copy and sequencing stages...");

      // 3. Poll status
      pollJobStatus(job_id, projectId);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred during creation.");
      setWizardStep("questions");
    }
  };

  const pollJobStatus = (jobId: string, projectId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/funnels/hermes/status?job_id=${jobId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.status === "completed") {
          clearInterval(interval);
          setGenerationStatus("Finalizing layout structure...");
          
          // Successful redirect
          router.push(`/dashboard/funnels/${projectId}/edit`);
        } else if (data.status === "failed") {
          clearInterval(interval);
          throw new Error("Hermes AI generation job failed.");
        }
      } catch (err: any) {
        clearInterval(interval);
        console.error(err);
        setErrorMsg(err.message || "Hermes job tracking lost. Checking editor...");
        router.push(`/dashboard/funnels/${projectId}/edit`);
      }
    }, 3000);
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    const matchesType = filterType === "all" || t.funnel_type === filterType;
    return matchesCategory && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Glow */}
      <div className="absolute w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* error state */}
      {errorMsg && (
        <div className="mb-6 max-w-xl w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold text-center z-20">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: Select Template */}
      {wizardStep === "template" && (
        <div className="max-w-5xl w-full z-10 animate-in fade-in duration-300">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Select a Funnel Blueprint
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Choose an engineered structure or build a tailored one from scratch.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8 p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-350 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                >
                  <option value="all">All Categories</option>
                  <option value="education">Education</option>
                  <option value="coaching">Coaching</option>
                  <option value="ecommerce">Ecommerce</option>
                  <option value="health">Health</option>
                  <option value="saas">SaaS</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-350 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                >
                  <option value="all">All Types</option>
                  <option value="optin">Opt-In</option>
                  <option value="sales">Sales</option>
                  <option value="webinar">Webinar</option>
                  <option value="application">Application</option>
                  <option value="challenge">Challenge</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => handleSelectTemplate(null)}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 text-indigo-400 text-xs font-bold transition-all duration-300"
            >
              Start From Scratch
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="bg-slate-900/30 border border-slate-800/80 hover:border-indigo-500/30 rounded-2xl p-6 cursor-pointer flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/[0.01]"
              >
                <div>
                  <div className="flex justify-between items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-[10px] font-bold text-slate-400">
                      {template.step_count} Steps
                    </span>
                    <span className="text-[10px] font-semibold text-slate-550 capitalize">{template.category}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-200 mb-2">{template.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{template.description}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-850/50">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Select Blueprint</span>
                  <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Hermes Questionnaire */}
      {wizardStep === "questions" && questions.length > 0 && (
        <div className="max-w-xl w-full bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 md:p-12 backdrop-blur-md shadow-2xl relative z-10 animate-in slide-in-from-bottom duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Question Index Progress */}
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold mb-6">
            <span>Hermes Funnel Planner</span>
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>

          <div className="w-full h-1 bg-slate-950 border border-slate-850 rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Active Question */}
          {(() => {
            const q = questions[currentQuestionIndex];
            const savedVal = answers[q.id] || "";

            return (
              <div className="space-y-6">
                <h3 className="text-xl md:text-2xl font-bold text-slate-200 leading-snug">
                  {q.text}
                </h3>

                {q.type === "single_select" && q.options ? (
                  <div className="space-y-3 pt-2">
                    {q.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleAnswerSubmit(option)}
                        className={`w-full text-left px-4 py-3 rounded-xl border border-slate-850 bg-slate-950/40 hover:bg-slate-900/60 hover:border-indigo-500/20 text-slate-300 text-sm font-semibold transition-all duration-300 flex items-center justify-between ${
                          savedVal === option ? "border-indigo-500/40 bg-indigo-950/20" : ""
                        }`}
                      >
                        <span>{option}</span>
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder={q.placeholder || "Type your answer..."}
                      defaultValue={savedVal}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) handleAnswerSubmit(val);
                        }
                      }}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 text-sm placeholder-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-300"
                      autoFocus
                    />
                    <div className="mt-4 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>Press Enter to continue</span>
                      <button
                        onClick={(e) => {
                          const input = (e.target as HTMLElement).parentElement?.previousElementSibling as HTMLInputElement;
                          const val = input?.value?.trim() || "";
                          if (val) handleAnswerSubmit(val);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Back Navigation */}
          {currentQuestionIndex > 0 && (
            <button
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              className="mt-8 text-xs font-bold text-slate-500 hover:text-slate-400 flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Previous Question</span>
            </button>
          )}
        </div>
      )}

      {/* STEP 3: Loading / Generating status */}
      {wizardStep === "generating" && (
        <div className="max-w-md w-full bg-slate-900/40 border border-slate-800/80 rounded-3xl p-10 text-center backdrop-blur-md shadow-2xl relative z-10 animate-in fade-in duration-300">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-8 animate-pulse">
            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-slate-200 mb-2">Hermes is Assembling</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-6">Building Funnel Blueprint</p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-850/80">
            <p className="text-xs text-slate-400 font-medium italic leading-relaxed">
              "{generationStatus}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
