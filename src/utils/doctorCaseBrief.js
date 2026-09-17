import { safeDateLabel, processingLabel } from '../services/documentIntelligence';
import { createDoctorBrief } from './historyCompleteness';

/**
 * Doctor-case helpers: convert document records & stored history into
 * safe plain-text summaries for the Admin/Doctor Patient Case page.
 * These only restate recorded/document-extracted information —
 * no diagnosis, treatment or prescribing is generated here.
 */

const asArray = (value) => (Array.isArray(value) ? value : []);

const collectStructured = (documents, key) =>
  asArray(documents).flatMap((doc) => (doc?.structured && Array.isArray(doc.structured[key]) ? doc.structured[key] : []));

const asText = (value) => (typeof value === 'string' && value.trim() ? value.trim() : '');

export const formatDocumentsSummary = (documents = []) => {
  const docs = asArray(documents);
  if (!docs.length) return 'No documents uploaded';
  return docs
    .map((doc) => {
      const name = doc.document_name || doc.file_name || 'Document';
      const type = doc.document_type || 'Other';
      const status = processingLabel(doc.processing_status);
      const date = doc.document_date ? safeDateLabel(doc.document_date) : (doc.document_date_label || 'Date not available');
      return `${type}\n${name}\nStatus: ${status}\nDate: ${date}`;
    })
    .join('\n\n');
};

