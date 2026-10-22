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

  // The UPSC root and every subject's setup page are open without the profile
  // gate. The gate's "Start setup" button links to setup, so gating setup too
  // sent new students straight back to the gate in a loop.
  if (profileOpenRoutes.has(pathname) || /\/lms\/onboarding\/?$/.test(pathname)) {
    return <>{children}</>;
  }

  // All other routes (including GS subject routes like /upsc/polity-governance,
  // /upsc/economy, etc.) are student-accessible behind the profile gate.
  // Those pages render "Coming Soon" states at the page-component level.
  return <UpscProfileGate>{children}</UpscProfileGate>;
}
