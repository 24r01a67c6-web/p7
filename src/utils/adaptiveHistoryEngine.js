/**
 * Pravedā Adaptive Clinical History Engine
 * ------------------------------------------
 * Deterministic state machine for focused, patient-friendly history capture.
 * It selects only questions relevant to the patient's chief complaint and
 * conditionally adds follow-ups when an answer creates a new information need.
 *
 * Safety boundary: this engine collects history and flags predefined warning
 * patterns for clinician review. It does not diagnose, prescribe, or refer.
 */

const normalize = (value = '') => String(value ?? '').trim().toLowerCase();
const has = (answers, id) => String(answers?.[id] ?? '').trim() !== '';
const includesAny = (value, terms = []) => {
  const text = normalize(value);
  return terms.some((term) => text.includes(normalize(term)));
};
const yes = (value) => includesAny(value, ['yes', 'हाँ', 'हां', 'అవును']);
const no = (value) => includesAny(value, ['no', 'नहीं', 'కాదు']);

const BRANCH_ALIASES = {
  chest: ['chest', 'सीने', 'सीना', 'ఛాతి'],
  fever: ['fever', 'बुखार', 'జ్వరం'],
  cough: ['cough', 'खांसी', 'దగ్గు'],
  stomach: ['stomach', 'abdomen', 'पेट', 'కడుపు'],
  headache: ['headache', 'सर दर्द', 'सिर दर्द', 'తలనొప్పి'],
  vomiting: ['vomit', 'उल्टी', 'వాంతి'],
  diarrhea: ['diarr', 'loose motion', 'दस्त', 'విరేచన'],
  injury: ['injury', 'hurt', 'sprain', 'fracture', 'చోటు', 'గాయం'],
};

const branchFromComplaint = (value = '') => {
  const text = normalize(value);
  return Object.entries(BRANCH_ALIASES).find(([, aliases]) => aliases.some((item) => text.includes(item)))?.[0] || 'general';
};

const push = (plan, ...ids) => {
  ids.forEach((id) => {
    if (id && !plan.includes(id)) plan.push(id);
  });
};

/**
 * Clinical branch rules. Base flow aims for a compact 5-question core and
 * expands only when the patient's answers make a follow-up clinically useful.
 */
const getBranchPlan = (branch, answers, patient = {}) => {
  const plan = [];

  switch (branch) {
    case 'chest':
      push(plan, 'chestStart', 'chestLocation', 'chestCharacter', 'chestSeverity', 'chestSpread');
      if (yes(answers.chestSpread)) push(plan, 'breathing');
      if (yes(answers.breathing)) push(plan, 'breathingStart', 'breathingWorse');
      push(plan, 'chestActivity', 'chestRelief');
      break;
    case 'fever':
      push(plan, 'feverStart', 'feverTemp', 'feverChills', 'feverCough');
      if (yes(answers.feverCough)) push(plan, 'coughDuration', 'coughBreathing');
      push(plan, 'feverBodyPain', 'feverRash');
      break;
    case 'cough':
      push(plan, 'coughDuration', 'coughType', 'coughFever', 'coughBreathing');
      if (yes(answers.coughBreathing)) push(plan, 'breathingStart');
      push(plan, 'coughColor', 'coughBlood');
      break;
    case 'stomach':
      push(plan, 'stomachStart', 'stomachLocation', 'stomachSeverity', 'stomachEating', 'stomachVomiting');
      if (yes(answers.stomachVomiting)) push(plan, 'vomitingFrequency', 'vomitingBlood');
      push(plan, 'stomachBowels');
      if (String(patient.gender || '').toLowerCase() === 'female') push(plan, 'pregnancyPossibility');
      break;
    case 'headache':
      push(plan, 'headacheStart', 'headacheLocation', 'headacheSeverity', 'headacheSudden');
      if (yes(answers.headacheSudden)) push(plan, 'headacheVision', 'headacheWeakness');
      else push(plan, 'headacheVision');
      break;
    case 'vomiting':
      push(plan, 'vomitingStart', 'vomitingFrequency', 'vomitingBlood', 'stomachPain');
      if (yes(answers.stomachPain)) push(plan, 'stomachLocation', 'stomachSeverity');
      if (yes(answers.vomitingBlood)) push(plan, 'dehydration');
      break;
    case 'diarrhea':
      push(plan, 'diarrheaStart', 'diarrheaFrequency', 'diarrheaBlood', 'diarrheaVomiting');
      if (yes(answers.diarrheaVomiting)) push(plan, 'vomitingFrequency', 'vomitingBlood');
      push(plan, 'dehydration');
      break;
    case 'injury':
      push(plan, 'generalStart', 'generalSeverity', 'relevantSymptoms');
      break;
    default:
      push(plan, 'generalStart', 'generalSeverity', 'relevantSymptoms');
  }

  return plan;
};

