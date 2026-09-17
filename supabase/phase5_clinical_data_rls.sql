-- Pravedā Phase 5: security hardening for clinical data.
-- Run AFTER phase2_staff_roles.sql, phase3_security_hardening.sql,
-- phase4_consultation_workflow.sql, step4_medical_documents.sql and the
-- patient-auth SQL that creates patient_record_sessions.
--
-- Design goals:
-- * Staff authorization is database-enforced through staff_profiles.
-- * Queue handlers do not receive clinical tables.
-- * Doctors are scoped to patients in their assigned department.
-- * Nurses are scoped to patients in their department and active workflows.
-- * Admins get operational visibility but are NOT automatically granted clinical access.
-- * Existing custom patient phone/password flow is preserved; patient-facing direct
--   table access cannot be safely scoped by auth.uid() because that flow is not Supabase Auth.
--   Patient-specific read/write hardening therefore remains a follow-up boundary.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Shared helpers
-- ------------------------------------------------------------
create or replace function public.current_staff_profile()
returns public.staff_profiles
language sql
security definer
stable
set search_path = public, extensions
as $$
  select sp
  from public.staff_profiles sp
  where sp.user_id = auth.uid()
    and sp.is_active = true
  limit 1;
$$;

revoke all on function public.current_staff_profile() from public;
grant execute on function public.current_staff_profile() to authenticated;

create or replace function public.staff_department()
returns text
language sql
security definer
stable
set search_path = public, extensions
as $$
  select sp.department
  from public.staff_profiles sp
  where sp.user_id = auth.uid()
    and sp.is_active = true
  limit 1;
$$;

revoke all on function public.staff_department() from public;
grant execute on function public.staff_department() to authenticated;

-- IMPORTANT: staff_profiles role is immutable to the user. Only admin-controlled workflows
-- should change role/is_active. We intentionally do not recreate staff self-update RLS here.

-- ------------------------------------------------------------
-- Patients
-- ------------------------------------------------------------
alter table public.patients enable row level security;

drop policy if exists staff_patients_select on public.patients;
create policy staff_patients_select
on public.patients
for select to authenticated
using (
  public.has_staff_role(array['doctor','nurse','admin'])
  and (
    public.has_staff_role(array['admin'])
    or (public.staff_department() is not null and patients.department = public.staff_department())
  )
);

-- Do not allow ordinary staff to mutate patient identity records directly.
-- Registration remains through the existing SECURITY DEFINER patient RPC.
drop policy if exists staff_patients_insert on public.patients;
drop policy if exists staff_patients_update on public.patients;
drop policy if exists staff_patients_delete on public.patients;

-- ------------------------------------------------------------
-- Medical history
-- ------------------------------------------------------------
alter table public.medical_history enable row level security;

drop policy if exists staff_history_select on public.medical_history;
create policy staff_history_select
on public.medical_history
for select to authenticated
using (
  public.has_staff_role(array['doctor','nurse'])
  and exists (
    select 1
    from public.patients p
    where p.id = medical_history.patient_id
      and (
        public.has_staff_role(array['admin'])
        or (public.staff_department() is not null and p.department = public.staff_department())
      )
  )
);

-- Clinical history is written by the patient intake flow; staff do not write raw history rows.
drop policy if exists staff_history_insert on public.medical_history;
drop policy if exists staff_history_update on public.medical_history;
drop policy if exists staff_history_delete on public.medical_history;

-- ------------------------------------------------------------
-- Medical documents
-- ------------------------------------------------------------
alter table public.medical_documents enable row level security;

drop policy if exists patient_insert_own on public.medical_documents;
drop policy if exists patient_select_own on public.medical_documents;
drop policy if exists patient_update_own on public.medical_documents;
drop policy if exists patient_delete_own on public.medical_documents;

drop policy if exists staff_documents_select on public.medical_documents;
create policy staff_documents_select
on public.medical_documents
for select to authenticated
using (
  public.has_staff_role(array['doctor','nurse'])
  and exists (
    select 1
    from public.patients p
    where p.id = medical_documents.patient_id
      and public.staff_department() is not null
      and p.department = public.staff_department()
  )
);

-- Doctors/nurses may not arbitrarily create or delete clinical documents through table DML.
-- Existing document service remains responsible for document creation; patient-write
-- hardening must be moved behind the patient session RPC boundary in the next iteration.
drop policy if exists staff_documents_insert on public.medical_documents;
drop policy if exists staff_documents_update on public.medical_documents;
drop policy if exists staff_documents_delete on public.medical_documents;

