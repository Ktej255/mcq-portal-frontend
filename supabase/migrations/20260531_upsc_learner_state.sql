create table if not exists public.upsc_student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.upsc_subject_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_slug text not null,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, subject_slug)
);

alter table public.upsc_student_profiles enable row level security;
alter table public.upsc_subject_progress enable row level security;

drop policy if exists "Students manage their UPSC profile" on public.upsc_student_profiles;
create policy "Students manage their UPSC profile"
  on public.upsc_student_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Students manage their UPSC subject progress" on public.upsc_subject_progress;
create policy "Students manage their UPSC subject progress"
  on public.upsc_subject_progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
