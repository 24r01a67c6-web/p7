import { getActiveSession } from './patientSessionService';
import {
  getPatientDashboardData,
  getOperationalPatients,
  getQueueOperationalPatients,
} from './patientRecordService';
import {
  getConsultationWorkflow,
  transitionConsultation,
} from './consultationWorkflowService';

/**
 * Cross-workspace orchestration layer.
 * Keeps patient/session, clinical record, and staff workflow access aligned
 * without duplicating Supabase queries in individual pages.
 */
export const resolveActivePatientId = (patientData = null) => {
  if (patientData?.id) return patientData.id;
  const session = getActiveSession();
  return session?.patient?.id || '';
};

export const getPatientWorkspaceSnapshot = async (patientId) => {
  const id = String(patientId || '').trim();
  if (!id) throw new Error('Patient ID is required.');
  return getPatientDashboardData(id);
};

export const getStaffWorkspaceSnapshot = async (role) => {
  if (role === 'queue_handler') return getQueueOperationalPatients();
  if (role === 'doctor' || role === 'nurse' || role === 'admin') return getOperationalPatients();
  throw new Error('Unsupported staff role.');
};

export const getWorkflowForPatient = async (patient) => {
  const id = patient?.id;
  if (!id) return null;
  return getConsultationWorkflow(patient);
};

export const movePatientWorkflow = async (patient, targetStatus, extras = {}) => {
  if (!patient?.id) throw new Error('Patient ID is required.');
  return transitionConsultation(patient, targetStatus, extras);
};
