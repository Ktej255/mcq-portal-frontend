"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { readStudentProfile } from "@/lib/upsc/studentProfile";

/**
 * Persistent Coins + XP pills for the student section.
 *
 * Rendered in the dashboard header so gamification is surfaced consistently on
 * every student page instead of only on the home tab bar. Stays current by
 * re-reading on navigation and on the profile-updated broadcast.
 */
export function UpscStudentStats({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const [profileRefresh, setProfileRefresh] = useState(0);
  // The profile is read from browser storage, so navigation and the
  // profile-updated broadcast are invalidation keys, not inputs.
  const profile = useMemo(() => {
    void pathname;
    void profileRefresh;
    return readStudentProfile();
  }, [pathname, profileRefresh]);

  useEffect(() => {
    const refresh = () => setProfileRefresh((value) => value + 1);
    window.addEventListener("sarit-upsc-profile-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("sarit-upsc-profile-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!profile || typeof profile.points !== "number") return null;

  return (
    <div className={`hidden items-center gap-2 sm:flex ${className}`}>
      <div className="flex items-center gap-1.5 rounded-lg border border-[#ef9f27]/30 bg-[#fff4df] px-2.5 py-1 text-xs font-black text-[#6f4a12]">
        <span aria-hidden>🪙</span>
        <span>{profile.coins ?? 0}</span>
        <span className="sr-only">Coins</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-lg border border-[#1d9e75]/30 bg-[#e7f5ee] px-2.5 py-1 text-xs font-black text-[#085041]">
        <span aria-hidden>⚡</span>
        <span>{profile.points ?? 0}</span>
        <span className="sr-only">XP</span>
      </div>
    </div>
  );
}
