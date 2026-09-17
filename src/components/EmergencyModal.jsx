import React from 'react';
import { IconAlertTriangle } from './Icons';

export const EmergencyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        className="emergency-alert-banner"
        style={{
          maxWidth: '550px',
          width: '100%',
          background: 'var(--bg-surface)',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '2.5rem',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--danger-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            border: '2px solid var(--danger-border)'
          }}
        >
          <IconAlertTriangle size={40} color="var(--danger)" />
        </div>

        <h3 style={{ fontSize: '1.6rem', color: 'var(--danger)', fontWeight: 800, marginBottom: '0.75rem' }}>
          🚨 Potential Emergency Symptom Detected
        </h3>

        <p style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Chest discomfort or acute pain detected. Please alert the OPD triage staff or nursing station immediately.
        </p>

        <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
          <button
            type="button"
            className="btn-touch-primary"
            style={{ flex: 1, background: 'var(--danger)', fontSize: '1.1rem', padding: '0.9rem' }}
            onClick={onClose}
          >
            I Have Informed Triage Staff
          </button>
        </div>
      </div>
    </div>
  );
};
