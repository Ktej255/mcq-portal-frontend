import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const globalWithSupabaseAdmin = globalThis as typeof globalThis & {
  __upscSupabaseAdminClient?: SupabaseClient;
};

export function getSupabaseAdminClient() {
  if (globalWithSupabaseAdmin.__upscSupabaseAdminClient) {
    return globalWithSupabaseAdmin.__upscSupabaseAdminClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !secretKey) return null;

  globalWithSupabaseAdmin.__upscSupabaseAdminClient = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return globalWithSupabaseAdmin.__upscSupabaseAdminClient;
}
