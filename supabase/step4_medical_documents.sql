-- Pravedā Step 4: Medical Document Intelligence (additive, idempotent)
create table if not exists public.medical_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  file_name text not null,
  file_type text,
  document_type text not null default 'Other',
  storage_path text,
  processing_status text not null default 'pending',
  document_date date,
  created_at timestamptz not null default now()
);
create table if not exists public.medical_document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.medical_documents(id) on delete cascade,
  item_type text not null,
  item_name text,
  value text,
  unit text,
  reference_range text,
  abnormal_flag boolean,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_medical_documents_patient on public.medical_documents(patient_id);
create index if not exists idx_medical_document_items_doc on public.medical_document_items(document_id);
alter table public.medical_documents enable row level security;
alter table public.medical_document_items enable row level security;
-- Storage bucket must be created once in Supabase dashboard: medical-documents (private)