const getCorePlan = (answers = {}) => {
  const core = ['generalConditions', 'medications', 'allergies'];
  if (yes(answers.allergies)) core.push('relevantSymptoms');
  core.push('surgeries', 'relevantSymptoms');
  return [...new Set(core)];
};

export const MAX_ADAPTIVE_QUESTIONS = 8;

export const getAdaptiveQuestionPlan = (answers = {}, patient = {}) => {
  const branch = branchFromComplaint(answers.chiefComplaint);
  const fullPlan = ['chiefComplaint', ...getBranchPlan(branch, answers, patient), ...getCorePlan(answers)];
  // Keep the medical interview compact: the Health Issue page already captures
  // the chief complaint, so Step 3 exposes at most 7 additional clinical questions.
  return [...new Set(fullPlan)].slice(0, MAX_ADAPTIVE_QUESTIONS);
};

export const getNextAdaptiveQuestion = (answers = {}, patient = {}) => {
  const plan = getAdaptiveQuestionPlan(answers, patient);
  return plan.find((id) => !has(answers, id)) || null;
};

export const getHistoryCompleteness = (answers = {}, patient = {}) => {
  const plan = getAdaptiveQuestionPlan(answers, patient);
  const answered = plan.filter((id) => has(answers, id)).length;
  const missing = plan.filter((id) => !has(answers, id));
  return {
    answered,
    total: plan.length,
    percent: plan.length ? Math.round((answered / plan.length) * 100) : 0,
    missing,
    branch: branchFromComplaint(answers.chiefComplaint),
    readyForDoctor: missing.length === 0,
  };
};

/** Warning patterns only; no diagnosis. */
export const assessRedFlags = (answers = {}) => {
  const flags = [];
  const add = (key, reason) => flags.push({ key, reason });

  if (yes(answers.breathing) && yes(answers.breathingWorse)) {
    add('breathing-worsening', 'Worsening breathing difficulty was reported.');
  }
  if (yes(answers.chestSpread) && includesAny(answers.chestSeverity, ['7–10', '7-10'])) {
    add('chest-pain-severe-spread', 'Severe chest pain with pain spreading to another area was reported.');
  }
  if (yes(answers.headacheSudden) || yes(answers.headacheWeakness)) {
    add('headache-neurologic-warning', 'Sudden severe headache or a new neurological warning symptom was reported.');
  }
  if (yes(answers.coughBlood) || yes(answers.vomitingBlood) || yes(answers.diarrheaBlood)) {
    add('bleeding-warning', 'Blood was reported in the symptom history.');
  }
  if (yes(answers.dehydration)) {
    add('possible-dehydration', 'Possible dehydration symptoms were reported.');
  }
  return { isRedFlag: flags.length > 0, flags, reason: flags[0]?.reason || '' };
};

export const branchFromChiefComplaint = branchFromComplaint;
export const isAnswerYes = yes;
export const isAnswerNo = no;