export const buildDoctorBriefText = ({ patient = {}, currentHistory = {}, documents = [], previousHistory = null, completeness = {}, priority = {} } = {}) => {
  const docs = asArray(documents);
  const answers = currentHistory?.answers && typeof currentHistory.answers === 'object' ? currentHistory.answers : {};
  const noInfo = 'No information available';
  const pendingNote = 'Information extraction pending';

  const extractedMeds = collectStructured(docs, 'medications')
    .map((m) => [asText(m?.name) || (typeof m === 'string' ? m : ''), asText(m?.dose), asText(m?.frequency)].filter(Boolean).join(' — '))
    .filter(Boolean);
  const reportedMeds = asText(answers.medications) || asText(patient.medications);
  const allergies = asText(answers.allergies) || asText(patient.allergies);
  const pastHistory = asText(answers.generalConditions) || asText(patient.past_medical_history) || asText(patient.pmh);

  const labs = collectStructured(docs, 'labs')
    .map((l) => [asText(l?.test), [asText(l?.value), asText(l?.unit)].filter(Boolean).join(' ')].filter(Boolean).join(': '))
    .filter(Boolean);
  const procedures = collectStructured(docs, 'procedures')
    .map((p) => asText(p?.name) || (typeof p === 'string' ? p : ''))
    .filter(Boolean);
  const documentDiagnoses = collectStructured(docs, 'diagnoses')
    .map((d) => asText(d?.name) || (typeof d === 'string' ? d : ''))
    .filter(Boolean);

  const hasExtraction = Boolean(extractedMeds.length || labs.length || procedures.length || documentDiagnoses.length);
  const extractionPending = docs.length > 0 && !hasExtraction;

  const historySummary = createDoctorBrief(currentHistory || {}).historySummary || [];

  const timelineHighlights = [];
  if (currentHistory?.completed_at) timelineHighlights.push(`Structured history completed — ${safeDateLabel(currentHistory.completed_at)}`);
  if (previousHistory?.completed_at) timelineHighlights.push(`Previous visit — ${previousHistory.chief_complaint || 'history recorded'} — ${safeDateLabel(previousHistory.completed_at)}`);
  docs.slice(0, 5).forEach((doc) => {
    timelineHighlights.push(`${doc.document_name || doc.file_name || 'Document'} (${doc.document_type || 'Other'}) uploaded — ${doc.document_date ? safeDateLabel(doc.document_date) : 'date not available'}`);
  });

  const sections = [];

  sections.push('PATIENT SNAPSHOT');
  sections.push(`Name: ${asText(patient.name) || noInfo}`);
  sections.push(`Age: ${patient.age !== undefined && patient.age !== null && patient.age !== '' ? patient.age : noInfo}`);
  sections.push(`Gender: ${asText(patient.gender) || noInfo}`);

  sections.push('');
  sections.push('CURRENT COMPLAINT');
  sections.push(asText(currentHistory?.chief_complaint) || asText(patient.chief_complaint) || asText(patient.chiefComplaint) || noInfo);

  sections.push('');
  sections.push('PATIENT-REPORTED HISTORY');
  sections.push(historySummary.length ? historySummary.map((item) => `- ${item.label}: ${item.answer}`).join('\n') : noInfo);

  sections.push('');
  sections.push('PREVIOUS HISTORY');
  const previousLines = [];
  if (previousHistory?.chief_complaint) previousLines.push(`- Complaint: ${previousHistory.chief_complaint}`);
  if (previousHistory?.completed_at) previousLines.push(`- Completed: ${safeDateLabel(previousHistory.completed_at)}`);
  if (pastHistory) previousLines.push(`- Conditions reported: ${pastHistory}`);
  sections.push(previousLines.length ? previousLines.join('\n') : noInfo);

  sections.push('');
  const medSources = [reportedMeds ? 'PATIENT-REPORTED' : null, extractedMeds.length ? 'DOCUMENT-EXTRACTED' : null].filter(Boolean);
  sections.push(`MEDICATIONS [${medSources.join(' + ') || 'NONE AVAILABLE'}]`);
  sections.push([reportedMeds, ...extractedMeds].filter(Boolean).join(', ') || noInfo);

  sections.push('');
  sections.push(`ALLERGIES [${allergies ? 'PATIENT-REPORTED' : 'NONE AVAILABLE'}]`);
  sections.push(allergies || noInfo);

  sections.push('');
  sections.push('PREVIOUS INVESTIGATIONS [DOCUMENT-EXTRACTED]');
  sections.push(labs.length ? labs.map((l) => `- ${l}`).join('\n') : (extractionPending ? pendingNote : noInfo));

  sections.push('');
  sections.push('PROCEDURES [DOCUMENT-EXTRACTED]');
  sections.push(procedures.length ? procedures.map((p) => `- ${p}`).join('\n') : (extractionPending ? pendingNote : noInfo));

  if (documentDiagnoses.length) {
    sections.push('');
    sections.push('DIAGNOSIS FOUND IN UPLOADED DOCUMENTS [DOCUMENT-EXTRACTED — NOT DOCTOR-VERIFIED]');
    sections.push(documentDiagnoses.map((d) => `- Diagnosis found in uploaded document: ${d}`).join('\n'));
  }

  sections.push('');
  sections.push('MEDICAL TIMELINE HIGHLIGHTS');
  sections.push(timelineHighlights.length ? timelineHighlights.map((item) => `- ${item}`).join('\n') : noInfo);

  sections.push('');
  sections.push('HISTORY QUALITY');
  sections.push(completeness && completeness.percentage !== undefined && completeness.percentage !== null ? `${completeness.percentage}% — ${asText(completeness.type) || 'recorded'} history` : noInfo);

  sections.push('');
  sections.push('PRIORITY');
  sections.push(priority?.level === 'HIGH'
    ? `HIGH — ${asText(priority.redFlagReason) || asText(currentHistory?.red_flag_reason) || 'Red-flag response requires physician review.'}`
    : `${priority?.level || 'NORMAL'} — No red flags detected from recorded responses`);

  sections.push('');
  sections.push('SOURCE LABELS');
  sections.push('PATIENT-REPORTED = answers given during intake. DOCUMENT-EXTRACTED = information read from uploaded documents (requires doctor review, not doctor-verified). DOCTOR-VERIFIED = none yet — no doctor verification has been recorded.');

  sections.push('');
  sections.push('This brief only restates recorded and document-extracted information. It is not a diagnosis and does not recommend treatment. Physician review required before clinical decisions.');

  return sections.join('\n');
};