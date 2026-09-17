import { ocrDocumentFile } from './ocrEngine';
import { extractClinicalEntities, extractMedsLabs } from './clinicalExtractor';
import { supabase } from '../lib/supabase';

export const DOCUMENT_TYPES = ['Prescription','Lab Report','Discharge Summary','Medical Scan/Report','Consultation Note','Other'];
export const PENDING_MESSAGE = 'Document uploaded — information extraction pending';
const ALLOWED_EXT = ['pdf','jpg','jpeg','png'];
export const validateDocumentFile = (file) => {
  if (!file) return { ok:false, error:'No file selected.' };
  const ext = String(file.name||'').split('.').pop().toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) return { ok:false, error:'Unsupported file. Use PDF, JPG, JPEG or PNG.' };
  if (file.size > 10*1024*1024) return { ok:false, error:'File too large. Max 10 MB.' };
  return { ok:true, error:'' };
};
export const normalizeDocumentType = (v) => DOCUMENT_TYPES.includes(v) ? v : 'Other';
const localKey = (pid) => `medikiosk_docs_${pid||'anonymous'}`;
export const readLocalDocuments = (pid) => {
  try { const p = JSON.parse(localStorage.getItem(localKey(pid))||'[]'); return Array.isArray(p)?p:[]; } catch { return []; }
};
export const writeLocalDocuments = (pid, docs) => {
  try { localStorage.setItem(localKey(pid), JSON.stringify(docs||[])); } catch { /*noop*/ }
};
export const safeDateLabel = (v) => {
  if (!v) return 'Date not available';
  const d = new Date(v); if (Number.isNaN(d.getTime())) return 'Date not available';
  return d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
};
export const OCR_PROVIDER = 'on-device (pdf.js + Tesseract eng/hin/tel)';
export const processingLabel = (s) => {
  if (s === 'processed') return 'Processed — information extracted';
  if (s === 'partial') return 'Partially processed — needs doctor check';
  if (s === 'failed') return 'Processing failed — manual review';
  if (s === 'processing') return 'Processing document…';
  return 'Pending extraction';
};
export const updateLocalDocument = (pid, docId, patch) => {
  const docs = readLocalDocuments(pid).map((d) => (String(d.id) === String(docId) ? { ...d, ...patch } : d));
  writeLocalDocuments(pid, docs);
  return docs;
};
const persistDocumentUpdate = async (docId, patch) => {
  if (!supabase || !docId) return;
  try {
    const row = {};
    if (patch.processing_status) row.processing_status = patch.processing_status;
    if (patch.document_date !== undefined) row.document_date = patch.document_date;
    if (patch.extracted_text !== undefined) row.extracted_text = patch.extracted_text ? patch.extracted_text.slice(0, 20000) : null;
    if (patch.ocr_method !== undefined) row.ocr_method = patch.ocr_method;
    if (patch.extraction_confidence !== undefined) row.extraction_confidence = patch.extraction_confidence || null;
    // structured: saved as JSONB for fast single-query restore (requires migration step6)
    if (patch.structured !== undefined) row.structured = patch.structured || null;
    if (Object.keys(row).length) await supabase.from('medical_documents').update(row).eq('id', docId);
  } catch { /* noop — Supabase may not yet have structured column; items table is the durable fallback */ }
};
const persistItems = async (docId, structured) => {
  if (!supabase || !docId || !structured) return;
  try {
    await supabase.from('medical_document_items').delete().eq('document_id', docId);
    const rows = [];
    const push = (t, x) => rows.push({ document_id: docId, item_type: t, item_name: x.test || x.name || x.text || null, value: x.value ?? x.dose ?? null, unit: x.unit ?? null, reference_range: x.reference_range ?? x.frequency ?? null, abnormal_flag: x.abnormal ?? null, metadata: { duration: x.duration || null, span: (x.span || '').slice(0, 200) } });
    (structured.labs || []).forEach((x) => push('lab', x));
    (structured.medications || []).forEach((x) => push('medication', x));
    (structured.diagnoses || []).forEach((x) => push('diagnosis', x));
    (structured.procedures || []).forEach((x) => push('procedure', x));
    if (rows.length) await supabase.from('medical_document_items').insert(rows);
  } catch { /* noop */ }
};
export const fetchDocumentItems = async (docId) => {
  if (supabase && docId) {
    try { const { data, error } = await supabase.from('medical_document_items').select('*').eq('document_id', docId); if (!error && data && data.length) return data; } catch { /* noop */ }
  }
  try { const p = JSON.parse(localStorage.getItem(`medikiosk_docitems_${docId}`) || '[]'); return Array.isArray(p) ? p : []; } catch { return []; }
};


