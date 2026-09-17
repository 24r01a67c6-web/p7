# Pravedā Phase 4 — Shared Consultation Workflow

## Persistent state machine
WAITING → CHECKED_IN → NURSE_PREPARATION → READY_FOR_DOCTOR → IN_CONSULTATION → COMPLETED

The `consultation_workflows` table is the shared source of truth when the Phase 4 migration is applied. The client keeps a best-effort local cache for graceful operation before migration.

## Role actions
- Queue Handler: WAITING → CHECKED_IN
- Nurse: CHECKED_IN → NURSE_PREPARATION → READY_FOR_DOCTOR
- Doctor: READY_FOR_DOCTOR → IN_CONSULTATION → COMPLETED

## Safety
Invalid transitions are rejected by the workflow service. Clinical content remains outside the workflow table and stays in the existing patient/history/document systems.
