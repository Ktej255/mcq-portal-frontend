"use client";

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThreadConsolidation } from '@/components/current-affairs/ThreadConsolidation';

/**
 * Thread Consolidation Page — shows full thread evolution.
 * Route: /upsc/current-affairs/threads/[threadId]
 */
export default function ThreadPage() {
  const params = useParams();
  const threadId = Number(params.threadId);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5]">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <Link href="/upsc/current-affairs" className="flex items-center gap-1.5 text-xs font-semibold text-[#5d675f] hover:text-[#1d9e75]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Current Affairs
        </Link>
        <ThreadConsolidation threadId={threadId} />
      </div>
    </main>
  );
}
