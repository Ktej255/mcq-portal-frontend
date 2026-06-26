/**
 * Type declarations for @cashfreepayments/cashfree-js
 * The Cashfree JS SDK doesn't ship TypeScript declarations.
 */
declare module "@cashfreepayments/cashfree-js" {
  interface CashfreeLoadOptions {
    mode: "sandbox" | "production";
  }

  interface CheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_modal" | "_self" | "_blank";
    returnUrl?: string;
  }

  interface CheckoutResult {
    error?: {
      message?: string;
      code?: string;
    };
    paymentDetails?: {
      paymentMessage?: string;
      [key: string]: unknown;
    };
  }

  interface CashfreeInstance {
    checkout(options: CheckoutOptions): Promise<CheckoutResult>;
  }

  export function load(options: CashfreeLoadOptions): Promise<CashfreeInstance>;
}
