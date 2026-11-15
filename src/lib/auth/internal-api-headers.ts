import { resolveToken } from "@/lib/auth/token-strategy";

/**
 * Headers for calling an operator-only Next API route from the browser.
 * The route checks the token's role with the backend; without a token the
 * call is simply refused.
 */
export async function buildInternalApiHeaders(): Promise<Record<string, string>> {
  const token = await resolveToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
