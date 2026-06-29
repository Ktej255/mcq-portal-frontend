"use client";

import { CAFeed } from "@/components/current-affairs/CAFeed";

/**
 * Redesigned Current Affairs page — replaces the static strategy-bridge view
 * with the daily CA learning platform feed.
 */
export default function UpscCurrentAffairsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5]">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <CAFeed />
      </div>
    </main>
  );
}
