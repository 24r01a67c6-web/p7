import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';
import { ProgressBar } from '../components/ProgressBar';
import { VoiceButton } from '../components/VoiceButton';
import { IconShield, IconArrowRight, IconArrowLeft, IconAlertTriangle } from '../components/Icons';

export const ConsentPage = () => {
  const navigate = useNavigate();
  const { consentGiven, setConsentGiven, patientData } = useKiosk();
  const [errorMsg, setErrorMsg] = useState('');

  const consentText = "Pravedā will collect your medical information and previous medical documents to prepare a clinical history for your doctor.";

  const handleCheckboxChange = (e) => {
    setConsentGiven(e.target.checked);
    if (e.target.checked) {
      setErrorMsg('');
    }
  };

  const handleContinue = () => {
    if (!consentGiven) {
      setErrorMsg('Please check "I understand and agree to continue" to proceed.');
      return;
    }
    setErrorMsg('');
    if (patientData?.identity_type === 'new_patient' && !patientData?.id) {
      navigate('/registration');
      return;
    }
    navigate('/health-issue');
  };

  return (
    <div className="kiosk-container">
      <ProgressBar currentStep={3} totalSteps={7} stepTitle="Informed Consent" />

      <div className="kiosk-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 className="kiosk-title" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>
              Before We Begin
            </h1>
            <p className="kiosk-subtitle" style={{ textAlign: 'left', margin: 0 }}>
              Please review and consent to digital clinical history collection
            </p>
          </div>
          <VoiceButton text={consentText} />
        </div>

        <div
          style={{
            background: 'var(--primary-light)',
            border: '1px solid var(--border-focus)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            marginBottom: '2rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary-dark)', marginBottom: '0.75rem' }}>
            <IconShield size={28} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Clinical Information Usage</h3>
          </div>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-main)', lineHeight: 1.6, fontWeight: 600 }}>
            "{consentText}"
          </p>
        </div>

        {/* Validation Error Message */}
        {errorMsg && (
          <div
            style={{
              background: 'var(--danger-light)',
              border: '1.5px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1.25rem',
              color: 'var(--danger)',
              fontWeight: 700,
              fontSize: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <IconAlertTriangle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Checkbox Card */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            background: consentGiven ? 'var(--success-light)' : 'var(--bg-subtle)',
            border: `2.5px solid ${consentGiven ? 'var(--success)' : 'var(--border-light)'}`,
            padding: '1.5rem 2rem',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            marginBottom: '2rem',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={handleCheckboxChange}
            style={{ width: '28px', height: '28px', accentColor: 'var(--primary)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>
            I understand and agree to continue.
          </span>
        </label>

        {/* Privacy Notice Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
            marginBottom: '2rem',
            padding: '0.75rem 1rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <IconShield size={18} color="var(--primary)" />
          <span>Privacy Notice: Your health data is securely encrypted according to ABDM & DISHA standards and shared strictly with your attending physician.</span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-touch-secondary"
            onClick={() => navigate('/language')}
          >
            <IconArrowLeft size={24} />
            <span>Back</span>
          </button>

          <button
            type="button"
            className="btn-touch-primary"
            onClick={handleContinue}
          >
            <span>Continue</span>
            <IconArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
