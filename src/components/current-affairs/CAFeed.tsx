"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, TrendingUp, BarChart3, Network } from 'lucide-react';
import Link from 'next/link';
import { caService, CAItemCardData, CAFilters } from '@/services/api/caService';
import { CAItemCard } from './CAItemCard';
import { CAFilterBar } from './CAFilterBar';

/**
 * CAFeed — Daily current affairs feed with filters, search, and pagination.
 * Requirements: 6.1, 6.3, 6.4
 */

interface CAFeedProps {
  initialItems?: CAItemCardData[];
}

export function CAFeed({ initialItems }: CAFeedProps) {
  const [items, setItems] = useState<CAItemCardData[]>(initialItems || []);
  const [totalCount, setTotalCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(!initialItems);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Partial<CAFilters>>({
    sort_by: 'publish_date',
  });

  const fetchFeed = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const data = await caService.getFeed(filters, p);
      if (p === 1) {
        setItems(data.items);
      } else {
        setItems(prev => [...prev, ...data.items]);
      }
      setTotalCount(data.total_count);
      setTodayCount(data.today_count);
      setPage(p);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  const loadMore = () => fetchFeed(page + 1);
  const hasMore = items.length < totalCount;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#13251d]">Current Affairs</h1>
          <p className="text-sm text-[#5d675f] mt-1">
            {todayCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1d9e75]/10 border border-[#1d9e75]/20 px-2 py-0.5 text-[10px] font-black text-[#1d9e75] mr-2">
                {todayCount} new today
              </span>
            )}
            {totalCount} items total
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/upsc/current-affairs/graph" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#dcd5c7] text-xs font-black text-[#5d675f] hover:border-[#1d9e75] transition-colors">
            <Network className="h-3.5 w-3.5" /> Graph
          </Link>
          <Link href="/upsc/current-affairs/timeline" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#dcd5c7] text-xs font-black text-[#5d675f] hover:border-[#1d9e75] transition-colors">
            <TrendingUp className="h-3.5 w-3.5" /> Timeline
          </Link>
        </div>
      </div>

      {/* Filters */}
      <CAFilterBar filters={filters} onFiltersChange={setFilters} />

      {/* Feed */}
      {loading && items.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse bg-[#e7f5ee] rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-8 text-center">
          <Newspaper className="h-8 w-8 text-[#dcd5c7] mx-auto" />
          <p className="mt-3 text-sm font-semibold text-[#5d675f]">No items match your filters</p>
          <button onClick={() => setFilters({ sort_by: 'publish_date' })} className="mt-2 text-xs text-[#1d9e75] font-black">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <CAItemCard item={item} />
            </motion.div>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-3 rounded-xl border border-[#dcd5c7] text-xs font-black text-[#5d675f] hover:border-[#1d9e75] transition-colors"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CAFeed;
