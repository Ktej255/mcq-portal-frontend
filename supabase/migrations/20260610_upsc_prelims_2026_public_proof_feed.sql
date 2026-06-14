create table if not exists public.upsc_prelims_2026_public_proof_feed (
  id text primary key,
  feed jsonb not null,
  claim_count integer not null default 0 check (claim_count >= 0),
  published_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists upsc_prelims_2026_public_proof_feed_published_idx
  on public.upsc_prelims_2026_public_proof_feed (published_at desc);

alter table public.upsc_prelims_2026_public_proof_feed enable row level security;

revoke all on table public.upsc_prelims_2026_public_proof_feed from anon, authenticated;
grant all on table public.upsc_prelims_2026_public_proof_feed to service_role;
