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

-- Add RLS policies for authenticated users
drop policy if exists "Users can view workspaces they are member of" on public.workspaces;
create policy "Users can view workspaces they are member of"
  on public.workspaces
  for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspaces.id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );

drop policy if exists "Workspace owners can update workspaces" on public.workspaces;
create policy "Workspace owners can update workspaces"
  on public.workspaces
  for update
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspaces.id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
      and workspace_members.role = 'owner'
    )
  );

-- Workspace members: user is a member of the same workspace
drop policy if exists "Workspace members can view workspace membership" on public.workspace_members;
create policy "Workspace members can view workspace membership"
  on public.workspace_members
  for select
  using (
    exists (
      select 1 from public.workspace_members as self
      where self.workspace_id = workspace_members.workspace_id
      and (self.user_id = auth.uid()::text or self.user_id = auth.jwt()->>'sub')
    )
  );

-- Module subscriptions: user is member of that workspace
drop policy if exists "Workspace members can view subscriptions" on public.module_subscriptions;
create policy "Workspace members can view subscriptions"
  on public.module_subscriptions
  for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = module_subscriptions.workspace_id
      and (workspace_members.user_id = auth.uid()::text or workspace_members.user_id = auth.jwt()->>'sub')
    )
  );
