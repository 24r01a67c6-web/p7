# Pravedā Phase 7 — Full Connection Audit

This pass connects the remaining staff operational data paths around the shared consultation workflow.

- Queue Handler uses a least-privilege RPC (`get_queue_patients`) that exposes operational fields only.
- Nurse uses the shared operational patient service and consultation workflow.
- Doctor uses the shared Supabase patient/history records and consultation workflow.
- Patient Dashboard uses the centralized patient record service and the consultation workflow.
- All staff actions remain behind StaffRoute and database-enforced staff roles.

Run `supabase/phase7_queue_access.sql` once in Supabase.
