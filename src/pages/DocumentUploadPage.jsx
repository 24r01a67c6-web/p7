import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';
import { ProgressBar } from '../components/ProgressBar';
import { VoiceButton } from '../components/VoiceButton';
import { IconArrowLeft, IconArrowRight, IconCheckCircle, IconUpload, IconFileText, IconAlertTriangle } from '../components/Icons';
import { useTranslation } from '../translations';
import { ExtractedInfoInline } from '../components/ExtractedInfo';
import { SampleDocTester } from '../components/SampleDocTester';
import { DOCUMENT_TYPES, PENDING_MESSAGE, clearSkipFlag, markDocumentsSkipped, processDocumentRecord, processingLabel, readLocalDocuments, removeDocumentRecord, safeDateLabel, structureOcrText, updateLocalDocument, uploadDocumentRecord, validateDocumentFile } from '../services/documentIntelligence';
import { getActiveSession, updateActiveConsultation } from '../services/patientSessionService';

export const DocumentUploadPage = () => {
  const navigate = useNavigate();
  const { language, patientData, setPatientData, uploadedDocs, setUploadedDocs } = useKiosk();
  const t = useTranslation(language);
  const inputRef = useRef(null);
  const cameraRef = useRef(null);
  const [activeType, setActiveType] = useState('Prescription');
  const [busy, setBusy] = useState(false);
  const [processingIds, setProcessingIds] = useState({});
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [docs, setDocs] = useState([]);
  const activeSession = getActiveSession();
  const safePatient = (patientData && typeof patientData === 'object') ? patientData : {};
  const patientId = safePatient.id || activeSession?.patient?.id || localStorage.getItem('medikiosk_current_patient_id') || '';
  const patientName = safePatient.name || activeSession?.patient?.name || '';

  useEffect(() => {
    const local = readLocalDocuments(patientId);
    setDocs(local);
    if (local.length && (!uploadedDocs || uploadedDocs.length === 0)) {
      setUploadedDocs(local.map((d) => ({ id: d.id, name: d.document_name || d.file_name, file: d.document_name || d.file_name, type: d.document_type, processing: d.processing_status !== 'processed', processedAt: d.created_at })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const syncContext = (next) => {
    setDocs(next);
    const mapped = next.map((d) => ({ id: d.id, name: d.document_name || d.file_name, file: d.document_name || d.file_name, type: d.document_type, processing: d.processing_status !== 'processed', processedAt: d.created_at }));
    setUploadedDocs(mapped);
    setPatientData((p) => ({ ...(p || {}), documents: mapped }));
    updateActiveConsultation({ documents: mapped });
  };

  const handleFiles = async (fileList) => {
    setError(''); setNotice('');
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setBusy(true);
    try {
      for (const file of files) {
        const check = validateDocumentFile(file);
        if (!check.ok) { setError(check.error); continue; }
        const rec = await uploadDocumentRecord({ file, documentType: activeType, patientId, patientName });
        setProcessingIds((p) => ({ ...p, [rec.id]: 'uploading' }));
        const next = [rec, ...readLocalDocuments(patientId)];
        const seen = new Set(); const deduped = next.filter((d) => { const k = String(d.id); if (seen.has(k)) return false; seen.add(k); return true; });
        syncContext(deduped);
        setNotice(`"${file.name}" uploaded. Running OCR…`);
        try {
          setProcessingIds((p) => ({ ...p, [rec.id]: 'processing' }));
          const result = await processDocumentRecord(rec, file, {});
          syncContext(readLocalDocuments(patientId));
          if (result.status === 'processed') setNotice(`"${file.name}": information extracted — requires doctor review.`);
          else if (result.status === 'partial') setNotice(`"${file.name}": partially processed — some information may require doctor verification.`);
          else setNotice(`"${file.name}": ${result.error || 'processing failed'} — available for manual review.`);
        } finally {
          setProcessingIds((p) => { const c = { ...p }; delete c[rec.id]; return c; });
        }
      }
    } catch (e) { setError(e?.message || 'Upload failed. Please try again.'); }
    finally { setBusy(false); }
  };


  const onRemove = async (docId) => {
    try { const next = await removeDocumentRecord(patientId, docId); syncContext(next); }
    catch { setError('Could not remove document. Please try again.'); }
  };
  const onSkip = () => {
    setError(''); setNotice('');
    if (docs.length > 0) { navigate('/summary'); return; }
    markDocumentsSkipped(patientId);
    navigate('/summary');
  };
  const onImportSample = async (result) => {
    setError(''); setNotice('');
    try {
      const res = await fetch(result.type === 'Lab Report' ? '/samples/sample-lab-report.txt' : result.type === 'Prescription' ? '/samples/sample-prescription.txt' : '/samples/sample-discharge-summary.txt');
      const text = await res.text();
      const structured = structureOcrText(text);
      const rec = await uploadDocumentRecord({ file: new File([text], `${result.label.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' }), documentType: result.type, patientId, patientName });
      const n = structured.diagnoses.length + structured.medications.length + structured.labs.length;
      const patch = { processing_status: n > 0 ? 'processed' : 'partial', extracted_text: text.slice(0, 20000), ocr_method: 'synthetic-sample (same rule extractor as OCR path)', extraction: { text: text.slice(0, 20000), method: 'synthetic-sample' }, structured, extraction_note: 'Information extracted from synthetic sample — requires doctor review.', document_date: structured.dates?.document_date || rec.document_date || null };
      if (patch.document_date) patch.document_date_label = safeDateLabel(patch.document_date);
      const docs = updateLocalDocument(patientId, rec.id, patch);
      syncContext(docs);
      setNotice(`"${result.label}" imported with extracted information — requires doctor review.`);
    } catch (e) { setError(e?.message || 'Could not import sample.'); }
  };
  const onContinue = () => { clearSkipFlag(patientId); navigate('/summary'); };

  return (
    <div className="kiosk-container">
      <ProgressBar currentStep={6} totalSteps={7} stepTitle="Step 6 of 7 — Previous Medical Documents" />
      <input ref={inputRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} style={{ display: 'none' }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} style={{ display: 'none' }} />
      <div className="kiosk-card">
        <h1 className="kiosk-title">Previous Medical Documents</h1>
        <p className="kiosk-subtitle">You can upload previous prescriptions, lab reports, discharge summaries, scans, or other medical records. (PDF, JPG, JPEG, PNG)</p>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <label style={{ fontWeight: 700 }}>Document type:</label>
          <select value={activeType} onChange={(e) => setActiveType(e.target.value)} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '2px solid var(--border-light)' }}>
            {DOCUMENT_TYPES.map((dt) => <option key={dt} value={dt}>{dt}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button type="button" className="btn-touch-primary" disabled={busy} onClick={() => inputRef.current?.click()}><IconUpload size={22} /><span>{busy ? 'Uploading…' : 'Upload Document'}</span></button>
          <button type="button" className="btn-touch-secondary" disabled={busy} onClick={() => cameraRef.current?.click()}><IconFileText size={22} /><span>Use Camera</span></button>
          <button type="button" className="btn-touch-secondary" disabled={busy} onClick={onSkip}><IconCheckCircle size={22} /><span>I Don&apos;t Have Documents</span></button>
        </div>
        {error && <div role="alert" style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 700, marginTop: '1rem' }}>{error}</div>}
        {notice && <div className="ai-bubble" style={{ marginTop: '1rem' }}><IconCheckCircle size={20} /> {notice}</div>}
        <div style={{ marginTop: '1.25rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Uploaded documents ({docs.length})</h3>
          {docs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No documents uploaded yet. You can continue without documents.</p>}
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {docs.map((d) => (
              <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.8rem 1rem', background: 'var(--bg-subtle)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{d.document_name || d.file_name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{d.document_type} • {safeDateLabel(d.document_date || d.created_at)} • {processingIds[d.id] ? 'Processing document…' : processingLabel(d.processing_status)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.extraction_note || PENDING_MESSAGE}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(d.processing_status === 'processed' || d.processing_status === 'partial') && (
                      <button type="button" className="btn-touch-secondary" onClick={() => setOpenId(String(openId) === String(d.id) ? null : d.id)}>{String(openId) === String(d.id) ? 'Hide' : 'View extracted information'}</button>
                    )}
                    <button type="button" className="btn-touch-secondary" onClick={() => onRemove(d.id)}>Remove</button>
                  </div>
                </div>
                {String(openId) === String(d.id) && <ExtractedInfoInline doc={d} />}
              </div>
            ))}
          </div>
        </div>
        <SampleDocTester onImport={onImportSample} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <IconAlertTriangle size={18} /><span>Uploaded information is shown as document-extracted and requires doctor review. No diagnosis is made here.</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button type="button" className="btn-touch-secondary" onClick={() => navigate('/history')}><IconArrowLeft size={24} /> <span>{t('back')}</span></button>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <VoiceButton text="Upload previous medical documents, or continue without documents." label="Hear instructions" />
            <button type="button" className="btn-touch-primary" onClick={onContinue}><span>{t('save')} &amp; {t('continue')}</span><IconArrowRight size={24} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};
