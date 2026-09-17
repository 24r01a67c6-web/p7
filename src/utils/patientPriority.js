import { analyzeHistoryCompleteness, getHistoryQuality } from './historyCompleteness';

export const calculatePatientPriority = (history = {}) => {
  const completeness = analyzeHistoryCompleteness(history);
  const hasHistory = Boolean(
    history.id
    || history.completed_at
    || history.chief_complaint
    || history.questions
    || history.answers
  );
  const hasRedFlag = history.red_flag === true;
  const level = hasRedFlag ? 'HIGH' : completeness.percentage < 70 ? 'MEDIUM' : 'NORMAL';
  const rank = { HIGH: 0, MEDIUM: 1, NORMAL: 2 }[level];

  return {
    level,
    rank,
    completeness: completeness.percentage,
    missing: completeness.missing,
    redFlagReason: history.red_flag_reason || '',
    quality: getHistoryQuality(completeness, hasHistory)
  };
};
