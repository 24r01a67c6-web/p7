import { supabase } from '../lib/supabase';
import { fetchPatientDocuments } from './documentIntelligence';
import { buildMedicalTimeline } from '../utils/medicalTimeline';
import { analyzeHistoryCompleteness, getHistoryQuality } from '../utils/historyCompleteness';
import { getActiveSession } from './patientSessionService';
import { getConsultationWorkflow } from './consultationWorkflowService';

/**
 * Normalization & Data Service for Patient Records & Digital Health Dashboard.
 * Single source of truth for querying Supabase with graceful fallback to cached session.
 */

export const getPatientProfile = async (patientId) => {
  if (!patientId) return null;

  // 1. Try fetching real record from Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, age, gender, phone, language, department, created_at, identity_type')
        .eq('id', patientId)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('[patientRecordService] Supabase profile fetch failed:', err);
    }
  }

  // 2. Fallback to active session cache
  const session = getActiveSession();
  if (session?.patient?.id === patientId) {
    return session.patient;
  }

  return null;
};

export const getPatientHistory = async (patientId) => {
  if (!patientId) return [];

  // 1. Query Supabase medical_history
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', patientId)
        .order('completed_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('[patientRecordService] Supabase history fetch failed:', err);
    }
  }

  // 2. Fallback to active session consultation history
  const session = getActiveSession();
  if (session?.patient?.id === patientId && session.consultation?.history?.length > 0) {
    return [{
      id: 'session-history',
      patient_id: patientId,
      chief_complaint: session.consultation.chiefComplaint || 'Not reported',
      questions: session.consultation.history,
      answers: session.consultation.answers,
      red_flag: session.consultation.redFlag,
      red_flag_reason: session.consultation.redFlagReason,
      completed_at: session.consultation.completedAt || session.lastUpdated
    }];
  }

  return [];
};

export const getPatientDocuments = async (patientId) => {
  if (!patientId) return [];
  try {
    const docs = await fetchPatientDocuments(patientId);
    return Array.isArray(docs) ? docs : [];
  } catch (err) {
    console.warn('[patientRecordService] Documents fetch failed:', err);
    return [];
  }
};

export const getPatientTimeline = (patientHistory = [], documents = []) => {
  const current = patientHistory[0] || null;
  const previous = patientHistory.slice(1);
  return buildMedicalTimeline({
    documents,
    currentHistory: current,
    previousHistories: previous
  });
};

export const getPatientSummary = (history = null, documents = []) => {
  if (!history && (!documents || documents.length === 0)) {
    return {
      chiefComplaint: 'Not reported',
      hpi: 'No clinical history reported yet.',
      pmh: 'Not reported',
      medications: 'None reported',
      allergies: 'None reported',
      investigations: 'No documents attached',
      redFlags: 'None reported',
      extractedMeds: [],
      extractedLabs: []
    };
  }

  const answers = history?.answers || {};
  const questions = Array.isArray(history?.questions) ? history.questions : [];

  const getAnswer = (key, qMatch) => {
    if (answers[key] && typeof answers[key] === 'string') return answers[key];
    const found = questions.find((q) => (q.questionId === key || (qMatch && q.question?.toLowerCase().includes(qMatch))));
    return found?.answer || '';
  };

  const chiefComplaint = history?.chief_complaint || getAnswer('chiefComplaint', 'main problem') || 'Not reported';
  const severity = getAnswer('chestSeverity') || getAnswer('generalSeverity') || getAnswer('stomachSeverity') || '';
  const duration = getAnswer('chestStart') || getAnswer('feverStart') || getAnswer('coughDuration') || getAnswer('generalStart') || '';
  const pastConditions = getAnswer('generalConditions', 'past medical') || 'Not reported';
  const allergies = getAnswer('generalAllergies', 'allergies') || 'None reported';

  let hpi = '';
  if (chiefComplaint !== 'Not reported') {
    hpi = `Patient reports ${chiefComplaint}${duration ? ` starting ${duration}` : ''}${severity ? ` with severity ${severity}` : ''}.`;
  } else {
    hpi = 'Patient completed self-service intake.';
  }

  const extractedMeds = [];
  const extractedLabs = [];
  (documents || []).forEach((doc) => {
    const s = doc.structured || {};
    (s.medications || []).forEach((m) => extractedMeds.push(m.name || m.text));
    (s.labs || []).forEach((l) => extractedLabs.push(`${l.test || l.name}: ${l.value} ${l.unit || ''}`.trim()));
  });

  const docInvestigations = (documents || []).map((d) => `${d.document_name || d.file_name} (${d.document_type || 'Other'})`).join(', ');

  const isRedFlag = Boolean(history?.red_flag);
  const redFlags = isRedFlag
    ? `⚠️ Potential Emergency: ${history?.red_flag_reason || 'Identified during intake'}`
    : 'None reported';

  return {
    chiefComplaint,
    hpi,
    pmh: pastConditions,
    medications: extractedMeds.length ? extractedMeds.join(', ') : 'None documented',
    allergies,
    investigations: docInvestigations || 'None uploaded',
    redFlags,
    extractedMeds,
    extractedLabs
  };
};

