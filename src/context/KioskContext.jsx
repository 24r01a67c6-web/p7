import React, { createContext, useContext, useState } from 'react';
import {
  getActiveSession,
  initPatientSession,
  updateActiveConsultation,
  clearActivePatientSession
} from '../services/patientSessionService';
import {
  createConsultationWorkflow,
  transitionConsultation,
  normalizeConsultationStatus,
  CONSULTATION_STATUS
} from '../services/consultationWorkflowService';

const KioskContext = createContext();

export const initialQueue = [
  {
    id: '102',
    token: '102',
    name: 'Ravi Kumar',
    age: 52,
    gender: 'Male',
    phone: '+91 98765 43210',
    language: 'en',
    department: 'Cardiology',
    status: 'Priority',
    priority: true,
    redFlag: true,
    chiefComplaint: 'Chest pain for 2 hours',
    history: [
      { question: 'What is your main problem today?', answer: 'Chest Pain' },
      { question: 'How long have you had this problem?', answer: 'Started today (2 hours ago)' },
      { question: 'Are you experiencing any other symptoms or pain severity?', answer: 'Severe pressure with difficulty breathing' },
      { question: 'Do you have any past medical conditions or ongoing medications?', answer: 'High Blood Pressure (5 yrs), Amlodipine 5 mg' },
      { question: 'Do you have any known drug or food allergies?', answer: 'No known allergies' }
    ],
    documents: [
      { id: 'doc-1', name: 'Prescription_Aug2026.pdf', type: 'PDF', extractedMed: 'Amlodipine 5 mg', extractedDate: '12 Aug 2026' },
      { id: 'doc-2', name: 'BloodReport_Jul2026.pdf', type: 'PDF', extractedLab: 'Blood Glucose – 156 mg/dL', extractedDate: '10 Jul 2026' }
    ],
    ayushData: {},
    hpi: 'Patient reports sudden onset chest discomfort with dyspnea.',
    pmh: 'Hypertension reported (5 yrs).',
    medications: 'Amlodipine 5 mg',
    allergies: 'No known allergies',
    investigations: 'Blood glucose: 156 mg/dL',
    redFlags: '⚠️ Breathing difficulty & severe chest pressure reported',
    summary: {
      chiefComplaint: 'Chest pain for 2 hours',
      hpi: 'Patient reports sudden onset chest discomfort with dyspnea.',
      pmh: 'Hypertension reported (5 yrs).',
      medications: 'Amlodipine 5 mg',
      allergies: 'No known allergies',
      investigations: 'Blood glucose: 156 mg/dL',
      redFlags: '⚠️ Breathing difficulty & severe chest pressure reported'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: '103',
    token: '103',
    name: 'Priya Sharma',
    age: 34,
    gender: 'Female',
    phone: '+91 98765 12345',
    language: 'hi',
    department: 'General Medicine',
    status: 'Normal',
    priority: false,
    redFlag: false,
    chiefComplaint: 'Fever and chills for 3 days',
    history: [
      { question: 'What is your main problem today?', answer: 'Fever' },
      { question: 'How long have you had this problem?', answer: '2-3 days' },
      { question: 'Are you experiencing any other symptoms or pain severity?', answer: 'Moderate body ache' },
      { question: 'Do you have any past medical conditions or ongoing medications?', answer: 'None reported' },
      { question: 'Do you have any known drug or food allergies?', answer: 'Penicillin allergy' }
    ],
    documents: [
      { id: 'doc-3', name: 'CBC_Report.pdf', type: 'PDF', extractedLab: 'Hb: 12.4 g/dL', extractedDate: '05 Sep 2026' }
    ],
    ayushData: {},
    hpi: 'High grade fever with body ache.',
    pmh: 'None',
    medications: 'Paracetamol 650 mg',
    allergies: 'Penicillin allergy',
    investigations: 'Hb: 12.4 g/dL',
    redFlags: 'None',
    summary: {
      chiefComplaint: 'Fever and chills for 3 days',
      hpi: 'High grade fever with body ache.',
      pmh: 'None reported',
      medications: 'Paracetamol 650 mg',
      allergies: 'Penicillin allergy',
      investigations: 'Hb: 12.4 g/dL',
      redFlags: 'None'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: '104',
    token: '104',
    name: 'Anil Kumar',
    age: 45,
    gender: 'Male',
    phone: '+91 91234 56789',
    language: 'te',
    department: 'General Medicine',
    status: 'Normal',
    priority: false,
    redFlag: false,
    chiefComplaint: 'Persistent cough for 1 week',
    history: [
      { question: 'What is your main problem today?', answer: 'Cough' },
      { question: 'How long have you had this problem?', answer: 'About 1 week' },
      { question: 'Are you experiencing any other symptoms or pain severity?', answer: 'Mild throat irritation' },
      { question: 'Do you have any past medical conditions or ongoing medications?', answer: 'Asthma in childhood' },
      { question: 'Do you have any known drug or food allergies?', answer: 'Dust allergy' }
    ],
    documents: [],
    ayushData: {},
    hpi: 'Dry cough worsening at night.',
    pmh: 'Asthma in childhood.',
    medications: 'Cetirizine 10 mg',
    allergies: 'Dust allergy',
    investigations: 'Chest X-Ray: Clear',
    redFlags: 'None',
    summary: {
      chiefComplaint: 'Persistent cough for 1 week',
      hpi: 'Dry cough worsening at night.',
      pmh: 'Asthma in childhood.',
      medications: 'Cetirizine 10 mg',
      allergies: 'Dust allergy',
      investigations: 'Chest X-Ray: Clear',
      redFlags: 'None'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: '105',
    token: '105',
    name: 'Sita Devi',
    age: 61,
    gender: 'Female',
    phone: '+91 99887 76655',
    language: 'hi',
    department: 'AYUSH',
    status: 'Priority',
    priority: true,
    redFlag: true,
    chiefComplaint: 'Joint stiffness and Agnimandya (indigestion)',
    history: [
      { question: 'What is your main problem today?', answer: 'Joint stiffness and indigestion' },
      { question: 'How long have you had this problem?', answer: 'More than a month' },
      { question: 'Are you experiencing any other symptoms or pain severity?', answer: 'Severe joint mobility restriction' },
      { question: 'Do you have any past medical conditions or ongoing medications?', answer: 'Osteoarthritis' },
      { question: 'Do you have any known drug or food allergies?', answer: 'None reported' }
    ],
    documents: [],
    ayushData: {
      prakriti: 'Vata-Kapha',
      vikriti: 'Vata Dushti',
      sara: 'Asthi Sara',
      samhanana: 'Madhyama (Moderate)',
      pramana: 'Anurupa (Proportionate)',
      satmya: 'Sarva Rasa Satmya',
      sattva: 'Madhyama (Medium)',
      aharaShakti: 'Mandagni',
      vyayamaShakti: 'Avara',
      vaya: 'Vriddha (Elderly)'
    },
    hpi: 'Vata-Kapha Prakriti imbalance with morning stiffness.',
    pmh: 'Osteoarthritis reported.',
    medications: 'Yograj Guggulu',
    allergies: 'None',
    investigations: 'Prakriti assessment completed',
    redFlags: '⚠️ Severe joint mobility restriction',
    summary: {
      chiefComplaint: 'Joint stiffness and Agnimandya (indigestion)',
      hpi: 'Vata-Kapha Prakriti imbalance with morning stiffness.',
      pmh: 'Osteoarthritis reported.',
      medications: 'Yograj Guggulu',
      allergies: 'None',
      investigations: 'Prakriti assessment completed',
      redFlags: '⚠️ Severe joint mobility restriction'
    },
    createdAt: new Date().toISOString()
  }
];

const defaultCurrentPatient = {
  id: '',
  token: '',
  name: 'Ravi Kumar',
  age: 52,
  gender: 'Male',
  phone: '+91 98765 43210',
  language: 'en',
  department: 'General Medicine',
  chiefComplaint: '',
  history: [],
  documents: [],
  redFlag: false,
  priority: false,
  ayushData: {
    prakriti: 'Vata-Kapha',
    vikriti: 'Vata Dushti',
    sara: 'Rasa Sara',
    samhanana: 'Madhyama (Moderate)',
    pramana: 'Anurupa (Proportionate)',
    satmya: 'Sarva Rasa Satmya',
    sattva: 'Madhyama (Medium)',
    aharaShakti: 'Mandagni',
    vyayamaShakti: 'Madhyama',
    vaya: 'Madhyama (Adult)',
    aharaRasa: ['Madhura (Sweet)', 'Lavana (Salty)'],
    vihara: 'Nidra: Irregular sleep (6 hrs) | Vyayama: Sedentary lifestyle | Agni: Mandagni'
  },
  summary: {},
  status: 'Normal',
  createdAt: ''
};


const createBlankPatientData = () => ({
  ...defaultCurrentPatient,
  id: '',
  token: '',
  patient_code: '',
  name: '',
  age: '',
  gender: '',
  phone: '',
  language: 'en',
  department: '',
  abha_number: '',
  abha_address: '',
  identity_type: 'new_patient',
  chiefComplaint: '',
  history: [],
  documents: [],
  redFlag: false,
  priority: false,
  redFlagReason: '',
  adaptiveAnswers: {},
  answers: {},
  ayushData: {},
  summary: {},
  status: 'Normal',
  createdAt: ''
});

export const KioskProvider = ({ children }) => {
  // Language is part of the active consultation. New consultations start unset; restored sessions use the patient's saved language.
  const [language, setLanguageState] = useState(() => {
    try {
      const session = getActiveSession();
      return ['en', 'hi', 'te'].includes(session?.patient?.language) ? session.patient.language : '';
    } catch {
      return '';
    }
  });

  const setLanguage = (newLang) => {
    setLanguageState(newLang);
    setPatientDataState((prev) => ({ ...prev, language: newLang }));
  };

  // 2. Consent state
  const [consentGiven, setConsentGiven] = useState(false);

  // 3. Current Patient Intake State synced with patientSessionService & 'medikiosk_current_patient'
  const [patientData, setPatientDataState] = useState(() => {
    try {
      const session = getActiveSession();
      if (session?.patient?.id) {
        return {
          ...defaultCurrentPatient,
          ...session.patient,
          ...session.consultation
        };
      }
      const saved = localStorage.getItem('medikiosk_current_patient');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    return defaultCurrentPatient;
  });

  const setPatientData = (updater) => {
    setPatientDataState((prev) => {
      const updated = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      try {
        if (updated?.id) {
          initPatientSession(updated, updated);
        } else {
          localStorage.setItem('medikiosk_current_patient', JSON.stringify(updated));
        }
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      return updated;
    });
  };

  // Symptoms & red-flag states
  const [symptoms, setSymptoms] = useState([]);
  const [conversation, setConversation] = useState([
    { sender: 'ai', text: 'Hello! I will ask a few questions to understand your health concern.' },
    { sender: 'ai', text: 'What is your main problem today?' }
  ]);
  const [emergencyAlert, setEmergencyAlert] = useState(false);

  // Uploaded docs state
  const [uploadedDocs, setUploadedDocs] = useState(() => patientData?.documents || []);

  // 4. Patients Queue state synced with 'medikiosk_patients'
  const [queue, setQueueState] = useState(() => {
    try {
      const saved = localStorage.getItem('medikiosk_patients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      localStorage.setItem('medikiosk_patients', JSON.stringify(initialQueue));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    return initialQueue;
  });

  const setQueue = (newQueue) => {
    setQueueState(newQueue);
    try {
      localStorage.setItem('medikiosk_patients', JSON.stringify(newQueue));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  const [selectedPatientId, setSelectedPatientId] = useState('102');

  // Helper: get all patients
  const getPatients = () => {
    try {
      const saved = localStorage.getItem('medikiosk_patients');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error reading patients:', e);
    }
    return queue;
  };

  const getPatientById = (id) => {
    const list = getPatients();
    return list.find((p) => String(p.id) === String(id) || String(p.token) === String(id)) || null;
  };

  // Helper: save submitted patient to queue and preserve canonical patient session
  const savePatient = (newPatient) => {
    const currentQueue = getPatients();
    const nextTokenNum = 100 + currentQueue.length + 2;
    const fallbackToken = nextTokenNum.toString();

    const isRedFlag = newPatient.redFlag !== undefined ? newPatient.redFlag : emergencyAlert;
    const canonicalId = newPatient.id || patientData.id || fallbackToken;
    const patientCode = newPatient.patient_code || patientData.patient_code || fallbackToken;

    const formattedPatient = {
      ...patientData,
      ...newPatient,
      id: canonicalId,
      token: patientCode,
      patient_code: patientCode,
      name: newPatient.name || patientData.name || 'New Patient',
      age: newPatient.age || patientData.age || 30,
      gender: newPatient.gender || patientData.gender || 'Male',
      phone: newPatient.phone || patientData.phone || '',
      language: newPatient.language || patientData.language || language || 'en',
      department: newPatient.department || patientData.department || 'General Medicine',
      status: normalizeConsultationStatus('WAITING'),
      priority: isRedFlag,
      redFlag: isRedFlag,
      chiefComplaint: newPatient.chiefComplaint || patientData.chiefComplaint || (symptoms.length > 0 ? symptoms.join(', ') : 'General consultation'),
      history: newPatient.history || patientData.history || [],
      documents: newPatient.documents || uploadedDocs || patientData.documents || [],
      ayushData: newPatient.ayushData || patientData.ayushData || {},
      hpi: newPatient.hpi || (newPatient.summary?.hpi) || patientData.summary?.hpi || 'Intake completed via Pravedā self-service portal.',
      pmh: newPatient.pmh || (newPatient.summary?.pmh) || patientData.summary?.pmh || 'Self-reported in Kiosk',
      medications: newPatient.medications || (newPatient.summary?.medications) || patientData.summary?.medications || 'None reported',
      allergies: newPatient.allergies || (newPatient.summary?.allergies) || patientData.summary?.allergies || 'None reported',
      investigations: newPatient.investigations || (newPatient.summary?.investigations) || patientData.summary?.investigations || 'None uploaded',
      redFlags: isRedFlag ? '⚠️ Potential Emergency reported during intake' : 'None reported',
      summary: newPatient.summary || patientData.summary || {
        chiefComplaint: newPatient.chiefComplaint || (symptoms.length > 0 ? symptoms.join(', ') : 'General consultation'),
        hpi: newPatient.hpi || 'Intake completed via Pravedā self-service portal.',
        pmh: newPatient.pmh || 'Self-reported in Kiosk',
        medications: newPatient.medications || 'None reported',
        allergies: newPatient.allergies || 'None reported',
        investigations: newPatient.investigations || 'None uploaded',
        redFlags: isRedFlag ? '⚠️ Potential Emergency reported during intake' : 'None reported'
      },
      completedAt: new Date().toISOString(),
      createdAt: patientData.createdAt || new Date().toISOString()
    };

    // Update queue
    const updatedQueue = [formattedPatient, ...currentQueue.filter((p) => String(p.id) !== String(canonicalId))];
    setQueue(updatedQueue);
    setSelectedPatientId(canonicalId);

    // CRITICAL: Preserve canonical patient session and data instead of resetting
    setPatientDataState(formattedPatient);
    initPatientSession(formattedPatient, formattedPatient);
    void createConsultationWorkflow({
      patientId: canonicalId,
      token: patientCode,
      department: formattedPatient.department,
      priority: isRedFlag ? 'HIGH' : 'NORMAL'
    });

    return formattedPatient;
  };

  // Helper: update existing patient
  const updatePatient = (id, updates) => {
    const currentQueue = getPatients();
    const updated = currentQueue.map((p) => {
      if (String(p.id) === String(id) || String(p.token) === String(id)) {
        return { ...p, ...updates };
      }
      return p;
    });
    setQueue(updated);
    if (patientData?.id === id) {
      setPatientDataState((prev) => ({ ...prev, ...updates }));
      updateActiveConsultation(updates);
    }
  };

  const transitionPatient = async (id, status, extras = {}) => {
    const patient = getPatientById(id) || { id, status: CONSULTATION_STATUS.WAITING };
    const workflow = await transitionConsultation(patient, status, extras);
    updatePatient(id, { status: workflow.status });
    return workflow;
  };

  const addPatientToQueue = (patient) => {
    return savePatient(patient);
  };

  const startNewConsultation = () => {
    clearActivePatientSession();
    setLanguageState('');
    setConsentGiven(false);
    setSymptoms([]);
    setConversation([
      { sender: 'ai', text: 'Hello! I will ask a few questions to understand your health concern.' },
      { sender: 'ai', text: 'What is your main problem today?' }
    ]);
    setUploadedDocs([]);
    setEmergencyAlert(false);
    const blank = createBlankPatientData();
    setPatientDataState(blank);
    try {
      localStorage.removeItem('selectedLanguage');
      localStorage.removeItem('medikiosk_current_patient_history');
      localStorage.removeItem('medikiosk_current_patient_id');
      localStorage.removeItem('medikiosk_current_patient');
      localStorage.removeItem('medikiosk_registration_completed');
      localStorage.removeItem('medikiosk_patient_record_token');
      localStorage.setItem('medikiosk_current_patient', JSON.stringify(blank));
    } catch (e) {
      console.warn('LocalStorage error while starting new consultation:', e);
    }
  };

  const clearSession = () => {
    startNewConsultation();
  };

  return (
    <KioskContext.Provider
      value={{
        language,
        setLanguage,
        consentGiven,
        setConsentGiven,
        patientData,
        setPatientData,
        symptoms,
        setSymptoms,
        conversation,
        setConversation,
        uploadedDocs,
        setUploadedDocs,
        emergencyAlert,
        setEmergencyAlert,
        queue,
        setQueue,
        selectedPatientId,
        setSelectedPatientId,
        startNewConsultation,
        addPatientToQueue,
        savePatient,
        getPatients,
        getPatientById,
        updatePatient,
        transitionPatient,
        consultationStatuses: CONSULTATION_STATUS,
        clearSession
      }}
    >
      {children}
    </KioskContext.Provider>
  );
};

export const useKiosk = () => useContext(KioskContext);
