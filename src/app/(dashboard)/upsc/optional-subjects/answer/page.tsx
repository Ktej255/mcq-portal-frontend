import { Suspense } from "react";

import { OptionalAnswerRoute } from "@/components/upsc/OptionalAnswerRoute";

export default function OptionalAnswerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f4ee]" />}>
      <OptionalAnswerRoute />
    </Suspense>
  );
}
