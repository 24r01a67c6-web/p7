const hasAnswer = (answers, ids) => ids.some((id) => {
  const value = answers[id];
  return typeof value === 'string' && value.trim() && value.trim().toLowerCase() !== 'not reported';
});

const complaintType = (complaint = '') => {
  const value = complaint.toLowerCase();
  if (value.includes('chest') || value.includes('ఛాతి') || value.includes('छाती')) return 'chest';
  if (value.includes('fever') || value.includes('జ్వరం') || value.includes('बुखार')) return 'fever';
  if (value.includes('cough') || value.includes('దగ్గు') || value.includes('खांसी')) return 'cough';
  if (value.includes('stomach') || value.includes('కడుపు') || value.includes('पेट')) return 'stomach';
  return 'generic';
};

const rules = {
  chest: {
    expected: [
      ['Chief complaint', ['chiefComplaint']],
      ['Onset', ['chestStart']],
      ['Severity', ['chestSeverity']],
      ['Breathing status', ['breathing']],
      ['Location of pain', ['chestLocation']],
      ['Whether pain radiates', ['chestSpread']],
      ['Previous similar episodes', ['previousEpisodes']]
    ]
  },
  fever: {
    expected: [
      ['Chief complaint', ['chiefComplaint']],
      ['Duration', ['feverStart']],
      ['Temperature', ['feverTemp']],
      ['Chills', ['feverChills']],
      ['Body pain or other symptoms', ['feverBodyPain', 'feverCough', 'relevantSymptoms']]
    ]
  },
  cough: {
    expected: [
      ['Chief complaint', ['chiefComplaint']],
      ['Duration', ['coughDuration']],
      ['Dry or productive cough', ['coughType']],
      ['Mucus details', ['coughColor', 'coughType']],
      ['Breathing status', ['coughBreathing']],
      ['Other symptoms', ['coughFever', 'relevantSymptoms']]
    ]
  },
  stomach: {
    expected: [
      ['Chief complaint', ['chiefComplaint']],
      ['Location of pain', ['stomachLocation']],
      ['Onset', ['stomachStart']],
      ['Severity', ['stomachSeverity']],
      ['Vomiting or diarrhea', ['stomachVomiting', 'stomachBowels']],
      ['Other symptoms', ['relevantSymptoms']]
    ]
  },
  generic: {
    expected: [
      ['Chief complaint', ['chiefComplaint']],
      ['Onset', ['generalStart']],
      ['Severity', ['generalSeverity']],
      ['Other symptoms', ['relevantSymptoms']]
    ]
  }
};

export const analyzeHistoryCompleteness = (history = {}) => {
  const answers = history.answers || Object.fromEntries(
    (Array.isArray(history.questions) ? history.questions : [])
      .map((item) => [item.questionId, item.answer])
  );
  const type = complaintType(history.chief_complaint || answers.chiefComplaint || '');
  const expected = rules[type].expected;
  const available = expected.filter(([, ids]) => hasAnswer(answers, ids)).map(([label]) => label);
  const missing = expected.filter(([, ids]) => !hasAnswer(answers, ids)).map(([label]) => label);

  return {
    type,
    available,
    missing,
    percentage: Math.round((available.length / expected.length) * 100)
  };
};

export const getHistoryQuality = (completeness, hasHistory = true) => {
  if (!hasHistory) {
    return {
      percentage: null,
      level: 'UNAVAILABLE',
      label: 'Quality unavailable'
    };
  }

  const percentage = completeness?.percentage || 0;
  const level = percentage >= 80 ? 'GOOD' : percentage >= 50 ? 'PARTIAL' : 'LIMITED';

  return {
    percentage,
    level,
    label: level
  };
};

const summaryLabels = {
  chiefComplaint: 'Chief complaint',
  chestStart: 'Onset',
  chestSeverity: 'Severity',
  breathing: 'Breathing difficulty',
  chestLocation: 'Pain location',
  chestSpread: 'Pain radiation',
  feverStart: 'Duration',
  feverTemp: 'Highest temperature',
  feverChills: 'Chills',
  feverBodyPain: 'Body pain',
  coughDuration: 'Duration',
  coughType: 'Cough type',
  coughColor: 'Mucus details',
  coughBreathing: 'Breathing difficulty',
  stomachLocation: 'Pain location',
  stomachStart: 'Onset',
  stomachSeverity: 'Severity',
  stomachVomiting: 'Vomiting',
  stomachBowels: 'Bowel symptoms',
  generalStart: 'Onset',
  generalSeverity: 'Severity',
  relevantSymptoms: 'Other symptoms'
};

export const createDoctorBrief = (history = {}) => {
  const answers = history.answers || {};
  const questions = Array.isArray(history.questions) ? history.questions : [];
  const questionSummary = questions
    .filter((item) => item.questionId !== 'chiefComplaint' && item.answer && item.answer !== 'Not reported')
    .map((item) => ({
      label: summaryLabels[item.questionId] || item.question || item.questionId,
      answer: item.answer
    }));
  const structuredSummary = Object.entries(answers)
    .filter(([id, answer]) => id !== 'chiefComplaint' && id !== 'rawAnswers' && typeof answer === 'string' && answer.trim() && answer !== 'Not reported')
    .map(([id, answer]) => ({ label: summaryLabels[id] || id, answer }));
  const historySummary = [...questionSummary, ...structuredSummary.filter((item) => !questionSummary.some((existing) => existing.label === item.label && existing.answer === item.answer))];

  return {
    chiefComplaint: history.chief_complaint || answers.chiefComplaint || 'Not reported',
    historySummary,
    hasRedFlag: Boolean(history.red_flag),
    redFlagReason: history.red_flag_reason || 'Stored symptom response requires clinical review.',
    disclaimer: 'Pre-consultation summary only. This does not provide a diagnosis or replace clinical assessment.'
  };
};
