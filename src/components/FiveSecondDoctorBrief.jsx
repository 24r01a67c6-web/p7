import React from 'react';
import { getHistoryQuality } from '../utils/historyCompleteness';

const valueOrNull = (value) => typeof value === 'string' && value.trim() && value !== 'Not reported' ? value.trim() : null;

export const FiveSecondDoctorBrief = ({ patient, currentHistory, previousHistory, completeness, priority, onViewTimeline, title }) => {
  const answers = currentHistory?.answers && typeof currentHistory.answers === 'object' ? currentHistory.answers : {};
  const keyFields = [
    ['Duration', answers.chestStart || answers.feverStart || answers.coughDuration || answers.stomachStart || answers.generalStart],
    ['Severity', answers.chestSeverity || answers.stomachSeverity || answers.generalSeverity],
    ['Location', answers.chestLocation || answers.stomachLocation],
    ['Associated symptoms', answers.relevantSymptoms || answers.feverBodyPain || answers.coughFever || answers.stomachVomiting || answers.stomachBowels],
    ['Medications', answers.medications || patient.medications],
    ['Allergies', answers.allergies || patient.allergies],
    ['Previous conditions', answers.generalConditions || patient.past_medical_history || patient.pmh]
  ].map(([label, value]) => ({ label, value: valueOrNull(value) })).filter((item) => item.value);
  const quality = getHistoryQuality(completeness, Boolean(currentHistory?.id || currentHistory?.completed_at));
  const continuityAnswer = valueOrNull(answers.continuity);

  return (
    <section className="kiosk-card" style={{ padding: '1.25rem', marginBottom: '1rem', border: '2px solid var(--primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ color: 'var(--primary-dark)', margin: 0 }}>{title || '5-Second Doctor Brief'}</h2>
          <small style={{ color: 'var(--text-muted)' }}>Decision support summary — doctor review required.</small>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <strong style={{ color: priority.level === 'HIGH' ? 'var(--danger)' : priority.level === 'MEDIUM' ? 'var(--warning)' : 'var(--success)' }}>{priority.level} PRIORITY</strong>
          <span style={{ fontWeight: 700, color: priority.level === 'HIGH' ? 'var(--danger)' : 'var(--text-main)' }}>{priority.level === 'HIGH' ? 'RED FLAG' : 'No red flags detected'}</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div><strong>Patient snapshot</strong><div>{patient.name || 'Not reported'} | {patient.age || '—'} | {patient.gender || '—'}</div><div>{patient.department || 'Not reported'} · {patient.language || '—'}</div><div>{currentHistory?.completed_at ? new Date(currentHistory.completed_at).toLocaleString() : 'Current visit not completed'}</div></div>
        <div><strong>Current complaint</strong><div>{currentHistory?.chief_complaint || 'Not reported'}</div></div>
        <div><strong>History quality</strong><div>{quality.percentage === null ? 'UNAVAILABLE' : `${quality.percentage}% — ${quality.level}`}</div><div style={{ color: 'var(--text-muted)' }}>{completeness.missing.length ? `Missing: ${completeness.missing.join(', ')}` : 'No useful fields missing'}</div></div>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Key history</strong>
        {keyFields.length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>{keyFields.map((item) => <span key={item.label} style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '0.45rem 0.65rem' }}><b>{item.label}:</b> {item.value}</span>)}</div> : <div style={{ color: 'var(--text-muted)' }}>No structured information reported.</div>}
      </div>
      <div style={{ display: 'grid', gap: '0.35rem', marginBottom: previousHistory ? '1rem' : 0 }}>
        <strong>Red-flag status</strong>
        <div style={{ color: priority.level === 'HIGH' ? 'var(--danger)' : 'var(--text-main)' }}>{priority.level === 'HIGH' ? `RED FLAG: ${priority.redFlagReason || 'Existing red-flag response requires review.'}` : 'No red flags detected'}</div>
      </div>
      {previousHistory && (
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
          <strong>Previous visit context</strong>
          <div>Complaint: {previousHistory.chief_complaint || 'Not reported'} · {previousHistory.completed_at ? new Date(previousHistory.completed_at).toLocaleDateString() : 'Date unavailable'}</div>
          {previousHistory.red_flag && <div style={{ color: 'var(--danger)' }}>Previous red flag: {previousHistory.red_flag_reason || 'Reported response requires review.'}</div>}
          {continuityAnswer && <div>Current continuity response: {continuityAnswer}</div>}
        </div>
      )}
      <button type="button" className="btn-touch-secondary" onClick={onViewTimeline}>View Timeline</button>
    </section>
  );
};
