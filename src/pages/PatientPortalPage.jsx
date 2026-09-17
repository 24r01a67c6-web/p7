import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';
import { getActiveSession, clearActivePatientSession } from '../services/patientSessionService';
import { getPatientWorkspaceSnapshot, resolveActivePatientId } from '../services/projectIntegrationService';
import { MedicalTimelineView } from '../components/MedicalTimelineView';
import {
  IconCheckCircle,
  IconAlertTriangle,
  IconFileText,
  IconUser,
  IconClock,
  IconShield,
  IconArrowLeft,
  IconSparkles
} from '../components/Icons';

export const PatientPortalPage = () => {
  const navigate = useNavigate();
  const { patientData, clearSession } = useKiosk();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Resolve the canonical patient ID from multiple safe layers
  const resolvePatientId = useCallback(() => resolveActivePatientId(patientData), [patientData]);

  const loadDashboard = useCallback(async () => {
    const patientId = resolvePatientId();
    if (!patientId) {
      setLoading(false);
      setError('Patient session could not be restored.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dashboardData = await getPatientWorkspaceSnapshot(patientId);
      setData(dashboardData);
    } catch (err) {
      console.error('[PatientDashboard] Failed to load record:', err);
      // Try fallback from active session cache before failing
      const session = getActiveSession();
      if (session?.patient?.id) {
        try {
          const fallbackData = await getPatientWorkspaceSnapshot(session.patient.id);
          setData(fallbackData);
          setLoading(false);
          return;
        } catch {
          // Ignore secondary fallback error
        }
      }
      setError(err?.message || 'Patient session could not be restored.');
    } finally {
      setLoading(false);
    }
  }, [resolvePatientId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleExitOrLogout = () => {
    clearActivePatientSession();
    if (clearSession) clearSession();
    navigate('/');
  };

  const formatLanguage = (langCode) => {
    switch (langCode) {
      case 'te': return 'తెలుగు (Telugu)';
      case 'hi': return 'हिंदी (Hindi)';
      case 'en': return 'English';
      default: return langCode || 'English';
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Date not available';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return 'Date not available';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 1. Loading State (Skeleton UI)
  if (loading) {
    return (
      <div className="kiosk-container" style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div className="kiosk-card" style={{ marginBottom: '1.5rem', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-subtle)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 28, width: '40%', background: 'var(--bg-subtle)', borderRadius: 6, marginBottom: 8 }} />
              <div style={{ height: 18, width: '60%', background: 'var(--bg-subtle)', borderRadius: 6 }} />
            </div>
          </div>
        </div>
        <div className="kiosk-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Loading your digital health record…</h2>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving your clinical history, documents, and consultation timeline.</p>
        </div>
      </div>
    );
  }

  // 2. Recovery / Error State (Never a silent redirect or blank screen)
  if (error || !data) {
    return (
      <div className="kiosk-container" style={{ maxWidth: 680, margin: '2rem auto' }}>
        <div className="kiosk-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--warning-light)', color: 'var(--warning)', display: 'grid', placeItems: 'center', margin: '0 auto 1.25rem' }}>
            <IconAlertTriangle size={32} />
          </div>
          <h1 className="kiosk-title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Patient session could not be restored
          </h1>
          <p className="kiosk-subtitle" style={{ marginBottom: '2rem' }}>
            {error || 'We could not link an active patient session. If you have already registered, you can log in to view your records, or start a new consultation.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn-touch-secondary" onClick={() => navigate('/patient-records')}>
              <IconFileText size={20} />
              <span>Login to My Records</span>
            </button>
            <button type="button" className="btn-touch-primary" onClick={() => navigate('/')}>
              <IconArrowLeft size={20} />
              <span>Return to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    profile,
    currentConsultation,
    clinicalHistory,
    documents,
    timeline,
    summary,
    historyQuality,
    recentActivity
  } = data;

  const isPriority = currentConsultation.priority === 'Priority';

  return (
    <div className="kiosk-container" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Top Bar Navigation & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn-touch-secondary" onClick={() => navigate('/')}>
          <IconArrowLeft size={20} />
          <span>Kiosk Home</span>
        </button>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Session Active
          </span>
          <button type="button" className="btn-touch-secondary" onClick={handleExitOrLogout}>
            Exit Patient Session
          </button>
        </div>
      </div>

      {/* SECTION 1: DIGITAL HEALTH RECORD — PATIENT PROFILE */}
      <section className="kiosk-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                color: 'white',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
              }}
            >
              <IconUser size={34} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Digital Health Record
              </span>
              <h1 className="kiosk-title" style={{ textAlign: 'left', margin: '0.2rem 0', fontSize: '1.85rem' }}>
                {profile.name}
              </h1>
              <p className="kiosk-subtitle" style={{ textAlign: 'left', margin: 0, fontSize: '0.95rem' }}>
                Personal Outpatient Intake & Clinical Record
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--success-light)', color: 'var(--success)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.85rem' }}>
            <IconCheckCircle size={18} />
            <span>Profile Verified</span>
          </div>
        </div>

        {/* Profile Attributes Grid — NO Medical ID is displayed */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-light)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Age</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{profile.age || 'Not specified'} yrs</div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Gender</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{profile.gender}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Phone Number</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>+91 {profile.phone}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Preferred Language</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{formatLanguage(profile.language)}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Clinical Department</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{profile.department}</div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CURRENT CONSULTATION */}
      <section
        className="kiosk-card"
        style={{
          marginBottom: '1.5rem',
          borderLeft: isPriority ? '5px solid var(--danger)' : '5px solid var(--primary)',
          background: isPriority ? 'rgba(239, 68, 68, 0.02)' : 'white'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isPriority ? 'var(--danger)' : 'var(--primary)', letterSpacing: '0.06em' }}>
              CURRENT CONSULTATION
            </span>
            <h2 style={{ fontSize: '1.4rem', margin: '0.2rem 0', fontWeight: 800 }}>
              {currentConsultation.chiefComplaint || 'Consultation Intake'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={isPriority ? 'badge badge-priority' : 'badge badge-normal'}>
              {isPriority ? '⚠️ Priority Alert' : 'Normal Priority'}
            </span>
            <span className="badge badge-normal" style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
              {currentConsultation.status}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Chief Complaint</span>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {currentConsultation.chiefComplaint}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>History Intake Status</span>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {currentConsultation.completenessPercent}% Completed
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Intake Time</span>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {formatDate(currentConsultation.completedAt)}
            </div>
          </div>
        </div>
      </section>

      {/* 2-COLUMN SECTION: CLINICAL HISTORY & CLINICAL SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* SECTION 3: CLINICAL HISTORY */}
        <section className="kiosk-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
              Clinical History
            </h3>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Adaptive Questions ({clinicalHistory.questions.length})
            </span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Reported Main Concern</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {clinicalHistory.current?.chief_complaint || summary.chiefComplaint}
              </div>
            </div>

            {/* Questions Breakdown */}
            {clinicalHistory.questions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {clinicalHistory.questions.map((q, idx) => (
                  <div
                    key={q.questionId || idx}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {q.question}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      {q.answer || 'Not reported'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                No adaptive questions recorded for this visit yet.
              </div>
            )}

            {/* Previous History Context if Available */}
            {clinicalHistory.previous.length > 0 && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
                  RELEVANT PREVIOUS VISITS
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {clinicalHistory.previous.slice(0, 2).map((prev, pIdx) => (
                    <div key={prev.id || pIdx} style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      • <strong>{prev.chief_complaint}</strong> ({formatDate(prev.completed_at)})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 6: CLINICAL SUMMARY */}
        <section className="kiosk-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
              Clinical Summary
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--warning)', background: 'var(--warning-light)', padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
              <IconSparkles size={14} />
              <span>Draft for Physician</span>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>History of Present Illness (Patient-Reported)</span>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.45 }}>
                {summary.hpi}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '0.8rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Past Conditions</span>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.2rem' }}>{summary.pmh}</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '0.8rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Allergies</span>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.2rem' }}>{summary.allergies}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '0.8rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Document Extracted Information</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.2rem' }}>
                <strong>Medications:</strong> {summary.medications}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.3rem' }}>
                <strong>Investigations:</strong> {summary.investigations}
              </div>
            </div>

            {/* Doctor-Verified Information Notice */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', background: 'rgba(2, 132, 199, 0.06)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginTop: 'auto' }}>
              <IconShield size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--primary-dark)', fontWeight: 600, lineHeight: 1.4 }}>
                Doctor Verification: This pre-consultation summary has been generated for physician review. Clinical diagnosis and treatment orders are confirmed directly during your doctor consultation.
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 4: MEDICAL DOCUMENTS */}
      <section className="kiosk-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
              Medical Documents
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Prescriptions, lab reports, and clinical documents uploaded for this record
            </span>
          </div>
          <span className="badge badge-normal">
            {documents.count} {documents.count === 1 ? 'Document' : 'Documents'} Attached
          </span>
        </div>

        {documents.list.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {documents.list.map((doc, dIdx) => (
              <div
                key={doc.id || dIdx}
                style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <IconFileText size={22} color="var(--primary)" />
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', wordBreak: 'break-word' }}>
                      {doc.document_name || doc.file_name || 'Medical Document'}
                    </strong>
                  </div>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.75rem',
                      background: doc.processing_status === 'processed' ? 'var(--success-light)' : 'var(--warning-light)',
                      color: doc.processing_status === 'processed' ? 'var(--success)' : 'var(--warning)'
                    }}
                  >
                    {doc.processing_status === 'processed' ? 'Processed' : 'Information extraction pending'}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong>Type:</strong> {doc.document_type || 'Other'} · <strong>Date:</strong> {doc.document_date_label || formatDate(doc.document_date || doc.created_at)}
                </div>

                {/* Extracted Clinical Details if Available */}
                {doc.structured && (doc.structured.medications?.length > 0 || doc.structured.labs?.length > 0) ? (
                  <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                    {doc.structured.medications?.length > 0 && (
                      <div style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>
                        💊 {doc.structured.medications.map((m) => m.name || m.text).join(', ')}
                      </div>
                    )}
                    {doc.structured.labs?.length > 0 && (
                      <div style={{ color: 'var(--text-main)', marginTop: '0.2rem' }}>
                        🔬 {doc.structured.labs.map((l) => `${l.test || l.name}: ${l.value}`).join(', ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {doc.processing_status === 'processed' ? 'Clinical data mapped to consultation' : 'Document available for manual physician review'}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
            <IconFileText size={36} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 700 }}>No medical documents attached</div>
            <div style={{ fontSize: '0.85rem' }}>No previous prescriptions or test reports were uploaded during this consultation.</div>
          </div>
        )}
      </section>

      {/* 2-COLUMN SECTION: MEDICAL TIMELINE & HISTORY QUALITY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* SECTION 5: MEDICAL TIMELINE */}
        <section className="kiosk-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
              Medical Timeline
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Chronological History
            </span>
          </div>

          <MedicalTimelineView events={timeline} />
        </section>

        {/* SECTION 7: HISTORY QUALITY */}
        <section className="kiosk-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
              History Quality
            </h3>
            <span className="badge badge-normal" style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
              Quality Rating: {historyQuality.label}
            </span>
          </div>

          {/* Gauge Bar */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              <span>Completeness Score</span>
              <span style={{ color: 'var(--primary)' }}>{historyQuality.percentage}%</span>
            </div>
            <div style={{ height: 10, background: 'var(--bg-subtle)', borderRadius: 10, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(Math.max(historyQuality.percentage, 5), 100)}%`,
                  background: historyQuality.percentage >= 70 ? 'var(--success)' : historyQuality.percentage >= 40 ? 'var(--warning)' : 'var(--primary)',
                  borderRadius: 10,
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>

          {/* Completed Areas */}
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
              COMPLETED AREAS ({historyQuality.available.length})
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {historyQuality.available.length > 0 ? (
                historyQuality.available.map((item) => (
                  <span
                    key={item}
                    style={{
                      background: 'var(--success-light)',
                      color: 'var(--success)',
                      padding: '0.3rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}
                  >
                    ✓ {item}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Initial intake answers recorded</span>
              )}
            </div>
          </div>

          {/* Missing Information */}
          {historyQuality.missing.length > 0 && (
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
                ADDITIONAL DETAILS FOR PHYSICIAN DISCUSSION ({historyQuality.missing.length})
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {historyQuality.missing.map((item) => (
                  <span
                    key={item}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-muted)',
                      padding: '0.3rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    • {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* SECTION 8: RECENT ACTIVITY */}
      <section className="kiosk-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '0.8rem' }}>
          Recent Record Activity
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconClock size={16} color="var(--primary)" />
            <span><strong>Latest Consultation:</strong> {formatDate(recentActivity.latestConsultation)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconFileText size={16} color="var(--primary)" />
            <span><strong>Latest Document:</strong> {formatDate(recentActivity.latestDoc)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconCheckCircle size={16} color="var(--primary)" />
            <span><strong>Latest History Update:</strong> {formatDate(recentActivity.latestHistoryUpdate)}</span>
          </div>
        </div>
      </section>

    </div>
  );
};
