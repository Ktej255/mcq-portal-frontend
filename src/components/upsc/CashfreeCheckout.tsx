"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

import { loadCashfreeSDK } from "@/lib/upsc/cashfreeLoader";
import {
  isMatchingActiveSubscription,
  paymentService,
  type CreateOrderResponse,
  type SubscriptionResponse,
} from "@/services/api/paymentService";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CashfreeCheckoutProps {
  planTier: string;
  billingCycle: string;
  amount: number;
  planTitle: string;
  onSuccess: (orderId: string, subscription: SubscriptionResponse) => void;
  onFailure: (error: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const SUBSCRIPTION_POLL_INTERVAL_MS = 2000;
const SUBSCRIPTION_CONFIRMATION_TIMEOUT_MS = 30000;

type CheckoutStatus = "loading" | "active" | "pending" | "error";
type PollTimer = {
  id: number;
  resolve: (shouldContinue: boolean) => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CashfreeCheckout({
  planTier,
  billingCycle,
  amount,
  planTitle,
  onSuccess,
  onFailure,
}: CashfreeCheckoutProps) {
  const [status, setStatus] = useState<CheckoutStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [hasSubmittedOrder, setHasSubmittedOrder] = useState(false);

  const isMountedRef = useRef(false);
  const flowIdRef = useRef(0);
  const pollTimerRef = useRef<PollTimer | null>(null);
  const submittedOrderRef = useRef<CreateOrderResponse | null>(null);

  const clearPollTimer = useCallback(() => {
    const pendingTimer = pollTimerRef.current;
    if (!pendingTimer) return;

    window.clearTimeout(pendingTimer.id);
    pollTimerRef.current = null;
    pendingTimer.resolve(false);
  }, []);

  const isCurrentFlow = useCallback((flowId: number) =>
    isMountedRef.current && flowIdRef.current === flowId,
  []);

  const waitForPollInterval = useCallback(
    (flowId: number) =>
      new Promise<boolean>((resolve) => {
        const id = window.setTimeout(() => {
          pollTimerRef.current = null;
          resolve(isCurrentFlow(flowId));
        }, SUBSCRIPTION_POLL_INTERVAL_MS);
        pollTimerRef.current = { id, resolve };
      }),
    [isCurrentFlow],
  );

  // -------------------------------------------------------------------------
  // Confirm only after the signed webhook has created the matching subscription
  // -------------------------------------------------------------------------

  const confirmSubscription = useCallback(
    async (orderData: CreateOrderResponse, flowId: number) => {
      const deadline = Date.now() + SUBSCRIPTION_CONFIRMATION_TIMEOUT_MS;

      while (isCurrentFlow(flowId) && Date.now() < deadline) {
        try {
          const subscription = await paymentService.getSubscription();

          if (!isCurrentFlow(flowId)) return;

          if (
            isMatchingActiveSubscription(subscription, {
              order_id: orderData.order_id,
              plan_tier: planTier,
              billing_cycle: billingCycle,
            })
          ) {
            onSuccess(orderData.order_id, subscription);
            return;
          }
        } catch {
          // The webhook may still be processing. Keep polling until the bounded
          // confirmation window expires rather than treating a transient read
          // failure as proof that the payment failed.
        }

        if (!isCurrentFlow(flowId) || Date.now() >= deadline) break;
        if (!(await waitForPollInterval(flowId))) return;
      }

      if (!isCurrentFlow(flowId)) return;

      const message =
        "Payment was submitted, but secure subscription confirmation timed out. It may still be processing; retry confirmation before paying again.";
      setError(message);
      setStatus("error");
      onFailure(message);
    },
    [billingCycle, isCurrentFlow, onFailure, onSuccess, planTier, waitForPollInterval],
  );

  const beginSubscriptionConfirmation = useCallback(
    (orderData: CreateOrderResponse) => {
      clearPollTimer();
      const flowId = ++flowIdRef.current;
      setOrderId(orderData.order_id);
      setError(null);
      setStatus("pending");
      void confirmSubscription(orderData, flowId);
    },
    [clearPollTimer, confirmSubscription],
  );

  // -------------------------------------------------------------------------
  // Create order and launch checkout
  // -------------------------------------------------------------------------

  const initiatePayment = useCallback(async () => {
    clearPollTimer();
    const flowId = ++flowIdRef.current;
    submittedOrderRef.current = null;
    setHasSubmittedOrder(false);
    setStatus("loading");
    setError(null);

    try {
      // Step 1: Create server-side order
      const orderData: CreateOrderResponse = await paymentService.createOrder(
        planTier,
        billingCycle,
      );
      if (!isCurrentFlow(flowId)) return;

      setOrderId(orderData.order_id);

      // Step 2: Load Cashfree SDK
      const cashfree = await loadCashfreeSDK();
      if (!cashfree) {
        throw new Error("Failed to load payment SDK. Please refresh the page.");
      }
      if (!isCurrentFlow(flowId)) return;

      // Step 3: Launch checkout modal
      setStatus("active");
      const checkoutResult = await cashfree.checkout({
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: "_modal",
      });
      if (!isCurrentFlow(flowId)) return;

      // Step 4: SDK success means only that payment was submitted. Activation
      // requires the matching webhook-backed subscription below.
      if (checkoutResult?.error) {
        const errMsg =
          checkoutResult.error?.message ||
          "Payment was not completed. Please try again.";
        setError(errMsg);
        setStatus("error");
        onFailure(errMsg);
      } else if (checkoutResult?.paymentDetails?.paymentMessage) {
        submittedOrderRef.current = orderData;
        setHasSubmittedOrder(true);
        beginSubscriptionConfirmation(orderData);
      } else {
        // Modal closed without completing — treat as user cancellation
        setError("Payment was cancelled. You can retry when ready.");
        setStatus("error");
      }
    } catch (err: unknown) {
      if (!isCurrentFlow(flowId)) return;

      const paymentError =
        err && typeof err === "object"
          ? (err as { response?: { data?: { message?: unknown } }; message?: unknown })
          : null;
      const responseMessage = paymentError?.response?.data?.message;
      const errorMessage = paymentError?.message;
      const message =
        (typeof responseMessage === "string" && responseMessage) ||
        (typeof errorMessage === "string" && errorMessage) ||
        "An unexpected error occurred while initiating payment.";
      setError(message);
      setStatus("error");
      onFailure(message);
    }
  }, [
    beginSubscriptionConfirmation,
    billingCycle,
    clearPollTimer,
    isCurrentFlow,
    onFailure,
    planTier,
  ]);

  // -------------------------------------------------------------------------
  // Mount and unmount cleanup
  // -------------------------------------------------------------------------

  useEffect(() => {
    isMountedRef.current = true;
    const initiationTimer = window.setTimeout(() => {
      void initiatePayment();
    }, 0);

    return () => {
      window.clearTimeout(initiationTimer);
      isMountedRef.current = false;
      flowIdRef.current += 1;
      clearPollTimer();
    };
    // The checkout flow intentionally starts once per mounted checkout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Retry handler
  // -------------------------------------------------------------------------

  const handleRetry = () => {
    if (retryCount >= MAX_RETRIES) return;
    setRetryCount((prev) => prev + 1);

    // If Cashfree already reported submission, retry confirmation for that same
    // order instead of creating a second order that could lead to double payment.
    if (submittedOrderRef.current) {
      beginSubscriptionConfirmation(submittedOrderRef.current);
    } else {
      void initiatePayment();
    }
  };

  // -------------------------------------------------------------------------
  // Render: Loading state
  // -------------------------------------------------------------------------

  if (status === "loading") {
    return (
      <div
        data-testid="cashfree-checkout-loading"
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-6"
      >
        <Loader2 className="h-6 w-6 animate-spin text-[#1d9e75]" />
        <p className="text-sm font-bold text-[#085041]">
          Preparing secure payment for {planTitle}…
        </p>
        <p className="text-xs font-semibold text-[#49675e]">
          Amount: ₹{amount.toLocaleString("en-IN")}
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Webhook confirmation pending
  // -------------------------------------------------------------------------

  if (status === "pending") {
    return (
      <div
        data-testid="cashfree-checkout-pending"
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-6"
      >
        <Loader2 className="h-6 w-6 animate-spin text-[#1d9e75]" />
        <p className="text-center text-sm font-bold text-[#085041]">
          Payment submitted. Waiting for secure subscription confirmation…
        </p>
        {orderId && (
          <p className="text-xs font-semibold text-[#49675e]">
            Order reference: {orderId}
          </p>
        )}
        <p className="text-center text-xs font-semibold text-[#49675e]">
          Your plan will activate only after our signed payment webhook is verified.
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Error / retry state
  // -------------------------------------------------------------------------

  if (status === "error" && error) {
    return (
      <div
        data-testid="cashfree-checkout-error"
        className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-5"
      >
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-bold text-red-800">{error}</p>
            {retryCount < MAX_RETRIES && (
              <p className="mt-1 text-xs font-semibold text-red-600">
                Retry {retryCount}/{MAX_RETRIES} used
              </p>
            )}
          </div>
        </div>

        {retryCount < MAX_RETRIES ? (
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-md bg-[#1d9e75] px-4 py-2 text-sm font-black text-white hover:bg-[#126245] transition shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {hasSubmittedOrder ? "Retry confirmation" : "Retry Payment"}
          </button>
        ) : (
          <p className="text-xs font-semibold text-red-700">
            Maximum retries reached. Please refresh the page or contact support.
          </p>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Checkout initiated (SDK modal is open)
  // -------------------------------------------------------------------------

  return (
    <div
      data-testid="cashfree-checkout-active"
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-6"
    >
      <p className="text-sm font-bold text-[#085041]">
        Cashfree checkout is open. Complete the payment in the modal.
      </p>
      <p className="text-xs font-semibold text-[#49675e]">
        {planTitle} — ₹{amount.toLocaleString("en-IN")}
      </p>
    </div>
  );
}
