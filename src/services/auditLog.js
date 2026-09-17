import { supabase } from '../lib/supabase';

export const writeAuditEvent = async ({ action, entityType = null, entityId = null, metadata = {} } = {}) => {
  if (!supabase || !action) return { id: null, error: null };
  try {
    const { data, error } = await supabase.rpc('write_audit_event', {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId || null,
      p_metadata: metadata || {}
    });
    return { id: data || null, error: error || null };
  } catch (error) {
    return { id: null, error };
  }
};
