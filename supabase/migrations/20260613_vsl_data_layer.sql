-- CREATE TABLES FOR PHASE 2: VSL DATA LAYER

-- TABLE 1: leads
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_module varchar(50) not null,
  source_id varchar(255) not null,
  email varchar(255) not null,
  phone varchar(20),
  name varchar(255),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TABLE 2: followup_jobs
create table if not exists public.followup_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel varchar(20) not null check (channel in ('email','sms','whatsapp','push')),
  sequence_id varchar(255) not null,
  status varchar(20) not null default 'pending' check (status in ('pending','sent','failed')),
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- TABLE 3: hermes_jobs
create table if not exists public.hermes_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id text not null,
  job_type varchar(100) not null,
  input_data jsonb not null default '{}'::jsonb,
  output_data jsonb,
  status varchar(20) not null default 'queued' check (status in ('queued','processing','completed','failed')),
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- TABLE 4: vsl_funnels
create table if not exists public.vsl_funnels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title varchar(255) not null,
  slug varchar(100) not null,
  status varchar(20) not null default 'draft' check (status in ('draft','published','archived')),
  video_url text,
  video_transcript text,
  transcription_status varchar(20) default 'pending' check (transcription_status in ('pending','processing','completed','failed')),
  ai_trigger_threshold integer not null default 80,
  questionnaire_answers jsonb default '{}'::jsonb,
  hermes_job_id uuid references public.hermes_jobs(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(workspace_id, slug)
);

-- TABLE 5: vsl_pages
create table if not exists public.vsl_pages (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.vsl_funnels(id) on delete cascade,
  page_type varchar(20) not null check (page_type in ('vsl','thankyou','upsell')),
  page_order integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  published_content jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TABLE 6: vsl_sessions
create table if not exists public.vsl_sessions (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.vsl_funnels(id) on delete cascade,
  visitor_token varchar(255) not null,
  lead_id uuid references public.leads(id),
  watch_percentage decimal(5,2) not null default 0,
  ai_conversation_log jsonb not null default '[]'::jsonb,
  ai_triggered_at timestamptz,
  converted boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TABLE 7: vsl_templates
create table if not exists public.vsl_templates (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  category varchar(100) not null,
  thumbnail_url text,
  page_content jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- Row Level Security (RLS) Configuration
alter table public.leads enable row level security;
alter table public.followup_jobs enable row level security;
alter table public.hermes_jobs enable row level security;
alter table public.vsl_funnels enable row level security;
alter table public.vsl_pages enable row level security;
alter table public.vsl_sessions enable row level security;
alter table public.vsl_templates enable row level security;

-- leads: workspace-scoped (select policy)
drop policy if exists "Users can view leads in their workspace" on public.leads;
create policy "Users can view leads in their workspace"
  on public.leads
  for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = leads.workspace_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

-- followup_jobs: workspace-scoped (select policy)
drop policy if exists "Users can view followup jobs in their workspace" on public.followup_jobs;
create policy "Users can view followup jobs in their workspace"
  on public.followup_jobs
  for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = followup_jobs.workspace_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

-- hermes_jobs: workspace-scoped (select policy)
drop policy if exists "Users can view hermes jobs in their workspace" on public.hermes_jobs;
create policy "Users can view hermes jobs in their workspace"
  on public.hermes_jobs
  for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = hermes_jobs.workspace_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

-- vsl_funnels: workspace-scoped (select policy)
drop policy if exists "Users can view funnels in their workspace" on public.vsl_funnels;
create policy "Users can view funnels in their workspace"
  on public.vsl_funnels
  for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = vsl_funnels.workspace_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

-- vsl_pages: accessible to workspace members who can access the funnel
drop policy if exists "Users can view pages of accessible funnels" on public.vsl_pages;
create policy "Users can view pages of accessible funnels"
  on public.vsl_pages
  for select
  using (
    exists (
      select 1 from public.vsl_funnels
      join public.workspace_members on workspace_members.workspace_id = vsl_funnels.workspace_id
      where vsl_funnels.id = vsl_pages.funnel_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

-- vsl_sessions: insert/update for anon (viewer side), read for workspace members
drop policy if exists "Anyone can insert sessions" on public.vsl_sessions;
create policy "Anyone can insert sessions"
  on public.vsl_sessions
  for insert
  with check (true);

drop policy if exists "Anyone can update sessions" on public.vsl_sessions;
create policy "Anyone can update sessions"
  on public.vsl_sessions
  for update
  using (true);

drop policy if exists "Workspace members can view sessions" on public.vsl_sessions;
create policy "Workspace members can view sessions"
  on public.vsl_sessions
  for select
  using (
    exists (
      select 1 from public.vsl_funnels
      join public.workspace_members on workspace_members.workspace_id = vsl_funnels.workspace_id
      where vsl_funnels.id = vsl_sessions.funnel_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

-- vsl_templates: read-only for all authenticated users
drop policy if exists "Authenticated users can read templates" on public.vsl_templates;
create policy "Authenticated users can read templates"
  on public.vsl_templates
  for select
  using (auth.uid() is not null or auth.jwt()->>'sub' is not null);

-- Seed templates:
insert into public.vsl_templates (name, category, page_content, is_active)
values 
  ('Clean Coaching VSL', 'coaching', '{}'::jsonb, true),
  ('Product Launch VSL', 'ecommerce', '{}'::jsonb, true),
  ('Course Sales VSL', 'education', '{}'::jsonb, true)
on conflict do nothing;
