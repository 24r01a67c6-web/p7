import React from 'react';
import { processingLabel, safeDateLabel } from '../services/documentIntelligence';
export const ExtractedInfoInline = ({ doc }) => {
  const s = (doc && doc.structured) || {};
  const labs = s.labs || []; const meds = s.medications || []; const dx = s.diagnoses || [];
  const px = s.procedures || []; const other = [...(s.allergies || []), ...(s.conditions || []), ...(s.findings || [])];
  const empty = !labs.length && !meds.length && !dx.length && !px.length && !other.length && !s.facility && !s.doctor;
  const src = `${doc.document_name || doc.file_name || 'Document'}, ${doc.document_date ? safeDateLabel(doc.document_date) : 'date not available'}`;
  return (
    <div style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
      <div style={{ fontWeight: 800, marginBottom: '0.4rem' }}>EXTRACTED MEDICAL INFORMATION</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Source: Document extracted ({src}) — requires doctor review. Not doctor-verified.</div>
      {empty && <div style={{ color: 'var(--text-muted)' }}>No clinical information extracted.</div>}
      {!!dx.length && <div style={{ marginTop: '0.4rem' }}><strong>Diagnosis</strong>{dx.map((x, i) => <div key={i} style={{ fontSize: '0.9rem' }}>• {x.name}</div>)}</div>}
      {!!meds.length && <div style={{ marginTop: '0.4rem' }}><strong>Medicines</strong>{meds.map((x, i) => <div key={i} style={{ fontSize: '0.9rem' }}>• {x.name}{x.dose ? ` — ${x.dose}` : ''}{x.frequency ? `, ${x.frequency}` : ''}{x.duration ? `, ${x.duration}` : ''}</div>)}</div>}
      {!!labs.length && <div style={{ marginTop: '0.4rem' }}><strong>Lab Results</strong>{labs.map((x, i) => <div key={i} style={{ fontSize: '0.9rem' }}>• {x.test}: {x.value}{x.unit ? ` ${x.unit}` : ''}{x.reference_range ? ` (ref ${x.reference_range})` : ' (Reference range not available)'}{x.abnormal === true ? ' — Outside reference range — doctor review required.' : ''}{x.abnormal === false ? ' — Within reference range.' : ''}</div>)}</div>}
      {!!px.length && <div style={{ marginTop: '0.4rem' }}><strong>Procedures</strong>{px.map((x, i) => <div key={i} style={{ fontSize: '0.9rem' }}>• {x.name}{x.date ? ` (${x.date})` : ''}</div>)}</div>}
      {!!other.length && <div style={{ marginTop: '0.4rem' }}><strong>Other Findings</strong>{other.map((x, i) => <div key={i} style={{ fontSize: '0.9rem' }}>• {x.name || x.text}</div>)}</div>}
      {(s.facility || s.doctor) && <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.facility ? `Facility (as written): ${s.facility}. ` : ''}{s.doctor ? `Doctor (as written): ${s.doctor}.` : ''}</div>}
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Status: {processingLabel(doc.processing_status)}</div>
    </div>
  );
};
