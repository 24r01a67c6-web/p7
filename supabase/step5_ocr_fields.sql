-- Step 5: OCR fields (additive; safe to re-run)
alter table public.medical_documents add column if not exists extracted_text text;
alter table public.medical_documents add column if not exists extraction_confidence text;
alter table public.medical_documents add column if not exists ocr_method text;
