import React, { useState } from 'react';
import { structureOcrText, ocrProviderInfo, OCR_PROVIDER } from '../services/documentIntelligence';
const SAMPLES = [
  { key: 'lab', label: 'Sample Lab Report', url: '/samples/sample-lab-report.txt', type: 'Lab Report' },
  { key: 'rx', label: 'Sample Prescription', url: '/samples/sample-prescription.txt', type: 'Prescription' },
  { key: 'dis', label: 'Sample Discharge Summary', url: '/samples/sample-discharge-summary.txt', type: 'Discharge Summary' },
];
export const SampleDocTester = ({ onImport }) => {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState('');
  const run = async (s) => {
    setBusy(s.key); setResult(null);
    try {
      const res = await fetch(s.url);
      const text = await res.text();
      const structured = structureOcrText(text);
      setResult({ label: s.label, type: s.type, text: text.slice(0, 600), labs: structured.labs, meds: structured.medications, dx: structured.diagnoses, dates: structured.dates });
    } catch (e) { setResult({ label: s.label, error: e?.message || 'Failed to load sample.' }); }
    finally { setBusy(''); }
  };
  return (
    <div style={{ marginTop: '1rem', border: '1px dashed var(--border-light)', borderRadius: '10px', padding: '0.8rem 1rem' }}>
      <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Try with synthetic sample documents (no real patient data)</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Runs the same rule-based extractor used after OCR — proves structuring without fake AI. For full OCR, upload a scanned PDF/image (needs internet once for the OCR worker).</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>OCR engine: {(() => { try { return ocrProviderInfo().provider; } catch { return OCR_PROVIDER; } })()}</div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {SAMPLES.map((s) => <button key={s.key} type="button" className="btn-touch-secondary" disabled={!!busy} onClick={() => run(s)}>{busy === s.key ? 'Testing…' : s.label}</button>)}
      </div>
      {result && !result.error && (
        <div style={{ marginTop: '0.6rem', fontSize: '0.88rem' }}>
          <strong>{result.label}</strong> — labs: {result.labs.length}, meds: {result.meds.length}, diagnoses: {result.dx.length}, doc date: {result.dates?.document_date || 'not found'}
          {result.labs.map((x, i) => <div key={i}>• {x.test}: {x.value}{x.unit ? ` ${x.unit}` : ''}{x.reference_range ? ` (ref ${x.reference_range})` : ' (Reference range not available)'}{x.abnormal === true ? ' — Outside reference range — doctor review required.' : ''}{x.abnormal === false ? ' — Within reference range.' : ''}</div>)}
          {result.meds.map((x, i) => <div key={i}>• {x.name} — {x.dose}{x.frequency ? `, ${x.frequency}` : ''}{x.duration ? `, ${x.duration}` : ''}</div>)}
          {result.dx.map((x, i) => <div key={i}>• Diagnosis (as written): {x.name}</div>)}
          {onImport && <button type="button" className="btn-touch-secondary" style={{ marginTop: '0.4rem' }} onClick={() => onImport(result)}>Import this sample as my document</button>}
        </div>
      )}
      {result && result.error && <div style={{ color: 'var(--danger)', marginTop: '0.5rem' }}>{result.error}</div>}
    </div>
  );
};
