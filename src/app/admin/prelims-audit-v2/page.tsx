import { PrelimsAuditPageClient } from "@/app/(dashboard)/upsc/prelims-2026-audit/page";

export default function AdminPrelimsAuditV2Page() {
  return (
    <div className="space-y-5" data-testid="admin-prelims-audit-v2-page">
      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-50">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
          Master Evidence Room
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight">Prelims 2026 Morning Batch V2</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-emerald-900 dark:text-emerald-100">
          This admin-only page uses the confirmed Morning Batch source folder and keeps public claims locked until
          source/page proof exists. V1 remains an internal archive; V2 is the active evidence view.
        </p>
      </section>

      <PrelimsAuditPageClient
        apiPath="/api/admin/prelims-audit-v2"
        versionLabel="Internal Version 2"
      />
    </div>
  );
}
