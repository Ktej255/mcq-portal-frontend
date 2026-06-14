"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HermesOutput } from "@/lib/vsl/hermes/types";
import { useAuth } from "@/lib/contexts/AuthContext";

interface Page {
  id: string;
  page_type: "vsl" | "thankyou" | "upsell";
  page_order: number;
  content: any;
}

interface FunnelData {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  video_url: string | null;
  transcription_status: "pending" | "processing" | "completed" | "failed";
  video_transcript: string | null;
  ai_trigger_threshold: number;
  hermes_job_id: string | null;
  pages: Page[];
}

export default function EditFunnelPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: funnelId } = use(params);
  const { getToken } = useAuth();

  // Helper function for making authenticated fetch calls to backend APIs
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(url, {
      ...options,
      headers,
    });
  };

  // States
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"script" | "research" | "followup" | "video">("script");
  const [workspaceSlug, setWorkspaceSlug] = useState("my-workspace");

  // Input states for settings
  const [title, setTitle] = useState("");
  const [aiThreshold, setAiThreshold] = useState(80);
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [savingSettings, setSavingSettings] = useState(false);

  // Video Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Hermes Output State
  const [hermesOutput, setHermesOutput] = useState<HermesOutput | null>(null);
  const [loadingHermes, setLoadingHermes] = useState(false);

  // Fetch funnel details on mount
  useEffect(() => {
    authFetch(`/api/v1/vsl/funnels/${funnelId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Funnel not found");
        return res.json();
      })
      .then((data) => {
        setFunnel(data);
        setTitle(data.title);
        setAiThreshold(data.ai_trigger_threshold);
        setStatus(data.status);

        // Fetch workspace details for slug
        authFetch(`/api/v1/workspaces/${data.workspace_id}`)
          .then((r) => r.json())
          .then((ws) => setWorkspaceSlug(ws.slug || "my-workspace"))
          .catch(() => {});

        // Fetch Hermes output if linked
        if (data.hermes_job_id) {
          setLoadingHermes(true);
          authFetch(`/api/v1/vsl/hermes/output?job_id=${data.hermes_job_id}`)
            .then((r) => r.json())
            .then((outputData) => setHermesOutput(outputData.output))
            .catch((err) => console.warn("HERMES_OUTPUT | Fetch error:", err))
            .finally(() => setLoadingHermes(false));
        }
      })
      .catch((err) => {
        console.error("EDIT_FUNNEL | Fetch error:", err);
        alert("Failed to load funnel details.");
        router.push("/dashboard/vsl");
      })
      .finally(() => setLoading(false));
  }, [funnelId]);

  // Poll transcript status if processing
  useEffect(() => {
    if (!funnel || funnel.transcription_status !== "processing") return;

    const interval = setInterval(() => {
      authFetch(`/api/v1/vsl/funnels/${funnelId}/video/transcript`)
        .then((res) => res.json())
        .then((data) => {
          if (data.transcription_status !== "processing") {
            setFunnel((prev) => prev ? {
              ...prev,
              transcription_status: data.transcription_status,
              video_transcript: data.transcript
            } : null);
            clearInterval(interval);
          }
        })
        .catch((err) => console.error("EDIT_FUNNEL | Poll transcript error:", err));
    }, 4000);

    return () => clearInterval(interval);
  }, [funnel?.transcription_status]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funnel || savingSettings) return;

    setSavingSettings(true);
    try {
      const response = await authFetch(`/api/v1/vsl/funnels/${funnelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          ai_trigger_threshold: aiThreshold,
          status,
        }),
      });

      if (!response.ok) throw new Error("Failed to update settings");
      const updated = await response.json();
      setFunnel((prev) => prev ? { ...prev, ...updated } : null);
      alert("Funnel settings updated!");
    } catch (err) {
      console.error("EDIT_FUNNEL | Save error:", err);
      alert("Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || uploading) return;

    setUploading(true);
    setUploadProgress(10);
    try {
      // 1. Fetch signed upload URL
      const signedRes = await authFetch(`/api/v1/vsl/funnels/${funnelId}/video/upload-url`, {
        method: "POST",
      });
      if (!signedRes.ok) throw new Error("Failed to generate signed upload URL");
      const { upload_url, path } = await signedRes.json();
      setUploadProgress(30);

      // 2. PUT file directly to Storage (Direct storage upload doesn't need API auth)
      const putRes = await fetch(upload_url, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type },
      });
      if (!putRes.ok) throw new Error("Failed to upload file to Storage");
      setUploadProgress(70);

      // 3. Confirm upload
      const confirmRes = await authFetch(`/api/v1/vsl/funnels/${funnelId}/video/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!confirmRes.ok) throw new Error("Failed to confirm upload");
      const confirmData = await confirmRes.json();
      setUploadProgress(100);

      setFunnel((prev) => prev ? {
        ...prev,
        video_url: confirmData.video_url,
        transcription_status: "processing"
      } : null);

      setSelectedFile(null);
      alert("Video uploaded! Transcription process initiated.");
    } catch (err) {
      console.error("EDIT_FUNNEL | Upload error:", err);
      alert("Video upload failed.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePublish = async () => {
    try {
      const response = await authFetch(`/api/v1/vsl/funnels/${funnelId}/publish`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Publish failed");
      const data = await response.json();
      
      setFunnel((prev) => prev ? { ...prev, status: "published" } : null);
      setStatus("published");
      alert(`VSL Funnel published! View at ${window.location.origin}${data.public_url}`);
    } catch (err) {
      console.error("EDIT_FUNNEL | Publish error:", err);
      alert("Publish failed. Make sure pages are created.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <p>Loading VSL Editor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-start">
      {/* Top Navigation / Action Bar */}
      <header className="flex items-center justify-between py-4 px-6 border-b border-slate-900 bg-slate-950/80 sticky top-0 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/vsl"
            className="p-1.5 border border-slate-800 hover:bg-slate-900 text-slate-400 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h2 className="text-sm font-bold text-slate-100">{title}</h2>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              VSL Funnel Workspace ID: {funnelId.substring(0, 8)}...
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {funnel?.status === "published" && (
            <a
              href={`/vsl/${workspaceSlug}/${funnel.slug}`}
              target="_blank"
              rel="noreferrer"
              className="py-1.5 px-3 border border-slate-800 hover:bg-slate-900 rounded-lg text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              View Live Page
            </a>
          )}
          <button
            onClick={handlePublish}
            className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-lg shadow-lg shadow-indigo-600/10 transition-colors cursor-pointer"
          >
            Publish Funnel
          </button>
        </div>
      </header>

      {/* Workspace Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Pane (7 cols): Mock Puck Page Builder Workspace */}
        <section className="lg:col-span-7 p-6 border-r border-slate-900 overflow-y-auto flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-200">Builder Workspace</h3>
              <p className="text-xs text-slate-400 mt-1">Configure layout components and core metadata.</p>
            </div>

            {/* Config Form */}
            <form onSubmit={handleSaveSettings} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-850 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-850 pb-2">Funnel Settings</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Internal Name</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Trigger Threshold (%)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={aiThreshold}
                    onChange={(e) => setAiThreshold(Number(e.target.value))}
                    className="w-full py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="py-1.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  {savingSettings ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>

            {/* Builder visual preview canvas */}
            <div className="p-6 border border-dashed border-slate-800 rounded-3xl bg-slate-950 flex flex-col items-center justify-center text-center min-h-[260px]">
              <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h4 className="text-xs font-semibold text-slate-300">Puck Visual Canvas Interface</h4>
              <p className="text-[11px] text-slate-500 max-w-[280px] mt-1 leading-normal mb-4">
                Puck canvas rendering is integrated on the front-end code template files.
              </p>
              <span className="text-[10px] py-1 px-3 bg-slate-900 border border-slate-800 rounded-full text-indigo-400 font-bold uppercase tracking-wider">
                Integrated Component
              </span>
            </div>
          </div>

          {/* Video upload footer */}
          <div className="pt-6 border-t border-slate-900/60 mt-8 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">VSL Presentation Video</h4>
            
            {funnel?.video_url ? (
              <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-200">Video Uploaded</span>
                    <a
                      href={funnel.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-indigo-400 hover:underline line-clamp-1 max-w-[250px]"
                    >
                      {funnel.video_url}
                    </a>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase">Whisper Transcript</span>
                  <span className={`text-[10px] font-bold uppercase ${funnel.transcription_status === "completed" ? "text-emerald-400" : funnel.transcription_status === "failed" ? "text-rose-400" : "text-amber-400 animate-pulse"}`}>
                    {funnel.transcription_status}
                  </span>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleVideoUpload} className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-slate-300 file:hover:bg-slate-850 file:cursor-pointer"
              />
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="w-full sm:w-auto py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
              >
                {uploading ? `Uploading (${uploadProgress}%)` : "Upload Video"}
              </button>
            </form>
          </div>
        </section>

        {/* Right Pane (5 cols): Hermes AI Coprocessor Output panel */}
        <section className="lg:col-span-5 p-6 overflow-y-auto flex flex-col justify-start">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Hermes AI Coprocessor
            </h3>
            {loadingHermes && <span className="text-[10px] text-slate-500 animate-pulse font-semibold">Syncing output...</span>}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-900 mb-6 gap-1 bg-slate-950/40 p-1 rounded-xl">
            {(["script", "research", "followup", "video"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "bg-slate-900 border border-slate-800 text-indigo-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          {loadingHermes ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500 text-xs">
              <p>Analyzing AI blueprint generation logs...</p>
            </div>
          ) : !hermesOutput ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-slate-850 bg-slate-900/20">
              <p className="text-xs text-slate-400">No Hermes AI generation data linked yet.</p>
              <Link
                href="/dashboard/vsl/new"
                className="mt-4 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white rounded-lg transition-colors cursor-pointer"
              >
                Trigger Questionnaire
              </Link>
            </div>
          ) : (
            <div className="flex-1 space-y-6">
              {/* Tab 1: VSL Copywriting Script */}
              {activeTab === "script" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">90-Second VSL Script</h4>
                    <span className="text-[10px] text-slate-500 font-semibold block mb-4">Total duration: 90 seconds (Target)</span>
                  </div>

                  {Object.entries(hermesOutput.vsl_script)
                    .filter(([key]) => key !== "total_seconds")
                    .map(([section, text]) => (
                      <div key={section} className="p-4 rounded-xl bg-slate-900/40 border border-slate-850">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1.5">
                          {section}
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">{text as string}</p>
                      </div>
                    ))}
                </div>
              )}

              {/* Tab 2: Market Research Details */}
              {activeTab === "research" && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                      Market Insight
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {hermesOutput.research_summary.market_insight}
                    </p>
                  </div>

                  {/* Tag Cloud for Buzzwords */}
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-3">
                      High-Yield Niche Buzzwords
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {hermesOutput.research_summary.buzzwords.map((w, idx) => (
                        <span key={idx} className="py-1 px-2.5 bg-slate-950 border border-slate-850 rounded-lg text-[10px] text-slate-300 font-semibold font-mono">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Objection List */}
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-3">
                      Top Customer Objections
                    </span>
                    <ul className="space-y-2 text-xs text-slate-300 font-semibold list-disc list-inside">
                      {hermesOutput.research_summary.top_objections.map((o, idx) => (
                        <li key={idx}>{o}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Resonating Proofs */}
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-3">
                      Resonating Proof Types
                    </span>
                    <ul className="space-y-2 text-xs text-slate-300 font-semibold list-disc list-inside">
                      {hermesOutput.research_summary.proof_types.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 3: Staggered Follow-up sequences preview */}
              {activeTab === "followup" && (
                <div className="space-y-5">
                  {/* Email */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Email Staggered Campaign</h4>
                    <div className="space-y-3">
                      {hermesOutput.followup_sequences.email.map((em, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-900/30 border border-slate-850">
                          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 mb-1">
                            <span>Email #{idx + 1}</span>
                            <span>Send: T+{em.send_after_hours} Hrs</span>
                          </div>
                          <span className="block text-xs font-bold text-slate-200 mb-1">{em.subject}</span>
                          <p className="text-[11px] text-slate-400 line-clamp-2">{em.body || em.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">WhatsApp Messages</h4>
                    <div className="space-y-3">
                      {hermesOutput.followup_sequences.whatsapp.map((wa, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-900/30 border border-slate-850">
                          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 mb-1">
                            <span>Message #{idx + 1}</span>
                            <span>Send: T+{wa.send_after_hours} Hrs</span>
                          </div>
                          <p className="text-[11px] text-slate-300 font-semibold leading-relaxed line-clamp-2">
                            {wa.message || wa.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Live Transcript Panel */}
              {activeTab === "video" && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-2">
                      Whisper Transcription
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium max-h-[300px] overflow-y-auto pr-1">
                      {funnel?.video_transcript || "Transcript will populate automatically once the Whisper processing finishes."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
