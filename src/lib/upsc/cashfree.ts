/**
 * Cashfree checkout helper (client).
 *
 * Calls the backend `POST /api/v1/payments/cashfree/order`, then opens the
 * Cashfree hosted checkout with the returned `payment_session_id`. The backend
 * verifies payment via webhook and activates the subscription.
 *
 * Requires the backend Cashfree keys to be configured (otherwise the order
 * endpoint returns 503 and we surface a friendly message).
 */
import { env } from "@/env";

const SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

type CashfreeInstance = {
  checkout: (opts: { paymentSessionId: string; redirectTarget?: string }) => Promise<unknown>;
};

declare global {
  interface Window {
    Cashfree?: (opts: { mode: string }) => CashfreeInstance;
  }
}

let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Checkout is only available in the browser."));
  if (window.Cashfree) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load the Cashfree SDK."));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export async function startCashfreeCheckout(opts: {
  tier: string;
  cycle: string;
  phone?: string;
  token: string | null;
}): Promise<void> {
  const apiBase = env.NEXT_PUBLIC_API_BASE_URL;
  const res = await fetch(`${apiBase}/payments/cashfree/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: JSON.stringify({ tier: opts.tier, cycle: opts.cycle, phone: opts.phone }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (res.status === 503) throw new Error("Online payment isn't enabled yet. Please try again after launch.");
    throw new Error(`Could not start checkout (${res.status}). ${detail}`.trim());
  }

  const json = await res.json();
  const sessionId: string | undefined = json?.data?.payment_session_id;
  const mode = json?.data?.env === "production" ? "production" : "sandbox";
  if (!sessionId) throw new Error("No payment session was returned.");

  await loadSdk();
  if (!window.Cashfree) throw new Error("Cashfree SDK is unavailable.");
  const cashfree = window.Cashfree({ mode });
  await cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: "_self" });
}
