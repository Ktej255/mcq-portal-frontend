"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeIndianRupee,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";

import {
  paymentService,
  type SubscriptionResponse,
  type OrderHistoryResponse,
} from "@/services/api/paymentService";

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [orders, setOrders] = useState<OrderHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [subRes, ordersRes] = await Promise.all([
          paymentService.getSubscription(),
          paymentService.getOrders(1),
        ]);
        setSubscription(subRes);
        setOrders(ordersRes);
      } catch (err: any) {
        setError(err?.message || "Failed to load billing data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
        <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#1d9e75]" />
          <span className="ml-3 text-sm font-black">Loading billing…</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      </main>
    );
  }

  const isActive = subscription?.status === "active";

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-5 md:px-8">
        {/* Header */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
            Account
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            Billing & Subscription
          </h1>
        </div>

        {/* Active Subscription Card */}
        <section className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex items-center gap-2 mb-4">
            <BadgeIndianRupee className="h-5 w-5 text-[#1d9e75]" />
            <h2 className="text-lg font-black">Current Subscription</h2>
          </div>

          {isActive ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#49675e]">
                  Plan
                </p>
                <p className="mt-1 text-lg font-black capitalize text-[#13251d]">
                  {subscription.plan_tier}
                </p>
              </div>
              <div className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#49675e]">
                  Billing Cycle
                </p>
                <p className="mt-1 text-lg font-black capitalize text-[#13251d]">
                  {subscription.billing_cycle}
                </p>
              </div>
              <div className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#49675e]">
                  Valid Until
                </p>
                <p className="mt-1 text-lg font-black text-[#13251d]">
                  {formatDate(subscription.end_date)}
                </p>
              </div>
              <div className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#49675e]">
                  Days Remaining
                </p>
                <p className="mt-1 text-lg font-black text-[#1d9e75]">
                  {subscription.remaining_days} days
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-5">
              <p className="text-sm font-semibold text-[#5d675f]">
                No active subscription. Choose a plan to start your UPSC preparation journey.
              </p>
              <Link
                href="/upsc/pricing"
                className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-[#1a3a2a] px-4 text-sm font-black text-white hover:bg-[#10291d] transition"
              >
                View Plans <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          )}

          {isActive && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/upsc/pricing"
                className="inline-flex min-h-9 items-center rounded-md border border-[#1a3a2a] px-3 text-xs font-black text-[#1a3a2a] hover:bg-[#1a3a2a] hover:text-white transition"
              >
                Upgrade Plan
              </Link>
            </div>
          )}
        </section>

        {/* Order History */}
        <section className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-[#1d9e75]" />
            <h2 className="text-lg font-black">Order History</h2>
          </div>

          {orders && orders.orders.length > 0 ? (
            <div className="space-y-2">
              {orders.orders.map((order) => (
                <div
                  key={order.order_id}
                  className="flex flex-col gap-2 rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex-1">
                    <p className="text-sm font-black capitalize text-[#13251d]">
                      {order.plan_tier} Plan — {order.billing_cycle}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-[#5d675f]">
                      {order.order_id} • {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-[#13251d]">
                      {money(order.amount)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                        order.status === "paid"
                          ? "bg-[#e7f5ee] text-[#085041]"
                          : order.status === "failed"
                          ? "bg-red-50 text-red-700"
                          : "bg-[#f7f4ee] text-[#746f66]"
                      }`}
                    >
                      {order.status}
                    </span>
                    {order.refund_status && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-700">
                        {order.refund_status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
              <Clock className="h-4 w-4 text-[#5d675f]" />
              <p className="text-sm font-semibold text-[#5d675f]">
                No orders yet. Your transaction history will appear here after your first purchase.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
