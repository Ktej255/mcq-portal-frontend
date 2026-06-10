import { UpscPrelimsShowcase } from "@/components/marketing/UpscPrelimsShowcase";
import { buildPrelims2026ShowcaseEvidence } from "@/lib/upsc/prelims2026ShowcaseEvidence";

export default function UpscPrelims2026ShowcasePortalPage() {
  return <UpscPrelimsShowcase questionEvidence={buildPrelims2026ShowcaseEvidence()} />;
}
