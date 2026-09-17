import React from 'react';
import { IconActivity, IconAlertTriangle, IconCheckCircle, IconClock, IconFileText } from './Icons';

const metric = (label, value, detail, Icon) => ({ label, value, detail, Icon });

export const ClinicalIntelligencePanel = ({ completeness, quality, priority, documents, timeline, previousHistory, currentHistory, workflowStatus }) => {
  const safeDocs = Array.isArray(documents) ? documents : [];
  const safeTimeline = Array.isArray(timeline) ? timeline : [];
  const level = priority?.level || 'NORMAL';
  const score = Number.isFinite(Number(priority?.score)) ? Number(priority.score) : null;
  const historyPercent = Number.isFinite(Number(quality?.percentage)) ? Number(quality.percentage) : (Number.isFinite(Number(completeness?.percentage)) ? Number(completeness.percentage) : 0);
  const missing = Array.isArray(completeness?.missing) ? completeness.missing : [];

  const metrics = [
    metric('History quality', `${historyPercent}%`, quality?.level || 'Recorded', IconCheckCircle),
    metric('Priority', level, score !== null ? `Score ${score}` : 'Review status', IconAlertTriangle),
    metric('Documents', String(safeDocs.length), safeDocs.length ? `${safeDocs.filter((d) => d?.processing_status === 'processed').length} processed` : 'None uploaded', IconFileText),
    metric('Timeline', String(safeTimeline.length), safeTimeline.length ? 'Clinical events' : 'No events yet', IconClock),
  ];

  const currentComplaint = currentHistory?.chief_complaint || 'Not reported';
  const previousComplaint = previousHistory?.chief_complaint || null;
  const changed = previousComplaint && previousComplaint !== currentComplaint;

  return (
    <section style={{ background: 'linear-gradient(145deg, var(--primary-dark), var(--primary))', color: '#fff', borderRadius: 'var(--radius-lg)', padding: '1.35rem', margin: '1.5rem 0', boxShadow: '0 12px 30px rgba(15, 67, 93, 0.16)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', fontSize: '.72rem', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', opacity: .82 }}>
            <IconActivity size={18} /> Pravedā Clinical Intelligence
          </div>
          <h2 style={{ margin: '.35rem 0 .25rem', fontSize: '1.3rem', color: '#fff' }}>Ready the doctor in seconds</h2>
          <p style={{ margin: 0, opacity: .82, fontSize: '.82rem', maxWidth: 700 }}>
            One clinical view combining intake quality, priority, records, timeline and handoff status.
          </p>
        </div>
        <span style={{ padding: '.35rem .7rem', borderRadius: 999, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', fontSize: '.72rem', fontWeight: 800 }}>
          {workflowStatus || 'Workflow status unavailable'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '.7rem', marginTop: '1rem' }}>
        {metrics.map(({ label, value, detail, Icon }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 12, padding: '.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', alignItems: 'center', opacity: .82 }}>
              <span style={{ fontSize: '.68rem', textTransform: 'uppercase', fontWeight: 800 }}>{label}</span>
              <Icon size={16} />
            </div>
            <div style={{ marginTop: '.28rem', fontSize: '1.08rem', fontWeight: 900 }}>{value}</div>
            <div style={{ marginTop: '.12rem', fontSize: '.7rem', opacity: .76 }}>{detail}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(220px,.8fr)', gap: '.8rem', marginTop: '.8rem' }}>
        <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '.85rem' }}>
          <div style={{ fontSize: '.68rem', textTransform: 'uppercase', fontWeight: 800, opacity: .78 }}>Doctor attention</div>
          <div style={{ marginTop: '.35rem', fontSize: '.82rem', fontWeight: 700 }}>
            {level === 'HIGH' ? 'High-priority symptom pattern requires review.' : 'No high-priority pattern is currently recorded.'}
          </div>
          {missing.length > 0 && <div style={{ marginTop: '.3rem', fontSize: '.74rem', opacity: .82 }}>Missing history: {missing.slice(0, 3).join(', ')}{missing.length > 3 ? '…' : ''}</div>}
        </div>
        <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '.85rem' }}>
          <div style={{ fontSize: '.68rem', textTransform: 'uppercase', fontWeight: 800, opacity: .78 }}>Continuity</div>
          <div style={{ marginTop: '.35rem', fontSize: '.82rem', fontWeight: 700 }}>{changed ? 'Current complaint differs from previous visit.' : previousComplaint ? 'Current complaint matches previous visit.' : 'No previous visit available.'}</div>
          {previousComplaint && <div style={{ marginTop: '.3rem', fontSize: '.74rem', opacity: .82 }}>Previous: {previousComplaint}</div>}
        </div>
      </div>
    </section>
  );
};
