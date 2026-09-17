# Pravedā — Phase 3 Security Hardening

This phase establishes the staff security foundation without breaking the existing custom patient phone/password flow.

## Added

- `public.has_staff_role(text[])` — database-backed active-role check for authenticated staff.
- Hardened `staff_profiles` RLS: staff can see/update their own profile; admins can oversee staff profiles.
- `public.audit_logs` — server-recorded staff audit trail.
- `public.write_audit_event(...)` — security-definer audit writer that derives actor identity/role from `auth.uid()` and the active staff profile.
- Staff login/logout audit events.
- Admin oversight access to Nurse and Queue Handler dashboards while still requiring an active staff profile.

## Run in Supabase

1. Run `supabase/phase2_staff_roles.sql` if it has not already been applied.
2. Run `supabase/phase3_security_hardening.sql`.

## Deliberate boundary

The current patient side uses a custom session-token/RPC authentication model rather than Supabase Auth. Because the browser still reads some patient-facing tables directly, this phase does **not** tighten those table policies yet. The next security phase must first move those patient reads/writes behind session-validated RPCs, then tighten patient/history/document/storage RLS without breaking the patient journey.

Never place service-role keys or private provider credentials in `VITE_*` variables.
