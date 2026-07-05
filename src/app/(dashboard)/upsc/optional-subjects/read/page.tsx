import { Suspense } from "react";

import { GeographyReadContent } from "@/components/upsc/GeographyReadContent";

export default function OptionalReadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f4ee]" />}>
      <GeographyReadContent />
    </Suspense>
  );
}
