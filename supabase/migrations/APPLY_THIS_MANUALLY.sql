-- ============================================================
-- SARIT PLATFORM — COMBINED MIGRATION SCRIPT
-- Apply this in Supabase Dashboard > SQL Editor
-- Run backbone first, then data layer, then funnels.
-- Each table uses CREATE TABLE IF NOT EXISTS — safe to re-run.
-- ============================================================

-- =============================================
-- PART 1: BACKBONE (workspaces, members, subscriptions)
-- Source: 20260612_vsl_backbone.sql
-- =============================================

-- Create enum types if they don't exist
do $$
begin
  if not exists (select 1 from pg_type where typname = 'workspace_plan') then
    create type workspace_plan as enum ('free', 'starter', 'pro', 'agency');
  end if;
  if not exists (select 1 from pg_type where typname = 'workspace_role') then
    create type workspace_role as enum ('owner', 'admin', 'member');
  end if;
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type subscription_status as enum ('active', 'trial', 'expired', 'cancelled');
  end if;
end$$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  slug varchar(100) unique not null,
  plan workspace_plan not null default 'free',
  settings jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id text not null,
  role workspace_role not null default 'member',
  invited_at timestamptz not null default timezone('utc'::text, now()),
  accepted_at timestamptz,
  unique (workspace_id, user_id)
);

create table if not exists public.module_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  module_slug varchar(50) not null,
  status subscription_status not null default 'active',
  cashfree_subscription_id varchar(255),
  started_at timestamptz not null default timezone('utc'::text, now()),
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (workspace_id, module_slug)
);

-- Enable RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.module_subscriptions enable row level security;

-- RLS Policies: workspaces
drop policy if exists "Users can view workspaces they are member of" on public.workspaces;
create policy "Users can view workspaces they are member of"
  on public.workspaces for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspaces.id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

drop policy if exists "Workspace owners can update workspaces" on public.workspaces;
create policy "Workspace owners can update workspaces"
  on public.workspaces for update
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspaces.id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
      and workspace_members.role = 'owner'
    )
  );

drop policy if exists "Workspace members can view workspace membership" on public.workspace_members;
create policy "Workspace members can view workspace membership"
  on public.workspace_members for select
  using (
    exists (
      select 1 from public.workspace_members as self
      where self.workspace_id = workspace_members.workspace_id
      and (self.user_id = auth.uid()::text or self.user_id = auth.jwt()->>'sub')
    )
  );

drop policy if exists "Workspace members can view subscriptions" on public.module_subscriptions;
create policy "Workspace members can view subscriptions"
  on public.module_subscriptions for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = module_subscriptions.workspace_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

-- =============================================
-- PART 2: VSL DATA LAYER (7 tables)
-- Source: 20260613_vsl_data_layer.sql
-- =============================================

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

create table if not exists public.followup_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel varchar(20) not null check (channel in ('email','sms','whatsapp','push')),
  sequence_id varchar(255) not null,
  status varchar(20) not null default 'pending' check (status in ('pending','sent','failed')),
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

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

