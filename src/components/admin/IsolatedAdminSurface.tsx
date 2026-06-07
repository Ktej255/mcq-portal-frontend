import Link from "next/link";
import { ArrowRight, LockKeyhole, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type IsolatedAdminSurfaceProps = {
  title: string;
  eyebrow: string;
  detail: string;
  dependency: string;
  retainedFor: string;
  testId: string;
};

export function IsolatedAdminSurface({
  title,
  eyebrow,
  detail,
  dependency,
  retainedFor,
  testId,
}: IsolatedAdminSurfaceProps) {
  return (
    <div className="space-y-6" data-testid={testId}>
      <header className="border-b border-zinc-200 pb-6">
        <Badge variant="outline" className="mb-3 h-7 rounded-md border-zinc-300 bg-zinc-100 px-2 font-bold text-zinc-700">
          <LockKeyhole className="h-3.5 w-3.5" />
          Internal Route Isolated
        </Badge>
        <h1 className="text-3xl font-black text-zinc-950">{title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">{detail}</p>
      </header>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-black text-amber-950">
          <ShieldAlert className="h-5 w-5 text-amber-700" />
          {eyebrow}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-700">Missing dependency</p>
            <p className="mt-2 text-sm leading-6 text-amber-900">{dependency}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-700">Why the route remains</p>
            <p className="mt-2 text-sm leading-6 text-amber-900">{retainedFor}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/dashboard"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-800"
        >
          Return to Operator Console <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/admin/feature-inventory"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50"
        >
          Inspect Feature Inventory <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
