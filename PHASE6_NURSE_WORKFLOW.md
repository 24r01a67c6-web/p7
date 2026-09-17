# Pravedā Phase 6 — Nurse Preparation Workflow

The nurse workspace now uses the shared `consultation_workflows` state and adds an operational preparation drawer for each patient.

## Workflow
`WAITING → CHECKED_IN → NURSE_PREPARATION → READY_FOR_DOCTOR → IN_CONSULTATION → COMPLETED`

## Nurse actions
- Open a patient preparation view.
- Verify identity/intake details.
- Review complaint, history quality, and linked documents.
- Capture optional vitals (temperature, pulse, respiratory rate, blood pressure, SpO₂).
- Add preparation notes.
- Move `CHECKED_IN` to `NURSE_PREPARATION`.
- Move `NURSE_PREPARATION` to `READY_FOR_DOCTOR` only after identity verification.

## Persistence
`consultation_workflows.nurse_vitals`, `nurse_notes`, and `identity_verified_at` store preparation state. Existing patient/clinical tables and authentication are unchanged.
