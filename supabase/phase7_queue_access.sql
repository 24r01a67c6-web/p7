-- Pravedā Phase 7: least-privilege queue access.
-- Returns only operational fields needed by queue handlers.
-- Run after phase2_staff_roles.sql, phase3_security_hardening.sql,
-- phase4_consultation_workflow.sql and phase5_clinical_data_rls.sql.

create or replace function public.get_queue_patients()
returns table (
  patient_id uuid,
  name text,
  age integer,
  gender text,
  language text,
  department text,
  patient_code text,
  queue_token text,
  status text,
  priority text,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public, extensions
as $$
  select
    p.id,
    p.name,
    p.age,
    p.gender,
    p.language,
    p.department,
    p.patient_code,
    w.queue_token,
    coalesce(w.status, 'WAITING'),
    coalesce(w.priority, 'NORMAL'),
    p.created_at
  from public.patients p
  left join public.consultation_workflows w on w.patient_id = p.id
  where public.has_staff_role(array['queue_handler','admin'])
    and (
      public.has_staff_role(array['admin'])
      or (public.staff_department() is not null and p.department = public.staff_department())
    )
  order by
    case when coalesce(w.priority, 'NORMAL') = 'HIGH' then 0 else 1 end,
    p.created_at desc;
$$;

revoke all on function public.get_queue_patients() from public;
grant execute on function public.get_queue_patients() to authenticated;

notify pgrst, 'reload schema';
