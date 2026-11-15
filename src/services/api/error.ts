import axios from "axios";

type ApiErrorPayload = {
  detail?: unknown;
  message?: unknown;
};

/**
 * Extract the most useful, honest message from an API failure.
 *
 * FastAPI raises `{ "detail": "..." }` for authorization and validation
 * failures, while `StandardResponse` envelopes use `message`. Surfacing the
 * detail matters for cohort-access errors: a learner must see that their beta
 * access is not active instead of a generic "failed to load".
 */
export function apiErrorMessage(error: unknown, fallback: string): string {  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiErrorPayload | undefined;
    if (typeof payload?.detail === "string" && payload.detail.trim()) {
      return payload.detail;
    }
    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message;
    }
    return error.message || fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

/** HTTP status of a failed API call, or undefined when the failure was not an HTTP response. */
export function apiErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}
