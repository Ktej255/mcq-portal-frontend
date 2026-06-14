"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FunnelHermesOutput } from "@/lib/funnels/hermes/types";

interface Step {
  id: string;
  project_id: string;
  step_order: number;
  step_type: string;
  title: string;
  content: any;
  settings: any;
  created_at: string;
  updated_at: string;
}

interface ProjectData {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  funnel_type: string;
  status: "draft" | "published" | "archived";
  goal: string | null;
  hermes_job_id: string | null;
  questionnaire_answers: any;
  settings: any;
  steps: Step[];
}

export default function EditFunnelPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: projectId } = use(params);

  // Core project state
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceSlug, setWorkspaceSlug] = useState("my-workspace");

  // Selection states
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<"ai" | "step_settings" | "funnel_settings">("ai");

  // Editable Step fields
  const [stepTitle, setStepTitle] = useState("");
  const [stepType, setStepType] = useState("optin");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [bodyCopy, setBodyCopy] = useState("");
  const [ctaText, setCtaText] = useState("Continue");
  const [formFields, setFormFields] = useState<string[]>([]);
  
  // Step settings
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [redirectOnSkip, setRedirectOnSkip] = useState("");

  // Editable Project settings
  const [projectName, setProjectName] = useState("");
  const [projectGoal, setProjectGoal] = useState("collect_leads");
  const [thankYouRedirect, setThankYouRedirect] = useState("");

  // Save states
  const [savingStep, setSavingStep] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState("All changes saved");

  // Hermes Output state
  const [hermesOutput, setHermesOutput] = useState<FunnelHermesOutput | null>(null);
  const [loadingHermes, setLoadingHermes] = useState(false);

  // Fetch project details on mount
  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = () => {
    fetch(`/api/v1/funnels/projects/${projectId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Project not found");
        return res.json();
      })
      .then((data) => {
        setProject(data);
        setProjectName(data.name);
        setProjectGoal(data.goal || "collect_leads");
        setThankYouRedirect(data.settings?.thank_you_redirect_url || "");

        // Fetch workspace slug
        fetch(`/api/v1/workspaces/${data.workspace_id}`)
          .then((r) => r.json())
          .then((ws) => setWorkspaceSlug(ws.slug || "my-workspace"))
          .catch(() => {});

        // Set active step to the first one by default if not set
        if (data.steps && data.steps.length > 0) {
          const sorted = [...data.steps].sort((a, b) => a.step_order - b.step_order);
          const defaultStep = sorted[0];
          setActiveStepId(defaultStep.id);
          loadStepData(defaultStep);
        }

        // Fetch Hermes output if job linked
        if (data.hermes_job_id) {
          setLoadingHermes(true);
          fetch(`/api/v1/funnels/hermes/output?job_id=${data.hermes_job_id}`)
            .then((r) => r.json())
            .then((outputData) => setHermesOutput(outputData.output))
            .catch((err) => console.warn("HERMES_OUTPUT | Fetch error:", err))
            .finally(() => setLoadingHermes(false));
        }
      })
      .catch((err) => {
        console.error("EDIT_PROJECT | Fetch error:", err);
        alert("Failed to load project details.");
        router.push("/dashboard/funnels");
      })
      .finally(() => setLoading(false));
  };

  const loadStepData = (step: Step) => {
    setStepTitle(step.title);
    setStepType(step.step_type);
    
    // Parse Puck content structure or fallbacks
    const content = step.content || {};
    const puckProps = content.props || {};
    setHeadline(content.headline || puckProps.headline || "");
    setSubheadline(content.subheadline || puckProps.subheadline || "");
    setBodyCopy(content.body_copy || puckProps.body_copy || "");
    setCtaText(content.cta_text || puckProps.cta_text || "Continue");
    setFormFields(content.form_fields || puckProps.form_fields || ["email", "name"]);

    // Settings
    const settings = step.settings || {};
    setShowProgressBar(settings.show_progress_bar !== false);
    setRedirectOnSkip(settings.redirect_url_on_skip || "");
  };

  const activeStep = project?.steps.find((s) => s.id === activeStepId) || null;

  // Auto-save step content every 30 seconds if modified
  useEffect(() => {
    if (!activeStepId || !project) return;
    
    const interval = setInterval(() => {
      autoSaveActiveStep();
    }, 30000);

    return () => clearInterval(interval);
  }, [activeStepId, stepTitle, stepType, headline, subheadline, bodyCopy, ctaText, formFields, showProgressBar, redirectOnSkip]);

  const autoSaveActiveStep = async () => {
    if (!activeStepId || !project) return;
    setSaveIndicator("Autosaving...");

    try {
      const stepContent = {
        headline,
        subheadline,
        body_copy: bodyCopy,
        cta_text: ctaText,
        form_fields: formFields
      };

      const stepSettings = {
        show_progress_bar: showProgressBar,
        redirect_url_on_skip: redirectOnSkip || null
      };

      const response = await fetch(`/api/v1/funnels/projects/${projectId}/steps/${activeStepId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: stepTitle,
          step_type: stepType,
          content: stepContent,
          settings: stepSettings
        })
      });

      if (response.ok) {
        const updatedStep = await response.json();
        // Update local state without trigger full refetch
        setProject((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            steps: prev.steps.map((s) => (s.id === activeStepId ? updatedStep : s))
          };
        });
        setSaveIndicator("All changes saved");
      } else {
        setSaveIndicator("Auto-save failed");
      }
    } catch (err) {
      setSaveIndicator("Auto-save failed");
    }
  };

  const handleManualSaveStep = async () => {
    setSavingStep(true);
    setSaveIndicator("Saving step...");
    await autoSaveActiveStep();
    setSavingStep(false);
    alert("Step details saved successfully!");
  };

  const handleSaveProjectSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingProject) return;

    setSavingProject(true);
    try {
      const response = await fetch(`/api/v1/funnels/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          goal: projectGoal,
          settings: {
            thank_you_redirect_url: thankYouRedirect || null
          }
        })
      });

      if (!response.ok) throw new Error("Failed to save project settings");
      const updatedProject = await response.json();

      setProject((prev) => (prev ? { ...prev, ...updatedProject } : null));
      alert("Project settings updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to save project settings.");
    } finally {
      setSavingProject(false);
    }
  };

  const handleAddStep = async () => {
    const title = prompt("Enter a title for the new step:", "New Funnel Step");
    if (!title) return;

    try {
      const response = await fetch(`/api/v1/funnels/projects/${projectId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          step_type: "optin"
        })
      });

      if (!response.ok) throw new Error("Failed to create step");
      const newStep = await response.json();

      setProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          steps: [...prev.steps, newStep]
        };
      });

      setActiveStepId(newStep.id);
      loadStepData(newStep);
    } catch (err) {
      console.error(err);
      alert("Failed to add new step.");
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm("Are you sure you want to delete this step? This action is irreversible.")) return;

    try {
      const response = await fetch(`/api/v1/funnels/projects/${projectId}/steps/${stepId}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete step");

      setProject((prev) => {
        if (!prev) return null;
        const filtered = prev.steps.filter((s) => s.id !== stepId);
        return {
          ...prev,
          steps: filtered
        };
      });

      // Switch active step
      if (activeStepId === stepId) {
        const remaining = project?.steps.filter((s) => s.id !== stepId) || [];
        if (remaining.length > 0) {
          setActiveStepId(remaining[0].id);
          loadStepData(remaining[0]);
        } else {
          setActiveStepId(null);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete step.");
    }
  };

  const handleReorderStep = async (stepId: string, direction: "up" | "down") => {
    if (!project) return;
    const sorted = [...project.steps].sort((a, b) => a.step_order - b.step_order);
    const index = sorted.findIndex((s) => s.id === stepId);

    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sorted.length - 1) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const targetStep = sorted[index];
    const swapStep = sorted[swapIndex];

    // Swap ordering numbers
    const tempOrder = targetStep.step_order;
    targetStep.step_order = swapStep.step_order;
    swapStep.step_order = tempOrder;

    try {
      const response = await fetch(`/api/v1/funnels/projects/${projectId}/steps/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step_ids: sorted.map((s) => s.id)
        })
      });

      if (!response.ok) throw new Error("Failed to reorder steps");

      setProject((prev) => (prev ? { ...prev, steps: sorted } : null));
    } catch (err) {
      console.error(err);
      alert("Failed to save step reordering.");
    }
  };

  const handleApplyAICopy = () => {
    if (!hermesOutput || !activeStep) return;

    // Try to find copy matching the step_type
    const stepBlueprint = hermesOutput.funnel_structure?.steps.find(
      (s) => s.step_type === stepType || s.title.toLowerCase().includes(stepTitle.toLowerCase())
    );

    if (stepBlueprint) {
      setHeadline(stepBlueprint.headline);
      setSubheadline(stepBlueprint.subheadline);
      setBodyCopy(stepBlueprint.body_copy);
      setCtaText(stepBlueprint.cta_text);
      if (stepBlueprint.form_fields) {
        setFormFields(stepBlueprint.form_fields);
      }
      alert("AI Copy applied successfully to builder panel! Make sure to save.");
    } else {
      // General fallback
      setHeadline(hermesOutput.page_copy?.headline || "");
      setSubheadline(hermesOutput.page_copy?.subheadline || "");
      setCtaText(hermesOutput.page_copy?.cta_variants?.[0] || "Continue");
      alert("General funnel copywriting applied to page fields. Customize as needed.");
    }
  };

  const handlePublish = async () => {
    try {
      const response = await fetch(`/api/v1/funnels/projects/${projectId}/publish`, {
        method: "POST"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to publish funnel");
      }

      const data = await response.json();
      setProject((prev) => (prev ? { ...prev, status: "published" } : null));
      alert(`Funnel successfully published! Live view URL: ${window.location.origin}${data.public_url}`);
    } catch (err: any) {
      console.error("EDIT_PROJECT | Publish error:", err);
      alert(err.message || "Publish failed. Please confirm steps are non-empty.");
    }
  };

  const handleToggleFormField = (field: string) => {
    setFormFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <p>Loading Funnel Editor...</p>
      </div>
    );
  }

  const sortedSteps = project ? [...project.steps].sort((a, b) => a.step_order - b.step_order) : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-start">
      {/* Header Bar */}
      <header className="flex items-center justify-between py-4 px-6 border-b border-slate-900 bg-slate-950/80 sticky top-0 backdrop-blur-md z-45">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/funnels"
            className="p-1.5 border border-slate-800 hover:bg-slate-900 text-slate-400 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h2 className="text-sm font-bold text-slate-100">{project?.name}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-semibold">
                Slug: /f/{workspaceSlug}/{project?.slug}
              </span>
              <span className="text-[9px] px-1.5 bg-slate-900 text-indigo-400 rounded border border-slate-850 font-bold uppercase">
                {saveIndicator}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project?.status === "published" && (
            <a
              href={`/f/${workspaceSlug}/${project.slug}`}
              target="_blank"
              rel="noreferrer"
              className="py-1.5 px-3 border border-slate-850 hover:bg-slate-900 rounded-lg text-xs font-semibold text-slate-350 transition-colors cursor-pointer"
            >
              View Live Page
            </a>
          )}
          <button
            onClick={handlePublish}
            className="py-1.5 px-4 bg-indigo-650 hover:bg-indigo-650/90 text-xs font-bold text-white rounded-lg shadow-lg hover:shadow-indigo-500/10 transition-colors cursor-pointer"
          >
            Publish Funnel
          </button>
        </div>
      </header>

      {/* Editor Split Pane Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden min-h-[calc(100vh-69px)]">
        
        {/* PANEL 1: Step Navigator (Left - 3 columns) */}
        <section className="lg:col-span-3 p-5 border-r border-slate-900 overflow-y-auto bg-slate-950 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Step Sequence</h3>
                <span className="text-[10px] text-slate-550 block">Reorder or add steps.</span>
              </div>
              <button
                onClick={handleAddStep}
                className="p-1 rounded-md border border-slate-800 hover:bg-slate-900 text-indigo-400 hover:text-indigo-300 transition-all duration-300 cursor-pointer"
                title="Add New Step"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <div className="space-y-2.5">
              {sortedSteps.map((step, idx) => {
                const isActive = step.id === activeStepId;
                return (
                  <div
                    key={step.id}
                    onClick={() => {
                      setActiveStepId(step.id);
                      loadStepData(step);
                    }}
                    className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? "bg-slate-900 border-indigo-500/30 text-indigo-400"
                        : "bg-slate-900/40 border-slate-900 text-slate-400 hover:border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-slate-650 bg-slate-950 w-5 h-5 rounded-full flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-200 truncate">{step.title}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-550 tracking-wider">
                          {step.step_type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Move Up */}
                      {idx > 0 && (
                        <button
                          onClick={() => handleReorderStep(step.id, "up")}
                          className="p-0.5 hover:bg-slate-950 rounded text-slate-500 hover:text-slate-300"
                          title="Move Step Up"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      )}
                      {/* Move Down */}
                      {idx < sortedSteps.length - 1 && (
                        <button
                          onClick={() => handleReorderStep(step.id, "down")}
                          className="p-0.5 hover:bg-slate-950 rounded text-slate-500 hover:text-slate-300"
                          title="Move Step Down"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                      {/* Delete */}
                      {sortedSteps.length > 1 && (
                        <button
                          onClick={() => handleDeleteStep(step.id)}
                          className="p-0.5 hover:bg-red-950/20 rounded text-slate-600 hover:text-red-400 transition-colors"
                          title="Delete Step"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PANEL 2: Mock Puck Editor (Center - 5 columns) */}
        <section className="lg:col-span-5 p-6 border-r border-slate-900 bg-slate-950/20 overflow-y-auto flex flex-col justify-between">
          {activeStep ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Visual Page Builder</h3>
                <span className="text-[10px] text-slate-550 block">Customize component details.</span>
              </div>

              {/* Puck canvas rendering mock editor fields */}
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-850 space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Step Title
                    </label>
                    <input
                      type="text"
                      value={stepTitle}
                      onChange={(e) => setStepTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Page Headline
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Master UPSC Math Syllabus in 30 Days"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Subheadline Copy
                    </label>
                    <textarea
                      rows={2}
                      value={subheadline}
                      onChange={(e) => setSubheadline(e.target.value)}
                      placeholder="e.g. The conceptual blueprint checklist used by professionals to score above the cut-off."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Body copy text
                    </label>
                    <textarea
                      rows={4}
                      value={bodyCopy}
                      onChange={(e) => setBodyCopy(e.target.value)}
                      placeholder="e.g. Enter details below to download. We'll send links directly."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      CTA Button Label
                    </label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {stepType !== "thankyou" && (
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                        Opt-In Form Fields
                      </label>
                      <div className="flex flex-wrap gap-4 text-xs">
                        <label className="flex items-center gap-1.5 text-slate-350 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formFields.includes("email")}
                            onChange={() => handleToggleFormField("email")}
                            disabled // Email is always required
                            className="rounded border-slate-800 text-indigo-500 bg-slate-950 focus:ring-0 cursor-not-allowed"
                          />
                          <span>Email (Required)</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-slate-350 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formFields.includes("name")}
                            onChange={() => handleToggleFormField("name")}
                            className="rounded border-slate-800 text-indigo-500 bg-slate-950 focus:ring-0"
                          />
                          <span>Name</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-slate-350 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formFields.includes("phone")}
                            onChange={() => handleToggleFormField("phone")}
                            className="rounded border-slate-800 text-indigo-500 bg-slate-950 focus:ring-0"
                          />
                          <span>Phone Number</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleManualSaveStep}
                    disabled={savingStep}
                    className="py-1.5 px-4 bg-indigo-650 hover:bg-indigo-650/90 text-white font-bold text-xs rounded-lg shadow transition-colors cursor-pointer"
                  >
                    {savingStep ? "Saving step..." : "Save Step Content"}
                  </button>
                </div>
              </div>

              {/* Puck visualization canvas preview mockup */}
              <div className="border border-dashed border-slate-800 rounded-3xl p-5 bg-slate-950 text-center min-h-[160px] flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2">
                  Puck Visual Mockup Canvas
                </span>
                <p className="text-[11px] text-slate-400 font-medium max-w-sm">
                  Step rendering resolves headlines, body copy, forms, and layout tags directly from standard component JSON in frontend page views.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-slate-550 text-xs">
              <p>Add or select a step from the navigator to begin editing.</p>
            </div>
          )}
        </section>

        {/* PANEL 3: Settings & Hermes AI Outputs (Right - 4 columns) */}
        <section className="lg:col-span-4 p-5 overflow-y-auto bg-slate-950/10 flex flex-col justify-start">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4.5 h-4.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Settings & AI Assistant</h3>
          </div>

          {/* Sub Tabs */}
          <div className="flex border-b border-slate-900 mb-6 gap-1 bg-slate-950 p-1 rounded-xl">
            {(["ai", "step_settings", "funnel_settings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightPanelTab(tab)}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  rightPanelTab === tab
                    ? "bg-slate-900 border border-slate-800 text-indigo-400"
                    : "text-slate-500 hover:text-slate-350"
                }`}
              >
                {tab === "ai" ? "AI Copy" : tab === "step_settings" ? "Step Config" : "Funnel Config"}
              </button>
            ))}
          </div>

          {/* TAB 1: AI COPY */}
          {rightPanelTab === "ai" && (
            <div className="space-y-5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Copywriting Assets</span>
                {hermesOutput && activeStep && (
                  <button
                    onClick={handleApplyAICopy}
                    className="py-1 px-2.5 bg-indigo-950 border border-indigo-500/20 text-indigo-400 rounded text-[9px] font-bold uppercase hover:bg-indigo-900 transition-colors"
                  >
                    Apply to Builder
                  </button>
                )}
              </div>

              {loadingHermes ? (
                <p className="text-xs text-slate-500 py-4 italic">Fetching Hermes outputs...</p>
              ) : !hermesOutput ? (
                <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-850 text-center">
                  <p className="text-xs text-slate-500">No copy generated yet. Finish the creation questions to generate copy blueprints.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Research */}
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-2">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">Market Objection Check</span>
                    <ul className="text-xs text-slate-300 space-y-1 font-medium list-disc list-inside">
                      {hermesOutput.research_summary.top_objections.map((o, idx) => (
                        <li key={idx}>{o}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Sequences */}
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-3">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">Campaign Sequences (Email)</span>
                    <div className="space-y-2">
                      {hermesOutput.followup_sequences.email.slice(0, 3).map((e, idx) => (
                        <div key={idx} className="p-2 bg-slate-950 rounded border border-slate-850/80 text-[11px]">
                          <span className="font-bold text-slate-300 block mb-0.5">{e.subject}</span>
                          <p className="text-slate-500 line-clamp-2 leading-snug">{e.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Buzzwords */}
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-2">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">Niche Keywords</span>
                    <div className="flex flex-wrap gap-1">
                      {hermesOutput.research_summary.buzzwords.map((b, idx) => (
                        <span key={idx} className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-350">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STEP SETTINGS */}
          {rightPanelTab === "step_settings" && (
            <div className="space-y-5">
              {activeStep ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Step Page Type
                    </label>
                    <select
                      value={stepType}
                      onChange={(e) => setStepType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                    >
                      <option value="optin">Opt-In Page</option>
                      <option value="sales">Sales Page</option>
                      <option value="video">Video VSL Page</option>
                      <option value="thankyou">Thank You Page</option>
                      <option value="upsell">Upsell Page</option>
                      <option value="downsell">Downsell Page</option>
                      <option value="bridge">Bridge Page</option>
                      <option value="webinar_reg">Webinar Registration</option>
                      <option value="application">Application Form</option>
                      <option value="countdown">Countdown Promo</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={showProgressBar}
                      onChange={(e) => setShowProgressBar(e.target.checked)}
                      className="rounded border-slate-800 text-indigo-500 bg-slate-950 focus:ring-0"
                    />
                    <span>Show Progress Bar on Page</span>
                  </label>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Skip Button Redirect URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={redirectOnSkip}
                      onChange={(e) => setRedirectOnSkip(e.target.value)}
                      placeholder="e.g. /f/workspace/sales-alternative"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="pt-2 text-[10px] text-slate-500 leading-normal border-t border-slate-850">
                    <p>Step configurations apply directly to visitors inside the funnel sequence pipeline.</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">Please select a step to view step settings.</p>
              )}
            </div>
          )}

          {/* TAB 3: FUNNEL SETTINGS */}
          {rightPanelTab === "funnel_settings" && (
            <form onSubmit={handleSaveProjectSettings} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Funnel Name
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Funnel Goal
                </label>
                <select
                  value={projectGoal}
                  onChange={(e) => setProjectGoal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                >
                  <option value="collect_leads">Collect Leads</option>
                  <option value="sell_product">Sell Product or Service</option>
                  <option value="book_call">Book Call</option>
                  <option value="register_webinar">Register Webinar</option>
                  <option value="build_waitlist">Build Waitlist</option>
                  <option value="download_resource">Download Resource</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Thank You Page Redirect URL
                </label>
                <input
                  type="text"
                  value={thankYouRedirect}
                  onChange={(e) => setThankYouRedirect(e.target.value)}
                  placeholder="e.g. https://mybrand.com/special-onboarding"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[9px] text-slate-500 mt-1 block">
                  Redirects users instantly on final step completion instead of showing standard thank you block.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProject}
                  className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700/80 text-white font-bold text-xs rounded-lg shadow transition-colors cursor-pointer"
                >
                  {savingProject ? "Updating settings..." : "Save Funnel Settings"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
