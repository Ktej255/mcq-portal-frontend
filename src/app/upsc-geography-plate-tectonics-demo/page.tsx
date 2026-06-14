import type { Metadata } from "next";

import { PlateTectonicsMasterModule } from "@/components/upsc/PlateTectonicsMasterModule";

export const metadata: Metadata = {
  title: "Plate Tectonics Master Module | Sarit Classes",
  description:
    "Standalone UPSC geography Plate Tectonics module generated from the Sarit Classes master prompt.",
};

export default function UpscGeographyPlateTectonicsDemoPage() {
  return <PlateTectonicsMasterModule />;
}
