import { safeDateLabel } from '../services/documentIntelligence';
const summarizeDoc = (doc) => {
  const s = doc.structured || {};
  const bits = [];
  (s.diagnoses || []).slice(0, 2).forEach((x) => bits.push(x.name));
  (s.medications || []).slice(0, 2).forEach((x) => bits.push(`${x.name}${x.dose ? ` ${x.dose}` : ''}`));
  (s.labs || []).slice(0, 3).forEach((x) => bits.push(`${x.test}: ${x.value}${x.unit ? ` ${x.unit}` : ''}`));
  (s.procedures || []).slice(0, 1).forEach((x) => bits.push(x.name));
  if (!bits.length) return doc.processing_status === 'failed' ? 'Processing failed — available for manual review.' : (doc.extraction_note || 'Document uploaded — requires doctor review.');
  return `${bits.join('; ')}. Source: Uploaded Document.`;
};
export const buildMedicalTimeline = ({ documents = [], currentHistory = null, previousHistories = [] } = {}) => {
  const events = [];
  (Array.isArray(documents)?documents:[]).forEach((doc)=>{
    const dateValue = doc.document_date || doc.created_at || null;
    let ts = 0; try { ts = dateValue ? new Date(dateValue).getTime() : 0; } catch { ts = 0; }
    events.push({ id:`doc-${doc.id}`, dateValue, dateLabel: doc.document_date?safeDateLabel(doc.document_date):(doc.document_date_label||'Date not available'), eventType: doc.document_type||'Medical document', title: doc.document_name||doc.file_name||'Uploaded document', summary: summarizeDoc(doc), source:'Uploaded Document', sortTs: ts||0, isCurrent:false });
  });
  (Array.isArray(previousHistories)?previousHistories:[]).forEach((h,i)=>{
    const dv = h.completed_at||h.created_at||null; let ts=0; try{ts=dv?new Date(dv).getTime():0;}catch{ts=0;}
    events.push({ id:`prev-${h.id||i}`, dateValue:dv, dateLabel:dv?safeDateLabel(dv):'Date not available', eventType:'Previous Consultation', title:h.chief_complaint||'Previous consultation recorded', summary:'History recorded in an earlier visit. Source: Patient History.', source:'Patient History', sortTs:ts||0, isCurrent:false });
  });
  if (currentHistory) {
    const dv = currentHistory.completed_at||currentHistory.created_at||new Date().toISOString();
    let ts=Date.now(); try{ts=new Date(dv).getTime()||Date.now();}catch{ts=Date.now();}
    events.push({ id:'current-visit', dateValue:dv, dateLabel:safeDateLabel(dv), eventType:'Clinical History', title:currentHistory.chief_complaint||currentHistory.chiefComplaint||'Current visit history', summary:'Current Step 3 clinical history. Source: Patient History.', source:'Patient History', sortTs:ts, isCurrent:true });
  }
  return events.sort((a,b)=>a.sortTs-b.sortTs);
};
