# Pravedā Connected Architecture

## Patient
Landing → Identify → Language → Consent → Health Issue → Adaptive History → AYUSH (conditional) → Documents/OCR → Summary → Patient Record.

## Shared middle layer
Patient session and canonical patient_id feed medical history, documents, OCR extraction, timeline, completeness, priority, summary, and consultation workflow.

## Staff workflow
Queue Handler: WAITING → CHECKED_IN
Nurse: CHECKED_IN → NURSE_PREPARATION → READY_FOR_DOCTOR
Doctor: READY_FOR_DOCTOR → IN_CONSULTATION → COMPLETED

## Staff workspaces
All staff workspaces use the same consultation_workflows records. Queue and nurse workspaces use the shared operational patient loader. Doctor workspace uses the clinical patient loader.

## Security boundary
Supabase Auth + staff_profiles + RLS are the authorization boundary. localStorage is a cache/session aid, not an authorization source.
