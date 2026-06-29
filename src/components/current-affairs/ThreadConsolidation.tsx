"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ArrowRight, CheckCircle2, Circle, GitBranch } from 'lucide-react';
import { caService, ThreadConsolidationOut } from '@/services/api/caService';

/**
 * ThreadConsolidation — Full thread assembly view showing chronological
 * evolution of an issue with causality arrows and coverage stats.
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

interface ThreadConsolidationProps {
  threadId: number;
}

const DIRECTION_DISPLAY: Record<string, { icon: any; color: string; label: string }> = {
  escalating: { icon: TrendingUp, color: 'text-red-600 bg-red-50 border-red-200', label: 'Escalating' },
  'de-escalating': { icon: TrendingDown, color: 'text-green-600 bg-green-50 border-green-200', label: 'De-escalating' },
  evolving: { icon: ArrowRight, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Evolving' },
  concluded: { icon: CheckCircle2, color: 'text-gray-600 bg-gray-50 border-gray-200', label: 'Concluded' },
};

export function ThreadConsolidation({ threadId }: ThreadConsolidationProps) {
  const [data, setData] = useState<ThreadConsolidationOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    caService.getThread(threadId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [threadId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse bg-[#e7f5ee] rounded-2xl" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse bg-[#fffdf8] rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-red-600">Thread not found.</p>;
  }

  const directionInfo = DIRECTION_DISPLAY[data.direction || 'evolving'] || DIRECTION_DISPLAY.evolving;
  const DirectionIcon = directionInfo.icon;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-[#dcd5c7] bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="h-4 w-4 text-[#1d9e75]" />
              <span className="text-[10px] font-black text-[#1d9e75] uppercase">Thread</span>
            </div>
            <h1 className="text-xl font-black text-[#13251d]">{data.title}</h1>
            {data.description && (
              <p className="mt-1 text-sm text-[#5d675f]">{data.description}</p>
            )}
          </div>
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black ${directionInfo.color}`}>
            <DirectionIcon className="h-3 w-3" />
            {directionInfo.label}
          </div>
        </div>

        {/* Coverage stats */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#dcd5c7]">
          <div className="text-center">
            <div className="text-lg font-black text-[#13251d]">{data.coverage.total_items}</div>
            <div className="text-[9px] text-[#5d675f]">Items</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-[#1d9e75]">{data.coverage.completed}</div>
            <div className="text-[9px] text-[#5d675f]">Completed</div>
          </div>
          <div className="flex-1">
            <div className="h-2 rounded-full bg-[#dcd5c7] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1d9e75] to-[#085041]"
                style={{ width: `${data.coverage.total_items > 0 ? (data.coverage.completed / data.coverage.total_items * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#1d9e75] to-[#dcd5c7]" />

        {data.items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="relative mb-4 last:mb-0"
          >
            {/* Node dot */}
            <div className="absolute -left-6 top-3">
              {item.is_completed ? (
                <CheckCircle2 className="h-5 w-5 text-[#1d9e75] bg-white rounded-full" />
              ) : (
                <Circle className="h-5 w-5 text-[#dcd5c7] fill-white" />
              )}
            </div>

            {/* Item card */}
            <Link href={`/upsc/current-affairs/${item.id}`}>
              <div className="rounded-xl border border-[#dcd5c7] bg-white p-4 hover:border-[#1d9e75] hover:shadow-sm transition-all ml-2">
                {/* Date */}
                <span className="text-[10px] font-black text-[#49675e]">
                  {new Date(item.publish_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>

                {/* Title */}
                <h3 className="text-sm font-black text-[#13251d] mt-1">{item.title}</h3>

                {/* Causality indicator */}
                {item.causality_direction && idx < data.items.length - 1 && (
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowRight className="h-3 w-3 text-[#1d9e75]" />
                    <span className="text-[9px] text-[#085041] font-semibold">
                      {item.causality_direction === 'causes' ? 'Led to →' :
                       item.causality_direction === 'caused_by' ? '← Caused by' :
                       'Related to'}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Related threads */}
      {data.related_threads.length > 0 && (
        <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4">
          <h4 className="text-xs font-black text-[#49675e] uppercase mb-2">Related Threads</h4>
          <div className="space-y-1.5">
            {data.related_threads.map(t => (
              <Link key={t.id} href={`/upsc/current-affairs/threads/${t.id}`}
                className="flex items-center gap-2 text-xs text-[#085041] hover:text-[#1d9e75]">
                <GitBranch className="h-3 w-3" /> {t.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThreadConsolidation;
