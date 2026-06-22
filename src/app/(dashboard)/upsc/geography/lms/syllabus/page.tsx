"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { SyllabusNodeOut } from "@/services/api/gsLmsService";
import { SyllabusTree } from "@/components/gs-lms/SyllabusTree";
import { LmsLoadingSkeleton } from "@/components/gs-lms/LmsLoadingSkeleton";
import { LmsEmptyState } from "@/components/gs-lms/LmsEmptyState";

export default function SyllabusPage() {
  const router = useRouter();
  const [tree, setTree] = useState<SyllabusNodeOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gsLmsService
      .getSyllabusTree()
      .then((data) => setTree(data.tree))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load syllabus")
      )
      .finally(() => setLoading(false));
  }, []);

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
      <h1 className="text-xl font-semibold text-[#1a3a2a] mb-6">Geography Syllabus</h1>
      <SyllabusTree tree={tree} onLeafClick={handleLeafClick} />
    </div>
  );
}
