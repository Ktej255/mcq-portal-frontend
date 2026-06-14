/**
 * Shared database row types for the VSL delivery layer.
 * These mirror the Supabase table schemas defined in the migrations.
 */

export interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "starter" | "pro" | "agency";
  settings: {
    reply_to_email?: string;
    whatsapp_phone_number_id?: string;
    whatsapp_access_token?: string;
    whatsapp_from_number?: string;
    fast2sms_api_key?: string;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export interface LeadRow {
  id: string;
  workspace_id: string;
  source_module: string;
  source_id: string;
  email: string;
  phone?: string | null;
  name?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FollowupJobRow {
  id: string;
  workspace_id: string;
  lead_id: string;
  channel: "email" | "sms" | "whatsapp" | "push";
  sequence_id: string;
  status: "pending" | "sent" | "failed";
  scheduled_at: string;
  sent_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface HermesJobRow {
  id: string;
  workspace_id: string;
  user_id: string;
  job_type: string;
  input_data: Record<string, unknown>;
  output_data?: {
    vsl_script?: Record<string, unknown>;
    page_copy?: { headline?: string; [key: string]: unknown };
    followup_sequences?: {
      email?: Array<{ subject: string; body: string; send_after_hours: number }>;
      whatsapp?: Array<{ message: string; send_after_hours: number }>;
      sms?: Array<{ message: string; send_after_hours: number }>;
    };
    [key: string]: unknown;
  } | null;
  status: "queued" | "processing" | "completed" | "failed";
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}
