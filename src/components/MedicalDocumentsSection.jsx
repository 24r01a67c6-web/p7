import React, { useState } from 'react';
import { processingLabel, safeDateLabel } from '../services/documentIntelligence';
import { ExtractedInfoInline } from './ExtractedInfo';
export const MedicalDocumentsSection = ({ documents = [], loading = false }) => {
  const [openId, setOpenId] = useState(null);
  const docs = Array.isArray(documents) ? documents : [];
  if (loading) return <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading medical documents…</div>;
  if (!docs.length) return <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '10px', color: 'var(--text-muted)' }}>No previous medical documents uploaded for this patient.</div>;
  return (
    <div style={{ display: 'grid', gap: '0.6rem' }}>
      {docs.map((d) => {
        const open = String(openId) === String(d.id);
        return (
          <div key={d.id} style={{ border: '1px solid var(--border-light)', borderRadius: '10px', padding: '0.8rem 1rem', background: 'white' }}>
            <button type="button" onClick={() => setOpenId(open ? null : d.id)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span><strong>{d.document_name || d.file_name || 'Document'}</strong><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}> — {d.document_type || 'Other'} | {d.document_date ? safeDateLabel(d.document_date) : (d.document_date_label || 'Date not available')} | {processingLabel(d.processing_status)}</span></span>
              <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{open ? 'Hide' : 'View extracted information'}</span>
            </button>
            {open && (
              <div style={{ marginTop: '0.6rem' }}>
                <ExtractedInfoInline doc={d} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
