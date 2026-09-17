-- Pravedā Phase 4: shared consultation workflow.
-- Run after phase2_staff_roles.sql and phase3_security_hardening.sql.

create table if not exists public.consultation_workflows (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null unique references public.patients(id) on delete cascade,
  assigned_doctor_id uuid references public.staff_profiles(id) on delete set null,
  department text,
  queue_token text,
  priority text not null default 'NORMAL',
  status text not null default 'WAITING' check (status in (
    'WAITING', 'CHECKED_IN', 'NURSE_PREPARATION', 'READY_FOR_DOCTOR', 'IN_CONSULTATION', 'COMPLETED'
  )),
  checked_in_at timestamptz,
  nurse_ready_at timestamptz,
  ready_for_doctor_at timestamptz,
  consultation_started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_consultation_workflows_status on public.consultation_workflows(status, updated_at desc);
create index if not exists idx_consultation_workflows_doctor on public.consultation_workflows(assigned_doctor_id, status, updated_at desc);
create index if not exists idx_consultation_workflows_department on public.consultation_workflows(department, status);

alter table public.consultation_workflows enable row level security;

drop policy if exists consultation_workflows_queue_select on public.consultation_workflows;
create policy consultation_workflows_queue_select
on public.consultation_workflows
for select to authenticated
using (public.has_staff_role(array['doctor','nurse','queue_handler','admin']));

drop policy if exists consultation_workflows_queue_update on public.consultation_workflows;
create policy consultation_workflows_queue_update
on public.consultation_workflows
for update to authenticated
using (public.has_staff_role(array['doctor','nurse','queue_handler','admin']))
with check (public.has_staff_role(array['doctor','nurse','queue_handler','admin']));

drop policy if exists consultation_workflows_staff_insert on public.consultation_workflows;
create policy consultation_workflows_staff_insert
on public.consultation_workflows
for insert to authenticated
with check (public.has_staff_role(array['doctor','nurse','queue_handler','admin']));

notify pgrst, 'reload schema';