export const getOperationalPatients = async () => {
  if (!supabase) return [];
  const { data: patients, error: patientError } = await supabase
    .from('patients')
    .select('id, name, age, gender, phone, language, department, created_at, identity_type')
    .order('created_at', { ascending: false });
  if (patientError) throw patientError;
  const rows = Array.isArray(patients) ? patients : [];
  const ids = rows.map((patient) => patient.id).filter(Boolean);
  if (!ids.length) return [];

  const [{ data: histories, error: historyError }, { data: workflows, error: workflowError }] = await Promise.all([
    supabase.from('medical_history')
      .select('id, patient_id, chief_complaint, completed_at, red_flag, red_flag_reason')
      .in('patient_id', ids)
      .order('completed_at', { ascending: false }),
    supabase.from('consultation_workflows')
      .select('*')
      .in('patient_id', ids)
  ]);
  if (historyError) throw historyError;
  // Workflow data is additive. If RLS/schema is temporarily unavailable, keep the patient list usable.
  if (workflowError) console.warn('[patientRecordService] Workflow load skipped:', workflowError.message || workflowError);

  const latestHistory = {};
  (histories || []).forEach((history) => {
    if (!latestHistory[history.patient_id]) latestHistory[history.patient_id] = history;
  });
  const workflowMap = {};
  (workflows || []).forEach((workflow) => { workflowMap[workflow.patient_id] = workflow; });

  return rows.map((patient) => {
    const history = latestHistory[patient.id] || {};
    const workflow = workflowMap[patient.id] || {};
    return {
      ...patient,
      token: workflow.queue_token || patient.patient_code || null,
      chiefComplaint: history.chief_complaint || '',
      priority: history.red_flag ? 'HIGH' : (workflow.priority || 'NORMAL'),
      redFlag: Boolean(history.red_flag),
      redFlagReason: history.red_flag_reason || '',
      status: workflow.status || 'WAITING',
      workflow,
      latestHistory: history
    };
  });
};


export const getQueueOperationalPatients = async () => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.rpc('get_queue_patients');
    if (!error && Array.isArray(data)) {
      return data.map((row) => ({
        ...row,
        id: row.patient_id || row.id,
        token: row.queue_token || row.patient_code || null,
        priority: row.priority || 'NORMAL',
        redFlag: row.priority === 'HIGH',
        status: normalizeQueueStatus(row.status),
      }));
    }
  } catch (error) {
    console.warn('[patientRecordService] Queue RPC unavailable:', error?.message || error);
  }

  // Do not fall back to the broad patients query for queue handlers.
  // Queue access is intentionally limited to the dedicated RPC.
  return [];
};

const normalizeQueueStatus = (status) => {
  const normalized = String(status || '').trim().toUpperCase();
  return ['WAITING','CHECKED_IN','NURSE_PREPARATION','READY_FOR_DOCTOR','IN_CONSULTATION','COMPLETED'].includes(normalized)
    ? normalized
    : 'WAITING';
};

export const getPatientDashboardData = async (patientId) => {
  if (!patientId) {
    throw new Error('Patient ID is required to load digital health record.');
  }

  // Load all components concurrently
  const [profile, histories, documents, workflow] = await Promise.all([
    getPatientProfile(patientId),
    getPatientHistory(patientId),
    getPatientDocuments(patientId),
    getConsultationWorkflow({ id: patientId })
  ]);

  if (!profile) {
    throw new Error('Patient profile could not be found.');
  }

  const currentHistory = histories[0] || null;
  const previousHistories = histories.slice(1);
  const timeline = getPatientTimeline(histories, documents);
  const summary = getPatientSummary(currentHistory, documents);
  const completeness = analyzeHistoryCompleteness(currentHistory || {});
  const quality = getHistoryQuality(completeness, Boolean(currentHistory));

  // Determine current consultation state
  const session = getActiveSession();
  const isCurrentSessionPatient = session?.patient?.id === patientId;
  const consultationStatus = workflow?.status || (isCurrentSessionPatient
    ? (session.consultation?.status || 'Intake completed — Ready for review')
    : 'Completed visit record');

  const priorityStatus = workflow?.priority || (currentHistory?.red_flag ? 'HIGH' : 'NORMAL');

  // Recent activity timestamps
  const latestConsultation = currentHistory?.completed_at || profile.created_at || null;
  const latestDoc = documents[0]?.created_at || null;
  const latestHistoryUpdate = currentHistory?.completed_at || null;

  return {
    profile: {
      id: profile.id,
      name: profile.name || 'Patient',
      age: profile.age,
      gender: profile.gender || 'Not specified',
      phone: profile.phone || 'Not specified',
      language: profile.language || 'en',
      department: profile.department || 'General Medicine',
      createdAt: profile.created_at
    },
    currentConsultation: {
      chiefComplaint: summary.chiefComplaint,
      completenessPercent: completeness.percentage || 0,
      priority: priorityStatus,
      workflow: workflow || null,
      status: consultationStatus,
      completedAt: latestConsultation
    },
    clinicalHistory: {
      current: currentHistory,
      previous: previousHistories,
      symptoms: currentHistory?.answers?.relevantSymptoms || summary.chiefComplaint,
      questions: currentHistory?.questions || []
    },
    documents: {
      list: documents,
      count: documents.length
    },
    timeline,
    summary,
    historyQuality: {
      percentage: quality.percentage ?? completeness.percentage ?? 0,
      level: quality.level,
      label: quality.label,
      available: completeness.available || [],
      missing: completeness.missing || []
    },
    recentActivity: {
      latestConsultation,
      latestDoc,
      latestHistoryUpdate
    }
  };
};
