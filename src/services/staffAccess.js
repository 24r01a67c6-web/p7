import { supabase } from '../lib/supabase';

export const STAFF_ROLES = ['doctor', 'nurse', 'queue_handler', 'admin'];

export const STAFF_ROLE_META = {
  doctor: {
    label: 'Doctor',
    path: '/doctor',
    tone: 'clinical',
    description: 'Review cases, history, priority signals and doctor briefs.'
  },
  nurse: {
    label: 'Nurse',
    path: '/nurse',
    tone: 'care',
    description: 'Prepare patients, capture vitals and track intake readiness.'
  },
  queue_handler: {
    label: 'Queue Handler',
    path: '/queue',
    tone: 'ops',
    description: 'Manage tokens, waiting patients and consultation flow.'
  },
  admin: {
    label: 'Admin',
    path: '/admin/dashboard',
    tone: 'admin',
    description: 'Manage staff access and operational configuration.'
  }
};

export async function getCurrentStaffProfile() {
  if (!supabase) return { profile: null, error: new Error('Supabase is not configured.') };
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) return { profile: null, error: authError };
  const user = authData?.user;
  if (!user) return { profile: null, error: null };

  const { data, error } = await supabase
    .from('staff_profiles')
    .select('id,user_id,full_name,email,role,department,is_active')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return { profile: null, error };
  if (!data || !data.is_active || !STAFF_ROLES.includes(data.role)) {
    return { profile: data || null, error: data ? new Error('Staff profile is inactive or has an unsupported role.') : new Error('No active staff profile is linked to this account.') };
  }
  return { profile: data, error: null };
}

export function staffHomePath(role) {
  return STAFF_ROLE_META[role]?.path || '/staff';
}
