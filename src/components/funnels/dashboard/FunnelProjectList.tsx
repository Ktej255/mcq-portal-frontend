"use client";

import React, { useState } from "react";
import Link from "next/link";

export interface DashboardProjectItem {
  id: string;
  name: string;
  slug: string;
  funnel_type: string;
  status: string;
  created_at: string;
  step_count: number;
  lead_count: number;
  conversion_rate: number;
}

interface FunnelProjectListProps {
  projects: DashboardProjectItem[];
  workspaceSlug: string;
  workspaceId: string;
}

export default function FunnelProjectList({
  projects: initialProjects,
  workspaceSlug
}: FunnelProjectListProps) {
  const [projects, setProjects] = useState<DashboardProjectItem[]>(initialProjects);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDuplicate = async (projectId: string) => {
    setLoadingId(projectId);
    try {
      const res = await fetch(`/api/v1/funnels/projects/${projectId}/duplicate`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Duplication failed");
      const data = await res.json();
      
      // Calculate derived metrics
      const newProj: DashboardProjectItem = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        funnel_type: data.funnel_type,
        status: data.status,
        created_at: data.created_at,
        step_count: data.steps?.length || 0,
        lead_count: 0,
        conversion_rate: 0
      };

      setProjects((prev) => [newProj, ...prev]);
      alert("Funnel duplicated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to duplicate funnel project.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleArchive = async (projectId: string) => {
    if (!confirm("Are you sure you want to archive this funnel? It will no longer be public.")) return;
    setLoadingId(projectId);
    try {
      const res = await fetch(`/api/v1/funnels/projects/${projectId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Archiving failed");
      
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      alert("Funnel archived successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to archive funnel project.");
    } finally {
      setLoadingId(null);
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "webinar": return "from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "optin": return "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30";
      case "sales": return "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30";
      case "application": return "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30";
      case "challenge": return "from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30";
      case "vsl": return "from-indigo-500/20 to-violet-500/20 text-indigo-400 border-indigo-500/30";
      default: return "from-slate-500/20 to-zinc-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Dashboard Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Funnels & Landing Pages
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Build, optimize, and launch multi-step visual marketing funnels.
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/dashboard/funnels/new"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-slate-100 text-sm font-bold shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Funnel</span>
            </Link>
          </div>
        </div>

        {/* List of projects */}
        {projects.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-800/80 rounded-3xl backdrop-blur-md">
            <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-300">No Funnels Built Yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Hermes AI does the heavy lifting. Create your first funnel and watch your leads grow.
            </p>
            <Link
              href="/dashboard/funnels/new"
              className="mt-6 inline-block px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-indigo-400 hover:bg-slate-800/50 hover:text-indigo-300 transition-all duration-300"
            >
              Get Started with Hermes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-slate-700/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/[0.02]"
              >
                <div>
                  {/* Title & Badges */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] uppercase font-bold tracking-wider bg-gradient-to-r ${getTypeBadgeColor(project.funnel_type)}`}>
                      {project.funnel_type}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      project.status === "published"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {project.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-200 line-clamp-1 mb-6">
                    {project.name}
                  </h3>

                  {/* Core Metrics */}
                  <div className="grid grid-cols-3 gap-4 p-3 rounded-xl bg-slate-950/60 border border-slate-850/80 mb-6 text-center">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Steps</span>
                      <span className="text-sm font-extrabold text-slate-300">{project.step_count}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Leads</span>
                      <span className="text-sm font-extrabold text-slate-300">{project.lead_count}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Conv. %</span>
                      <span className="text-sm font-extrabold text-indigo-400">{project.conversion_rate}%</span>
                    </div>
                  </div>
                </div>

                {/* Operations Buttons */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-850">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/dashboard/funnels/${project.id}/edit`}
                      className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-bold transition-all duration-300 text-center flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </Link>

                    {project.status === "published" ? (
                      <a
                        href={`/f/${workspaceSlug}/${project.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/20 text-indigo-400 text-xs font-bold transition-all duration-300 text-center flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>Live View</span>
                      </a>
                    ) : (
                      <button
                        disabled
                        className="py-2 px-3 rounded-lg bg-slate-900 border border-slate-850 text-slate-600 text-xs font-bold cursor-not-allowed text-center"
                      >
                        Not Live
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDuplicate(project.id)}
                      disabled={loadingId === project.id}
                      className="py-1.5 px-3 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-350 text-[10px] font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                      <span>Clone</span>
                    </button>

                    <button
                      onClick={() => handleArchive(project.id)}
                      disabled={loadingId === project.id}
                      className="py-1.5 px-3 rounded-lg bg-slate-950 hover:bg-red-950/25 border border-slate-850 hover:border-red-500/20 text-slate-500 hover:text-red-400 text-[10px] font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Archive</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
