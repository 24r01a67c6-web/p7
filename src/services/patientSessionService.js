/**
 * Pravedā Centralized Patient Session Service
 * 
 * Provides a single canonical source of truth for:
 * 1. Active patient account & profile (id, name, age, gender, phone, language, department)
 * 2. Active consultation session (current complaint, answers, documents, status, timestamps)
 * 3. Session persistence across route changes and browser refreshes
 */

const SESSION_KEY = 'medikiosk_patient_session';
const LEGACY_ID_KEY = 'medikiosk_current_patient_id';
const LEGACY_PATIENT_KEY = 'medikiosk_current_patient';
const LEGACY_TOKEN_KEY = 'medikiosk_patient_record_token';
const LEGACY_REG_COMPLETED_KEY = 'medikiosk_registration_completed';

export const createEmptySession = () => ({
  patient: null,
  consultation: {
    chiefComplaint: '',
    answers: {},
    adaptiveAnswers: {},
    history: [],
    documents: [],
    redFlag: false,
    priority: false,
    redFlagReason: '',
    status: 'Intake in progress',
    summary: {},
    startedAt: new Date().toISOString(),
    completedAt: null
  },
  lastUpdated: new Date().toISOString()
});

export const getActiveSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.patient && parsed.patient.id) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[SessionService] Failed to read primary session:', e);
  }

  // Fallback recovery from legacy keys if primary session is missing
  try {
    const legacyPatientRaw = localStorage.getItem(LEGACY_PATIENT_KEY);
    const legacyId = localStorage.getItem(LEGACY_ID_KEY);
    if (legacyPatientRaw) {
      const legacyPatient = JSON.parse(legacyPatientRaw);
      if (legacyPatient && (legacyPatient.id || legacyId)) {
        const restored = {
          patient: {
            id: legacyPatient.id || legacyId,
            name: legacyPatient.name || '',
            age: legacyPatient.age || '',
            gender: legacyPatient.gender || 'Male',
            phone: legacyPatient.phone || '',
            language: legacyPatient.language || 'en',
            department: legacyPatient.department || 'General Medicine',
            patient_code: legacyPatient.patient_code || '',
            identity_type: legacyPatient.identity_type || 'new_patient',
            session_token: localStorage.getItem(LEGACY_TOKEN_KEY) || legacyPatient.session_token || null
          },
          consultation: {
            chiefComplaint: legacyPatient.chiefComplaint || '',
            answers: legacyPatient.answers || {},
            adaptiveAnswers: legacyPatient.adaptiveAnswers || {},
            history: legacyPatient.history || [],
            documents: legacyPatient.documents || [],
            redFlag: Boolean(legacyPatient.redFlag),
            priority: Boolean(legacyPatient.priority),
            redFlagReason: legacyPatient.redFlagReason || '',
            status: legacyPatient.status || 'Intake in progress',
            summary: legacyPatient.summary || {},
            startedAt: legacyPatient.createdAt || new Date().toISOString(),
            completedAt: legacyPatient.completedAt || null
          },
          lastUpdated: new Date().toISOString()
        };
        // Re-persist canonical session
        localStorage.setItem(SESSION_KEY, JSON.stringify(restored));
        return restored;
      }
    }
  } catch (e) {
    console.warn('[SessionService] Failed to recover from legacy storage:', e);
  }

  return createEmptySession();
};

export const initPatientSession = (patientData, consultationData = {}) => {
  if (!patientData || !patientData.id) {
    console.warn('[SessionService] Cannot init session without valid patient ID');
    return null;
  }

  const patient = {
    id: patientData.id,
    name: patientData.name || '',
    age: patientData.age || '',
    gender: patientData.gender || 'Male',
    phone: patientData.phone || '',
    language: patientData.language || 'en',
    department: patientData.department || 'General Medicine',
    patient_code: patientData.patient_code || '',
    identity_type: patientData.identity_type || 'new_patient',
    session_token: patientData.session_token || localStorage.getItem(LEGACY_TOKEN_KEY) || null
  };

  const consultation = {
    chiefComplaint: consultationData.chiefComplaint || patientData.chiefComplaint || '',
    answers: consultationData.answers || patientData.answers || {},
    adaptiveAnswers: consultationData.adaptiveAnswers || patientData.adaptiveAnswers || {},
    history: consultationData.history || patientData.history || [],
    documents: consultationData.documents || patientData.documents || [],
    redFlag: Boolean(consultationData.redFlag ?? patientData.redFlag),
    priority: Boolean(consultationData.priority ?? patientData.priority),
    redFlagReason: consultationData.redFlagReason || patientData.redFlagReason || '',
    status: consultationData.status || patientData.status || 'Intake in progress',
    summary: consultationData.summary || patientData.summary || {},
    startedAt: consultationData.startedAt || new Date().toISOString(),
    completedAt: consultationData.completedAt || null
  };

  const session = {
    patient,
    consultation,
    lastUpdated: new Date().toISOString()
  };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    // Keep legacy keys synchronized for backward compatibility
    localStorage.setItem(LEGACY_ID_KEY, patient.id);
    localStorage.setItem(LEGACY_PATIENT_KEY, JSON.stringify({ ...patient, ...consultation }));
    localStorage.setItem(LEGACY_REG_COMPLETED_KEY, 'true');
    if (patient.session_token) {
      localStorage.setItem(LEGACY_TOKEN_KEY, patient.session_token);
    }
  } catch (e) {
    console.warn('[SessionService] Failed to persist session:', e);
  }

  return session;
};

export const updateActiveConsultation = (patch = {}) => {
  const current = getActiveSession();
  if (!current || !current.patient) {
    console.warn('[SessionService] No active patient session to update consultation');
    return null;
  }

  const updatedConsultation = {
    ...current.consultation,
    ...patch
  };

  const updatedSession = {
    ...current,
    consultation: updatedConsultation,
    lastUpdated: new Date().toISOString()
  };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
    localStorage.setItem(
      LEGACY_PATIENT_KEY,
      JSON.stringify({ ...updatedSession.patient, ...updatedConsultation })
    );
  } catch (e) {
    console.warn('[SessionService] Failed to update consultation session:', e);
  }

  return updatedSession;
};

export const updateActivePatient = (patientPatch = {}) => {
  const current = getActiveSession();
  if (!current || !current.patient) return null;

  const updatedPatient = {
    ...current.patient,
    ...patientPatch
  };

  const updatedSession = {
    ...current,
    patient: updatedPatient,
    lastUpdated: new Date().toISOString()
  };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
    localStorage.setItem(
      LEGACY_PATIENT_KEY,
      JSON.stringify({ ...updatedPatient, ...current.consultation })
    );
  } catch (e) {
    console.warn('[SessionService] Failed to update patient profile:', e);
  }

  return updatedSession;
};

export const hasActivePatientSession = () => {
  const session = getActiveSession();
  return Boolean(session?.patient?.id);
};

export const clearActivePatientSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_ID_KEY);
    localStorage.removeItem(LEGACY_PATIENT_KEY);
    localStorage.removeItem(LEGACY_REG_COMPLETED_KEY);
    localStorage.removeItem('medikiosk_current_patient_history');
  } catch (e) {
    console.warn('[SessionService] Failed to clear session:', e);
  }
};
