import React from 'react';
import { useKiosk } from '../context/KioskContext';
import { useTranslation } from '../translations';

export const ProgressBar = ({ currentStep = 1, totalSteps = 7, stepTitle = "" }) => {
  const { language } = useKiosk();
  const t = useTranslation(language);
  const steps = [
    { num: 1, label: 'Registration / Login' },
    { num: 2, label: 'Language Selection' },
    { num: 3, label: 'Consent' },
    { num: 4, label: 'Health Issue / Symptoms' },
    { num: 5, label: 'Adaptive Case-Taking' },
    { num: 6, label: 'Medical Documents' },
    { num: 7, label: 'Clinical Summary' }
  ];

  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div style={{ width: '100%', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('step')} {currentStep} / {totalSteps}: {stepTitle || steps[currentStep - 1]?.label}
        </span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          {percentage}%
        </span>
      </div>

      {/* Progress track */}
      <div style={{ width: '100%', height: '10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s ease'
          }}
        />
      </div>
    </div>
  );
};
