"use client";

import { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import type { CAFilters } from '@/services/api/caService';

/**
 * CAFilterBar — subject, GS paper, exam type, date, sort controls.
 * Requirements: 6.1, 6.2
 */

const SUBJECTS = ['geography', 'economy', 'polity', 'environment', 'science-tech', 'history', 'disaster-mgmt', 'internal-security'];
const GS_PAPERS = ['GS1', 'GS2', 'GS3', 'GS4'];
const EXAM_TYPES = ['prelims', 'mains', 'both'];

interface CAFilterBarProps {
  filters: Partial<CAFilters>;
  onFiltersChange: (filters: Partial<CAFilters>) => void;
}

export function CAFilterBar({ filters, onFiltersChange }: CAFilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof CAFilters, value: string | null) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleSearch = () => {
    onFiltersChange({ ...filters, search: searchInput || null });
  };

  const clearAll = () => {
    setSearchInput('');
    onFiltersChange({ sort_by: 'publish_date' });
  };

  const activeCount = Object.values(filters).filter(v => v != null && v !== 'publish_date').length;

  return (
    <div className="space-y-3">
      {/* Search + toggle */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5d675f]" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search current affairs..."
            className="w-full pl-9 pr-3 py-2.5 min-h-11 rounded-lg border border-[#dcd5c7] bg-white text-base sm:text-sm text-[#1f2e26] focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/30"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`min-h-11 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-black transition-colors ${
            showAdvanced ? 'border-[#1d9e75] bg-[#e7f5ee] text-[#085041]' : 'border-[#dcd5c7] text-[#5d675f]'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters {activeCount > 0 && `(${activeCount})`}
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="min-h-11 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-black text-red-600"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 space-y-4">
          {/* Subject */}
          <div>
            <label className="text-xs font-black text-[#49675e] uppercase tracking-wide">Subject</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateFilter('subject', filters.subject === s ? null : s)}
                  className={`min-h-9 sm:min-h-8 inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    filters.subject === s
                      ? 'border-[#1a3a2a] bg-[#1a3a2a] text-white'
                      : 'border-[#dcd5c7] bg-white text-[#5d675f] hover:border-[#1d9e75]'
                  }`}
                >
                  {s.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* GS Paper */}
          <div>
            <label className="text-xs font-black text-[#49675e] uppercase tracking-wide">GS Paper</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {GS_PAPERS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateFilter('gs_paper', filters.gs_paper === p ? null : p)}
                  className={`min-h-9 sm:min-h-8 inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    filters.gs_paper === p
                      ? 'border-[#1a3a2a] bg-[#1a3a2a] text-white'
                      : 'border-[#dcd5c7] bg-white text-[#5d675f] hover:border-[#1d9e75]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Type */}
          <div>
            <label className="text-xs font-black text-[#49675e] uppercase tracking-wide">Exam Type</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {EXAM_TYPES.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => updateFilter('exam_relevance', filters.exam_relevance === e ? null : e)}
                  className={`min-h-9 sm:min-h-8 inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors capitalize ${
                    filters.exam_relevance === e
                      ? 'border-[#1a3a2a] bg-[#1a3a2a] text-white'
                      : 'border-[#dcd5c7] bg-white text-[#5d675f] hover:border-[#1d9e75]'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs font-black text-[#49675e] uppercase tracking-wide">Sort by</label>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                onClick={() => updateFilter('sort_by', 'publish_date')}
                className={`min-h-9 sm:min-h-8 inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-bold border ${
                  filters.sort_by !== 'relevance_score' ? 'border-[#1a3a2a] bg-[#1a3a2a] text-white' : 'border-[#dcd5c7] bg-white text-[#5d675f]'
                }`}
              >
                Newest
              </button>
              <button
                type="button"
                onClick={() => updateFilter('sort_by', 'relevance_score')}
                className={`min-h-9 sm:min-h-8 inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-bold border ${
                  filters.sort_by === 'relevance_score' ? 'border-[#1a3a2a] bg-[#1a3a2a] text-white' : 'border-[#dcd5c7] bg-white text-[#5d675f]'
                }`}
              >
                Most Relevant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CAFilterBar;
