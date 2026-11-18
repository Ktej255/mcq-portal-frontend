"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { RefreshCcw, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/services/api/client";

/**
 * Operator screen for GS LMS beta cohort access.
 *
 * Production runs with GS_LMS_ENFORCE_ACCESS=true, so a signed-in student sees
 * "Ask the program team to activate your cohort access" until an admin grants
 * it. The backend endpoints (backend/app/api/v1/gs_lms/access_admin.py) were
 * the only way to do that; this page puts them on screen.
 */

type BetaAccessGrant = {
  user_id: number;
  email: string;
  access_type: string;
  starts_at: string;
  ends_at: string | null;
  status: string;
  reason: string | null;
  updated_at: string;
};

const ENDPOINT = "admin/gs-lms/beta-access";

function errorMessage(error: unknown, fallback: string) {
  const detail =
    error && typeof error === "object" && "response" in error
      ? (error as { response?: { data?: { detail?: unknown; message?: unknown } } }).response?.data
      : undefined;
  if (typeof detail?.detail === "string" && detail.detail.trim()) return detail.detail;
  if (Array.isArray(detail?.detail)) return "Check the email and dates, then try again.";
  if (typeof detail?.message === "string" && detail.message.trim()) return detail.message;
  return fallback;
}

function isActive(grant: BetaAccessGrant) {
  if (grant.status !== "ACTIVE") return false;
  const now = Date.now();
  if (new Date(grant.starts_at).getTime() > now) return false;
  if (grant.ends_at && new Date(grant.ends_at).getTime() <= now) return false;
  return true;
}

function formatDate(value: string | null) {
  if (!value) return "No end date";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminBetaAccessPage() {
  const [grants, setGrants] = useState<BetaAccessGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`${ENDPOINT}?limit=500`);
      setGrants((res.data?.data as BetaAccessGrant[] | undefined) ?? []);
      setError("");
    } catch (err) {
      setError(
        errorMessage(err, "Couldn't load access grants. Check that you're signed in as an admin and the backend is reachable."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred so the first render never sets state synchronously.
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const save = async (payload: { user_email: string; ends_at?: string | null; reason?: string | null }) => {
    const res = await apiClient.post(ENDPOINT, { status: "ACTIVE", ...payload });
    return res.data?.data as BetaAccessGrant | undefined;
  };

  const handleGrant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const endsAt = endsOn ? new Date(`${endsOn}T23:59:59`).toISOString() : null;
      const grant = await save({ user_email: trimmed, ends_at: endsAt, reason: reason.trim() || null });
      setNotice(`Access is on for ${grant?.email ?? trimmed}. They can open the GS course now.`);
      setEmail("");
      setEndsOn("");
      setReason("");
      await load();
    } catch (err) {
      setError(errorMessage(err, "Couldn't grant access. Try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (grant: BetaAccessGrant) => {
    setBusyUserId(grant.user_id);
    setError("");
    setNotice("");
    try {
      await apiClient.delete(`${ENDPOINT}/${grant.user_id}`);
      setNotice(`Access removed for ${grant.email}.`);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Couldn't remove access. Try again."));
    } finally {
      setBusyUserId(null);
    }
  };

  const handleReactivate = async (grant: BetaAccessGrant) => {
    setBusyUserId(grant.user_id);
    setError("");
    setNotice("");
    try {
      await save({ user_email: grant.email, ends_at: null, reason: grant.reason });
      setNotice(`Access is back on for ${grant.email}.`);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Couldn't turn access back on. Try again."));
    } finally {
      setBusyUserId(null);
    }
  };

  const activeCount = grants.filter(isActive).length;

  return (
    <div data-testid="admin-beta-access-page" className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 font-bold uppercase tracking-widest">
            Students
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Beta access</h1>
          <p className="text-muted-foreground">
            Students can open the GS course only after you turn access on here. {activeCount} active of {grants.length}.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-bold">Give a student access</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The student must have signed in once, so their account exists. Use the email they signed in with.
        </p>
        <form onSubmit={handleGrant} className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr_2fr_auto] md:items-end">
          <label className="space-y-1 text-sm font-semibold">
            <span>Student email</span>
            <Input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@example.com"
              data-testid="beta-access-email"
            />
          </label>
          <label className="space-y-1 text-sm font-semibold">
            <span>Ends on (optional)</span>
            <Input type="date" value={endsOn} onChange={(event) => setEndsOn(event.target.value)} />
          </label>
          <label className="space-y-1 text-sm font-semibold">
            <span>Note (optional)</span>
            <Input
              value={reason}
              maxLength={256}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. June Geography batch"
            />
          </label>
          <Button type="submit" disabled={saving || !email.trim()} data-testid="beta-access-grant">
            <UserPlus className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Give access"}
          </Button>
        </form>
      </section>

      {notice ? (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <section className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-950">
            <tr>
              <th className="p-3">Student</th>
              <th className="p-3">Status</th>
              <th className="p-3">From</th>
              <th className="p-3">Until</th>
              <th className="p-3">Note</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {grants.map((grant) => {
              const active = isActive(grant);
              return (
                <tr key={grant.user_id} className="border-t border-zinc-100 align-top dark:border-zinc-800">
                  <td className="p-3 font-semibold">{grant.email}</td>
                  <td className="p-3">
                    <Badge variant={active ? "default" : "outline"}>{active ? "Active" : grant.status.toLowerCase()}</Badge>
                  </td>
                  <td className="whitespace-nowrap p-3 tabular-nums">{formatDate(grant.starts_at)}</td>
                  <td className="whitespace-nowrap p-3 tabular-nums">{formatDate(grant.ends_at)}</td>
                  <td className="p-3">{grant.reason || "—"}</td>
                  <td className="p-3 text-right">
                    {active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyUserId === grant.user_id}
                        onClick={() => void handleRevoke(grant)}
                      >
                        Remove access
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyUserId === grant.user_id}
                        onClick={() => void handleReactivate(grant)}
                      >
                        Turn back on
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && grants.length === 0 && !error ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">
                  No student has access yet. Add one above.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
