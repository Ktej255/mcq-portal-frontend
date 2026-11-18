import Link from "next/link";
import { LmsLayoutShell } from "@/components/gs-lms/pages/LmsLayoutShell";
import { SubjectLmsProvider } from "@/components/gs-lms/SubjectLmsContext";
import { SUPPORTED_GS_LMS_SUBJECTS, getSupportedGsLmsSubject } from "@/lib/gsLmsRoutePolicy";

/**
 * Subject layout for the GS LMS workspace.
 *
 * Only subjects with reviewed, beta-open content render the workspace shell.
 * Every other GS subject slug stays addressable — a learner following a saved,
 * shared, or stale link gets an honest "not open yet" explanation instead of a
 * 404, because `notFound()` here used to swallow the whole locked-subject
 * surface (the `/upsc/{slug}` pages and their retired day rooms all redirect
 * into this layout).
 */
export default async function LmsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subject: string }>;
}) {
  const { subject: routeSubject } = await params;
  const subject = getSupportedGsLmsSubject(routeSubject);

  if (!subject) {
    return (
      <SubjectNotOpen
        slug={typeof routeSubject === "string" ? routeSubject : ""}
        openSubjects={Object.values(SUPPORTED_GS_LMS_SUBJECTS)}
      />
    );
  }

  return (
    <SubjectLmsProvider subject={subject.slug} label={subject.label}>
      <LmsLayoutShell>{children}</LmsLayoutShell>
    </SubjectLmsProvider>
  );
}

function SubjectNotOpen({
  slug,
  openSubjects,
}: {
  slug: string;
  openSubjects: Array<{ slug: string; label: string }>;
}) {
  const readable = slug
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
  const [firstOpen] = openSubjects;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-16">
      <div className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8c5d14]">
          Not open in the beta yet
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-[#13251d]">
          {readable || "This subject"} is not available
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#495c52]">
          No reviewed study content, MCQ sets, or past questions have been published for this
          subject, so there is nothing here to study yet. It will appear in the sidebar when its
          content is reviewed and opened.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {firstOpen ? (
            <Link
              href={`/upsc/${firstOpen.slug}/lms`}
              className="inline-flex min-h-11 items-center rounded-lg bg-[#1a3a2a] px-4 text-sm font-bold text-white transition hover:bg-[#10291d]"
            >
              Continue with {firstOpen.label}
            </Link>
          ) : null}
          <Link
            href="/upsc"
            className="inline-flex min-h-11 items-center rounded-lg border border-[#cfc6b6] bg-white px-4 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
          >
            Back to Today
          </Link>
        </div>
      </div>
    </div>
  );
}
