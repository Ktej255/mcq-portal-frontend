create table if not exists public.upsc_pyq_import_records (
  id text primary key,
  year integer not null check (year between 2010 and 2026),
  stage text not null check (stage in ('Prelims', 'Mains', 'Optional')),
  kind text not null check (kind in ('GS_PRELIMS', 'GS_MAINS', 'OPTIONAL_MAINS')),
  subject_slug text not null,
  subject_title text not null,
  paper text not null,
  question_number text not null,
  import_status text not null check (import_status in ('MAPPED', 'NEEDS_REVIEW')),
  text_status text not null check (text_status = 'EXACT_VERIFIED'),
  source_href text not null,
  record jsonb not null,
  imported_at timestamptz not null,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists upsc_pyq_import_records_subject_idx
  on public.upsc_pyq_import_records (subject_slug, year desc);

create index if not exists upsc_pyq_import_records_stage_idx
  on public.upsc_pyq_import_records (stage, kind, year desc);

create index if not exists upsc_pyq_import_records_status_idx
  on public.upsc_pyq_import_records (import_status, text_status);

alter table public.upsc_pyq_import_records enable row level security;

revoke all on table public.upsc_pyq_import_records from anon, authenticated;
grant all on table public.upsc_pyq_import_records to service_role;
