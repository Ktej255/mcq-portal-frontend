import { Suspense } from "react";

import { GeographyAnswerWorkspace } from "@/components/upsc/GeographyAnswerWorkspace";

export default function OptionalAnswerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f4ee]" />}>
      <GeographyAnswerWorkspace />
    </Suspense>
  );
}
