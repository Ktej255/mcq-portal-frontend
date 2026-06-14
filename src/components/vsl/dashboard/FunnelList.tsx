"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Funnel {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  created_at: string;
  video_url: string | null;
  transcription_status: "pending" | "processing" | "completed" | "failed";
  session_count?: number;
  lead_count?: number;
}

interface FunnelListProps {
  funnels: Funnel[];
  workspaceSlug: string;
  workspaceId: string;
}

export function FunnelList({ funnels, workspaceSlug, workspaceId }: FunnelListProps) {
  const router = useRouter();

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/vsl/${workspaceSlug}/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("Link copied to clipboard!");
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Video Sales Letters (VSL)
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Create and manage interactive AI-guided video sales funnels.
            </p>
          </div>
          <Link
            href="/dashboard/vsl/new"
            className="inline-flex items-center justify-center py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
          >
            Create New VSL
          </Link>
        </div>

        {/* Funnels Grid */}
        {funnels.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md min-h-[300px]">
            <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-200 mb-1">No funnels created yet</h3>
            <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed mb-6">
              Create your first interactive VSL funnel to start engaging your leads with AI.
            </p>
            <Link
              href="/dashboard/vsl/new"
              className="py-2 px-4 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {funnels.map((funnel) => {
              const sessionCount = funnel.session_count || 0;
              const leadCount = funnel.lead_count || 0;
              const conversionRate = sessionCount > 0 ? ((leadCount / sessionCount) * 100).toFixed(1) : "0.0";

              return (
                <div
                  key={funnel.id}
                  className="flex flex-col justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-850 hover:border-slate-750 transition-all shadow-md backdrop-blur-sm relative group"
                >
                  <div>
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`py-0.5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          funnel.status === "published"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : funnel.status === "archived"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-slate-950 text-slate-400 border border-slate-800"
                        }`}
                      >
                        {funnel.status}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {new Date(funnel.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-100 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                      {funnel.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5 mb-4">
                      /{funnel.slug}
                    </p>

                    {/* Basic Stats */}
                    <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-slate-950/60 border border-slate-900 mb-4 text-center">
                      <div>
                        <span className="block text-xs text-slate-500 font-semibold">Views</span>
                        <span className="text-sm font-bold text-slate-200">{sessionCount}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500 font-semibold">Leads</span>
                        <span className="text-sm font-bold text-slate-200">{leadCount}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500 font-semibold">Conv. Rate</span>
                        <span className="text-sm font-bold text-slate-200">{conversionRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                    <Link
                      href={`/dashboard/vsl/${funnel.id}/edit`}
                      className="flex-1 py-1.5 px-3 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold text-center rounded-lg transition-colors cursor-pointer"
                    >
                      Edit Funnel
                    </Link>

                    {funnel.status === "published" && (
                      <>
                        <a
                          href={`/vsl/${workspaceSlug}/${funnel.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-lg transition-colors cursor-pointer"
                          title="View Live"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <button
                          onClick={() => handleCopyLink(funnel.slug)}
                          className="p-1.5 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-lg transition-colors cursor-pointer"
                          title="Copy Link"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
