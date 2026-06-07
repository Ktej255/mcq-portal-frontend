create table if not exists public.upsc_adaptive_teacher_rate_limits (
  request_key_hash text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.upsc_adaptive_teacher_rate_limits enable row level security;

revoke all on table public.upsc_adaptive_teacher_rate_limits from anon, authenticated;

create or replace function public.consume_upsc_adaptive_teacher_rate_limit(
  p_request_key_hash text,
  p_window_seconds integer default 60,
  p_request_limit integer default 12
)
returns table (
  allowed boolean,
  request_limit integer,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_time timestamptz := timezone('utc'::text, now());
  current_count integer;
  current_window_started_at timestamptz;
begin
  if p_request_key_hash is null or length(trim(p_request_key_hash)) < 16 then
    raise exception 'A hashed request identity is required.';
  end if;

  if p_window_seconds < 1 or p_window_seconds > 3600 then
    raise exception 'The rate-limit window must be between 1 and 3600 seconds.';
  end if;

  if p_request_limit < 1 or p_request_limit > 1000 then
    raise exception 'The request limit must be between 1 and 1000.';
  end if;

  insert into public.upsc_adaptive_teacher_rate_limits (
    request_key_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values (
    trim(p_request_key_hash),
    current_time,
    1,
    current_time
  )
  on conflict (request_key_hash) do update
    set
      window_started_at = case
        when public.upsc_adaptive_teacher_rate_limits.window_started_at
          + make_interval(secs => p_window_seconds) <= excluded.updated_at
          then excluded.updated_at
        else public.upsc_adaptive_teacher_rate_limits.window_started_at
      end,
      request_count = case
        when public.upsc_adaptive_teacher_rate_limits.window_started_at
          + make_interval(secs => p_window_seconds) <= excluded.updated_at
          then 1
        else public.upsc_adaptive_teacher_rate_limits.request_count + 1
      end,
      updated_at = excluded.updated_at
  returning
    public.upsc_adaptive_teacher_rate_limits.request_count,
    public.upsc_adaptive_teacher_rate_limits.window_started_at
  into current_count, current_window_started_at;

  allowed := current_count <= p_request_limit;
  request_limit := p_request_limit;
  remaining := greatest(p_request_limit - current_count, 0);
  retry_after_seconds := case
    when allowed then 0
    else greatest(
      1,
      ceil(
        extract(
          epoch from (
            current_window_started_at
            + make_interval(secs => p_window_seconds)
            - current_time
          )
        )
      )::integer
    )
  end;

  return next;
end;
$$;

revoke execute on function public.consume_upsc_adaptive_teacher_rate_limit(text, integer, integer)
  from public, anon, authenticated;

grant execute on function public.consume_upsc_adaptive_teacher_rate_limit(text, integer, integer)
  to service_role;
