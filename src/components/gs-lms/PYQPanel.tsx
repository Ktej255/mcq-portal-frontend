"use client";

import { useState, useEffect } from "react";
import type { PyqOut } from "@/services/api/gsLmsService";
import { gsLmsService } from "@/services/api/gsLmsService";
import { PYQCard } from "./PYQCard";
import { LmsEmptyState } from "./LmsEmptyState";
import { useSubjectLms } from "./SubjectLmsContext";

interface PYQPanelProps {
  nodeId: number;
}

export function PYQPanel({ nodeId }: PYQPanelProps) {
  const [activeTab, setActiveTab] = useState<"PRELIMS" | "MAINS">("PRELIMS");
  const [pyqs, setPyqs] = useState<PyqOut[]>([]);
  const [loading, setLoading] = useState(true);
  const { subject } = useSubjectLms();

  useEffect(() => {
    setLoading(true);
    gsLmsService
      .getTopicPyqs(subject, nodeId, activeTab)
      .then((res) => setPyqs(res.pyqs))
      .catch(() => setPyqs([]))
      .finally(() => setLoading(false));
  }, [nodeId, activeTab, subject]);

  const handleReveal = async (pyqId: number) => {
    const updated = await gsLmsService.revealPyqAnswer(subject, pyqId);
    setPyqs((prev) =>
      prev.map((p) => (p.id === pyqId ? { ...p, ...updated, revealed: true } : p))
    );
  };

  const tabs: Array<{ key: "PRELIMS" | "MAINS"; label: string }> = [
    { key: "PRELIMS", label: "Prelims" },
    { key: "MAINS", label: "Mains" },
  ];

  return (
    <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-[#dcd5c7]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-[#1d9e75] border-b-2 border-[#1d9e75] bg-[#1d9e75]/5"
                : "text-[#13251d]/60 hover:text-[#13251d]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg" />
            <div className="h-24 bg-gray-200 rounded-lg" />
          </div>
        ) : pyqs.length === 0 ? (
          <LmsEmptyState
            title="No PYQs available"
            description={`No ${activeTab.toLowerCase()} questions found for this topic yet.`}
          />
        ) : (
          <div className="space-y-3">
            {pyqs.map((pyq) => (
              <PYQCard key={pyq.id} pyq={pyq} onReveal={handleReveal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
