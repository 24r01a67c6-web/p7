-- Pravedā Phase 6: nurse preparation fields.
-- Run after phase4_consultation_workflow.sql and phase5_clinical_data_rls.sql.
-- Additive only; no patient data is deleted.

alter table public.consultation_workflows
  add column if not exists nurse_vitals jsonb not null default '{}'::jsonb,
  add column if not exists nurse_notes text,
  add column if not exists identity_verified_at timestamptz;

create index if not exists idx_consultation_workflows_nurse_status
  on public.consultation_workflows(department, status, updated_at desc);

notify pgrst, 'reload schema';
