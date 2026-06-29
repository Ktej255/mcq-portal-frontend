"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import { caService, CAItemDetailOut } from '@/services/api/caService';
import { CAItemFunnel } from '@/components/current-affairs/CAItemFunnel';

/**
 * CA Item Funnel Page — individual item learning experience.
 * Route: /upsc/current-affairs/[itemId]
 */
export default function CAItemPage() {
  const params = useParams();
  const itemId = Number(params.itemId);
  const [item, setItem] = useState<CAItemDetailOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    caService.getItemDetail(itemId)
      .then(setItem)
      .catch(() => setError('Item not found'))
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5]">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#e7f5ee] rounded-lg w-2/3" />
            <div className="h-64 bg-[#fffdf8] rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5]">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center">
          <p className="text-sm text-red-600">{error || 'Item not found'}</p>
          <Link href="/upsc/current-affairs" className="mt-3 text-xs text-[#1d9e75] font-black">← Back to feed</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5]">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        {/* Breadcrumb */}
        <Link href="/upsc/current-affairs" className="flex items-center gap-1.5 text-xs font-semibold text-[#5d675f] hover:text-[#1d9e75]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Current Affairs
        </Link>

        {/* Item Header */}
        <div className="rounded-2xl border border-[#dcd5c7] bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-black text-[#13251d]">{item.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[10px] font-black text-[#1d9e75] bg-[#e7f5ee] px-2 py-0.5 rounded-full">
                  {item.subject.replace('-', ' ')}
                </span>
                <span className="text-[10px] font-black text-[#49675e] bg-[#f7f4ee] px-1.5 py-0.5 rounded">
                  {item.gs_paper}
                </span>
                <span className="text-[10px] text-[#5d675f]">
                  {new Date(item.publish_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className={`text-[9px] font-black uppercase ${
                  item.source_authority === 'official' ? 'text-[#1d9e75]' : 'text-[#49675e]'
                }`}>
                  {item.source_authority}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < item.relevance_score ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
              ))}
            </div>
          </div>

          {/* Thread links */}
          {item.threads.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {item.threads.map(t => (
                <Link
                  key={t.id}
                  href={`/upsc/current-affairs/threads/${t.id}`}
                  className="text-[9px] font-black text-[#085041] bg-[#e7f5ee] px-2 py-0.5 rounded-full hover:bg-[#b9d9cd] transition-colors"
                >
                  🧵 {t.title}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Funnel */}
        <CAItemFunnel itemId={itemId} item={item} />
      </div>
    </main>
  );
}
