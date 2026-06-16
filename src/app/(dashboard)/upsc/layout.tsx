"use client";

import { usePathname } from "next/navigation";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { UpscProfileGate } from "@/components/upsc/UpscProfileGate";

const operatorRoutes = new Set([
  "/upsc/prelims-2026-audit",
  "/upsc/prelims-2026-audit-v2",
  "/upsc/prelims-2026-showcase",
  "/upsc/prelims-review-command",
  "/upsc/prelims-2027-strategy",
  "/upsc/readiness-audit",
  "/upsc/current-affairs",
  "/upsc/mcq-command",
  "/upsc/content-command",
  "/upsc/revision-command",
  "/upsc/yearly-planner",
  "/upsc/geography/testing",
]);

const profileOpenRoutes = new Set([
  "/upsc",
]);

// Reading / reference sections that should be browsable without first
// completing the personalised self-study intake. These are catalog and
// study-content pages (e.g. the optional-subject Read experience), so a
// student or a prospective enrollee can open them directly. They remain
// behind authentication via the dashboard ProtectedRoute.
const profileOpenPrefixes = [
  "/upsc/optional-subjects",
];

const futureSubjectPrefixes = [
  "/upsc/environment",
  "/upsc/disaster-management",
  "/upsc/economy",
  "/upsc/science-tech",
  "/upsc/polity-governance",
  "/upsc/internal-security-society",
  "/upsc/history",
];

export default function UpscLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (operatorRoutes.has(pathname)) {
    return <ProtectedRoute requiredRole="ADMIN">{children}</ProtectedRoute>;
  }

  if (futureSubjectPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return <ProtectedRoute requiredRole="ADMIN">{children}</ProtectedRoute>;
  }

  if (profileOpenRoutes.has(pathname)) {
    return <>{children}</>;
  }

  if (profileOpenPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return <>{children}</>;
  }

  return <UpscProfileGate>{children}</UpscProfileGate>;
}
