import type { Metadata } from "next";

import { UpscPrelimsShowcase } from "@/components/marketing/UpscPrelimsShowcase";
import { buildPrelims2026ShowcaseEvidence } from "@/lib/upsc/prelims2026ShowcaseEvidence";

export const metadata: Metadata = {
  title: "UPSC Prelims 2026 Showcase | Morning Batch Audit",
  description:
    "Standalone UPSC Prelims 2026 audit showcase for main-site proof, content coverage, pattern shift, and portal activation planning.",
};

export default function UpscPrelims2026ShowcasePage() {
  return <UpscPrelimsShowcase questionEvidence={buildPrelims2026ShowcaseEvidence()} />;
}
