"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Upload, GitBranch, BarChart3, FileText } from 'lucide-react';
import { adminCmsService, AdminCAListItem } from '@/services/api/adminCmsService';

/**
 * Admin CMS Dashboard — landing page with stats and quick actions.
 * Route: /admin/cms
 *
 * Requirements: 10.1, 10.5
 */
export default function AdminCmsPage() {
  const [items, setItems] = useState<AdminCAListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminCmsService.getItems({ status: statusFilter || undefined })
      .then(data => { setItems(data.items); setTotal(data.total); })
      .finally(() => setLoading(false));
  }, [statusFilter]);

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

        {/* Items table */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-[#e7f5ee] rounded-lg" />
            ))}
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
                      <Link href={`/admin/cms/${item.id}`} className="text-[#1d9e75] font-black hover:underline">Edit</Link>
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
