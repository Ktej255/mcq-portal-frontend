import type { Metadata } from "next";

import { PlateTectonicsUnifiedV3 } from "@/components/upsc/PlateTectonicsUnifiedV3";

export const metadata: Metadata = {
  title: "Plate Tectonics V3 Unified Learning Lab | Sarit Classes",
  description:
    "Unified UPSC Plate Tectonics learning lab with section-wise learning, PYQ slides, practice MCQs, recall scoring, AI discussion mode and local analytics.",
};

export default function PlateTectonicsV3Page() {
  return <PlateTectonicsUnifiedV3 />;
}
