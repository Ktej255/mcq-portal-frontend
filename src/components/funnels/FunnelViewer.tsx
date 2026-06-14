"use client";

import React, { useEffect, useState } from "react";
import { FunnelProjectRow, FunnelStepRow } from "@/lib/funnels/routing";
import FunnelStepRenderer from "./FunnelStepRenderer";
import FunnelProgressBar from "./FunnelProgressBar";

interface FunnelViewerProps {
  project: FunnelProjectRow;
  steps: FunnelStepRow[];
  workspaceSlug: string;
  initialStepOrder?: number;
}

export default function FunnelViewer({
  project,
  steps,
  workspaceSlug,
  initialStepOrder = 0
}: FunnelViewerProps) {
  const [currentStepOrder, setCurrentStepOrder] = useState<number>(initialStepOrder);
  const [visitorToken, setVisitorToken] = useState<string>("");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  // 1. Initialize visitor token on mount
  useEffect(() => {
    let token = sessionStorage.getItem("sarit_funnels_visitor_token");
    if (!token) {
      token = `visitor-${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem("sarit_funnels_visitor_token", token);
    }
    setVisitorToken(token);
  }, []);

  // Find the step corresponding to the current order
  const currentStep = steps.find((s) => s.step_order === currentStepOrder) || steps[0];

  // 2. Track page_view event when step or visitorToken changes
  useEffect(() => {
    if (!visitorToken || !currentStep) return;

    fetch("/api/v1/funnels/public/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: project.id,
        step_id: currentStep.id,
        visitor_token: visitorToken
      })
    }).catch((err) => {
      console.error("FunnelViewer | Error tracking page view:", err);
    });
  }, [currentStepOrder, visitorToken, currentStep?.id, project.id]);

  const handleStepComplete = async (fieldData: any) => {
    if (!currentStep) return;

    try {
      const response = await fetch("/api/v1/funnels/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: project.id,
          step_id: currentStep.id,
          visitor_token: visitorToken,
          field_data: fieldData,
          email: fieldData.email,
          phone: fieldData.phone,
          name: fieldData.name
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.message || "Failed to submit form data");
      }

      const result = await response.json();
      setCompletedSteps((prev) => [...prev, currentStep.id]);

      // If it is the final step
      if (result.is_final_step) {
        // Check if a redirection setting is configured
        const thankYouRedirect = project.settings?.thank_you_redirect_url || project.settings?.redirect_url_on_skip;
        if (thankYouRedirect) {
          window.location.href = thankYouRedirect;
        } else {
          setFinished(true);
        }
      } else if (result.next_step) {
        const nextOrder = result.next_step.step_order;
        setCurrentStepOrder(nextOrder);

        // Update URL path without full reload
        const newUrl = `/f/${workspaceSlug}/${project.slug}/${nextOrder}`;
        window.history.pushState(null, "", newUrl);
      } else {
        // Safe fallback
        setFinished(true);
      }
    } catch (error) {
      console.error("FunnelViewer | Error submitting step:", error);
      throw error;
    }
  };

  if (finished) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4">
        {/* Glow */}
        <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 text-center backdrop-blur-md shadow-2xl relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 mb-2">Thank You!</h1>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Your submission has been received successfully. We appreciate your time!
          </p>
          {project.settings?.thank_you_redirect_url && (
            <a
              href={project.settings.thank_you_redirect_url}
              className="inline-block w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-sm font-semibold transition-all duration-300 shadow-lg"
            >
              Continue
            </a>
          )}
        </div>
      </main>
    );
  }

  if (!currentStep) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 text-indigo-500" />
      </div>
    );
  }

  const showProgress = steps.length > 1 && project.settings?.show_progress_bar !== false;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center relative overflow-hidden px-4 py-12">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full flex flex-col justify-center flex-1 z-10">
        {/* Progress bar */}
        {showProgress && (
          <FunnelProgressBar
            totalSteps={steps.length}
            currentStep={currentStepOrder}
          />
        )}

        {/* Current Step Renderer */}
        <FunnelStepRenderer
          step={currentStep}
          onComplete={handleStepComplete}
        />
      </div>
    </main>
  );
}
