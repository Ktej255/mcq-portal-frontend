"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { KnowledgeGraph } from '@/components/current-affairs/KnowledgeGraph';

/**
 * Knowledge Graph Page — full-page interactive graph visualization.
 * Route: /upsc/current-affairs/graph
 */
export default function GraphPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5]">
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        <Link href="/upsc/current-affairs" className="flex items-center gap-1.5 text-xs font-semibold text-[#5d675f] hover:text-[#1d9e75]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Feed
        </Link>
        <h1 className="text-xl font-black text-[#13251d]">Knowledge Graph</h1>
        <p className="text-xs text-[#5d675f]">Explore how current affairs connect to each other and the syllabus</p>
        <KnowledgeGraph onNodeClick={(id) => router.push(`/upsc/current-affairs/${id}`)} />
      </div>
    </main>
  );
}