create table if not exists public.vsl_templates (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  category varchar(100) not null,
  thumbnail_url text,
  page_content jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- Enable RLS on VSL tables
alter table public.leads enable row level security;
alter table public.followup_jobs enable row level security;
alter table public.hermes_jobs enable row level security;
alter table public.vsl_funnels enable row level security;
alter table public.vsl_pages enable row level security;
alter table public.vsl_sessions enable row level security;
alter table public.vsl_templates enable row level security;

-- RLS Policies
drop policy if exists "Users can view leads in their workspace" on public.leads;
create policy "Users can view leads in their workspace"
  on public.leads for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = leads.workspace_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

drop policy if exists "Users can view followup jobs in their workspace" on public.followup_jobs;
create policy "Users can view followup jobs in their workspace"
  on public.followup_jobs for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = followup_jobs.workspace_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

drop policy if exists "Users can view hermes jobs in their workspace" on public.hermes_jobs;
create policy "Users can view hermes jobs in their workspace"
  on public.hermes_jobs for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = hermes_jobs.workspace_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

drop policy if exists "Users can view funnels in their workspace" on public.vsl_funnels;
create policy "Users can view funnels in their workspace"
  on public.vsl_funnels for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = vsl_funnels.workspace_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

drop policy if exists "Users can view pages of accessible funnels" on public.vsl_pages;
create policy "Users can view pages of accessible funnels"
  on public.vsl_pages for select
  using (
    exists (
      select 1 from public.vsl_funnels
      join public.workspace_members on workspace_members.workspace_id = vsl_funnels.workspace_id
      where vsl_funnels.id = vsl_pages.funnel_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

drop policy if exists "Anyone can insert sessions" on public.vsl_sessions;
create policy "Anyone can insert sessions"
  on public.vsl_sessions for insert with check (true);

drop policy if exists "Anyone can update sessions" on public.vsl_sessions;
create policy "Anyone can update sessions"
  on public.vsl_sessions for update using (true);

drop policy if exists "Workspace members can view sessions" on public.vsl_sessions;
create policy "Workspace members can view sessions"
  on public.vsl_sessions for select
  using (
    exists (
      select 1 from public.vsl_funnels
      join public.workspace_members on workspace_members.workspace_id = vsl_funnels.workspace_id
      where vsl_funnels.id = vsl_sessions.funnel_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

drop policy if exists "Authenticated users can read templates" on public.vsl_templates;
create policy "Authenticated users can read templates"
  on public.vsl_templates for select
  using (auth.uid() is not null or auth.jwt()->>'sub' is not null);

-- Seed VSL templates
insert into public.vsl_templates (name, category, page_content, is_active)
values
  ('Clean Coaching VSL', 'coaching', '{}'::jsonb, true),
  ('Product Launch VSL', 'ecommerce', '{}'::jsonb, true),
  ('Course Sales VSL', 'education', '{}'::jsonb, true)
on conflict do nothing;

-- =============================================
-- PART 3: MODULE 11 — FUNNELS + TEMPLATES
-- Source: 20260613_funnels_module.sql
-- =============================================

create table if not exists public.funnel_projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name varchar(255) not null,
  slug varchar(100) not null,
  description text,
  funnel_type varchar(50) not null default 'general'
    check (funnel_type in ('general','optin','lead_magnet','webinar','sales','challenge','application','vsl')),
  status varchar(20) not null default 'draft'
    check (status in ('draft','published','archived')),
  goal varchar(100)
    check (goal in ('collect_leads','sell_product','book_call','register_webinar','build_waitlist','download_resource')),
  hermes_job_id uuid references public.hermes_jobs(id),
  questionnaire_answers jsonb default '{}'::jsonb,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(workspace_id, slug)
);

create table if not exists public.funnel_steps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.funnel_projects(id) on delete cascade,
  step_order integer not null default 0,
  step_type varchar(50) not null
    check (step_type in ('optin','sales','video','thankyou','upsell','downsell','bridge','webinar_reg','application','countdown')),
  title varchar(255) not null,
  content jsonb not null default '{}'::jsonb,
  published_content jsonb,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.funnel_templates (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  description text,
  category varchar(100) not null
    check (category in ('coaching','ecommerce','education','health','finance','real_estate','saas','events','general')),
  funnel_type varchar(50) not null default 'general',
  tags text[] default '{}'::text[],
  thumbnail_url text,
  preview_url text,
  step_count integer not null default 1,
  step_blueprints jsonb default '[]'::jsonb,
  is_active boolean not null default true,
  is_vsl_compatible boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists public.funnel_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.funnel_projects(id) on delete cascade,
  step_id uuid not null references public.funnel_steps(id) on delete cascade,
  lead_id uuid references public.leads(id),
  visitor_token varchar(255) not null,
  field_data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.funnel_analytics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.funnel_projects(id) on delete cascade,
  step_id uuid references public.funnel_steps(id) on delete set null,
  visitor_token varchar(255) not null,
  event_type varchar(50) not null
    check (event_type in ('page_view','form_submit','step_complete','cta_click','exit')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.funnel_projects enable row level security;
alter table public.funnel_steps enable row level security;
alter table public.funnel_templates enable row level security;
alter table public.funnel_submissions enable row level security;
alter table public.funnel_analytics enable row level security;

-- RLS Policies for funnels module
drop policy if exists "Workspace members can view funnel projects" on public.funnel_projects;
create policy "Workspace members can view funnel projects"
  on public.funnel_projects for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = funnel_projects.workspace_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

drop policy if exists "Workspace members can view funnel steps" on public.funnel_steps;
create policy "Workspace members can view funnel steps"
  on public.funnel_steps for select
  using (
    exists (
      select 1 from public.funnel_projects
      join public.workspace_members on workspace_members.workspace_id = funnel_projects.workspace_id
      where funnel_projects.id = funnel_steps.project_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

drop policy if exists "Authenticated users can read funnel templates" on public.funnel_templates;
create policy "Authenticated users can read funnel templates"
  on public.funnel_templates for select
  using (true);

drop policy if exists "Anyone can insert funnel submissions" on public.funnel_submissions;
create policy "Anyone can insert funnel submissions"
  on public.funnel_submissions for insert with check (true);

drop policy if exists "Anyone can insert funnel analytics" on public.funnel_analytics;
create policy "Anyone can insert funnel analytics"
  on public.funnel_analytics for insert with check (true);

drop policy if exists "Workspace members can view funnel analytics" on public.funnel_analytics;
create policy "Workspace members can view funnel analytics"
  on public.funnel_analytics for select
  using (
    exists (
      select 1 from public.funnel_projects
      join public.workspace_members on workspace_members.workspace_id = funnel_projects.workspace_id
      where funnel_projects.id = funnel_analytics.project_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

-- Seed Funnel Templates
insert into public.funnel_templates (name, description, category, funnel_type, tags, step_count, is_active, is_vsl_compatible)
values
  ('Free Webinar Registration', 'Simple 2-step webinar registration funnel', 'events', 'webinar', ARRAY['beginner_friendly'], 2, true, false),
  ('Lead Magnet Opt-in', 'Offer a free resource to collect email leads', 'education', 'optin', ARRAY['beginner_friendly'], 2, true, false),
  ('High Ticket Application', 'Application funnel for premium coaching programs', 'coaching', 'application', ARRAY['high_ticket'], 3, true, false),
  ('Product Launch Funnel', 'Classic product launch sequence', 'ecommerce', 'sales', ARRAY['ecommerce'], 4, true, false),
  ('UPSC Coaching Opt-in', 'Opt-in funnel for UPSC aspirants', 'education', 'optin', ARRAY['beginner_friendly','vsl_compatible'], 2, true, true),
  ('Free Challenge Registration', 'Register leads for a multi-day challenge', 'health', 'challenge', ARRAY['engagement'], 3, true, false),
  ('SaaS Free Trial Funnel', 'Convert visitors into free trial users', 'saas', 'optin', ARRAY['saas','vsl_compatible'], 2, true, true),
  ('School Admission Enquiry', 'Collect admission enquiries from parents', 'education', 'application', ARRAY['beginner_friendly'], 3, true, false)
on conflict do nothing;

-- =============================================
-- VERIFICATION QUERY — Run this last to confirm
-- Expected: 13 rows returned
-- =============================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'workspaces',
  'workspace_members',
  'module_subscriptions',
  'leads',
  'followup_jobs',
  'hermes_jobs',
  'vsl_funnels',
  'vsl_pages',
  'vsl_sessions',
  'vsl_templates',
  'funnel_projects',
  'funnel_steps',
  'funnel_templates',
  'funnel_submissions',
  'funnel_analytics'
)
ORDER BY table_name;
-- Expected: 15 rows returned (all tables above)
