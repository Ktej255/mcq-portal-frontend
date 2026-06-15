import type { Metadata } from "next";

import { UpscPrelimsShowcase } from "@/components/marketing/UpscPrelimsShowcase";
import { buildPrelims2026ShowcaseEvidence } from "@/lib/upsc/prelims2026ShowcaseEvidence";

export const metadata: Metadata = {
  title: "UPSC Prelims 2026 Results | Course Performance Analysis",
  description:
    "Complete transparency on our UPSC Prelims 2026 course performance. 76% coverage, 74 out of 97 questions analyzed. See subject-wise breakdown and our 2027 improvement plan.",
};

export default function UpscPrelims2026ShowcasePage() {
  return <UpscPrelimsShowcase questionEvidence={buildPrelims2026ShowcaseEvidence()} />;
}
