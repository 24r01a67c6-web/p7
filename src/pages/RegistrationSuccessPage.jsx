import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';
import { ProgressBar } from '../components/ProgressBar';
import { IconArrowRight, IconCheckCircle, IconShield, IconUser } from '../components/Icons';
import { getActiveSession } from '../services/patientSessionService';

export const RegistrationSuccessPage = () => {
  const navigate = useNavigate();
  const { patientData, setPatientData } = useKiosk();

  // Resolve canonical patient from context or persistent session service
  const patient = useMemo(() => {
    if (patientData?.id && patientData?.name) {
      return patientData;
    }
    const session = getActiveSession();
    if (session?.patient?.id) {
      // Sync back to context if context was empty
      if (!patientData?.id) {
        setPatientData({ ...session.patient, ...session.consultation });
      }
      return session.patient;
    }
    return null;
  }, [patientData, setPatientData]);

  if (!patient || !patient.id) {
    return (
      <div className="kiosk-container">
        <div className="kiosk-card" style={{ textAlign: 'center', maxWidth: 640, margin: '2rem auto' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--warning-light)', color: 'var(--warning)', display: 'grid', placeItems: 'center', margin: '0 auto 1.25rem' }}>
            <IconUser size={32} />
          </div>
          <h1 className="kiosk-title">Patient session not found</h1>
          <p className="kiosk-subtitle" style={{ marginBottom: '1.75rem' }}>
            We could not locate an active registration session. Please start registration or identify yourself.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn-touch-secondary" onClick={() => navigate('/identify')}>
              Patient Identification
            </button>
            <button type="button" className="btn-touch-primary" onClick={() => navigate('/registration')}>
              New Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-container">
      <ProgressBar currentStep={1} totalSteps={7} stepTitle="Registration completed successfully" />
      <div className="kiosk-card registration-success-card" style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
        <div className="success-icon" style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'grid', placeItems: 'center', margin: '0 auto 1.25rem' }}>
          <IconCheckCircle size={38} />
        </div>
        <span className="section-kicker" style={{ color: 'var(--success)', fontWeight: 800, letterSpacing: '0.06em' }}>
          Registration completed successfully
        </span>
        <h1 className="kiosk-title" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
          Welcome, {patient.name}
        </h1>
        <p className="kiosk-subtitle" style={{ maxWidth: 560, margin: '0 auto 1.75rem' }}>
          Your account is ready. Next, we will capture your current medical concern and clinical history for your attending physician.
        </p>
        <div className="success-security" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '2rem' }}>
          <IconShield size={18} />
          <span>Your clinical record stays connected to your phone number for future consultations.</span>
        </div>
        <div>
          <button
            type="button"
            className="btn-touch-primary"
            style={{ minWidth: 280, margin: '0 auto' }}
            onClick={() => navigate('/health-issue')}
          >
            <span>Continue to Health Issue</span>
            <IconArrowRight size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};
