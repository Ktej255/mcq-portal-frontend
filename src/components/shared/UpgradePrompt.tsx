"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { upgradeRequiredEvent, type UpgradeRequiredDetail } from "@/lib/upsc/upgradePrompt";

const TITLES: Record<UpgradeRequiredDetail["reason"], string> = {
  trial_expired: "Your free trial has ended",
  feature: "Included in a higher plan",
  mcq_limit: "Today's MCQ limit reached",
};

/** Shows the backend's "upgrade required" answers as one friendly dialog. */
export function UpgradePrompt() {
  const [detail, setDetail] = useState<UpgradeRequiredDetail | null>(null);

  useEffect(() => {
    const onUpgrade = (event: Event) => setDetail((event as CustomEvent<UpgradeRequiredDetail>).detail);
    window.addEventListener(upgradeRequiredEvent, onUpgrade);
    return () => window.removeEventListener(upgradeRequiredEvent, onUpgrade);
  }, []);

  return (
    <Dialog open={detail !== null} onOpenChange={(open) => (open ? null : setDetail(null))}>
      <DialogContent data-testid="upgrade-prompt">
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-[#e4f4ec] text-[#1a3a2a]">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <DialogTitle>{detail ? TITLES[detail.reason] : ""}</DialogTitle>
          <DialogDescription>{detail?.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDetail(null)}>
            Not now
          </Button>
          <Link
            href={detail?.upgrade_path ?? "/upsc/pricing"}
            onClick={() => setDetail(null)}
            className="inline-flex h-9 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-bold text-white hover:bg-[#13251d]"
          >
            See plans
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
