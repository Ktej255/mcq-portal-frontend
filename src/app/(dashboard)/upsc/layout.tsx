"use client";

import { usePathname } from "next/navigation";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { UpscProfileGate } from "@/components/upsc/UpscProfileGate";
import { isOperatorRoute } from "@/lib/navigation/studentNav";

const profileOpenRoutes = new Set([
  "/upsc",
]);

export default function UpscLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Operator-only routes require ADMIN role (e.g. audit, command, strategy pages)
  if (isOperatorRoute(pathname)) {
    return <ProtectedRoute requiredRole="ADMIN">{children}</ProtectedRoute>;
  }

  // The UPSC root is open without a profile gate (landing/onboarding)
  if (profileOpenRoutes.has(pathname)) {
    return <>{children}</>;
  }

  // All other routes (including GS subject routes like /upsc/polity-governance,
  // /upsc/economy, etc.) are student-accessible behind the profile gate.
  // Those pages render "Coming Soon" states at the page-component level.
  return <UpscProfileGate>{children}</UpscProfileGate>;
}
