"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TimelineView } from '@/components/current-affairs/TimelineView';

/**
 * Timeline Page — thread-based chronological view.
 * Route: /upsc/current-affairs/timeline
 */
export default function TimelinePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5]">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <Link href="/upsc/current-affairs" className="flex items-center gap-1.5 text-xs font-semibold text-[#5d675f] hover:text-[#1d9e75]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Feed
        </Link>
        <TimelineView />
      </div>
    </main>
  );
}
