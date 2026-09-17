import { supabase } from '../lib/supabase';

export const CONSULTATION_STATUS = {
  WAITING: 'WAITING',
  CHECKED_IN: 'CHECKED_IN',
  NURSE_PREPARATION: 'NURSE_PREPARATION',
  READY_FOR_DOCTOR: 'READY_FOR_DOCTOR',
  IN_CONSULTATION: 'IN_CONSULTATION',
  COMPLETED: 'COMPLETED',
};

const STATUS_ORDER = [
  CONSULTATION_STATUS.WAITING,
  CONSULTATION_STATUS.CHECKED_IN,
  CONSULTATION_STATUS.NURSE_PREPARATION,
  CONSULTATION_STATUS.READY_FOR_DOCTOR,
  CONSULTATION_STATUS.IN_CONSULTATION,
  CONSULTATION_STATUS.COMPLETED,
];

export const STATUS_LABELS = {
  WAITING: 'Waiting',
  CHECKED_IN: 'Checked in',
  NURSE_PREPARATION: 'Nurse preparation',
  READY_FOR_DOCTOR: 'Ready for doctor',
  IN_CONSULTATION: 'In consultation',
  COMPLETED: 'Completed',
};

const LEGACY_STATUS_MAP = {
  WAITING: CONSULTATION_STATUS.WAITING,
  REGISTERED: CONSULTATION_STATUS.WAITING,
  PRIORITY: CONSULTATION_STATUS.WAITING,
  'INTAKE IN PROGRESS': CONSULTATION_STATUS.WAITING,
  'INTAKE COMPLETED — READY FOR REVIEW': CONSULTATION_STATUS.READY_FOR_DOCTOR,
  READY: CONSULTATION_STATUS.READY_FOR_DOCTOR,
  'READY FOR DOCTOR': CONSULTATION_STATUS.READY_FOR_DOCTOR,
  'IN CONSULTATION': CONSULTATION_STATUS.IN_CONSULTATION,
  COMPLETED: CONSULTATION_STATUS.COMPLETED,
};

const localKey = (patientId) => `pravada_consultation_workflow_${patientId}`;

export const normalizeConsultationStatus = (status) => {
  const normalized = String(status || '').trim().toUpperCase();
  return LEGACY_STATUS_MAP[normalized] || CONSULTATION_STATUS.WAITING;
};

export const canTransition = (fromStatus, toStatus) => {
  const from = normalizeConsultationStatus(fromStatus);
  const to = normalizeConsultationStatus(toStatus);
  if (from === to) return true;
  const fromIndex = STATUS_ORDER.indexOf(from);
  const toIndex = STATUS_ORDER.indexOf(to);
  return fromIndex >= 0 && toIndex === fromIndex + 1;
};

const timestampFieldForStatus = (status) => ({
  CHECKED_IN: 'checked_in_at',
  NURSE_PREPARATION: 'nurse_ready_at',
  READY_FOR_DOCTOR: 'ready_for_doctor_at',
  IN_CONSULTATION: 'consultation_started_at',
  COMPLETED: 'completed_at',
}[status]);

const readLocal = (patientId) => {
  try {
    const raw = localStorage.getItem(localKey(patientId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeLocal = (patientId, workflow) => {
  try {
    localStorage.setItem(localKey(patientId), JSON.stringify(workflow));
  } catch {
    // Local cache is best-effort only.
  }
};

export const getConsultationWorkflow = async (patient) => {
  const patientId = patient?.id;
  if (!patientId) return null;

  if (supabase) {
    const { data, error } = await supabase
      .from('consultation_workflows')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();

    if (!error && data) {
      writeLocal(patientId, data);
      return data;
    }
  }

  const cached = readLocal(patientId);
  if (cached) return cached;

  return {
    id: null,
    patient_id: patientId,
    status: normalizeConsultationStatus(patient.status),
    department: patient.department || 'General Medicine',
    queue_token: patient.token || null,
    priority: patient.priority?.level || (patient.priority || patient.redFlag ? 'HIGH' : 'NORMAL'),
    assigned_doctor_id: null,
  };
};

export const createConsultationWorkflow = async ({ patientId, token, department, priority = 'NORMAL' }) => {
  if (!patientId) return null;
  const payload = {
    patient_id: patientId,
    queue_token: token || null,
    department: department || 'General Medicine',
    priority: priority || 'NORMAL',
    status: CONSULTATION_STATUS.WAITING,
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('consultation_workflows')
      .upsert(payload, { onConflict: 'patient_id' })
      .select('*')
      .single();
    if (!error && data) {
      writeLocal(patientId, data);
      return data;
    }
  }

  const local = { ...payload, id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  writeLocal(patientId, local);
  return local;
};

export const getConsultationWorkflows = async (patients = []) => {
  const ids = patients.map((p) => p?.id).filter(Boolean);
  if (supabase && ids.length) {
    const { data, error } = await supabase
      .from('consultation_workflows')
      .select('*')
      .in('patient_id', ids);
    if (!error && Array.isArray(data)) {
      const map = {};
      data.forEach((row) => { map[row.patient_id] = row; writeLocal(row.patient_id, row); });
      return map;
    }
  }
  const map = {};
  patients.forEach((patient) => {
    const workflow = readLocal(patient.id) || {
      patient_id: patient.id,
      status: normalizeConsultationStatus(patient.status),
      department: patient.department || 'General Medicine',
      queue_token: patient.token || null,
      priority: patient.priority?.level || (patient.priority || patient.redFlag ? 'HIGH' : 'NORMAL'),
    };
    map[patient.id] = workflow;
  });
  return map;
};

export const transitionConsultation = async (patient, toStatus, extras = {}) => {
  const patientId = patient?.id;
  if (!patientId) throw new Error('Patient ID is required.');

  const current = await getConsultationWorkflow(patient);
  const fromStatus = normalizeConsultationStatus(current?.status || patient?.status);
  const targetStatus = normalizeConsultationStatus(toStatus);

  if (!canTransition(fromStatus, targetStatus)) {
    throw new Error(`Invalid workflow transition: ${fromStatus} → ${targetStatus}`);
  }

  const now = new Date().toISOString();
  const next = {
    ...current,
    patient_id: patientId,
    status: targetStatus,
    ...extras,
    updated_at: now,
  };
  const timestampField = timestampFieldForStatus(targetStatus);
  if (timestampField) next[timestampField] = now;

  if (supabase) {
    const updatePayload = {
      status: targetStatus,
      updated_at: now,
      ...extras,
    };
    if (timestampField) updatePayload[timestampField] = now;
    const { data, error } = await supabase
      .from('consultation_workflows')
      .update(updatePayload)
      .eq('patient_id', patientId)
      .select('*')
      .maybeSingle();
    if (!error && data) {
      writeLocal(patientId, data);
      return data;
    }
  }

  writeLocal(patientId, next);
  return next;
};