const safeId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `doc-${Date.now()}-${Math.floor(Math.random()*1e6)}`);
export const markDocumentsSkipped = (pid) => { try { localStorage.setItem(`medikiosk_docs_skipped_${pid||'anonymous'}`,'1'); } catch {} };
export const didSkipDocuments = (pid) => { try { return localStorage.getItem(`medikiosk_docs_skipped_${pid||'anonymous'}`)==='1'; } catch { return false; } };
export const clearSkipFlag = (pid) => { try { localStorage.removeItem(`medikiosk_docs_skipped_${pid||'anonymous'}`); } catch {} };
export const processDocumentRecord = async (record, file, opts = {}) => {
  const pid = record.patient_id;
  updateLocalDocument(pid, record.id, { processing_status: 'processing', extraction_note: 'Processing document…' });
  try {
    const ocr = await ocrDocumentFile(file, { onProgress: opts.onProgress });
    const a = extractClinicalEntities(ocr.text);
    const b = extractMedsLabs(ocr.text);
    const structured = { ...a.structured, medications: b.medications, labs: b.labs, procedures: b.procedures.length ? b.procedures : a.structured.procedures, allergies: b.allergies, conditions: b.conditions, findings: b.findings };
    const n = structured.diagnoses.length + structured.medications.length + structured.labs.length + structured.procedures.length + structured.allergies.length + structured.conditions.length;
    const hasText = ocr.text.trim().length >= 20;
    const status = n > 0 ? (n >= 2 ? 'processed' : 'partial') : (hasText ? 'partial' : 'failed');
    const patch = { processing_status: status, extracted_text: ocr.text.slice(0, 20000), ocr_method: ocr.method, extraction: { text: ocr.text.slice(0, 20000), method: ocr.method }, structured, extraction_note: status === 'failed' ? 'Processing failed — available for manual review.' : (status === 'partial' ? 'Partially processed — some information may require doctor verification.' : 'Information extracted — requires doctor review.'), document_date: structured.dates?.document_date || record.document_date || null };
    if (patch.document_date) patch.document_date_label = safeDateLabel(patch.document_date);
    const docs = updateLocalDocument(pid, record.id, patch);
    await persistDocumentUpdate(record.id, patch);
    await persistItems(record.id, structured);
    try { localStorage.setItem(`medikiosk_docitems_${record.id}`, JSON.stringify(structured.labs.map((x) => ({ document_id: record.id, item_type: 'lab', item_name: x.test, value: x.value, unit: x.unit })))); } catch { /* noop */ }
    return { status, updated: docs.find((d) => String(d.id) === String(record.id)) };
  } catch (err) {
    const patch = { processing_status: 'failed', extraction_note: `${err?.message || 'OCR failed.'} Available for manual review.` };
    const docs = updateLocalDocument(pid, record.id, patch);
    await persistDocumentUpdate(record.id, patch);
    return { status: 'failed', error: err?.message, updated: docs.find((d) => String(d.id) === String(record.id)) };
  }
};

