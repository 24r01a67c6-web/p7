-- Pravedā Step 6: OCR structured JSONB column + RLS policies (idempotent)
-- Run in Supabase SQL Editor

-- 1. Add structured JSONB column to medical_documents for fast single-query restore
alter table public.medical_documents
  add column if not exists structured jsonb;

-- 2. Ensure OCR columns exist (step5 guard)
alter table public.medical_documents add column if not exists extracted_text text;
alter table public.medical_documents add column if not exists extraction_confidence text;
alter table public.medical_documents add column if not exists ocr_method text;

-- 3. RLS: allow anon key to insert/select/update/delete patient documents
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='medical_documents' and policyname='patient_insert_own') then
    create policy patient_insert_own on public.medical_documents for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='medical_documents' and policyname='patient_select_own') then
    create policy patient_select_own on public.medical_documents for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='medical_documents' and policyname='patient_update_own') then
    create policy patient_update_own on public.medical_documents for update using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='medical_documents' and policyname='patient_delete_own') then
    create policy patient_delete_own on public.medical_documents for delete using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='medical_document_items' and policyname='items_insert_own') then
    create policy items_insert_own on public.medical_document_items for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='medical_document_items' and policyname='items_select_own') then
    create policy items_select_own on public.medical_document_items for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='medical_document_items' and policyname='items_delete_own') then
    create policy items_delete_own on public.medical_document_items for delete using (true);
  end if;
end $$;
