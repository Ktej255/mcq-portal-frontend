import { apiClient } from './client';

/**
 * API client for the Cashfree Payment Integration.
 *
 * Wraps all `/api/v1/payments/*` backend endpoints with typed
 * request/response interfaces, following the established `gsLmsService.ts`
 * pattern: single exported object, shared `apiClient`, `unwrap` helper.
 *
 * Auth is handled centrally by the shared `apiClient` request interceptor
 * (Bearer token), matching every other service in this codebase.
 */

// ---------------------------------------------------------------------------
// Types — mirror backend Pydantic schemas (app/api/v1/payments/schemas.py)
// ---------------------------------------------------------------------------

export interface CreateOrderResponse {
  order_id: string;
  payment_session_id: string;
  amount: number;
  currency: string;
  plan_tier: string;
  billing_cycle: string;
}

export interface SubscriptionResponse {
  status: string;
  plan_tier: string | null;
  billing_cycle: string | null;
  start_date: string | null;
  end_date: string | null;
  remaining_days: number | null;
  order_id: string | null;
}

export interface OrderHistoryItem {
  order_id: string;
  plan_tier: string;
  billing_cycle: string;
  amount: number;
  status: string;
  refund_status: string | null;
  created_at: string;
}

export interface OrderHistoryResponse {
  orders: OrderHistoryItem[];
  total: number;
  page: number;
  page_size: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const unwrap = <T>(data: unknown): T => {
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  return (record.data ?? record) as T;
};

export const paymentService = {
  /**
   * Create a Cashfree payment order for the given plan tier and billing cycle.
   * Amount is computed server-side for security — only plan selection is sent.
   */
  createOrder: async (planTier: string, billingCycle: string): Promise<CreateOrderResponse> => {
    const response = await apiClient.post('payments/orders', {
      plan_tier: planTier,
      billing_cycle: billingCycle,
    });
    return unwrap<CreateOrderResponse>(response.data);
  },

  /**
   * Fetch the current active subscription for the authenticated student.
   * Returns `{status: "inactive", plan_tier: null}` if none active.
   */
  getSubscription: async (): Promise<SubscriptionResponse> => {
    const response = await apiClient.get('payments/subscription');
    return unwrap<SubscriptionResponse>(response.data);
  },

  /**
   * Fetch paginated order history for the authenticated student.
   * Sorted by created_at descending (most recent first).
   */
  getOrders: async (page = 1): Promise<OrderHistoryResponse> => {
    const response = await apiClient.get(`payments/orders?page=${page}`);
    return unwrap<OrderHistoryResponse>(response.data);
  },
};
