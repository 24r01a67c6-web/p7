-- Pravedā Phase 8: integration prerequisites.
-- Safe to run after the earlier phase migrations.
-- This migration only ensures the shared workflow exists before dependent RPCs/policies.

create extension if not exists pgcrypto;

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
  nurse_vitals jsonb not null default '{}'::jsonb,
  nurse_notes text,
  identity_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.consultation_workflows
  add column if not exists nurse_vitals jsonb not null default '{}'::jsonb,
  add column if not exists nurse_notes text,
  add column if not exists identity_verified_at timestamptz,
  add column if not exists ready_for_doctor_at timestamptz;

create index if not exists idx_consultation_workflows_status_v8
  on public.consultation_workflows(status, updated_at desc);

create index if not exists idx_consultation_workflows_department_v8
  on public.consultation_workflows(department, status, updated_at desc);

alter table public.consultation_workflows enable row level security;

notify pgrst, 'reload schema';
