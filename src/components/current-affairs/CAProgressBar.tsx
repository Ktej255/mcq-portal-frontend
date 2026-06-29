"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, AlertTriangle, TrendingUp } from 'lucide-react';
import { caService, CAAnalyticsOut } from '@/services/api/caService';

/**
 * CAProgressBar — Visual coverage tracker with streak, subject bars, and "at risk" warning.
 *
 * Enhancement 5: Visual Progress Bars
 */

const SUBJECT_COLORS: Record<string, string> = {
  geography: '#22c55e',
  economy: '#f59e0b',
  polity: '#3b82f6',
  environment: '#14b8a6',
  'science-tech': '#a855f7',
  history: '#ef4444',
  'disaster-mgmt': '#f97316',
  'internal-security': '#6366f1',
};

export function CAProgressBar() {
  const [analytics, setAnalytics] = useState<CAAnalyticsOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    caService.getAnalytics()
      .then(setAnalytics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !analytics) {
    return <div className="h-24 animate-pulse bg-[#e7f5ee] rounded-xl" />;
  }

  const { streak, coverage_by_subject, overall_coverage_percent, missed_items_count } = analytics;
  const atRisk = streak.current_streak > 0 && missed_items_count > 0;

  return (
    <div className="rounded-xl border border-[#dcd5c7] bg-white p-4 space-y-3">
      {/* Top row: streak + overall + missed warning */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Streak */}
          <div className="flex items-center gap-1.5">
            <Flame className={`h-4 w-4 ${streak.current_streak > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
            <span className="text-sm font-black text-[#13251d]">{streak.current_streak}</span>
            <span className="text-[9px] text-[#5d675f]">day streak</span>
          </div>

          {/* Overall coverage */}
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-[#1d9e75]" />
            <span className="text-sm font-black text-[#1d9e75]">{overall_coverage_percent}%</span>
            <span className="text-[9px] text-[#5d675f]">covered</span>
          </div>
        </div>

        {/* At-risk warning */}
        {atRisk && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            <span className="text-[9px] font-black text-amber-700">{missed_items_count} missed</span>
          </div>
        )}
      </div>

      {/* Subject-wise bars */}
      <div className="space-y-1.5">
        {coverage_by_subject.filter(s => s.total_available > 0).map(s => (
          <div key={s.subject} className="flex items-center gap-2">
            <span className="text-[9px] font-black text-[#5d675f] w-20 truncate">{s.subject.replace('-', ' ')}</span>
            <div className="flex-1 h-2 rounded-full bg-[#dcd5c7] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: SUBJECT_COLORS[s.subject] || '#94a3b8' }}
              />
            </div>
            <span className="text-[9px] font-black text-[#49675e] w-12 text-right">
              {s.completed}/{s.total_available}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CAProgressBar;
