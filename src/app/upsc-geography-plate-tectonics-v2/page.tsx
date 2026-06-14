import type { Metadata } from "next";

import { PlateTectonicsResearchEdition } from "@/components/upsc/PlateTectonicsResearchEdition";

export const metadata: Metadata = {
  title: "Plate Tectonics V2 Research Edition | Sarit Classes",
  description:
    "Research-led UPSC Plate Tectonics single-source module with visuals, trends, traps, India linkage and MCQ readiness.",
};

export default function PlateTectonicsV2Page() {
  return <PlateTectonicsResearchEdition />;
}
