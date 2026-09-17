import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock3, FileText, Search, UserCheck, Users, X } from 'lucide-react';
import { StaffWorkspaceShell } from '../components/StaffWorkspaceShell';
import { useKiosk } from '../context/KioskContext';
import { supabase } from '../lib/supabase';
import { getStaffWorkspaceSnapshot, getPatientWorkspaceSnapshot } from '../services/projectIntegrationService';
import {
  CONSULTATION_STATUS,
  STATUS_LABELS,
  getConsultationWorkflows,
  normalizeConsultationStatus,
} from '../services/consultationWorkflowService';

const EMPTY_VITALS = { temperature: '', pulse: '', respiratoryRate: '', systolic: '', diastolic: '', spo2: '' };

const languageLabel = (language) => ({ en: 'English', hi: 'Hindi', te: 'Telugu' }[language] || 'English');

export const NurseDashboardPage = () => {
  const { transitionPatient } = useKiosk();
  const [staffPatients, setStaffPatients] = useState([]);
  const [workflows, setWorkflows] = useState({});
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [vitals, setVitals] = useState(EMPTY_VITALS);
  const [nurseNotes, setNurseNotes] = useState('');
  const [identityVerified, setIdentityVerified] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  const loadStaffPatients = async () => {
    setLoadingPatients(true);
    try {
      const data = await getStaffWorkspaceSnapshot('nurse');
      if (Array.isArray(data) && data.length) {
        setStaffPatients(data);
      } else if (Array.isArray(data)) {
        setStaffPatients([]);
      }
    } catch (error) {
      console.warn('[NurseDashboard] Operational patient load failed:', error?.message || error);
      setStaffPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadWorkflows = async () => {
    const patientsForWorkflow = staffPatients;
    const map = await getConsultationWorkflows(patientsForWorkflow);
    setWorkflows(map);
  };

  useEffect(() => {
    let active = true;
    const refreshPatients = async () => {
      await loadStaffPatients();
      if (!active) return;
    };
    refreshPatients();
    const timer = window.setInterval(refreshPatients, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!loadingPatients) loadWorkflows();
  }, [staffPatients, loadingPatients]);

  const patients = useMemo(() => {
    const term = search.trim().toLowerCase();
    return staffPatients.filter((patient) => {
      if (!term) return true;
      return [patient.name, patient.token, patient.department, patient.language, patient.chiefComplaint]
        .some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [staffPatients, search]);

  const counts = useMemo(() => {
    const values = { waiting: 0, preparing: 0, ready: 0, priority: 0 };
    staffPatients.forEach((patient) => {
      const status = normalizeConsultationStatus(workflows[patient.id]?.status || patient.status);
      if ([CONSULTATION_STATUS.CHECKED_IN, CONSULTATION_STATUS.WAITING].includes(status)) values.waiting += 1;
      if (status === CONSULTATION_STATUS.NURSE_PREPARATION) values.preparing += 1;
      if (status === CONSULTATION_STATUS.READY_FOR_DOCTOR) values.ready += 1;
      if (patient.priority || patient.redFlag) values.priority += 1;
    });
    return values;
  }, [staffPatients, workflows]);

  const stats = [
    { label: 'Awaiting preparation', value: counts.waiting, icon: Clock3, tone: 'neutral' },
    { label: 'In preparation', value: counts.preparing, icon: Activity, tone: 'default' },
    { label: 'Ready for doctor', value: counts.ready, icon: CheckCircle2, tone: 'success' },
    { label: 'Priority patients', value: counts.priority, icon: AlertTriangle, tone: 'attention' },
  ];

  const openPatient = async (patient) => {
    setSelectedPatient(patient);
    setSelectedRecord(null);
    setActionError('');
    setSavedMessage('');
    const workflow = workflows[patient.id] || {};
    const storedVitals = workflow.nurse_vitals || {};
    setVitals({ ...EMPTY_VITALS, ...storedVitals });
    setNurseNotes(workflow.nurse_notes || '');
    setIdentityVerified(Boolean(workflow.identity_verified_at));
    setLoadingRecord(true);
    try {
      const record = await getPatientDashboardData(patient.id);
      setSelectedRecord(record);
    } catch (error) {
      setActionError(error.message || 'Patient information could not be loaded.');
    } finally {
      setLoadingRecord(false);
    }
  };

  const closePatient = () => {
    setSelectedPatient(null);
    setSelectedRecord(null);
    setActionError('');
    setSavedMessage('');
  };

  const updateStatus = async (target) => {
    if (!selectedPatient) return;
    setActionError('');
    setSavedMessage('');
    setSaving(true);
    try {
      const extras = {
        nurse_vitals: vitals,
        nurse_notes: nurseNotes.trim() || null,
        identity_verified_at: identityVerified ? new Date().toISOString() : null,
      };
      await transitionPatient(selectedPatient.id, target, extras);
      await loadWorkflows();
      setSavedMessage(target === CONSULTATION_STATUS.READY_FOR_DOCTOR ? 'Patient marked ready for doctor.' : 'Preparation saved.');
    } catch (error) {
      setActionError(error.message || 'Unable to update patient workflow.');
    } finally {
      setSaving(false);
    }
  };

  const currentStatus = selectedPatient
    ? normalizeConsultationStatus(workflows[selectedPatient.id]?.status || selectedPatient.status)
    : null;

  const selectedDocs = selectedRecord?.documents?.list || [];
  const selectedSummary = selectedRecord?.summary;

  return (
    <>
      <StaffWorkspaceShell
        role="nurse"
        kicker="Nurse workspace"
        title="Patient preparation"
        description="Prepare checked-in patients, verify intake readiness, capture vitals and hand over a complete case to the doctor."
        search={<label className="staff-search" aria-label="Search patients"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient, token or concern" /></label>}
        stats={stats}
      >
        <section className="nurse-hero-grid">
          <article className="staff-panel nurse-focus-card">
            <div className="staff-panel-head">
              <div><span>Preparation queue</span><h2>What needs attention now</h2></div>
              <span className="staff-panel-caption"><UserCheck size={15} /> Patient readiness workflow</span>
            </div>
            <div className="nurse-focus-list">
              {patients.filter((patient) => {
                const status = normalizeConsultationStatus(workflows[patient.id]?.status || patient.status);
                return [CONSULTATION_STATUS.CHECKED_IN, CONSULTATION_STATUS.NURSE_PREPARATION].includes(status);
              }).slice(0, 4).map((patient) => (
                <button type="button" className="nurse-focus-item" key={patient.id} onClick={() => openPatient(patient)}>
                  <span className="nurse-focus-token">#{patient.token || '—'}</span>
                  <span><strong>{patient.name || 'Unnamed patient'}</strong><small>{patient.chiefComplaint || 'Complaint not available'}</small></span>
                  <span className="nurse-focus-arrow">Open</span>
                </button>
              ))}
              {!patients.some((patient) => [CONSULTATION_STATUS.CHECKED_IN, CONSULTATION_STATUS.NURSE_PREPARATION].includes(normalizeConsultationStatus(workflows[patient.id]?.status || patient.status))) && (
                <div className="staff-empty nurse-inline-empty"><CheckCircle2 size={20} /><strong>No patients awaiting preparation</strong><span>New checked-in patients will appear here.</span></div>
              )}
            </div>
          </article>

          <article className="nurse-readiness-card">
            <div className="nurse-readiness-eyebrow">READY FOR DOCTOR</div>
            <strong>{counts.ready}</strong>
            <span>patients have completed nurse preparation</span>
            <div className="nurse-readiness-meter"><span style={{ width: `${staffPatients.length ? Math.min(100, Math.round((counts.ready / staffPatients.length) * 100)) : 0}%` }} /></div>
            <small>Handoff is complete only when the patient is ready for clinical review.</small>
          </article>
        </section>

        <section className="staff-panel">
          <div className="staff-panel-head">
            <div><span>Today's intake</span><h2>All patients in preparation workflow</h2></div>
            <span className="staff-panel-caption"><Users size={15} /> {patients.length} patient{patients.length === 1 ? '' : 's'}</span>
          </div>
          <div className="nurse-table">
            <div className="nurse-table-head"><span>Patient</span><span>Concern</span><span>Status</span><span>Priority</span><span>Action</span></div>
            {patients.length ? patients.map((patient) => {
              const status = normalizeConsultationStatus(workflows[patient.id]?.status || patient.status);
              const priority = patient.priority?.level || (patient.priority || patient.redFlag ? 'HIGH' : 'NORMAL');
              return (
                <div className="nurse-table-row" key={patient.id}>
                  <div className="nurse-patient-cell"><div className="staff-patient-avatar">{String(patient.name || 'P').slice(0, 1).toUpperCase()}</div><span><b>{patient.name || 'Unnamed patient'}</b><small>#{patient.token || '—'} · {languageLabel(patient.language)}</small></span></div>
                  <span className="nurse-concern">{patient.chiefComplaint || 'History pending'}</span>
                  <span className="staff-status-pill">{STATUS_LABELS[status]}</span>
                  <span className={`staff-status-pill ${priority !== 'NORMAL' ? 'priority' : ''}`}>{priority === 'NORMAL' ? 'Routine' : priority}</span>
                  <button type="button" className="staff-row-button primary" onClick={() => openPatient(patient)}><UserCheck size={15} /> Prepare</button>
                </div>
              );
            }) : <div className="staff-empty"><Users size={20} /><strong>No patients match your search</strong><span>Try a different name or token.</span></div>}
          </div>
        </section>
      </StaffWorkspaceShell>

      {selectedPatient && (
        <div className="nurse-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePatient(); }}>
          <aside className="nurse-drawer" aria-label="Nurse patient preparation">
            <div className="nurse-drawer-head">
              <div><span>Patient preparation</span><h2>{selectedPatient.name || 'Unnamed patient'}</h2><small>#{selectedPatient.token || '—'} · {selectedPatient.department || 'General Medicine'}</small></div>
              <button type="button" className="nurse-close-button" onClick={closePatient} aria-label="Close"><X size={19} /></button>
            </div>

            {loadingRecord ? <div className="nurse-loading-state"><div className="staff-loading-dot" /> Loading patient record...</div> : (
              <div className="nurse-drawer-body">
                {actionError ? <div className="staff-portal-error" role="alert">{actionError}</div> : null}
                {savedMessage ? <div className="nurse-success-message" role="status">{savedMessage}</div> : null}

                <section className="nurse-drawer-section">
                  <div className="nurse-drawer-section-head"><span>Patient snapshot</span><span className="staff-status-pill">{STATUS_LABELS[currentStatus] || 'Waiting'}</span></div>
                  <div className="nurse-snapshot-grid">
                    <div><small>Age</small><strong>{selectedRecord?.profile?.age ?? selectedPatient.age ?? '—'}</strong></div>
                    <div><small>Gender</small><strong>{selectedRecord?.profile?.gender || selectedPatient.gender || '—'}</strong></div>
                    <div><small>Language</small><strong>{languageLabel(selectedRecord?.profile?.language || selectedPatient.language)}</strong></div>
                    <div><small>Complaint</small><strong>{selectedSummary?.chiefComplaint || selectedPatient.chiefComplaint || 'Not reported'}</strong></div>
                  </div>
                </section>

                <section className="nurse-drawer-section">
                  <div className="nurse-drawer-section-head"><span>Identity & intake check</span><span className="nurse-check-state">{identityVerified ? 'Verified' : 'Not verified'}</span></div>
                  <label className="nurse-checkbox"><input type="checkbox" checked={identityVerified} onChange={(event) => setIdentityVerified(event.target.checked)} /> <span>Patient identity and intake details checked against the registration record.</span></label>
                  <div className="nurse-intake-strip"><span>History quality</span><b>{selectedRecord?.historyQuality?.percentage ?? 0}%</b><span>Documents</span><b>{selectedDocs.length}</b></div>
                </section>

                <section className="nurse-drawer-section">
                  <div className="nurse-drawer-section-head"><span>Vitals</span><span>Optional</span></div>
                  <div className="nurse-vitals-grid">
                    {[['temperature','Temperature','°C'],['pulse','Pulse','bpm'],['respiratoryRate','Respiratory rate','/min'],['systolic','Systolic','mmHg'],['diastolic','Diastolic','mmHg'],['spo2','SpO₂','%']].map(([key, label, unit]) => (
                      <label key={key}><span>{label}</span><div><input value={vitals[key]} onChange={(event) => setVitals((prev) => ({ ...prev, [key]: event.target.value }))} inputMode="decimal" placeholder="—" /><small>{unit}</small></div></label>
                    ))}
                  </div>
                </section>

                <section className="nurse-drawer-section">
                  <div className="nurse-drawer-section-head"><span>Documents</span><span>{selectedDocs.length} linked</span></div>
                  {selectedDocs.length ? <div className="nurse-document-list">{selectedDocs.slice(0, 4).map((doc) => <div className="nurse-document-item" key={doc.id || doc.file_name}><FileText size={16} /><span><b>{doc.file_name || doc.document_name || 'Document'}</b><small>{doc.document_type || 'Other'} · {doc.processing_status || 'Pending'}</small></span></div>)}</div> : <div className="nurse-mini-empty">No previous medical documents linked.</div>}
                </section>

                <section className="nurse-drawer-section">
                  <div className="nurse-drawer-section-head"><span>Preparation notes</span><span>Internal clinical workflow</span></div>
                  <textarea value={nurseNotes} onChange={(event) => setNurseNotes(event.target.value)} rows={4} placeholder="Record preparation notes or operational observations for the clinical handoff." />
                </section>
              </div>
            )}

            <div className="nurse-drawer-footer">
              {currentStatus === CONSULTATION_STATUS.CHECKED_IN && <button type="button" className="staff-row-button primary nurse-wide-action" disabled={saving} onClick={() => updateStatus(CONSULTATION_STATUS.NURSE_PREPARATION)}><Activity size={15} /> {saving ? 'Saving...' : 'Start preparation'}</button>}
              {currentStatus === CONSULTATION_STATUS.NURSE_PREPARATION && <button type="button" className="staff-row-button primary nurse-wide-action" disabled={saving || !identityVerified} onClick={() => updateStatus(CONSULTATION_STATUS.READY_FOR_DOCTOR)}><CheckCircle2 size={15} /> {saving ? 'Saving...' : 'Mark ready for doctor'}</button>}
              {currentStatus === CONSULTATION_STATUS.READY_FOR_DOCTOR && <div className="nurse-ready-footer"><CheckCircle2 size={17} /> Ready for doctor</div>}
              {currentStatus === CONSULTATION_STATUS.WAITING && <div className="nurse-ready-footer neutral"><Clock3 size={17} /> Awaiting queue check-in</div>}
              {!currentStatus && <div className="nurse-ready-footer neutral">Workflow status unavailable</div>}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
