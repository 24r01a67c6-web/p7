import React from 'react';
export const MedicalTimelineView = ({ events = [] }) => {
  const list = Array.isArray(events) ? events : [];
  if (!list.length) return <div style={{ color: 'var(--text-muted)' }}>No timeline events recorded for this visit yet.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {list.map((item) => (
        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1.25rem', borderLeft: '3px solid var(--primary)', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '-8px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>{item.dateLabel} — {item.eventType}</div>
          <div style={{ fontWeight: 700 }}>{item.title}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{item.summary}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Source: {item.source}</div>
        </div>
      ))}
    </div>
  );
};
