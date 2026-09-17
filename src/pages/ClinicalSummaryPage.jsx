import React, { useEffect, useState } from 'react';
import { readLocalDocuments } from '../services/documentIntelligence';
import { ExtractedInfoInline } from '../components/ExtractedInfo';
import { buildMedicalTimeline } from '../utils/medicalTimeline';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';
import { ProgressBar } from '../components/ProgressBar';
import { VoiceButton } from '../components/VoiceButton';
import {
  IconFileText,
  IconCheckCircle,
  IconAlertTriangle,
  IconSparkles,
  IconArrowLeft,
} from '../components/Icons';
import { getActiveSession } from '../services/patientSessionService';
import { ClinicalIntelligenceLayer } from '../components/ClinicalIntelligenceLayer';
import { analyzeHistoryCompleteness } from '../utils/historyCompleteness';

export const ClinicalSummaryPage = () => {
  const navigate = useNavigate();
  const {
    patientData,
    symptoms,
    emergencyAlert,
    uploadedDocs,
    savePatient
  } = useKiosk();

  const [submitted, setSubmitted] = useState(false);
  const [_createdToken, setCreatedToken] = useState('');
  const [docList, setDocList] = useState([]);
  const activeSession = getActiveSession();
  const pid = (patientData && (patientData.id || patientData.patient_code)) || activeSession?.patient?.id || localStorage.getItem('medikiosk_current_patient_id') || '';
  useEffect(() => { try { setDocList(readLocalDocuments(pid)); } catch { setDocList([]); } }, [pid, uploadedDocs]);

  // Structured Summary Data fields with "Not reported" fallback
  const chiefComplaint = patientData.chiefComplaint || (symptoms.length > 0 ? symptoms.join(', ') : 'Not reported');

  const historyObj = Array.isArray(patientData.history) ? patientData.history : [];
  const hpi = patientData.summary?.hpi ||
    (historyObj.length >= 2 ? `Patient reports: ${historyObj[0]?.answer || 'symptom'} for ${historyObj[1]?.answer || 'duration'}. Severity: ${historyObj[2]?.answer || 'none'}.` : 'Not reported');

  const pmh = patientData.summary?.pmh || historyObj[3]?.answer || 'Not reported';
  const medications = patientData.summary?.medications || historyObj[3]?.answer || 'Not reported';
  const allergies = patientData.summary?.allergies || historyObj[4]?.answer || 'Not reported';

  const docsForSummary = docList.length ? docList : (Array.isArray(uploadedDocs) ? uploadedDocs : []);
  const investigations = docsForSummary.length > 0
    ? docsForSummary.map((d) => `${d.document_name || d.name || d.file || 'Document'} (${d.document_type || d.type || 'Other'})`).join(', ')
    : 'Not reported';
  const timelinePreview = buildMedicalTimeline({ documents: docList, currentHistory: { chief_complaint: chiefComplaint, completed_at: new Date().toISOString() }, previousHistories: [] }).slice(0, 5);

  const isRedFlag = patientData.redFlag || emergencyAlert;
  const redFlags = isRedFlag
    ? '⚠️ Potential Emergency: Breathing difficulty & acute chest pressure reported'
    : 'None reported';

  const handleSubmit = () => {
    // 1. Create a patient object
    // 2. Give it a unique ID
    // 3. Save it to localStorage
    // 4. Navigate to: /doctor
    const submissionPayload = {
      ...patientData,
      chiefComplaint,
      hpi,
      pmh,
      medications,
      allergies,
      investigations,
      redFlag: isRedFlag,
      priority: isRedFlag,
      status: isRedFlag ? 'Priority' : 'Normal',
      summary: {
        chiefComplaint,
        hpi,
        pmh,
        medications,
        allergies,
        investigations,
        redFlags
      }
    };

    const saved = savePatient(submissionPayload);
    setCreatedToken(saved.token || saved.id);
    setSubmitted(true);

    // Keep the patient completion screen separate from the staff portal.
    setTimeout(() => {
      navigate('/patient');
    }, 1200);
  };

  return (
    <div className="kiosk-container">
      <ProgressBar currentStep={7} totalSteps={7} stepTitle="Step 7 of 7 — AI-Assisted Clinical Summary" />

      <div className="kiosk-card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 className="kiosk-title" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>
              Your Clinical Summary
            </h1>
            <p className="kiosk-subtitle" style={{ textAlign: 'left', margin: 0 }}>
              Structured medical intake prepared for your attending physician
            </p>
          </div>
          <VoiceButton text="Review your clinical summary before submitting to your attending doctor." />
        </div>

        {/* Success Banner if Submitted */}
        {submitted ? (
          <div
            style={{
              background: 'var(--success-light)',
              border: '2px solid var(--success-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '2.5rem',
              textAlign: 'center',
              marginBottom: '2rem'
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--success)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}
            >
              <IconCheckCircle size={44} />
            </div>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
              Consultation Summary Saved
            </h2>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '1.5rem' }}>
              Your structured clinical history has been saved to your digital health record and is available to the hospital consultation team for review.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-touch-primary"
                onClick={() => navigate('/patient')}
              >
                <IconFileText size={20} />
                <span>View My Digital Record</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Disclaimer Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--warning-light)',
                color: 'var(--warning)',
                border: '1px solid var(--warning-border)',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.9rem',
                fontWeight: 700,
                marginBottom: '1.5rem'
              }}
            >
              <IconSparkles size={18} />
              <span>AI-generated draft – requires physician review</span>
            </div>

            {/* Medical Summary Grid */}
            <div
              style={{
                background: 'white',
                border: '2px solid var(--border-light)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                marginBottom: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}
            >
              {/* Patient Information Header */}
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Patient Information
                </div>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>
                  {patientData.name || 'Not reported'}, {patientData.age || '—'} yrs ({patientData.gender || 'Not reported'})
                </h3>
                <div style={{ color: 'var(--primary-dark)', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.2rem' }}>
                  OPD Department: {patientData.department || 'Not reported'} | Phone: {patientData.phone || 'Not reported'} | Language: {patientData.language || 'English'}
                </div>
              </div>

              {/* Red Flags if Present */}
              {isRedFlag ? (
                <div
                  style={{
                    background: 'var(--danger-light)',
                    border: '1.5px solid var(--danger-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    color: 'var(--danger)',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}
                >
                  <IconAlertTriangle size={22} />
                  <span>Red Flags: {redFlags}</span>
                </div>
              ) : (
                <div style={{ fontSize: '0.95rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <IconCheckCircle size={18} />
                  <span>Red Flags: None reported</span>
                </div>
              )}

              {/* Sections */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Chief Complaint
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {chiefComplaint}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    History of Present Illness (HPI)
                  </div>
                  <div style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {hpi}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Past Medical History
                  </div>
                  <div style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {pmh}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Current Medications
                  </div>
                  <div style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {medications}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Allergies
                  </div>
                  <div style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {allergies}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Previous Investigations
                  </div>
                  <div style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {investigations}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>DOCUMENT-EXTRACTED INFORMATION — requires doctor review. {docList.length ? `${docList.filter((d) => d.processing_status === 'processed' || d.processing_status === 'partial').length} of ${docList.length} document(s) with extracted information.` : 'No documents uploaded.'}</div>
                  {docList.filter((d) => d.processing_status === 'processed' || d.processing_status === 'partial').slice(0, 3).map((d) => (
                    <div key={d.id} style={{ marginTop: '0.5rem' }}><ExtractedInfoInline doc={d} /></div>
                  ))}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Medical Timeline Highlights
                  </div>
                  <div style={{ display: 'grid', gap: '0.4rem', marginTop: '0.4rem' }}>
                    {timelinePreview.map((ev) => (
                      <div key={ev.id} style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        <strong>{ev.dateLabel}</strong> — {ev.eventType}: {ev.title} <span style={{ color: 'var(--text-muted)' }}>(Source: {ev.source})</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>PATIENT-REPORTED: current complaint + Step 3 history. DOCUMENT-EXTRACTED: OCR results from uploaded files. DOCTOR-VERIFIED: only after physician review.</div>
                </div>
              </div>
            </div>

            <ClinicalIntelligenceLayer
              documents={docList}
              priority={isRedFlag ? 'HIGH' : 'NORMAL'}
              completeness={analyzeHistoryCompleteness({ ...patientData, ...(patientData.answers || {}), ...(patientData.adaptiveAnswers || {}) }).percentage || 0}
              hasAyush={patientData.department === 'AYUSH' || Boolean(patientData.ayushData?.assessment)}
            />

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-touch-secondary"
                onClick={() => navigate('/documents')}
              >
                <IconArrowLeft size={24} />
                <span>Back to Documents</span>
              </button>

              <button
                type="button"
                className="btn-touch-primary"
                onClick={handleSubmit}
              >
                <IconCheckCircle size={24} />
                <span>Submit to Doctor</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
