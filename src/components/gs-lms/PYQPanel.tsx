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
  const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null);
  const [failedRequestKey, setFailedRequestKey] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { subject } = useSubjectLms();
  const requestKey = `${subject}:${nodeId}:${activeTab}`;
  const loading = loadedRequestKey !== requestKey;
  // Failure is recorded against the request that failed, so switching tab or
  // topic can never show the previous request's error, and no state has to be
  // reset when this effect starts.
  const fetchError = failedRequestKey === requestKey;

  useEffect(() => {
    let cancelled = false;

    gsLmsService
      .getTopicPyqs(subject, nodeId, activeTab)
      .then((res) => {
        if (cancelled) return;
        setPyqs(res.pyqs);
      })
      .catch(() => {
        if (!cancelled) setFailedRequestKey(requestKey);
      })
      .finally(() => {
        if (!cancelled) setLoadedRequestKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [nodeId, activeTab, subject, requestKey, retryCount]);

  const handleRetry = () => {
    setFailedRequestKey(null);
    setLoadedRequestKey(null);
    setRetryCount((count) => count + 1);
  };

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
        ) : fetchError ? (
          <LmsEmptyState
            title={`${activeTab === "PRELIMS" ? "Prelims" : "Mains"} PYQs unavailable`}
            description={`We couldn't load ${activeTab.toLowerCase()} questions for ${subject} topic ${nodeId}. Please try again.`}
            action={{ label: "Retry", onClick: handleRetry }}
          />
        ) : pyqs.length === 0 ? (
          <LmsEmptyState
            title="No PYQs available"
            description={`No ${activeTab.toLowerCase()} questions found for this topic yet.`}
          />
        ) : (
          <div className="space-y-3">
            {pyqs.map((pyq) => (
              <PYQCard key={pyq.id} pyq={pyq} onReveal={handleReveal} subject={subject} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
