"use client";

import React, { useEffect, useState } from "react";
import { VSLPlayer } from "./VSLPlayer";
import { AIChat } from "./AIChat";

interface VSLPageProps {
  funnelId: string;
  videoUrl: string;
  triggerThreshold: number;
  aiStarters: string[];
  title: string;
  headline: string;
  subheadline: string;
}

export function VSLPage({
  funnelId,
  videoUrl,
  triggerThreshold,
  aiStarters,
  title,
  headline,
  subheadline,
}: VSLPageProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [aiTriggered, setAiTriggered] = useState(false);
  const [watchPercentage, setWatchPercentage] = useState(0);

  // Initialize session on mount
  useEffect(() => {
    // Generate a random visitor token
    let visitorToken = localStorage.getItem("sarit_vsl_visitor_token");
    if (!visitorToken) {
      visitorToken = `visitor-${Math.random().toString(36).substring(2, 12)}`;
      localStorage.setItem("sarit_vsl_visitor_token", visitorToken);
    }

    fetch("/api/v1/vsl/public/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funnel_id: funnelId, visitor_token: visitorToken }),
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to create session");
      })
      .then((data) => {
        setSessionId(data.session_id);
      })
      .catch((err) => console.error("VSL_PAGE | Session init error:", err));
  }, [funnelId]);

  const handleWatchUpdate = (pct: number) => {
    setWatchPercentage(pct);
  };

  const handleAiTrigger = () => {
    setAiTriggered(true);
  };

  const handleLeadCapture = (leadId: string) => {
    console.info("VSL_PAGE | Lead successfully registered:", leadId);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-start">
      {/* Background Gradient */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-4 py-12 flex-1 flex flex-col justify-center">
        {/* Header Branding */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-indigo-400">
            <span>Powered by Sarit VSL Module</span>
          </div>
        </div>

        {/* Headlines */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-slate-200 bg-clip-text text-transparent mb-4">
            {headline}
          </h1>
          <p className="text-lg text-slate-400 font-medium">
            {subheadline}
          </p>
        </div>

        {/* Split Player / Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Left Panel: Video Player (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col justify-center">
            <VSLPlayer
              videoUrl={videoUrl}
              funnelId={funnelId}
              triggerThreshold={triggerThreshold}
              sessionId={sessionId}
              onWatchUpdate={handleWatchUpdate}
              onAiTrigger={handleAiTrigger}
            />
            {/* Disclaimer or small text under player */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
              <span>Seek bar disabled to ensure complete conceptual transfer</span>
              <span>Watch to {triggerThreshold}% to unlock Q&A</span>
            </div>
          </div>

          {/* Right Panel: AI Chat Widget (1/3 width) */}
          <div className="lg:col-span-1 min-h-[450px] lg:min-h-0 relative">
            {aiTriggered && sessionId ? (
              <div className="h-full animate-in slide-in-from-right fade-in duration-500">
                <AIChat
                  sessionId={sessionId}
                  starters={aiStarters}
                  onLeadCapture={handleLeadCapture}
                />
              </div>
            ) : (
              /* Beautiful glassmorphic placeholder prior to trigger */
              <div className="h-full min-h-[350px] flex flex-col items-center justify-center p-6 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md">
                <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-slate-400 mb-4 animate-pulse">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">AI Consultation Engine</h3>
                <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed mb-4">
                  The AI conversation assistant will activate automatically at <span className="font-semibold text-indigo-400">{triggerThreshold}%</span> watch progress.
                </p>
                {/* Visual Progress ring / bar */}
                <div className="w-full max-w-[200px] h-1.5 bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((watchPercentage / triggerThreshold) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">
                  {Math.round(watchPercentage)}% Watched
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
