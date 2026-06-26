"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { SyllabusNodeOut } from "@/services/api/gsLmsService";
import { SyllabusTree } from "@/components/gs-lms/SyllabusTree";
import { LmsLoadingSkeleton } from "@/components/gs-lms/LmsLoadingSkeleton";
import { LmsEmptyState } from "@/components/gs-lms/LmsEmptyState";
import { useApiConfig } from "@/lib/hooks/useApi";

export default function SyllabusPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useApiConfig();
  const [tree, setTree] = useState<SyllabusNodeOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSyllabus = useCallback(() => {
    setLoading(true);
    setError(null);
    gsLmsService
      .getSyllabusTree("geography")
      .then((data) => setTree(data.tree))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load syllabus")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetchSyllabus();
  }, [isLoaded, isSignedIn, fetchSyllabus]);

  const handleLeafClick = (nodeId: number) => {
    router.push(`/upsc/geography/lms/topic/${nodeId}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-[#1a3a2a] mb-6">Geography Syllabus</h1>
        <LmsLoadingSkeleton variant="tree" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={fetchSyllabus}
          className="mt-3 rounded-md border border-[#dcd5c7] bg-white px-4 py-2 text-xs font-bold text-[#1a3a2a] transition hover:border-[#1d9e75] hover:bg-[#e7f5ee]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-[#1a3a2a] mb-6">Geography Syllabus</h1>
        <LmsEmptyState
          title="No syllabus available"
          description="The geography syllabus hasn't been set up yet. Check back soon."
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold text-[#1a3a2a]">Geography Syllabus</h1>
        <a
          href="/upsc/geography"
          className="inline-flex items-center gap-2 rounded-md border border-[#dcd5c7] bg-white px-3 py-2 text-xs font-bold text-[#1a3a2a] transition hover:border-[#1d9e75] hover:bg-[#e7f5ee]"
        >
          ← Daily Sessions (Watch/Talk/MCQ)
        </a>
      </div>
      <SyllabusTree tree={tree} onLeafClick={handleLeafClick} />
    </div>
  );
}
