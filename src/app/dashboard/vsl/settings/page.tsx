"use client";

/**
 * VSL Channel Settings Dashboard
 * /dashboard/vsl/settings
 *
 * Tabs:
 *   1. Email Settings (Resend sender config)
 *   2. WhatsApp Settings (WhatsApp Business API credentials)
 *   3. SMS Settings (Fast2SMS API key)
 *   4. Follow-up Queue (view/retry/process pending jobs)
 *
 * TODO Phase 3:
 * - Custom domain verification flow for Resend sender
 * - Evolution API self-hosted WhatsApp toggle
 * - DLT template registration for SMS compliance (TRAI India)
 * - Twenty CRM sync toggle
 */

import { useState, useEffect, useCallback } from "react";

type Tab = "email" | "whatsapp" | "sms" | "queue";

interface FollowupJob {
  id: string;
  channel: string;
  scheduled_at: string;
  status: string;
  lead_email?: string;
}

interface WorkspaceSettings {
  reply_to_email?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_access_token?: string;
  whatsapp_from_number?: string;
  fast2sms_api_key?: string;
}

function TabButton({ id, active, label, onClick }: { id: Tab; active: boolean; label: string; onClick: (t: Tab) => void }) {
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        padding: "10px 20px",
        background: active ? "#4f46e5" : "transparent",
        color: active ? "#fff" : "#6b7280",
        border: "none",
        borderBottom: active ? "2px solid #4f46e5" : "2px solid transparent",
        cursor: "pointer",
        fontWeight: active ? 600 : 400,
        fontSize: "14px",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function SaveButton({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        padding: "10px 24px",
        background: saved ? "#059669" : "#4f46e5",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: saving ? "not-allowed" : "pointer",
        fontWeight: 600,
        fontSize: "14px",
        marginTop: "16px",
        opacity: saving ? 0.7 : 1,
        transition: "background 0.2s",
      }}
    >
      {saving ? "Saving…" : saved ? "✓ Saved" : "Save Settings"}
    </button>
  );
}

