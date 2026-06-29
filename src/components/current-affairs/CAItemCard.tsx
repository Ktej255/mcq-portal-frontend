"use client";

import Link from 'next/link';
import { CheckCircle2, Video, Star } from 'lucide-react';
import type { CAItemCardData } from '@/services/api/caService';

/**
 * CAItemCard — Individual item card with badges and status.
 * Requirements: 6.3, 11.3, 11.4
 */

const SUBJECT_COLORS: Record<string, string> = {
  geography: 'bg-green-100 text-green-800 border-green-200',
  economy: 'bg-amber-100 text-amber-800 border-amber-200',
  polity: 'bg-blue-100 text-blue-800 border-blue-200',
  environment: 'bg-teal-100 text-teal-800 border-teal-200',
  'science-tech': 'bg-purple-100 text-purple-800 border-purple-200',
  history: 'bg-red-100 text-red-800 border-red-200',
  'disaster-mgmt': 'bg-orange-100 text-orange-800 border-orange-200',
  'internal-security': 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

interface CAItemCardProps {
  item: CAItemCardData;
}

export function CAItemCard({ item }: CAItemCardProps) {
  const subjectColor = SUBJECT_COLORS[item.subject] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <Link href={`/upsc/current-affairs/${item.id}`} className="block">
      <div className="rounded-xl border border-[#dcd5c7] bg-white p-4 hover:border-[#1d9e75] hover:shadow-sm transition-all group">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Title */}
            <h3 className="text-sm font-black text-[#13251d] group-hover:text-[#1d9e75] transition-colors line-clamp-2">
              {item.title}
            </h3>

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Subject badge */}
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black ${subjectColor}`}>
                {item.subject.replace('-', ' ')}
              </span>

              {/* GS Paper */}
              <span className="text-[10px] font-black text-[#49675e] bg-[#f7f4ee] px-1.5 py-0.5 rounded">
                {item.gs_paper}
              </span>

              {/* Exam relevance */}
              <span className="text-[10px] text-[#5d675f]">
                {item.exam_relevance === 'both' ? 'Prelims + Mains' : item.exam_relevance}
              </span>

              {/* Date */}
              <span className="text-[10px] text-[#5d675f]">
                {new Date(item.publish_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>

              {/* Video indicator */}
              {item.has_video && <Video className="h-3 w-3 text-[#1d9e75]" />}
            </div>

            {/* Thread chips */}
            {item.thread_titles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {item.thread_titles.slice(0, 2).map((title, i) => (
                  <span key={i} className="text-[9px] text-[#085041] bg-[#e7f5ee] px-1.5 py-0.5 rounded-full">
                    {title}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right side: relevance + completion */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {/* Relevance stars */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-2.5 w-2.5 ${i < item.relevance_score ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                />
              ))}
            </div>

            {/* Completion check */}
            {item.is_completed && (
              <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
            )}

            {/* Source authority */}
            <span className={`text-[8px] font-black uppercase ${
              item.source_authority === 'official' ? 'text-[#1d9e75]' :
              item.source_authority === 'standard' ? 'text-[#49675e]' : 'text-[#5d675f]'
            }`}>
              {item.source_authority}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CAItemCard;
