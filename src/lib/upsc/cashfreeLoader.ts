let cashfreeInstance: any = null;

/**
 * Dynamically loads and initializes the Cashfree JS SDK.
 * Caches the instance to avoid re-initialization on subsequent calls.
 * Mode is determined by `NEXT_PUBLIC_CASHFREE_MODE` env var (defaults to "sandbox").
 */
export async function loadCashfreeSDK(): Promise<any> {
  if (cashfreeInstance) return cashfreeInstance;

  const { load } = await import("@cashfreepayments/cashfree-js");
  cashfreeInstance = await load({
    mode:
      process.env.NEXT_PUBLIC_CASHFREE_MODE === "production"
        ? "production"
        : "sandbox",
  });
  return cashfreeInstance;
}
