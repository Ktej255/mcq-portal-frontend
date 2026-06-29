"use client";

import { useState, useEffect } from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';
import { funnelService } from '@/services/api/funnelService';

/**
 * ExternalResourceCards — Curated external reading resources per section.
 * Max 5, REVIEWED only, ordered by display_order.
 *
 * Requirements: 12.1, 12.2, 12.3, 12.5
 */

interface ExternalResource {
  id: number;
  section_label: string;
  title: string;
  source_name: string;
  url: string;
  relevance_description: string | null;
}

interface ExternalResourceCardsProps {
  nodeId: number;
  sectionLabel?: string;
  subject?: string;
}

export function ExternalResourceCards({ nodeId, sectionLabel, subject = "geography" }: ExternalResourceCardsProps) {
  const [resources, setResources] = useState<ExternalResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await fetch(`/api/v1/gs-lms/${subject}/topics/${nodeId}/external-resources`)
          .then(res => res.json());
        const filtered = sectionLabel
          ? (data || []).filter((r: ExternalResource) => r.section_label === sectionLabel)
          : (data || []);
        setResources(filtered.slice(0, 5));
      } catch {
        setResources([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, [nodeId, sectionLabel, subject]);

  if (loading || resources.length === 0) return null;

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
