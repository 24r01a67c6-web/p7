import React, { Component, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { IconArrowLeft, IconAlertTriangle } from '../components/Icons';
import { analyzeHistoryCompleteness, createDoctorBrief } from '../utils/historyCompleteness';
import { calculatePatientPriority } from '../utils/patientPriority';
import { FiveSecondDoctorBrief } from '../components/FiveSecondDoctorBrief';
import { Sidebar } from '../components/Sidebar';
import { fetchPatientDocuments } from '../services/documentIntelligence';
import { ClinicalIntelligenceLayer } from '../components/ClinicalIntelligenceLayer';
import { formatDocumentsSummary, buildDoctorBriefText } from '../utils/doctorCaseBrief';

/** Local error boundary — only for this patient case route, so a render
 * failure can never produce a blank white page. */
export class PatientCaseErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(renderError) {
    console.error('Patient case render error:', renderError);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="kiosk-container">
          <div className="kiosk-card">
            <h2>Unable to load patient case</h2>
            <p style={{ color: 'var(--text-muted)' }}>Something went wrong while rendering this patient case. Please try again.</p>
            <button type="button" className="btn-touch-primary" onClick={() => { window.location.href = '/admin/dashboard'; }}>Back to dashboard</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AdminPatientCasePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCase = async () => {
      if (!id || !supabase) {
        setError('This patient record could not be loaded.');
        return;
      }
      try {
        const { data, error: queryError } = await supabase.from('patients').select('*').eq('id', id).single();
      if (queryError) {
        setError('This patient record could not be loaded.');
        return;
      }
      const { data: historyRows, error: historyError } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', id)
        .order('completed_at', { ascending: false })
        .limit(20);
      if (historyError) {
        console.error('MEDICAL HISTORY LOAD ERROR:', historyError);
      }
      const savedHistory = historyRows?.[0] || {};
      {
        let localCase = {};
        try {
          const localPatients = JSON.parse(localStorage.getItem('medikiosk_patients') || '[]');
          const intake = localPatients.find((item) => item.name === data.name && item.phone === data.phone) || {};
          const histories = JSON.parse(localStorage.getItem('medikiosk_patient_histories') || '[]');
          const history = histories.find((item) => item.patientName === data.name && item.patientPhone === data.phone) || {};
          localCase = { ...intake, ...history };
        } catch (storageError) {
          console.warn('Could not read local patient case details:', storageError);
        }
        setPatient({ ...data, ...localCase, savedHistory, historyRows: historyRows || [] });
        try {
          const docs = await fetchPatientDocuments(id);
          setPatient((previous) => ({ ...previous, documents: Array.isArray(docs) ? docs : [] }));
        } catch (docError) {
          console.warn('Could not load patient documents:', docError);
          setPatient((previous) => ({ ...previous, documents: [] }));
        }
      }
      } catch (loadError) {
        console.error('Patient case load failed:', loadError);
        setError('This patient record could not be loaded.');
      }
    };
    loadCase();
  }, [id]);

  if (error) return <div className="kiosk-container"><div className="kiosk-card"><p style={{ color: 'var(--danger)' }}>{error}</p><button className="btn-touch-secondary" onClick={() => navigate('/admin/dashboard')}>Back to dashboard</button></div></div>;
  if (!patient) return <div className="kiosk-container"><div className="kiosk-card">Loading patient case...</div></div>;

  const documents = Array.isArray(patient.documents) ? patient.documents : [];
  const currentHistory = patient.savedHistory || {};
  const previousHistory = patient.historyRows?.[1] || null;
  const completeness = analyzeHistoryCompleteness(currentHistory);
  const priority = calculatePatientPriority(currentHistory);
  const quality = priority.quality;
  const brief = createDoctorBrief(currentHistory);
  const timeline = [
    ...(documents.map((document) => ({
      date: document.document_date || document.processedAt || document.date || document.created_at,
      label: document.document_type || document.type || 'Medical document',
      detail: document.document_name || document.file_name || document.name || document.file || 'Document'
    }))),
    ...(currentHistory.completed_at ? [{
      date: currentHistory.completed_at,
      label: 'Current visit',
      detail: currentHistory.chief_complaint || 'Structured history completed'
    }] : [])
  ].sort((first, second) => new Date(first.date || 0) - new Date(second.date || 0));
  const hasRedFlag = Boolean(currentHistory.red_flag || patient.red_flag || patient.redFlag);
  const redFlagMessage = currentHistory.red_flag_reason || patient.red_flag_reason || patient.redFlagReason || 'Potential emergency symptom reported';

  let documentsSummary = 'No documents linked';
  try { documentsSummary = formatDocumentsSummary(documents); } catch (summaryError) { console.warn('Document summary generation failed:', summaryError); }

  let doctorBriefText = 'Doctor brief unavailable';
  try { doctorBriefText = buildDoctorBriefText({ patient, currentHistory, documents, previousHistory, completeness, priority }); } catch (briefError) { console.error('Doctor brief generation failed:', briefError); }

  const fields = [
    ['Patient information', `${patient.name || '—'} | ${patient.age ?? '—'} | ${patient.gender || '—'} | ${patient.phone || '—'}`],
    ['Chief complaint', patient.savedHistory?.chief_complaint || patient.chief_complaint || patient.chiefComplaint || 'Not reported'],
    ['Medical history', Array.isArray(patient.savedHistory?.questions) ? patient.savedHistory.questions.map((item) => `${item.question || item.questionId}: ${item.answer}`).join('\n') : (Array.isArray(patient.questions) ? patient.questions.map((item) => `${item.question || item.questionId}: ${item.answer}`).join('\n') : (Array.isArray(patient.history) ? patient.history.map((item) => `${item.question || item.questionId}: ${item.answer}`).join('\n') : patient.history || 'History will appear after the patient completes intake.'))],
    ['Previous medical history', patient.past_medical_history || patient.pastMedicalHistory || patient.pmh || 'Not reported'],
    ['Medications', patient.medications || 'Not reported'],
    ['Allergies', patient.allergies || 'Not reported'],
    ['Family history', patient.family_history || patient.familyHistory || 'Not reported'],
    ['Lifestyle', patient.lifestyle || 'Not reported'],
    ['Red flag status', (patient.savedHistory?.red_flag || patient.redFlag) ? 'Red flag detected' : 'No red flag detected'],
    ['Red flag reason', patient.savedHistory?.red_flag_reason || patient.redFlagReason || 'None reported'],
    ['History completion time', patient.savedHistory?.completed_at ? new Date(patient.savedHistory.completed_at).toLocaleString() : 'Not completed'],
    ['Uploaded documents', documentsSummary],
    ['AI doctor brief', doctorBriefText],
    ['Consultation status', 'Pending consultation']
  ];

  return <PatientCaseErrorBoundary><div className="doctor-layout"><Sidebar /><main className="doctor-main" style={{ width: '100%' }}><button type="button" className="btn-touch-secondary" onClick={() => navigate('/admin/dashboard')}><IconArrowLeft size={20} />Back to dashboard</button><div style={{ margin: '1.5rem 0' }}><h1>Patient Case View</h1><p style={{ color: 'var(--text-muted)' }}>Patient ID: {patient.id} | Registered {patient.created_at ? new Date(patient.created_at).toLocaleString() : '—'}</p></div>{hasRedFlag && <div className="emergency-alert-banner"><IconAlertTriangle size={28} color="var(--danger)" /><strong>Red-flag alert: {redFlagMessage}</strong></div>}<FiveSecondDoctorBrief patient={patient} currentHistory={patient.savedHistory} previousHistory={previousHistory} completeness={completeness} priority={priority} onViewTimeline={() => document.getElementById('medical-timeline')?.scrollIntoView({ behavior: 'smooth' })} /><ClinicalIntelligenceLayer documents={documents} priority={priority.level} completeness={completeness.percentage || 0} hasAyush={patient.department === 'AYUSH' || Boolean(patient.ayushData?.assessment)} />
