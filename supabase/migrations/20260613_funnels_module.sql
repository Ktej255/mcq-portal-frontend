-- CREATE TABLES FOR MODULE 11: FUNNELS + TEMPLATES

-- TABLE 1: funnel_projects
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

-- TABLE 2: funnel_steps
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

-- TABLE 3: funnel_templates
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
  steps_template jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  is_premium boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- TABLE 4: funnel_submissions
create table if not exists public.funnel_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.funnel_projects(id) on delete cascade,
  step_id uuid not null references public.funnel_steps(id) on delete cascade,
  lead_id uuid references public.leads(id),
  visitor_token varchar(255) not null,
  field_data jsonb not null default '{}'::jsonb,
  submitted_at timestamptz default now()
);

-- TABLE 5: funnel_analytics
create table if not exists public.funnel_analytics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.funnel_projects(id) on delete cascade,
  step_id uuid not null references public.funnel_steps(id) on delete cascade,
  visitor_token varchar(255) not null,
  event_type varchar(50) not null
    check (event_type in ('page_view','step_complete','step_skip','form_submit','cta_click','exit')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- RLS Configurations
alter table public.funnel_projects enable row level security;
alter table public.funnel_steps enable row level security;
alter table public.funnel_templates enable row level security;
alter table public.funnel_submissions enable row level security;
alter table public.funnel_analytics enable row level security;

-- funnel_projects: workspace-scoped select/insert/update/delete
drop policy if exists "Users can view funnel projects in their workspace" on public.funnel_projects;
create policy "Users can view funnel projects in their workspace"
  on public.funnel_projects
  for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = funnel_projects.workspace_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

drop policy if exists "Users can manage funnel projects in their workspace" on public.funnel_projects;
create policy "Users can manage funnel projects in their workspace"
  on public.funnel_projects
  for all
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = funnel_projects.workspace_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = funnel_projects.workspace_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

-- funnel_steps: accessible to workspace members who own the project
drop policy if exists "Users can view funnel steps" on public.funnel_steps;
create policy "Users can view funnel steps"
  on public.funnel_steps
  for select
  using (
    exists (
      select 1 from public.funnel_projects
      join public.workspace_members on workspace_members.workspace_id = funnel_projects.workspace_id
      where funnel_projects.id = funnel_steps.project_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

drop policy if exists "Users can manage funnel steps" on public.funnel_steps;
create policy "Users can manage funnel steps"
  on public.funnel_steps
  for all
  using (
    exists (
      select 1 from public.funnel_projects
      join public.workspace_members on workspace_members.workspace_id = funnel_projects.workspace_id
      where funnel_projects.id = funnel_steps.project_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  )
  with check (
    exists (
      select 1 from public.funnel_projects
      join public.workspace_members on workspace_members.workspace_id = funnel_projects.workspace_id
      where funnel_projects.id = funnel_steps.project_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

-- funnel_templates: read-only for all authenticated users
drop policy if exists "Anyone can select active templates" on public.funnel_templates;
create policy "Anyone can select active templates"
  on public.funnel_templates
  for select
  using (auth.uid() is not null or auth.jwt()->>'sub' is not null);

-- funnel_submissions: insert for anon, read for workspace members
drop policy if exists "Anyone can insert funnel submissions" on public.funnel_submissions;
create policy "Anyone can insert funnel submissions"
  on public.funnel_submissions
  for insert
  with check (true);

drop policy if exists "Workspace members can view funnel submissions" on public.funnel_submissions;
create policy "Workspace members can view funnel submissions"
  on public.funnel_submissions
  for select
  using (
    exists (
      select 1 from public.funnel_projects
      join public.workspace_members on workspace_members.workspace_id = funnel_projects.workspace_id
      where funnel_projects.id = funnel_submissions.project_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

-- funnel_analytics: insert for anon, read for workspace members
drop policy if exists "Anyone can insert analytics" on public.funnel_analytics;
create policy "Anyone can insert analytics"
  on public.funnel_analytics
  for insert
  with check (true);

drop policy if exists "Workspace members can view analytics" on public.funnel_analytics;
create policy "Workspace members can view analytics"
  on public.funnel_analytics
  for select
  using (
    exists (
      select 1 from public.funnel_projects
      join public.workspace_members on workspace_members.workspace_id = funnel_projects.workspace_id
      where funnel_projects.id = funnel_analytics.project_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

-- Seed 8 starter templates into funnel_templates:
insert into public.funnel_templates (name, category, funnel_type, tags, step_count, description, steps_template, is_active)
values
  ('Free Webinar Registration', 'general', 'webinar', '{"beginner_friendly"}', 2, 'Simple 2-step webinar registration funnel', '[]'::jsonb, true),
  ('Lead Magnet Opt-in', 'education', 'optin', '{"beginner_friendly"}', 2, 'Collect emails with a free resource offer', '[]'::jsonb, true),
  ('High Ticket Application', 'coaching', 'application', '{"high_ticket"}', 3, 'Qualify leads before booking a sales call', '[]'::jsonb, true),
  ('Product Launch Funnel', 'ecommerce', 'sales', '{"ecommerce"}', 4, '4-step product launch with upsell', '[]'::jsonb, true),
  ('UPSC Coaching Opt-in', 'education', 'optin', '{"beginner_friendly","vsl_compatible"}', 2, 'Capture UPSC aspirant leads with a free resource', '[]'::jsonb, true),
  ('Free Challenge Registration', 'health', 'challenge', '{"engagement"}', 3, '5-day challenge with daily email sequence', '[]'::jsonb, true),
  ('SaaS Free Trial Funnel', 'saas', 'optin', '{"saas","vsl_compatible"}', 2, 'Collect trial signups with feature highlights', '[]'::jsonb, true),
  ('School Admission Enquiry', 'education', 'application', '{"beginner_friendly"}', 3, 'Parent enquiry form with follow-up sequence', '[]'::jsonb, true)
on conflict do nothing;
