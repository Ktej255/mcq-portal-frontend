"use client";

import { CAFeed } from "@/components/current-affairs/CAFeed";
import { CAProgressBar } from "@/components/current-affairs/CAProgressBar";
import { CAQuickTest } from "@/components/current-affairs/CAQuickTest";

/**
 * Redesigned Current Affairs page — replaces the static strategy-bridge view
 * with the daily CA learning platform feed + progress + quick test.
 */
export default function UpscCurrentAffairsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5]">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-5 md:px-8">
        <CAProgressBar />
        <CAFeed />
        <CAQuickTest />
      </div>
    </main>
  );
}
