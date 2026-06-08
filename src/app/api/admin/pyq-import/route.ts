import { NextRequest, NextResponse } from "next/server";

import { hasInternalApiAccess } from "@/lib/auth/internal-api-access";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  dedupePyqImportRecords,
  parsePyqImportRecord,
  parsePyqImportRecords,
  type PyqImportRecord,
} from "@/lib/upsc/pyqImportLedger";

export const dynamic = "force-dynamic";

const PYQ_IMPORT_TABLE = "upsc_pyq_import_records";
const MAX_IMPORT_REQUEST_BYTES = 900_000;

type PyqImportDatabaseRow = {
  id: string;
  year: number;
  stage: string;
  kind: string;
  subject_slug: string;
  subject_title: string;
  paper: string;
  question_number: string;
  import_status: string;
  text_status: string;
  source_href: string;
  record: PyqImportRecord;
  imported_at: string;
  updated_at?: string;
};

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function localOnlyPayload(message = "Supabase admin persistence is not configured. Exact PYQ rows remain browser-local.") {
  return {
    mode: "local-only",
    records: [],
    savedCount: 0,
    table: PYQ_IMPORT_TABLE,
    message,
  };
}

function unavailablePayload(message: string) {
  return {
    mode: "unavailable",
    records: [],
    savedCount: 0,
    table: PYQ_IMPORT_TABLE,
    message,
  };
}

function rowFromRecord(record: PyqImportRecord) {
  return {
    id: record.id,
    year: record.year,
    stage: record.stage,
    kind: record.kind,
    subject_slug: record.subjectSlug,
    subject_title: record.subjectTitle,
    paper: record.paper,
    question_number: record.questionNumber,
    import_status: record.importStatus,
    text_status: record.textStatus,
    source_href: record.sourceHref,
    record,
    imported_at: record.importedAt,
    updated_at: new Date().toISOString(),
  };
}

function recordFromRow(row: Partial<PyqImportDatabaseRow>) {
  return parsePyqImportRecord(row.record);
}

async function readBoundedJsonBody(request: NextRequest) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_IMPORT_REQUEST_BYTES) {
    return { status: "too-large" as const };
  }

  const rawBody = await request.text().catch(() => null);
  if (rawBody === null) return { status: "invalid" as const };
  if (new TextEncoder().encode(rawBody).byteLength > MAX_IMPORT_REQUEST_BYTES) {
    return { status: "too-large" as const };
  }

  try {
    return { status: "ready" as const, body: JSON.parse(rawBody) as unknown };
  } catch {
    return { status: "invalid" as const };
  }
}

async function readPersistedRecords() {
  const client = getSupabaseAdminClient();
  if (!client) return localOnlyPayload();

  try {
    const { data, error } = await client
      .from(PYQ_IMPORT_TABLE)
      .select("record")
      .order("imported_at", { ascending: false })
      .limit(2_000);

    if (error) {
      return unavailablePayload(`Supabase PYQ import table is not ready: ${error.message}`);
    }

    const records = dedupePyqImportRecords(
      (data ?? []).map((row) => recordFromRow(row as Partial<PyqImportDatabaseRow>)).filter(Boolean) as PyqImportRecord[]
    );

    return {
      mode: "supabase",
      records,
      savedCount: records.length,
      table: PYQ_IMPORT_TABLE,
      message: "Supabase persistence is active for exact PYQ import rows.",
    };
  } catch (error) {
    return unavailablePayload(
      error instanceof Error
        ? `Supabase PYQ import persistence failed: ${error.message}`
        : "Supabase PYQ import persistence failed."
    );
  }
}

export async function GET(request: NextRequest) {
  if (!(await hasInternalApiAccess(request))) {
    return noStoreJson({ message: "Master access required" }, { status: 403 });
  }

  return noStoreJson(await readPersistedRecords());
}

export async function POST(request: NextRequest) {
  if (!(await hasInternalApiAccess(request))) {
    return noStoreJson({ message: "Master access required" }, { status: 403 });
  }

  if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") {
    return noStoreJson({ message: "JSON PYQ import request required" }, { status: 415 });
  }

  const parsedBody = await readBoundedJsonBody(request);
  if (parsedBody.status === "too-large") {
    return noStoreJson({ message: "PYQ import request is too large" }, { status: 413 });
  }
  if (parsedBody.status !== "ready") {
    return noStoreJson({ message: "Invalid PYQ import request" }, { status: 400 });
  }

  const body = parsedBody.body as { records?: unknown };
  const records = parsePyqImportRecords(body.records).filter((record) => record.textStatus === "EXACT_VERIFIED");
  if (records.length === 0) {
    return noStoreJson({ message: "At least one exact verified PYQ row is required" }, { status: 400 });
  }

  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson(localOnlyPayload("Supabase admin persistence is not configured. Accepted rows remain browser-local."));
  }

  try {
    const { error } = await client.from(PYQ_IMPORT_TABLE).upsert(records.map(rowFromRecord), { onConflict: "id" });
    if (error) {
      return noStoreJson(unavailablePayload(`Supabase PYQ import table is not ready: ${error.message}`));
    }

    return noStoreJson(await readPersistedRecords());
  } catch (error) {
    return noStoreJson(
      unavailablePayload(
        error instanceof Error
          ? `Supabase PYQ import persistence failed: ${error.message}`
          : "Supabase PYQ import persistence failed."
      )
    );
  }
}
