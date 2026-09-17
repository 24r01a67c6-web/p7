-- Pravedā Phase 3: staff security foundation and audit trail.
-- Run after phase2_staff_roles.sql.
-- This migration intentionally does NOT tighten patient/medical-history/document RLS yet,
-- because the current patient-facing flow still uses the custom session-token/RPC model.
-- That boundary will be migrated in a later step so we do not break the working patient journey.

create extension if not exists pgcrypto;

-- Helper used by staff-only policies. SECURITY DEFINER avoids policy recursion.
create or replace function public.has_staff_role(p_roles text[])
returns boolean
language sql
security definer
stable
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = auth.uid()
      and sp.is_active = true
      and sp.role = any(p_roles)
  );
$$;

revoke all on function public.has_staff_role(text[]) from public;
grant execute on function public.has_staff_role(text[]) to authenticated;

-- Tighten staff profile visibility: self + admins only.
alter table public.staff_profiles enable row level security;

drop policy if exists staff_profiles_select_self on public.staff_profiles;
drop policy if exists staff_profiles_select_admin on public.staff_profiles;
drop policy if exists staff_profiles_update_self on public.staff_profiles;
drop policy if exists staff_profiles_update_admin on public.staff_profiles;

create policy staff_profiles_select_self
on public.staff_profiles
for select to authenticated
using (user_id = auth.uid());

create policy staff_profiles_select_admin
on public.staff_profiles
for select to authenticated
using (public.has_staff_role(array['admin']));

create policy staff_profiles_update_self
on public.staff_profiles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy staff_profiles_update_admin
on public.staff_profiles
for update to authenticated
using (public.has_staff_role(array['admin']))
with check (public.has_staff_role(array['admin']));

-- Audit trail. Store event metadata, but never passwords or raw secrets.
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_user_id, created_at desc);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin
on public.audit_logs
for select to authenticated
using (public.has_staff_role(array['admin']));

-- Clients write through this controlled function instead of inserting arbitrary actor identity.
create or replace function public.write_audit_event(
  p_action text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_role text;
begin
  select sp.role into v_role
  from public.staff_profiles sp
  where sp.user_id = auth.uid() and sp.is_active = true
  limit 1;

  if v_role is null then
    raise exception 'Active staff profile required.' using errcode = '42501';
  end if;

  insert into public.audit_logs(actor_user_id, actor_role, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    v_role,
    left(coalesce(nullif(trim(p_action), ''), 'unknown'), 120),
    left(nullif(trim(p_entity_type), ''), 80),
    p_entity_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.write_audit_event(text, text, uuid, jsonb) from public;
grant execute on function public.write_audit_event(text, text, uuid, jsonb) to authenticated;

notify pgrst, 'reload schema';
