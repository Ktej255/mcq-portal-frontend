select
  c.relname as table_name,
  c.relrowsecurity as row_level_security_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'upsc_adaptive_teacher_rate_limits';

select
  routine_schema,
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'consume_upsc_adaptive_teacher_rate_limit';

select
  has_function_privilege(
    'anon',
    'public.consume_upsc_adaptive_teacher_rate_limit(text, integer, integer)',
    'execute'
  ) as anon_can_execute,
  has_function_privilege(
    'authenticated',
    'public.consume_upsc_adaptive_teacher_rate_limit(text, integer, integer)',
    'execute'
  ) as authenticated_can_execute,
  has_function_privilege(
    'service_role',
    'public.consume_upsc_adaptive_teacher_rate_limit(text, integer, integer)',
    'execute'
  ) as service_role_can_execute;
