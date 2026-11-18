"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  GS_LMS_ACCESS_DENIED_EVENT,
  type GsLmsAccessDeniedDetail,
} from "@/lib/gs-lms/access-events";

/**
 * Study, My books and Wellbeing read GS course endpoints, which the backend
 * closes until a student's beta access is switched on. Inside the GS course
 * the LMS layout already shows a clear "access not active" panel; these three
 * pages sit outside it and showed a generic load error instead. This boundary
 * gives them the same honest state.
 */
const GUARDED_PATH = /^\/(upsc|neet|jee)\/(study|books|wellbeing)(\/|$)/;

export function GsAccessBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const guarded = GUARDED_PATH.test(pathname);
  const [denied, setDenied] = useState<{ path: string; message: string } | null>(null);

  useEffect(() => {
    if (!guarded) return;
    const handle = (event: Event) => {
      const message = (event as CustomEvent<Partial<GsLmsAccessDeniedDetail>>).detail?.message;
      if (typeof message === "string" && message.trim()) setDenied({ path: pathname, message });
    };
    window.addEventListener(GS_LMS_ACCESS_DENIED_EVENT, handle);
    return () => window.removeEventListener(GS_LMS_ACCESS_DENIED_EVENT, handle);
  }, [guarded, pathname]);

  if (!guarded || !denied || denied.path !== pathname) return <>{children}</>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16" data-testid="gs-access-pending">
      <div className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8c5d14]">Course access pending</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-[#13251d]">
          This part opens once your access is switched on
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#495c52]">
          You are signed in, but your GS course access is not active yet. The program team turns it on for each
          beta student. Current affairs and the optional subjects are open in the meantime.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/upsc/current-affairs"
            className="inline-flex min-h-11 items-center rounded-lg bg-[#1a3a2a] px-4 text-sm font-bold text-white transition hover:bg-[#10291d]"
          >
            Open current affairs
          </Link>
          <Link
            href="/upsc/optional-subjects"
            className="inline-flex min-h-11 items-center rounded-lg border border-[#cfc6b6] bg-white px-4 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
          >
            Optional subjects
          </Link>
        </div>
      </div>
    </div>
  );
}