<section className="kiosk-card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1rem' }}><strong>{priority.level} PRIORITY</strong><span style={{ marginLeft: '1rem' }}>History completeness: {priority.completeness}%</span></section><section className="kiosk-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}><h2 style={{ color: 'var(--primary-dark)', marginBottom: '0.75rem' }}>History Quality</h2>{quality.percentage === null ? <p>History not completed. Quality unavailable.</p> : <><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><strong style={{ fontSize: '1.5rem' }}>{quality.percentage}%</strong><strong>{quality.label}</strong></div><div style={{ height: '0.5rem', background: 'var(--border-light)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.75rem' }}><div style={{ width: `${quality.percentage}%`, height: '100%', background: quality.level === 'GOOD' ? 'var(--success)' : quality.level === 'PARTIAL' ? 'var(--warning)' : 'var(--danger)' }} /></div><div style={{ display: 'grid', gap: '0.25rem' }}>{completeness.available.map((item) => <div key={`available-${item}`}>✓ {item}</div>)}{completeness.missing.length > 0 && <div style={{ marginTop: '0.35rem' }}>⚠ Useful information still missing:</div>}{completeness.missing.map((item) => <div key={`missing-${item}`} style={{ color: 'var(--text-muted)', paddingLeft: '1rem' }}>• {item}</div>)}</div></>}</section><section className="kiosk-card" style={{ padding: '1.5rem', marginBottom: '1rem', border: '2px solid var(--primary)' }}><h2 style={{ color: 'var(--primary-dark)', marginBottom: '1rem' }}>2-Minute Doctor Brief</h2><h3>Chief complaint</h3><p style={{ marginBottom: '1rem' }}>{brief.chiefComplaint}</p><h3>History summary</h3><ul style={{ margin: '0 0 1rem', paddingLeft: '1.25rem' }}>{brief.historySummary.length ? brief.historySummary.map((item) => <li key={`${item.label}-${item.answer}`}>{item.label}: {item.answer}</li>) : <li>No completed history information reported.</li>}</ul><h3>Red flag</h3><p style={{ color: brief.hasRedFlag ? 'var(--danger)' : 'var(--text-main)', marginBottom: '1rem' }}>{brief.hasRedFlag ? `Potential red flag detected: ${brief.redFlagReason}` : 'No potential red flag detected from the recorded responses.'}</p><h3>History completeness</h3><p style={{ marginBottom: '0.25rem' }}>Completeness: {completeness.percentage}%</p><p style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{completeness.missing.length ? completeness.missing.map((item) => `⚠ ${item}`).join('\n') : 'No additional fields identified by the prototype rules.'}</p><h3>Patient context</h3><p style={{ marginBottom: '1rem' }}>Age: {patient.age} | Gender: {patient.gender} | Language: {patient.language} | Department: {patient.department || 'Not reported'}</p><h3>Doctor action note</h3><p style={{ marginBottom: '1rem' }}>Review the recorded history and assess the patient according to clinical protocol.</p><p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{brief.disclaimer}</p></section><section id="medical-timeline" className="kiosk-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}><h2 style={{ color: 'var(--primary-dark)', marginBottom: '0.75rem' }}>Medical timeline</h2>{timeline.length ? timeline.map((item) => <div key={`${item.label}-${item.date}`} style={{ borderLeft: '3px solid var(--primary)', padding: '0.5rem 0 0.5rem 1rem', marginBottom: '0.5rem' }}><strong>{item.date ? new Date(item.date).toLocaleDateString() : 'Demo date unavailable'}</strong><div>{item.label}: {item.detail}</div></div>) : <p>No documents or completed visit events recorded.</p>}</section><section className="kiosk-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}><h2 style={{ color: 'var(--primary-dark)', marginBottom: '0.75rem' }}>History completeness</h2><p style={{ marginBottom: '0.75rem' }}>Information available:</p><p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)', marginBottom: '0.75rem' }}>{completeness.available.length ? completeness.available.map((item) => `✓ ${item}`).join('\n') : 'No completed history information reported.'}</p><p style={{ marginBottom: '0.75rem' }}>Information that may still be useful:</p><p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)', marginBottom: '0.75rem' }}>{completeness.missing.length ? completeness.missing.map((item) => `⚠ ${item}`).join('\n') : 'No additional fields identified by the prototype rules.'}</p><strong>Completeness: {completeness.percentage}%</strong></section><div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>{fields.map(([label, value]) => <section className="kiosk-card" style={{ padding: '1.25rem' }} key={label}><h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>{label}</h3><p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>{String(value)}</p></section>)}</div></main></div></PatientCaseErrorBoundary>;
};
