"use client";

import { useState, useEffect } from 'react';
import { ExternalLink, BookOpen, RefreshCw } from 'lucide-react';
import { gsLmsService, ExternalResourceOut } from '@/services/api/gsLmsService';

/**
 * ExternalResourceCards — Curated external reading resources per section.
 * Max 5, REVIEWED only, ordered by display_order.
 *
 * Requirements: 12.1, 12.2, 12.3, 12.5
 */

type ExternalResource = ExternalResourceOut;

interface ExternalResourceCardsProps {
  nodeId: number;
  sectionLabel?: string;
  subject?: string;
}

export function ExternalResourceCards({ nodeId, sectionLabel, subject = "geography" }: ExternalResourceCardsProps) {
  const [loaded, setLoaded] = useState<{ key: string; items: ExternalResource[] }>({ key: "", items: [] });
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Loading, error and the result are all keyed by the request they belong to,
  // so changing section never shows the previous request's state and the effect
  // never has to clear state when it starts.
  const requestKey = `${subject}:${nodeId}:${sectionLabel ?? ""}:${retryCount}`;
  const loading = loadedKey !== requestKey;
  const error = failedKey === requestKey ? "Recommended resources are temporarily unavailable." : null;
  const resources = loaded.key === requestKey ? loaded.items : [];

  useEffect(() => {
    let cancelled = false;

    gsLmsService
      .getExternalResources(subject, nodeId)
      .then((data) => {
        if (cancelled) return;
        const filtered = sectionLabel
          ? data.filter((r: ExternalResource) => r.section_label === sectionLabel)
          : data;
        setLoaded({ key: requestKey, items: filtered.slice(0, 5) });
      })
      .catch(() => {
        if (cancelled) return;
        setLoaded({ key: requestKey, items: [] });
        setFailedKey(requestKey);
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [nodeId, sectionLabel, subject, requestKey]);

  if (loading) return (
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#dcd5c7] bg-white p-3 text-xs text-[#49675e]" role="status" aria-live="polite">
      <BookOpen className="h-3.5 w-3.5 animate-pulse text-[#1d9e75]" />
      <span>Loading recommended reading...</span>
    </div>
  );

  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3" role="alert">
        <p className="text-xs text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => setRetryCount((count) => count + 1)}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-red-700 hover:text-red-900"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-[#dcd5c7] bg-white p-3 text-xs text-[#49675e]">
        <p>No recommended resources are available for this section yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <h4 className="flex items-center gap-1.5 text-[10px] font-black text-[#49675e] uppercase">
        <BookOpen className="h-3 w-3" /> Recommended Reading
      </h4>
      {resources.map((resource) => (
        <a
          key={resource.id}
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-2 rounded-lg border border-[#dcd5c7] bg-white p-3 hover:border-[#1d9e75] hover:shadow-sm transition-all group"
        >
          <ExternalLink className="h-3.5 w-3.5 text-[#1d9e75] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
          <div className="min-w-0">
            <p className="text-xs font-black text-[#1a3a2a] truncate">{resource.title}</p>
            <p className="text-[10px] text-[#49675e]">{resource.source_name}</p>
            {resource.relevance_description && (
              <p className="text-[10px] text-[#5d675f] mt-0.5 line-clamp-2">{resource.relevance_description}</p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

export default ExternalResourceCards;
