# Pravedā Phase 8 — Full Connection Pass

The application now has a small orchestration layer (`src/services/projectIntegrationService.js`) that connects the existing patient-record service and shared consultation workflow without creating a second data model.

## Canonical connection

Patient/session → patient record bundle → consultation workflow → staff workspace.

## Staff data sources

- Doctor / Nurse / Admin: `getOperationalPatients()` (department/RLS controlled by Supabase)
- Queue Handler: `getQueueOperationalPatients()` (dedicated least-privilege RPC)

## Patient record bundle

`getPatientWorkspaceSnapshot()` delegates to `getPatientDashboardData()` so profile, histories, documents, timeline, summary, completeness and workflow stay on one path.

## Database prerequisite

`supabase/phase8_integration_safety.sql` is an idempotent prerequisite that ensures the shared `consultation_workflows` relation exists before dependent Phase 7 objects are created.