export const ocrProviderInfo = () => ({ provider: OCR_PROVIDER, langs: 'eng+hin+tel', secretsRequired: false });
/** OCR-only entry point used by tests: text -> structured (no upload needed). */
export const structureOcrText = (ocrText = '') => {
  const a = extractClinicalEntities(ocrText);
  const b = extractMedsLabs(ocrText);
  return { ...a.structured, medications: b.medications, labs: b.labs, procedures: b.procedures.length ? b.procedures : a.structured.procedures, allergies: b.allergies, conditions: b.conditions, findings: b.findings };
};
export const uploadDocumentRecord = async ({ file, documentType, patientId, patientName }) => {
  const v = validateDocumentFile(file); if (!v.ok) throw new Error(v.error);
  const type = normalizeDocumentType(documentType);
  const rec = { id: safeId(), patient_id: patientId||null, patient_name: patientName||'', file_name: file.name, document_name: file.name, file_type: file.type||'', document_type: type, storage_path:'', processing_status:'pending', document_date:null, document_date_label:'Date not available', created_at:new Date().toISOString(), extraction:null, extraction_note:PENDING_MESSAGE, structured:{diagnoses:[],medications:[],labs:[],procedures:[]} };
  if (supabase && patientId) {
    try { const path=`${patientId}/${rec.id}-${file.name}`; const { error } = await supabase.storage.from('medical-documents').upload(path,file,{upsert:true}); if(!error) rec.storage_path=path; } catch {}
    try { const { data, error } = await supabase.from('medical_documents').insert({ patient_id:patientId, file_name:rec.file_name, file_type:rec.file_type, document_type:rec.document_type, storage_path:rec.storage_path||null, processing_status:'pending', document_date:null }).select('*').single(); if(!error&&data){ rec.id=data.id||rec.id; rec.created_at=data.created_at||rec.created_at; } } catch {}
  }
  const ex = readLocalDocuments(patientId); writeLocalDocuments(patientId,[rec,...ex]); clearSkipFlag(patientId); return rec;
};
export const processDocument = async () => ({ status:'pending', note:PENDING_MESSAGE, requiresProvider:true });
export const fetchPatientDocuments = async (patientId) => {
  const local = readLocalDocuments(patientId);
  if (!supabase || !patientId) return local;
  try {
    // Select structured JSONB column if present (requires step6 migration); falls back gracefully
    const { data, error } = await supabase
      .from('medical_documents')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error || !data || !data.length) return local;
    const byId = new Map(local.map((d) => [String(d.id), d]));

    // For docs that have processing_status processed/partial but no structured in localStorage,
    // attempt to reconstruct structured from medical_document_items table
    const needItems = data
      .filter((row) => (row.processing_status === 'processed' || row.processing_status === 'partial') && !byId.get(String(row.id))?.structured?.medications?.length && !row.structured)
      .map((row) => row.id);
    const itemsByDoc = {};
    if (needItems.length > 0) {
      try {
        const { data: items } = await supabase
          .from('medical_document_items')
          .select('*')
          .in('document_id', needItems);
        if (Array.isArray(items)) {
          items.forEach((item) => {
            if (!itemsByDoc[item.document_id]) itemsByDoc[item.document_id] = { diagnoses: [], medications: [], labs: [], procedures: [], allergies: [], conditions: [] };
            const s = itemsByDoc[item.document_id];
            if (item.item_type === 'lab') s.labs.push({ test: item.item_name, value: item.value, unit: item.unit, reference_range: item.reference_range, abnormal: item.abnormal_flag });
            else if (item.item_type === 'medication') s.medications.push({ name: item.item_name, dose: item.value, frequency: item.reference_range, duration: item.metadata?.duration || null });
            else if (item.item_type === 'diagnosis') s.diagnoses.push({ name: item.item_name, status: 'document-extracted' });
            else if (item.item_type === 'procedure') s.procedures.push({ name: item.item_name });
          });
        }
      } catch { /* noop — items table query failed; structured will be empty or from localStorage */ }
    }

    return data.map((row) => {
      const l = byId.get(String(row.id)) || {};
      const st = (row.processing_status === 'processed' || row.processing_status === 'partial' || row.processing_status === 'failed' || row.processing_status === 'processing')
        ? row.processing_status
        : (l.processing_status || 'pending');
      // structured: prefer localStorage (has full data), then Supabase JSONB column, then reconstructed from items
      const structured = l.structured?.medications?.length || l.structured?.labs?.length
        ? l.structured
        : (row.structured || itemsByDoc[row.id] || { diagnoses: [], medications: [], labs: [], procedures: [] });
      const merged = {
        id: row.id,
        patient_id: row.patient_id,
        file_name: row.file_name || l.file_name || 'Document',
        document_name: row.file_name || l.document_name || 'Document',
        file_type: row.file_type || l.file_type || '',
        document_type: normalizeDocumentType(row.document_type || l.document_type),
        storage_path: row.storage_path || l.storage_path || '',
        processing_status: st,
        document_date: row.document_date || l.document_date || null,
        document_date_label: row.document_date ? safeDateLabel(row.document_date) : (l.document_date_label || 'Date not available'),
        created_at: row.created_at || l.created_at || new Date().toISOString(),
        extraction: l.extraction || null,
        extracted_text: row.extracted_text || l.extracted_text || null,
        ocr_method: row.ocr_method || l.ocr_method || null,
        extraction_note: l.extraction_note || PENDING_MESSAGE,
        structured,
      };
      // Keep localStorage up-to-date with Supabase state so future loads are fast
      updateLocalDocument(patientId, row.id, merged);
      return merged;
    });
  } catch { return local; }
};
export const removeDocumentRecord = async (patientId, docId) => {
  const next = readLocalDocuments(patientId).filter((d)=>String(d.id)!==String(docId));
  writeLocalDocuments(patientId,next);
  if (supabase) { try { await supabase.from('medical_documents').delete().eq('id',docId); } catch {} }
  return next;
};
