"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

import { loadCashfreeSDK } from "@/lib/upsc/cashfreeLoader";
import { paymentService, type CreateOrderResponse } from "@/services/api/paymentService";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CashfreeCheckoutProps {
  planTier: string;
  billingCycle: string;
  amount: number;
  planTitle: string;
  onSuccess: (orderId: string) => void;
  onFailure: (error: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const checkoutInitiated = useRef(false);

  // -------------------------------------------------------------------------
  // Create order and launch checkout
  // -------------------------------------------------------------------------

  const initiatePayment = useCallback(async () => {
    setLoading(true);
    setError(null);
    checkoutInitiated.current = false;

    try {
      // Step 1: Create server-side order
      const orderData: CreateOrderResponse = await paymentService.createOrder(
        planTier,
        billingCycle,
      );

      setPaymentSessionId(orderData.payment_session_id);
      setOrderId(orderData.order_id);

      // Step 2: Load Cashfree SDK
      const cashfree = await loadCashfreeSDK();
      if (!cashfree) {
        throw new Error("Failed to load payment SDK. Please refresh the page.");
      }

      // Step 3: Launch checkout modal
      checkoutInitiated.current = true;
      setLoading(false);

      const checkoutResult = await cashfree.checkout({
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: "_modal",
      });

      // Step 4: Handle checkout result
      if (checkoutResult?.error) {
        const errMsg =
          checkoutResult.error?.message ||
          "Payment was not completed. Please try again.";
        setError(errMsg);
        onFailure(errMsg);
      } else if (checkoutResult?.paymentDetails?.paymentMessage) {
        // Payment succeeded
        onSuccess(orderData.order_id);
      } else {
        // Modal closed without completing — treat as user cancellation
        setError("Payment was cancelled. You can retry when ready.");
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "An unexpected error occurred while initiating payment.";
      setError(message);
      setLoading(false);
      onFailure(message);
    }
  }, [planTier, billingCycle, onSuccess, onFailure]);

  // -------------------------------------------------------------------------
  // Mount: start payment flow
  // -------------------------------------------------------------------------

  useEffect(() => {
    initiatePayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Retry handler
  // -------------------------------------------------------------------------

  const handleRetry = () => {
    if (retryCount >= MAX_RETRIES) return;
    setRetryCount((prev) => prev + 1);
    initiatePayment();
  };

  // -------------------------------------------------------------------------
  // Render: Loading state
  // -------------------------------------------------------------------------

  if (loading) {
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
  // Render: Error state
  // -------------------------------------------------------------------------

  if (error) {
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
            className="inline-flex w-fit items-center gap-2 rounded-md bg-[#1d9e75] px-4 py-2 text-sm font-black text-white hover:bg-[#126245] transition shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Payment
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
