"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Upload } from 'lucide-react';
import { adminCmsService, AdminCAListItem } from '@/services/api/adminCmsService';

/**
 * Admin CMS Dashboard — landing page with stats and quick actions.
 * Route: /admin/cms
 *
 * Requirements: 10.1, 10.5
 *
 * The Actions column runs the review workflow itself. `PATCH
 * /admin/current-affairs/items/{id}/status` and
 * `adminCmsService.updateStatus()` have existed since the CMS was built, but
 * nothing in this page called them: the only row affordance linked to
 * `/admin/cms/{id}`, a route that has no page, so a reviewer could not move a
 * drafted item towards publication from the app at all. The transitions below
 * mirror the backend contract in `app/core/current_affairs/ca_engine.py`
 * (`VALID_TRANSITIONS`: DRAFT→IN_REVIEW, IN_REVIEW→PUBLISHED|DRAFT,
 * PUBLISHED→ARCHIVED, ARCHIVED→nothing) so the UI never offers a move the
 * engine will reject with 409.
 */

type ReviewStatus = 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

const NEXT_STATUS_ACTIONS: Record<ReviewStatus, Array<{ to: ReviewStatus; label: string }>> = {
  DRAFT: [{ to: 'IN_REVIEW', label: 'Send to review' }],
  IN_REVIEW: [
    { to: 'PUBLISHED', label: 'Publish' },
    { to: 'DRAFT', label: 'Return to draft' },
  ],
  PUBLISHED: [{ to: 'ARCHIVED', label: 'Archive' }],
  ARCHIVED: [],
};

export default function AdminCmsPage() {
  const [items, setItems] = useState<AdminCAListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await adminCmsService.getItems({ status: statusFilter || undefined });
      setItems(data.items);
      setTotal(data.total);
    } catch {
      // A failed read is a failure, not an empty queue: an operator deciding
      // what still needs reviewing must never see "No items found" when the
      // API was simply unreachable.
      setItems([]);
      setTotal(0);
      setLoadError('The item list could not be loaded. Check that the backend is reachable, then retry.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    // Deferred one tick so the effect itself performs no synchronous state
    // write (`react-hooks/set-state-in-effect`), the same pattern the LMS
    // pages use for their data loads.
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const changeStatus = async (item: AdminCAListItem, to: ReviewStatus) => {
    setPendingItemId(item.id);
    setActionError(null);
    try {
      await adminCmsService.updateStatus(item.id, to);
      await load();
    } catch (error) {
      setActionError(
        `"${item.title}" stayed at ${item.review_status}: ${describeStatusError(error)}`,
      );
    } finally {
      setPendingItemId(null);
    }
  };

  const statusCounts = {
    DRAFT: items.filter(i => i.review_status === 'DRAFT').length,
    IN_REVIEW: items.filter(i => i.review_status === 'IN_REVIEW').length,
    PUBLISHED: items.filter(i => i.review_status === 'PUBLISHED').length,
  };

  return (
    <main className="min-h-screen bg-[#f7f4ee]">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#13251d]">Admin CMS</h1>
            <p className="text-sm text-[#5d675f]">Manage current affairs content</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/cms/new" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-xs font-black">
              <Plus className="h-3.5 w-3.5" /> New Item
            </Link>
            <Link href="/admin/cms/bulk-upload" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#dcd5c7] text-xs font-black text-[#5d675f]">
              <Upload className="h-3.5 w-3.5" /> Bulk Upload
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Items', value: total, color: 'text-[#13251d]' },
            { label: 'Draft', value: statusCounts.DRAFT, color: 'text-amber-600' },
            { label: 'In Review', value: statusCounts.IN_REVIEW, color: 'text-blue-600' },
            { label: 'Published', value: statusCounts.PUBLISHED, color: 'text-[#1d9e75]' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-[#dcd5c7] bg-white p-4">
              <p className="text-[10px] font-black text-[#49675e] uppercase">{stat.label}</p>
              <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2">
          {['', 'DRAFT', 'IN_REVIEW', 'PUBLISHED'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-black border transition-colors ${
                statusFilter === s ? 'border-[#1a3a2a] bg-[#1a3a2a] text-white' : 'border-[#dcd5c7] text-[#5d675f]'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {actionError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">
            {actionError}
          </div>
        )}

        {/* Items table */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-[#e7f5ee] rounded-lg" />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-black text-red-900">Item list unavailable</p>
            <p className="mt-1 text-xs text-red-800">{loadError}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 rounded-lg bg-red-800 px-3 py-1.5 text-[11px] font-black text-white"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-[#dcd5c7] bg-white overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#f7f4ee]">
                <tr>
                  <th className="text-left p-3 font-black text-[#49675e]">Title</th>
                  <th className="text-left p-3 font-black text-[#49675e]">Date</th>
                  <th className="text-left p-3 font-black text-[#49675e]">Subject</th>
                  <th className="text-left p-3 font-black text-[#49675e]">Paper</th>
                  <th className="text-left p-3 font-black text-[#49675e]">Status</th>
                  <th className="text-left p-3 font-black text-[#49675e]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-t border-[#dcd5c7] hover:bg-[#fffdf8]">
                    <td className="p-3 font-semibold text-[#13251d] max-w-[200px] truncate">{item.title}</td>
                    <td className="p-3 text-[#5d675f]">{item.publish_date}</td>
                    <td className="p-3"><span className="bg-[#e7f5ee] text-[#085041] px-1.5 py-0.5 rounded text-[9px] font-black">{item.subject}</span></td>
                    <td className="p-3 text-[#5d675f]">{item.gs_paper}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        item.review_status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                        item.review_status === 'IN_REVIEW' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {item.review_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {NEXT_STATUS_ACTIONS[(item.review_status as ReviewStatus)]?.map(action => (
                          <button
                            key={action.to}
                            type="button"
                            data-testid={`admin-cms-status-${action.to}`}
                            disabled={pendingItemId === item.id}
                            onClick={() => void changeStatus(item, action.to)}
                            className="rounded-md bg-[#1a3a2a] px-2 py-1 text-[10px] font-black text-white transition hover:bg-[#10291d] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {pendingItemId === item.id ? 'Saving…' : action.label}
                          </button>
                        ))}
                        {NEXT_STATUS_ACTIONS[(item.review_status as ReviewStatus)]?.length ? null : (
                          <span className="text-[10px] font-bold text-[#8a8377]">No transition available</span>
                        )}
                        <Link
                          href={`/upsc/current-affairs/${item.id}`}
                          className="text-[#1d9e75] font-black hover:underline"
                        >
                          Preview
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="p-8 text-center text-sm text-[#5d675f]">No items found</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/** Backend detail text when available, otherwise an honest generic reason. */
function describeStatusError(error: unknown): string {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail.trim();
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 409) return 'the engine rejected that transition.';
  if (status === 404) return 'the item could not be found on the server.';
  return 'the status request could not be completed.';
}
