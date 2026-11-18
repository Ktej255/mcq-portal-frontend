"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Database, RefreshCw } from "lucide-react";

import { apiClient } from "@/services/api/client";

type ContentStatus = {
  loaded: boolean;
  topics: number;
  topics_visible: number;
  sections: number;
  mcqs: number;
  pyqs: number;
};

type Phase = "checking" | "ready" | "loading" | "unreachable";

const ENDPOINT = "admin/gs-lms/content-load";

/**
 * Shows what Geography content the database holds and lets an operator load
 * it. A new database has tables and no content; this replaces running a
 * script with the database password. Loading again is safe: content is
 * updated in place and nothing a student did is removed.
 */
export function GeographyContentLoader() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [status, setStatus] = useState<ContentStatus | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const readStatus = useCallback(() => {
    apiClient
      .get(ENDPOINT)
      .then((response) => {
        setStatus(response.data?.data ?? null);
        setPhase("ready");
      })
      .catch(() => setPhase("unreachable"));
  }, []);

  useEffect(() => {
    readStatus();
  }, [readStatus]);

  const load = () => {
    setPhase("loading");
    setNotice(null);
    apiClient
      .post(ENDPOINT, undefined, { timeout: 120_000 })
      .then((response) => {
        const data = response.data?.data;
        setStatus(data?.status ?? null);
        const created = Number(data?.result?.sections_created ?? 0);
        setNotice({
          kind: "ok",
          text: created > 0
            ? "Geography content is loaded. Students can open it now."
            : "Geography content was already loaded and has been refreshed.",
        });
        setPhase("ready");
      })
      .catch(() => {
        setNotice({ kind: "error", text: "The content could not be loaded. Nothing was changed. Please try again." });
        setPhase("ready");
      });
  };

  const busy = phase === "checking" || phase === "loading";

  return (
    <section
      className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
      data-testid="admin-geography-content-loader"
      aria-label="Geography content in the database"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
            <Database className="h-5 w-5 text-emerald-700" />
            Geography content
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            {phase === "checking" && "Checking what the database holds…"}
            {phase === "unreachable" && "The server could not be reached, so the content status is unknown."}
            {(phase === "ready" || phase === "loading") && status?.loaded &&
              "The reviewed Geography content is in the database. Load again after a content update; nothing a student did is removed."}
            {(phase === "ready" || phase === "loading") && status && !status.loaded &&
              "The database has no Geography content yet, so students see an empty syllabus. Load it once to open the subject."}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={busy || phase === "unreachable"}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${phase === "loading" ? "animate-spin" : ""}`} />
          {phase === "loading" ? "Loading…" : status?.loaded ? "Load again" : "Load Geography content"}
        </button>
      </div>

      {status && (
        <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Topics students can open", `${status.topics_visible} of ${status.topics}`],
            ["Study sections", status.sections],
            ["Practice MCQs", status.mcqs],
            ["Previous year questions", status.pyqs],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <dt className="text-xs font-bold text-zinc-500">{label}</dt>
              <dd className="mt-1 text-xl font-black text-zinc-950">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {notice && (
        <p
          role={notice.kind === "error" ? "alert" : "status"}
          className={`mt-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold ${
            notice.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {notice.kind === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
          {notice.text}
        </p>
      )}
    </section>
  );
}
