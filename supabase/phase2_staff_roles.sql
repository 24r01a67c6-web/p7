create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('doctor','nurse','queue_handler','admin')),
  department text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff_profiles enable row level security;

drop policy if exists staff_profiles_select_self on public.staff_profiles;
create policy staff_profiles_select_self on public.staff_profiles
for select to authenticated
using (user_id = auth.uid());

drop policy if exists staff_profiles_update_self on public.staff_profiles;
create policy staff_profiles_update_self on public.staff_profiles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index if not exists idx_staff_profiles_role on public.staff_profiles(role);
create index if not exists idx_staff_profiles_active on public.staff_profiles(is_active);

notify pgrst, 'reload schema';
