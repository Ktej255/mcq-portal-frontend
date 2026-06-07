"use client";

import { usePathname } from "next/navigation";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { UpscProfileGate } from "@/components/upsc/UpscProfileGate";

const operatorRoutes = new Set([
  "/upsc/prelims-2026-audit",
  "/upsc/prelims-2026-audit-v2",
  "/upsc/readiness-audit",
  "/upsc/mcq-command",
  "/upsc/content-command",
  "/upsc/revision-command",
  "/upsc/geography/testing",
]);

const profileOpenRoutes = new Set([
  "/upsc",
]);

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

  return <UpscProfileGate>{children}</UpscProfileGate>;
}
