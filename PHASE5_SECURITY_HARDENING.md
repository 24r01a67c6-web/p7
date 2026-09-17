# Pravedā Phase 5 — Clinical Data Security Hardening

This phase hardens database access for staff-facing clinical data while preserving the existing custom patient phone/password flow.

## What changes

- Adds database helpers for current active staff and department.
- Restricts staff patient/history/document access by active staff role and department.
- Queue handlers do not receive medical-history/document table access.
- Medical document items inherit access from their parent document/patient.
- Consultation workflow policies distinguish operational queue access from clinical staff access.
- Makes the `medical-documents` storage bucket private and adds department-scoped staff reads.
- Keeps audit logs admin-readable and blocks direct client DML to audit logs.
- Removes the existing broad document policies created by the earlier step6 migration when this migration is run.

## Important limitation

Patients currently authenticate through a custom phone/password + session-token RPC flow rather than Supabase Auth. Because `auth.uid()` does not represent a patient in that architecture, patient-specific database RLS cannot safely be invented from `auth.uid()` alone without changing the patient session boundary. This migration therefore does not claim to complete patient-side row-level hardening. That should be handled in a dedicated follow-up using session-aware SECURITY DEFINER RPCs (and a storage upload boundary) rather than broad public policies.

## Required order

Run the existing migrations first, then run:

`supabase/phase5_clinical_data_rls.sql`

Afterward reload the PostgREST schema or use the `notify pgrst` already included.

## Verification

Use the security test matrix in the implementation notes. In particular, verify that:

- an authenticated queue handler can read/update queue workflow only;
- a nurse/doctor can read only records in their configured department;
- an unauthorized patient cannot be accessed by changing a URL ID;
- audit logs cannot be written directly by the browser;
- the medical-documents bucket is private.