export default function VSLSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("email");
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [settings, setSettings] = useState<WorkspaceSettings>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [jobs, setJobs] = useState<FollowupJob[]>([]);
  const [jobFilter, setJobFilter] = useState<"pending" | "sent" | "failed">("pending");
  const [pendingCount, setPendingCount] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Load workspace on mount
  useEffect(() => {
    fetch("/api/v1/workspaces")
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setWorkspaceId(data.id);
          setSettings(data.settings || {});
        }
      })
      .catch(console.error);
  }, []);

  const loadJobs = useCallback(() => {
    if (!workspaceId) return;
    // Fetch pending count
    fetch("/api/v1/vsl/delivery/process")
      .then((r) => r.json())
      .then((d) => setPendingCount(d.pending_count ?? 0))
      .catch(console.error);
  }, [workspaceId]);

  useEffect(() => {
    loadJobs();
    if (activeTab === "queue") {
      const interval = setInterval(loadJobs, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, loadJobs]);

  const handleSave = async () => {
    if (!workspaceId) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/v1/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const result = await fetch("/api/v1/vsl/delivery/process", { method: "POST" }).then((r) => r.json());
      alert(`Processed ${result.processed} jobs: ${result.sent} sent, ${result.failed} failed`);
      loadJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = async (jobId: string) => {
    await fetch("/api/v1/vsl/delivery/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId }),
    });
    loadJobs();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
    marginTop: "6px",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 500,
    fontSize: "14px",
    color: "#374151",
    marginTop: "16px",
  };

  const infoStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "4px",
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: "720px", margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
        Delivery Channel Settings
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "24px", fontSize: "14px" }}>
        Configure how follow-up messages are sent to your leads.
      </p>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: "28px", display: "flex", gap: "4px" }}>
        <TabButton id="email" active={activeTab === "email"} label="📧 Email" onClick={setActiveTab} />
        <TabButton id="whatsapp" active={activeTab === "whatsapp"} label="💬 WhatsApp" onClick={setActiveTab} />
        <TabButton id="sms" active={activeTab === "sms"} label="📱 SMS" onClick={setActiveTab} />
        <TabButton id="queue" active={activeTab === "queue"} label={`⚙️ Queue ${pendingCount > 0 ? `(${pendingCount})` : ""}`} onClick={setActiveTab} />
      </div>

      {/* EMAIL TAB */}
      {activeTab === "email" && (
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>Email Configuration</h2>
          <p style={infoStyle}>
            Emails are sent via <strong>Resend</strong>. During development, the sender is{" "}
            <code>onboarding@resend.dev</code>. Connect a custom domain in production for branded emails.
          </p>

          <label style={labelStyle}>Reply-to Email Address</label>
          <p style={infoStyle}>Replies from leads will be forwarded to this address.</p>
          <input
            id="reply-to-email"
            type="email"
            style={inputStyle}
            placeholder="you@yourcompany.com"
            value={settings.reply_to_email || ""}
            onChange={(e) => setSettings({ ...settings, reply_to_email: e.target.value })}
          />

          <div
            style={{
              background: "#fef3c7",
              border: "1px solid #fcd34d",
              borderRadius: "8px",
              padding: "12px 16px",
              marginTop: "20px",
              fontSize: "13px",
              color: "#92400e",
            }}
          >
            <strong>⚠️ RESEND_API_KEY required</strong> — Add your Resend API key to environment variables.{" "}
            <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" style={{ color: "#7c3aed" }}>
              Get your key →
            </a>
          </div>

          <SaveButton onClick={handleSave} saving={saving} saved={saved} />
        </div>
      )}

      {/* WHATSAPP TAB */}
      {activeTab === "whatsapp" && (
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>WhatsApp Business API</h2>
          <p style={infoStyle}>
            Uses the official Meta WhatsApp Business Cloud API. You need a verified WhatsApp Business Account.{" "}
            <a href="https://developers.facebook.com/docs/whatsapp" target="_blank" rel="noreferrer" style={{ color: "#7c3aed" }}>
              How to get credentials →
            </a>
          </p>

          <label style={labelStyle} htmlFor="wa-phone-id">Phone Number ID</label>
          <input
            id="wa-phone-id"
            style={inputStyle}
            placeholder="1234567890123456"
            value={settings.whatsapp_phone_number_id || ""}
            onChange={(e) => setSettings({ ...settings, whatsapp_phone_number_id: e.target.value })}
          />

          <label style={labelStyle} htmlFor="wa-access-token">Access Token</label>
          <input
            id="wa-access-token"
            type="password"
            style={inputStyle}
            placeholder="EAAxxxxxxxxxxxxxxx"
            value={settings.whatsapp_access_token || ""}
            onChange={(e) => setSettings({ ...settings, whatsapp_access_token: e.target.value })}
          />

          <label style={labelStyle} htmlFor="wa-from-number">From Number (with country code)</label>
          <input
            id="wa-from-number"
            style={inputStyle}
            placeholder="+919876543210"
            value={settings.whatsapp_from_number || ""}
            onChange={(e) => setSettings({ ...settings, whatsapp_from_number: e.target.value })}
          />

          <SaveButton onClick={handleSave} saving={saving} saved={saved} />
        </div>
      )}

      {/* SMS TAB */}
      {activeTab === "sms" && (
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>SMS via Fast2SMS</h2>
          <p style={infoStyle}>
            Fast2SMS is India&apos;s leading transactional SMS provider.{" "}
            <a href="https://www.fast2sms.com" target="_blank" rel="noreferrer" style={{ color: "#7c3aed" }}>
              Get your Fast2SMS API key →
            </a>
          </p>

          <label style={labelStyle} htmlFor="fast2sms-key">Fast2SMS API Key</label>
          <input
            id="fast2sms-key"
            type="password"
            style={inputStyle}
            placeholder="Your Fast2SMS API key"
            value={settings.fast2sms_api_key || ""}
            onChange={(e) => setSettings({ ...settings, fast2sms_api_key: e.target.value })}
          />

          <p style={{ ...infoStyle, marginTop: "16px" }}>
            ⚠️ For DLT compliance (TRAI India), register SMS templates before going live.
          </p>

          <SaveButton onClick={handleSave} saving={saving} saved={saved} />
        </div>
      )}

      {/* QUEUE TAB */}
      {activeTab === "queue" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600 }}>
              Follow-up Queue ({pendingCount} pending)
            </h2>
            <button
              id="process-jobs-btn"
              onClick={handleProcess}
              disabled={processing}
              style={{
                padding: "8px 20px",
                background: "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: processing ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "13px",
                opacity: processing ? 0.7 : 1,
              }}
            >
              {processing ? "Processing…" : "⚡ Process Now"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {(["pending", "sent", "failed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setJobFilter(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: "1px solid #e5e7eb",
                  background: jobFilter === s ? "#4f46e5" : "#f9fafb",
                  color: jobFilter === s ? "#fff" : "#374151",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <p style={{ ...infoStyle, marginBottom: "8px" }}>Queue auto-refreshes every 30 seconds when this tab is active.</p>

          {jobs.length === 0 ? (
            <div
              style={{
                padding: "32px",
                textAlign: "center",
                background: "#f9fafb",
                borderRadius: "12px",
                color: "#9ca3af",
                fontSize: "14px",
              }}
            >
              No {jobFilter} jobs found.{" "}
              {jobFilter === "pending" && pendingCount > 0 && "Reload to see pending jobs."}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={{ padding: "10px", textAlign: "left", borderRadius: "8px 0 0 8px" }}>Lead</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Channel</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Scheduled</th>
                  <th style={{ padding: "10px", textAlign: "left", borderRadius: "0 8px 8px 0" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px" }}>{job.lead_email || job.id.slice(0, 8)}</td>
                    <td style={{ padding: "10px" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          background: job.channel === "email" ? "#e0e7ff" : job.channel === "whatsapp" ? "#d1fae5" : "#fce7f3",
                          color: job.channel === "email" ? "#3730a3" : job.channel === "whatsapp" ? "#065f46" : "#9d174d",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        {job.channel}
                      </span>
                    </td>
                    <td style={{ padding: "10px" }}>
                      {new Date(job.scheduled_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </td>
                    <td style={{ padding: "10px" }}>
                      {job.status === "failed" && (
                        <button
                          onClick={() => handleRetry(job.id)}
                          style={{
                            padding: "4px 12px",
                            background: "#fef3c7",
                            border: "1px solid #fcd34d",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            color: "#92400e",
                          }}
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
