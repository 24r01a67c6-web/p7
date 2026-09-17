import React from 'react';
import { IconActivity, IconAlertTriangle, IconCheckCircle, IconClock, IconFileText, IconSparkles, IconShield, IconUsers } from './Icons';

const ITEM = ({ icon: Icon, title, description, status = 'READY', muted = false }) => (
  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.9rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: muted ? 'var(--bg-subtle)' : 'white' }}>
    <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', background: muted ? 'var(--bg-subtle)' : 'var(--primary-light)', color: muted ? 'var(--text-muted)' : 'var(--primary-dark)', flexShrink: 0 }}><Icon size={18} /></div>
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <strong>{title}</strong>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em', color: muted ? 'var(--text-muted)' : 'var(--success)' }}>{status}</span>
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '0.2rem' }}>{description}</div>
    </div>
  </div>
);

export const ClinicalIntelligenceLayer = ({ documents = [], priority = 'NORMAL', completeness = 0, hasAyush = false }) => {
  const docs = Array.isArray(documents) ? documents : [];
  const processed = docs.filter((doc) => ['processed', 'partial'].includes(doc?.processing_status)).length;
  const priorityStatus = priority === 'HIGH' ? 'REVIEW' : priority === 'MEDIUM' ? 'ATTENTION' : 'READY';

  return (
    <section className="kiosk-card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="capability-icon"><IconSparkles size={20} /></div>
        <div>
          <div style={{ color: 'var(--primary-dark)', fontWeight: 800, letterSpacing: '0.06em', fontSize: '0.78rem' }}>MIDDLE LAYER</div>
          <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Clinical Intelligence Pipeline</h2>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
        <ITEM icon={IconUsers} title="Adaptive Case-Taking" description="Patient answers drive the focused clinical history path." />
        <ITEM icon={IconActivity} title="AYUSH Layer" description={hasAyush ? 'Seven-parameter patient assessment captured.' : 'Runs only when the patient is in AYUSH mode.'} status={hasAyush ? 'CAPTURED' : 'CONDITIONAL'} muted={!hasAyush} />
        <ITEM icon={IconFileText} title="Document Intelligence / OCR" description={`${processed} of ${docs.length} uploaded document(s) have extraction data.`} status={docs.length === 0 ? 'EMPTY' : processed === docs.length ? 'READY' : 'PENDING'} muted={docs.length === 0} />
        <ITEM icon={IconClock} title="Medical Timeline" description="Combines consultation history and uploaded-document events chronologically." />
        <ITEM icon={IconCheckCircle} title="History Completeness" description={`${completeness}% of the current history is captured by the prototype completeness rules.`} />
        <ITEM icon={IconAlertTriangle} title="Priority Assessment" description="Uses recorded red-flag/priority signals for clinical staff review." status={priorityStatus} />
        <ITEM icon={IconSparkles} title="AI-Assisted Case Summary" description="Consolidates patient-reported and document-extracted information for review." />
        <ITEM icon={IconShield} title="Doctor Brief → Secure Record" description="The final workflow moves into physician review and the connected patient record." />
      </div>
    </section>
  );
};
