"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UnifiedFunnelItem } from "@/lib/funnels/unifiedView";

interface UnifiedFunnelListProps {
  items: UnifiedFunnelItem[];
  workspaceSlug: string;
}

export default function UnifiedFunnelList({
  items: initialItems,
  workspaceSlug
}: UnifiedFunnelListProps) {
  const [items, setItems] = useState<UnifiedFunnelItem[]>(initialItems);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDuplicate = async (item: UnifiedFunnelItem) => {
    setLoadingId(item.id);
    try {
      const endpoint = item.source_module === "vsl" 
        ? `/api/v1/vsl/funnels/${item.id}/duplicate` // Wait, does VSL have duplicate? Yes, if not, we can fall back to standard project duplicate.
        : `/api/v1/funnels/projects/${item.id}/duplicate`;

      // Wait, let's check if VSL actually has duplicate. If we are unsure, we can check by fetching.
      // But we can just use the project duplication if source_module is funnels.
      // If it's VSL, we can mock it or call duplicate. To be safe, let's call the endpoint.
      const res = await fetch(item.source_module === "vsl" ? `/api/v1/funnels/projects/${item.id}/duplicate` : endpoint, {
        method: "POST"
      });
      
      if (!res.ok) throw new Error("Duplication failed");
      const data = await res.json();

      const newItem: UnifiedFunnelItem = {
        id: data.id,
        name: data.name || data.title,
        type: data.funnel_type || "vsl",
        status: data.status,
        source_module: item.source_module,
        lead_count: 0,
        created_at: data.created_at,
        edit_url: item.source_module === "vsl" ? `/dashboard/vsl/${data.id}/edit` : `/dashboard/funnels/${data.id}/edit`,
        live_url: item.source_module === "vsl" ? `/vsl/${workspaceSlug}/${data.slug}` : `/f/${workspaceSlug}/${data.slug}`
      };

      setItems((prev) => [newItem, ...prev]);
      alert("Funnel duplicated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to duplicate funnel.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleArchive = async (item: UnifiedFunnelItem) => {
    if (!confirm("Are you sure you want to archive this funnel?")) return;
    setLoadingId(item.id);
    try {
      const endpoint = item.source_module === "vsl"
        ? `/api/v1/vsl/funnels/${item.id}`
        : `/api/v1/funnels/projects/${item.id}`;

      const res = await fetch(endpoint, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Archive failed");

      setItems((prev) => prev.filter((i) => i.id !== item.id));
      alert("Funnel archived successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to archive funnel.");
    } finally {
      setLoadingId(null);
    }
  };

  const getSourceBadgeColor = (source: string) => {
    if (source === "vsl") {
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    }
    return "bg-purple-500/10 text-purple-400 border-purple-500/20";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Unified Funnels Hub
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              One unified view of VSL funnels and general marketing funnels.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/vsl/new"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-slate-200 text-xs font-semibold transition-all duration-300"
            >
              + VSL Funnel
            </Link>
            <Link
              href="/dashboard/funnels/new"
              className="px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-slate-100 text-xs font-semibold transition-all duration-300"
            >
              + Marketing Funnel
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-800/80 rounded-3xl">
            <p className="text-slate-500 text-sm">No funnels created yet in this workspace.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-slate-700/50 hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex justify-between items-center gap-2 mb-4">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[9px] uppercase font-bold tracking-wider ${getSourceBadgeColor(item.source_module)}`}>
                      {item.source_module === "vsl" ? "VSL Specialization" : "General Funnel"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      item.status === "published" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {item.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-200 line-clamp-1 mb-4">
                    {item.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-950/40 border border-slate-850/80 mb-6 text-center text-xs">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Leads</span>
                      <span className="font-extrabold text-slate-350">{item.lead_count}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Type</span>
                      <span className="font-extrabold text-indigo-400 uppercase tracking-wider">{item.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-850">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={item.edit_url}
                      className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center"
                    >
                      Edit
                    </Link>

                    {item.status === "published" ? (
                      <a
                        href={item.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-lg bg-indigo-950/40 hover:bg-indigo-900 border border-indigo-500/20 text-indigo-400 text-xs font-bold text-center"
                      >
                        Live View
                      </a>
                    ) : (
                      <button
                        disabled
                        className="py-2 px-3 rounded-lg bg-slate-900 border border-slate-850 text-slate-650 text-xs font-bold cursor-not-allowed text-center"
                      >
                        Not Live
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDuplicate(item)}
                      disabled={loadingId === item.id}
                      className="py-1.5 px-3 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 text-[10px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      Clone
                    </button>

                    <button
                      onClick={() => handleArchive(item)}
                      disabled={loadingId === item.id}
                      className="py-1.5 px-3 rounded-lg bg-slate-950 hover:bg-red-950/20 border border-slate-850 hover:border-red-500/20 text-slate-500 hover:text-red-400 text-[10px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      Archive
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