-- ------------------------------------------------------------
-- Medical document items
-- ------------------------------------------------------------
alter table public.medical_document_items enable row level security;

drop policy if exists items_insert_own on public.medical_document_items;
drop policy if exists items_select_own on public.medical_document_items;
drop policy if exists items_delete_own on public.medical_document_items;

drop policy if exists staff_document_items_select on public.medical_document_items;
create policy staff_document_items_select
on public.medical_document_items
for select to authenticated
using (
  public.has_staff_role(array['doctor','nurse'])
  and exists (
    select 1
    from public.medical_documents d
    join public.patients p on p.id = d.patient_id
    where d.id = medical_document_items.document_id
      and public.staff_department() is not null
      and p.department = public.staff_department()
  )
);

drop policy if exists staff_document_items_insert on public.medical_document_items;
drop policy if exists staff_document_items_update on public.medical_document_items;
drop policy if exists staff_document_items_delete on public.medical_document_items;

-- ------------------------------------------------------------
-- Consultation workflows
-- ------------------------------------------------------------
alter table public.consultation_workflows enable row level security;

drop policy if exists consultation_workflows_queue_select on public.consultation_workflows;
drop policy if exists consultation_workflows_queue_update on public.consultation_workflows;
drop policy if exists consultation_workflows_staff_insert on public.consultation_workflows;

-- Queue handlers: workflow-only access.
create policy consultation_workflows_queue_handler_select
on public.consultation_workflows
for select to authenticated
using (public.has_staff_role(array['queue_handler','admin']));

create policy consultation_workflows_queue_handler_update
on public.consultation_workflows
for update to authenticated
using (public.has_staff_role(array['queue_handler','admin']))
with check (public.has_staff_role(array['queue_handler','admin']));

-- Nurse/doctor workflow visibility is restricted by department.
create policy consultation_workflows_clinical_staff_select
on public.consultation_workflows
for select to authenticated
using (
  public.has_staff_role(array['doctor','nurse'])
  and public.staff_department() is not null
  and consultation_workflows.department = public.staff_department()
);

-- Only doctor/nurse/admin may change clinical workflow states.
create policy consultation_workflows_clinical_staff_update
on public.consultation_workflows
for update to authenticated
using (
  public.has_staff_role(array['doctor','nurse','admin'])
  and (
    public.has_staff_role(array['admin'])
    or (public.staff_department() is not null and consultation_workflows.department = public.staff_department())
  )
)
with check (
  public.has_staff_role(array['doctor','nurse','admin'])
  and (
    public.has_staff_role(array['admin'])
    or (public.staff_department() is not null and consultation_workflows.department = public.staff_department())
  )
);

create policy consultation_workflows_staff_insert_v2
on public.consultation_workflows
for insert to authenticated
with check (
  public.has_staff_role(array['queue_handler','nurse','doctor','admin'])
  and (
    public.has_staff_role(array['admin'])
    or (public.staff_department() is not null and consultation_workflows.department = public.staff_department())
  )
);

-- ------------------------------------------------------------
-- Audit logs
-- ------------------------------------------------------------
alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin
on public.audit_logs
for select to authenticated
using (public.has_staff_role(array['admin']));

-- Explicitly prevent direct client inserts/updates/deletes to audit log.
drop policy if exists audit_logs_insert on public.audit_logs;
drop policy if exists audit_logs_update on public.audit_logs;
drop policy if exists audit_logs_delete on public.audit_logs;

-- ------------------------------------------------------------
-- Storage: private medical-documents bucket
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('medical-documents', 'medical-documents', false)
on conflict (id) do update set public = false;

-- Remove generic/public policies if they exist under these names.
drop policy if exists medical_docs_public_read on storage.objects;
drop policy if exists medical_docs_public_insert on storage.objects;
drop policy if exists medical_docs_public_update on storage.objects;
drop policy if exists medical_docs_public_delete on storage.objects;

-- Staff in the same department can read private medical documents by path prefix.
-- Patient-specific storage authorization remains tied to the custom patient session boundary
-- and is intentionally NOT guessed here.
drop policy if exists staff_medical_docs_read on storage.objects;
create policy staff_medical_docs_read
on storage.objects
for select to authenticated
using (
  bucket_id = 'medical-documents'
  and public.has_staff_role(array['doctor','nurse'])
  and public.staff_department() is not null
  and exists (
    select 1
    from public.patients p
    where p.id::text = split_part(name, '/', 1)
      and p.department = public.staff_department()
  )
);

-- Queue handlers receive no medical-document object access.


notify pgrst, 'reload schema';
