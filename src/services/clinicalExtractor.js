const norm = (s) => String(s || '');
export const extractClinicalEntities = (rawText = '') => {
  const text = norm(rawText);
  const S = { diagnoses: [], medications: [], labs: [], procedures: [], allergies: [], conditions: [], findings: [], dates: {}, facility: null, doctor: null };
  let grounded = 0;
  const claim = (span) => { if (span) grounded += String(span).length; };
  const toIso = (s) => { const m = String(s).match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/); if (!m) return null; let y = m[3]; if (y.length === 2) y = `20${y}`; const iso = `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; const d = new Date(iso); return Number.isNaN(d.getTime()) ? null : iso; };
  const hosp = text.match(/(?:hospital|clinic|nursing home|medical (?:college|centre|center))\s*[:\-]?\s*([A-Za-z][A-Za-z .&'()-]{2,60})/i);
  if (hosp && hosp[1]) { S.facility = hosp[1].trim().slice(0, 80); claim(hosp[0]); }
  const doc = text.match(/(?:dr\.?|doctor)\s*([A-Z][A-Za-z .]{2,40})/);
  if (doc && doc[1]) { S.doctor = doc[1].trim().slice(0, 60); claim(doc[0]); }
  const adm = text.match(/admission[^:\n]*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i);
  const dis = text.match(/discharg[^:\n]*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i);
  const dtx = text.match(/(?:date|dated|report date|visit date)[^:\n]*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i);
  if (adm && adm[1]) { S.dates.admission_date = toIso(adm[1]); claim(adm[0]); }
  if (dis && dis[1]) { S.dates.discharge_date = toIso(dis[1]); claim(dis[0]); }
  if (dtx && dtx[1]) { S.dates.document_date = toIso(dtx[1]); claim(dtx[0]); }
  if (!S.dates.document_date) S.dates.document_date = S.dates.discharge_date || S.dates.admission_date || null;
  const dx = text.match(/(diagnos(?:is|es)|final diagnosis|provisional diagnosis|impression)\s*[:\-]?\s*([^\n]{3,160})/i);
  if (dx && dx[2]) {
    dx[2].split(/[,;]|\s{2,}/).map((s) => s.trim()).filter((s) => s.length >= 3 && s.length <= 80).slice(0, 5).forEach((n) => {
      S.diagnoses.push({ name: n, status: 'document-extracted', span: dx[0].slice(0, 120) }); claim(dx[0]);
    });
  }
  return { structured: S, grounded };
};

export const extractMedsLabs = (rawText = '') => {
  const text = String(rawText || '');
  const medications = []; const labs = []; const procedures = []; const allergies = []; const conditions = []; const findings = [];
  let grounded = 0;
  const claim = (s) => { if (s) grounded += String(s).length; };
  const medRe = /(?:^|\n)\s*(?:\d+[.)]\s*)?(?:Rx\s*[:\-]?\s*)?([A-Z][A-Za-z\- ]{2,30}?)\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|IU|units?))\b([^\n]{0,90})/gim;
  let m; const seenMed = new Set();
  while ((m = medRe.exec(text)) && medications.length < 12) {
    const pre = text.slice(Math.max(0, m.index - 60), m.index);
    // Never treat lines inside a Lab Report section as prescriptions.
    if (/lab(oratory)?|report|hemoglobin|\bhb\b|wbc|glucose|test|result|range|reference/i.test(pre)) {
      // Allow only if the line itself starts with Rx/prescription marker.
      if (!/^\s*(?:\d+[.)]\s*)?(?:Rx\b|prescription)/i.test(m[0])) continue;
    }
    const name = m[1].trim();
    if (seenMed.has(name.toLowerCase())) continue;
    // Lab test names are not medicines (prevents "Glucose 126 mg/dL" -> medication).
    if (/^(hemoglobin|hb|wbc|tlc|rbc|platelet|glucose|sugar|cholesterol|triglyceride|creatinine|urea|bilirubin|tsh|esr|crp|hct|pcv)$/i.test(name)) continue;
    // A dose followed by a lab concentration unit (mg/dL, g/dL) is not a drug dose.
    if (/(?:mg|mcg|g|ml|IU|units?)\s*\/\s*(?:d[ lL]|l|uL|µL|mol)/i.test(String(m[2] || '') + String(m[3] || '').slice(0, 8))) continue;
    if (/^(tablet|capsule|syrup|injection|report|blood|patient|date|hospital|doctor|diagnosis)$/i.test(name)) continue;
    seenMed.add(name.toLowerCase());
    const line = m[0];
    const freq = (line.match(/(\d+\s*(?:times?\s*(?:daily|a day|per day)|BD|TDS|OD|HS|SOS|daily|twice|thrice)[^\n,;]{0,20})/i) || [])[1] || null;
    const dur = (line.match(/(?:for|x)\s*(\d+\s*(?:days?|weeks?|months?))/i) || [])[1] || null;
    medications.push({ name, dose: m[2].trim(), frequency: freq ? freq.trim() : null, duration: dur ? dur.trim() : null, span: line.slice(0, 140) });
    claim(line);
  }
  const labRe = /\b(hemoglobin|hb|wbc|tlc|rbc|platelet|glucose|sugar|cholesterol|triglyceride|creatinine|urea|bilirubin|tsh|esr|crp|hct|pcv)\b[^:\n\d]{0,15}[:\-]?\s*(\d[\d,]*(?:\.\d+)?)\s*([A-Za-z/%]{1,10})?(?:[^\n\d]{0,25}?\(?\s*(\d[\d.,]*\s*[-–]\s*\d[\d.,]*[^\n)]{0,20})\s*\)?)?/gi;
  let l; const seenLab = new Set();
  while ((l = labRe.exec(text)) && labs.length < 20) {
    const key = (l[1] + l[2]).toLowerCase();
    if (seenLab.has(key)) continue;
    seenLab.add(key);
    const value = Number(String(l[2]).replace(/,/g, ''));
    if (!Number.isFinite(value)) continue;
    const unit = (l[3] || '').trim().slice(0, 14) || null;
    const range = (l[4] || '').trim().slice(0, 40) || null;
    let abnormal = null;
    if (range) { const n = range.match(/(\d[\d.,]*)\s*[-–]\s*(\d[\d.,]*)/); if (n) { const lo = Number(n[1].replace(/,/g, '')); const hi = Number(n[2].replace(/,/g, '')); if (Number.isFinite(lo) && Number.isFinite(hi)) abnormal = value < lo || value > hi; } }
    labs.push({ test: l[1].trim(), value: String(l[2]).replace(/,/g, ''), valueNum: value, unit, reference_range: range, abnormal, span: l[0].slice(0, 140) });
    claim(l[0]);
  }
  const px = text.match(/(procedure|surgery|operation)\s*[:\-]?\s*([^\n]{3,120})/i);
  if (px && px[2]) procedures.push({ name: px[2].trim().slice(0, 100), date: null, span: px[0].slice(0, 120) });
  const alg = text.match(/allerg(?:y|ies)\s*[:\-]?\s*([^\n]{2,120})/i);
  if (alg && alg[1] && !/^(nil|none|no |nad|nkda)/i.test(alg[1].trim())) allergies.push({ name: alg[1].trim().slice(0, 100), span: alg[0].slice(0, 120) });
  const pmh = text.match(/(?:past (?:medical )?history|known case of|comorbidities)\s*[:\-]?\s*([^\n]{3,160})/i);
  if (pmh && pmh[1]) conditions.push({ name: pmh[1].trim().slice(0, 120), span: pmh[0].slice(0, 140) });
  const fu = text.match(/follow[\s-]?up[^\n]*[:\-]?\s*([^\n]{3,160})/i);
  if (fu && fu[1]) findings.push({ text: `Follow-up: ${fu[1].trim().slice(0, 150)}`, span: fu[0].slice(0, 140) });
  return { medications, labs, procedures, allergies, conditions, findings, grounded };
};
