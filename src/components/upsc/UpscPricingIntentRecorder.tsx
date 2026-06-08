"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import type { ProductPlan } from "@/lib/upsc/yearlyPlanner";

type SavedPricingIntent = {
  planId: string;
  title: string;
  months: number;
  listPrice: number;
  launchPrice: number;
  savings: number;
  discountPercent: number;
  effectiveMonthly: number;
  commerceMode: string;
  readyForPayment: boolean;
  savedAt: string;
};

const pricingIntentStorageKey = "sarit-upsc-pricing-intent-v1";

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function UpscPricingIntentRecorder({
  plan,
  savings,
  commerceMode,
  readyForPayment,
}: {
  plan: ProductPlan;
  savings: number;
  commerceMode: string;
  readyForPayment: boolean;
}) {
  const [savedIntent, setSavedIntent] = useState<SavedPricingIntent | null>(null);

  const fallbackIntent: SavedPricingIntent = {
    planId: plan.id,
    title: plan.title,
    months: plan.months,
    listPrice: plan.listPrice,
    launchPrice: plan.launchPrice,
    savings,
    discountPercent: plan.discountPercent,
    effectiveMonthly: plan.effectiveMonthly,
    commerceMode,
    readyForPayment,
    savedAt: "",
  };

  useEffect(() => {
    const intent: SavedPricingIntent = {
      planId: plan.id,
      title: plan.title,
      months: plan.months,
      listPrice: plan.listPrice,
      launchPrice: plan.launchPrice,
      savings,
      discountPercent: plan.discountPercent,
      effectiveMonthly: plan.effectiveMonthly,
      commerceMode,
      readyForPayment,
      savedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(pricingIntentStorageKey, JSON.stringify(intent));
    setSavedIntent(intent);
  }, [
    commerceMode,
    plan.discountPercent,
    plan.effectiveMonthly,
    plan.id,
    plan.launchPrice,
    plan.listPrice,
    plan.months,
    plan.title,
    readyForPayment,
    savings,
  ]);

  const receipt = savedIntent ?? fallbackIntent;

  return (
    <section
      data-testid="upsc-pricing-intent-recorder"
      data-storage-key={pricingIntentStorageKey}
      data-plan-id={receipt.planId}
      data-months={receipt.months}
      data-launch-price={receipt.launchPrice}
      data-savings={receipt.savings}
      data-commerce-mode={receipt.commerceMode}
      data-ready-for-payment={String(receipt.readyForPayment)}
      data-saved={String(Boolean(savedIntent))}
      className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">Local plan receipt</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">
            {receipt.title} intent saved for pilot onboarding
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
            The portal can remember this choice before live payments open: {money(receipt.launchPrice)} for{" "}
            {receipt.months} month{receipt.months === 1 ? "" : "s"}, saving {money(receipt.savings)} against monthly billing.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#085041] text-white">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {[
          ["Intent", receipt.commerceMode],
          ["Payment", receipt.readyForPayment ? "Ready" : "Not collected"],
          ["Saved", savedIntent ? "Confirmed" : "Recording"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-[#b9d9cd] bg-white/75 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]">{label}</p>
            <p className="mt-1 text-sm font-black text-[#13251d]">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
