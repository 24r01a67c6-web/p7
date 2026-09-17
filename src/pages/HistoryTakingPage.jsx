import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';
import { ProgressBar } from '../components/ProgressBar';
import { VoiceButton } from '../components/VoiceButton';
import { AdaptiveVoiceInput } from '../components/AdaptiveVoiceInput';
import { EmergencyModal } from '../components/EmergencyModal';
import { IconAlertTriangle, IconArrowLeft, IconCheckCircle, IconSparkles } from '../components/Icons';
import { useTranslation } from '../translations';
import { getQuestionDefinitions, isRedFlagAnswer } from '../data/adaptiveQuestions';
import { getAdaptiveQuestionPlan, getNextAdaptiveQuestion, getHistoryCompleteness, assessRedFlags, branchFromChiefComplaint } from '../utils/adaptiveHistoryEngine';
import { supabase } from '../lib/supabase';
import { extractClinicalInformation } from '../utils/clinicalHistoryIntelligence';
import { getActiveSession, updateActiveConsultation } from '../services/patientSessionService';

const INVALID_PREVIOUS_COMPLAINTS = [
  'coffee', 'i am having coffee', 'hi', 'hi hi', 'hello',
  'test', 'testing', 'yes', 'no', 'okay', 'ok'
];

const isValidPreviousComplaint = (value = '') => {
  const text = String(value || '').trim().toLowerCase();
  if (!text || text.length < 4) return false;
  if (INVALID_PREVIOUS_COMPLAINTS.includes(text)) return false;
  if (/^(hi+|hello+|hey+|test.*|ok+|yes|no)[\s.!]*$/.test(text)) return false;
  return true;
};

const getContinuityText = (language, complaint = '') => {
  const value = String(complaint || '').trim().toLowerCase();
  if (language === 'hi') return `पिछली बार आपने ${complaint} बताया था। क्या यह समस्या अभी भी है?`;
  if (language === 'te') return `గతసారి మీరు ${complaint} గురించి చెప్పారు. ఈ సమస్య ఇంకా ఉందా?`;
  if (value.includes('fever')) return 'Last time, you reported fever. Are you still experiencing it?';
  if (value.includes('chest')) return 'You previously reported chest pain. Are you still experiencing it?';
  if (value.includes('cough')) return 'You previously reported a cough. Is it still present?';
  return `Last time you reported ${complaint}. Is this still present?`;
};

const isAffirmativeContinuity = (value = '') => {
  const text = String(value || '').trim().toLowerCase();
  return ['yes', 'हाँ', 'हां', 'हा', 'అవును'].includes(text);
};

const answerText = (value = '') => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const emergencyAnswer = (answer = '') => {
  const text = answerText(answer);
  return isRedFlagAnswer(text) ||
    ['severe', '7–10', 'yes', 'అవును', 'हाँ', 'తీవ్ర'].some((term) => text.toLowerCase().includes(term));
};

export const HistoryTakingPage = () => {
  const navigate = useNavigate();
  const { language, patientData, setPatientData, setSymptoms, emergencyAlert, setEmergencyAlert } = useKiosk();
  const safeLanguage = ['en', 'hi', 'te'].includes(language) ? language : 'en';
  const safePatient = (patientData && typeof patientData === 'object' && !Array.isArray(patientData)) ? patientData : {};
  const t = useTranslation(safeLanguage);
  const definitions = useMemo(() => getQuestionDefinitions(safeLanguage) || {}, [safeLanguage]);
  const [answers, setAnswers] = useState(() => {
    const stored = safePatient?.adaptiveAnswers;
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {};
    return Object.fromEntries(Object.entries(stored).map(([key, value]) => [key, answerText(value)]));
  });
  const [askedIds, setAskedIds] = useState([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [redFlagEventKey, setRedFlagEventKey] = useState('');
  const [acknowledgedRedFlagEvent, setAcknowledgedRedFlagEvent] = useState('');
  const [redFlagReason, setRedFlagReason] = useState(safePatient.redFlagReason || '');
  const [saveError, setSaveError] = useState('');
  const [intelligenceMessage, setIntelligenceMessage] = useState('');
  const [previousVisit, setPreviousVisit] = useState(null);
  const [continuityLoading, setContinuityLoading] = useState(true);
  const [typedDraft, setTypedDraft] = useState('');
  const activeSession = getActiveSession();
  const currentPatientId = safePatient.id || activeSession?.patient?.id || localStorage.getItem('medikiosk_current_patient_id') || '';

  useEffect(() => {
    let cancelled = false;
    const loadPreviousVisit = async () => {
      if (!currentPatientId || !supabase) {
        setContinuityLoading(false);
        return;
      }
      console.log('[CONTINUITY] Loading previous visit for patient', currentPatientId);
      const { data, error } = await supabase
        .from('medical_history')
        .select('id, chief_complaint, questions, answers, red_flag, red_flag_reason, completed_at')
        .eq('patient_id', currentPatientId)
        .order('completed_at', { ascending: false })
        .limit(1);
      if (cancelled) return;
      if (error) {
        console.error('[CONTINUITY] Previous visit load failed:', error.message);
      } else if (data?.[0]) {
        console.log('[CONTINUITY] Previous visit found');
        setPreviousVisit(data[0]);
      } else {
        console.log('[CONTINUITY] No previous visit found');
      }
      setContinuityLoading(false);
    };
    loadPreviousVisit();
    return () => { cancelled = true; };
  }, [currentPatientId]);

  const branch = branchFromChiefComplaint(answerText(answers?.chiefComplaint));
  const extracted = useMemo(() => extractClinicalInformation(answers || {}), [answers]);
  const previousComplaintRaw = previousVisit?.chief_complaint || '';
  const previousComplaint = isValidPreviousComplaint(previousComplaintRaw) ? String(previousComplaintRaw).trim() : '';
  const continuityQuestion = useMemo(() => {
    if (!previousComplaint || continuityLoading) return null;
    return {
      id: 'continuity',
      text: getContinuityText(safeLanguage, previousComplaint),
      quickAnswers: safeLanguage === 'hi'
        ? [['हाँ', '✓'], ['नहीं', '→']]
        : safeLanguage === 'te'
          ? [['అవును', '✓'], ['కాదు', '→']]
          : [['Yes', '✓'], ['No', '→']]
    };
  }, [previousComplaint, continuityLoading, safeLanguage]);
  const previousAnswers = previousVisit?.answers && typeof previousVisit.answers === 'object' && !Array.isArray(previousVisit.answers)
    ? previousVisit.answers
    : {};
  const previousQuestionDetails = Array.isArray(previousVisit?.questions)
    ? previousVisit.questions.map((item) => item?.answer).filter((value) => typeof value === 'string')
    : [];
  const previousDetails = [
    ...Object.entries(previousAnswers)
      .filter(([key, value]) => key !== 'rawAnswers' && key !== 'chiefComplaint' && typeof value === 'string' && value.trim() && value !== 'Not reported')
      .map(([, value]) => value),
    ...previousQuestionDetails
  ]
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 3);
  const adaptivePlan = useMemo(() => getAdaptiveQuestionPlan({ ...extracted, ...answers }, safePatient), [extracted, answers, safePatient]);
  const mergedAnswers = useMemo(() => ({ ...extracted, ...answers }), [extracted, answers]);
  const planQuestions = useMemo(() => (Array.isArray(adaptivePlan) ? adaptivePlan : []).map((id) => definitions?.[id]).filter(Boolean).filter((item) => !(item.id === 'chiefComplaint' && answerText(answers?.chiefComplaint).trim())), [adaptivePlan, definitions, answers]);
  // Never let a missing localized definition make Step 3 appear blank.
  const safePlanQuestions = useMemo(() => {
    if (planQuestions.length > 0) return planQuestions;
    const fallback = definitions?.chiefComplaint ? [definitions.chiefComplaint] : [];
    if (fallback.length > 0) return fallback;
    // Absolute last resort so first question always renders safely.
    return [{ id: 'chiefComplaint', text: 'What is your main health problem today?', quickAnswers: [] }];
  }, [planQuestions, definitions]);

  const questions = useMemo(() => [
    ...(!answers.continuity && continuityQuestion ? [continuityQuestion] : []),
    ...safePlanQuestions
  ].filter(Boolean).slice(0, 8), [answers.continuity, continuityQuestion, safePlanQuestions]);
  const answeredCount = useMemo(() => questions.filter((item) => item && item.id && answerText(mergedAnswers[item.id]).trim()).length, [questions, mergedAnswers]);
  const activeQuestion = useMemo(() => questions.find((item) => item && item.id && !answerText(mergedAnswers[item.id]).trim()) || null, [questions, mergedAnswers]);
  const activeAnswerValue = activeQuestion ? answerText(answers[activeQuestion.id]) : '';
  const completeness = useMemo(() => getHistoryCompleteness(mergedAnswers, safePatient), [mergedAnswers, safePatient]);
  const askedCount = Math.min(Math.max(askedIds.length, answeredCount, activeQuestion ? 1 : 0), Math.max(questions.length, 1));

  useEffect(() => {
    if (activeQuestion && activeQuestion.id) {
      setAskedIds((previous) => (previous.includes(activeQuestion.id) ? previous : [...previous, activeQuestion.id]));
    }
  }, [activeQuestion]);

  useEffect(() => {
    setTypedDraft('');
  }, [activeQuestion?.id]);

  const updateAnswer = (id, value) => {
    const text = answerText(value);
    setAnswers((previous) => ({ ...(previous || {}), [id]: value }));
    setIntelligenceMessage('Understanding your response...');
    window.setTimeout(() => setIntelligenceMessage(''), 700);
    if (emergencyAnswer(text) || assessRedFlags({ ...(answers || {}), [id]: text }).isRedFlag) {
      const eventKey = `${id}:${text.trim().toLowerCase()}`;
      setRedFlagReason(text.trim());
      setEmergencyAlert(true);
      setRedFlagEventKey(eventKey);
      if (eventKey !== acknowledgedRedFlagEvent) {
        setShowEmergencyModal(true);
      }
    }
    if (id === 'chiefComplaint' && text.trim()) setSymptoms([text.trim()]);
  };

  const acknowledgeEmergency = () => {
    setAcknowledgedRedFlagEvent(redFlagEventKey);
    setShowEmergencyModal(false);
  };

  const completeCurrentAnswer = (id, value) => {
    const text = String(value || '').trim();
    if (!text) {
      setIntelligenceMessage('Please provide an answer before continuing.');
      window.setTimeout(() => setIntelligenceMessage(''), 1200);
      return false;
    }
    if (id === 'continuity') {
      if (isAffirmativeContinuity(text) && previousComplaint) {
        setAnswers((previous) => ({ ...previous, chiefComplaint: previousComplaint, continuity: text }));
        setSymptoms([previousComplaint]);
      } else {
        setAnswers((previous) => ({ ...previous, continuity: text }));
      }
      setIntelligenceMessage('Understanding your response...');
      window.setTimeout(() => setIntelligenceMessage(''), 700);
      setTypedDraft('');
      return true;
    }
    const nextAnswers = { ...(answers || {}), [id]: text };
    updateAnswer(id, text);
    setTypedDraft('');
    const extractedNow = extractClinicalInformation(nextAnswers) || {};
    const nextMerged = { ...extractedNow, ...nextAnswers };
    const nextQuestionId = getNextAdaptiveQuestion(nextMerged, safePatient);
    // One source of truth: the adaptive engine decides when the history is complete.
    if (!nextQuestionId) {
      submitHistory(nextAnswers);
      return true;
    }
    return true;
  };

  const submitHistory = async (overrideAnswers) => {
    const finalAnswers = overrideAnswers || answers || {};
    const structuredAnswers = { ...(extractClinicalInformation(finalAnswers) || {}), ...(finalAnswers || {}) };
    const safeQuestions = Array.isArray(questions) ? questions.filter((item) => item && item.id) : [];
    const completeAnswers = Object.fromEntries(safeQuestions.map((item) => [item.id, answerText(structuredAnswers[item.id]).trim() || 'Not reported']));
    Object.keys(structuredAnswers || {}).forEach((key) => {
      if (typeof structuredAnswers[key] === 'string' && structuredAnswers[key].trim()) completeAnswers[key] = structuredAnswers[key].trim();
    });
    // Never store a continuity yes/no as the chief complaint.
    if (completeAnswers.continuity && !completeAnswers.chiefComplaint) completeAnswers.chiefComplaint = previousComplaint || 'Not reported';
    if (completeAnswers.chiefComplaint && ['yes', 'no', 'हाँ', 'नहीं', 'అవును', 'కాదు'].includes(answerText(completeAnswers.chiefComplaint).trim().toLowerCase())) {
      completeAnswers.chiefComplaint = previousComplaint || 'Not reported';
    }
    const history = safeQuestions.map((item) => ({
      questionId: item.id,
      question: item.text || item.id,
      answer: answerText(completeAnswers[item.id]) || 'Not reported'
    }));
    const redFlagAssessment = assessRedFlags(completeAnswers);
    const detected = history.find((item) => emergencyAnswer(item.answer));
    const isRedFlag = Boolean(emergencyAlert || detected || redFlagAssessment.isRedFlag);
    const reason = redFlagReason || redFlagAssessment.reason || detected?.answer || '';
    const completedAt = new Date().toISOString();
    const historyRecord = {
      patientId: currentPatientId,
      patientName: safePatient.name || '',
      patientPhone: safePatient.phone || '',
      chiefComplaint: answerText(completeAnswers.chiefComplaint) || 'Not reported',
      questions: history,
      answers: { ...completeAnswers, rawAnswers: answers },
      redFlag: isRedFlag,
      redFlagReason: reason,
      completedAt
    };

    const patientId = historyRecord.patientId;
    if (!supabase || !patientId) {
      setSaveError(t('savePatientError'));
      return;
    }

    setSaveError('');
    const { error: historyError } = await supabase
      .from('medical_history')
      .insert({
        patient_id: patientId,
        chief_complaint: historyRecord.chiefComplaint,
        questions: historyRecord.questions,
        answers: historyRecord.answers,
        red_flag: historyRecord.redFlag,
        red_flag_reason: historyRecord.redFlagReason || null,
        completed_at: historyRecord.completedAt
      });

    if (historyError) {
      console.error('MEDICAL HISTORY SAVE ERROR:', historyError);
      setSaveError(t('savePatientError'));
      return;
    }

    try {
      localStorage.setItem('medikiosk_current_patient_history', JSON.stringify(historyRecord));
      const existingHistory = JSON.parse(localStorage.getItem('medikiosk_patient_histories') || '[]');
      const withoutCurrent = existingHistory.filter((item) => !(item.patientName === historyRecord.patientName && item.patientPhone === historyRecord.patientPhone));
      localStorage.setItem('medikiosk_patient_histories', JSON.stringify([historyRecord, ...withoutCurrent]));
    } catch (storageError) {
      console.error('Could not save patient history locally:', storageError);
    }

    const consultationPatch = {
      chiefComplaint: historyRecord.chiefComplaint,
      adaptiveAnswers: completeAnswers,
      answers: completeAnswers,
      history,
      redFlag: isRedFlag,
      priority: isRedFlag,
      status: isRedFlag ? 'Priority' : 'History completed',
      redFlagReason: reason,
      completedAt,
      summary: {
        chiefComplaint: historyRecord.chiefComplaint,
        hpi: history.map((item) => `${item.question}: ${item.answer}`).join('. '),
        redFlags: isRedFlag ? reason : 'None reported'
      }
    };

    updateActiveConsultation(consultationPatch);

    setPatientData((previous) => ({
      ...previous,
      ...consultationPatch,
      summary: {
        ...(previous.summary || {}),
        ...consultationPatch.summary
      }
    }));
    navigate(safePatient.department === 'AYUSH' ? '/ayush-assessment' : '/documents');
  };

  return (
    <div className="kiosk-container">
      <ProgressBar currentStep={5} totalSteps={7} stepTitle="Step 5 – Adaptive Case-Taking" />
      <EmergencyModal isOpen={showEmergencyModal} onClose={acknowledgeEmergency} />
      <div className="kiosk-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <span className="section-kicker">Adaptive Case-Taking</span>
            <h1 className="kiosk-title" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>{t('historyTitle')}</h1>
            <p className="kiosk-subtitle" style={{ textAlign: 'left', margin: 0 }}>{t('adaptiveInstructions')}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-normal">Language: {safeLanguage === 'te' ? 'Telugu' : safeLanguage === 'hi' ? 'Hindi' : 'English'}</span>
            <VoiceButton text={(Array.isArray(questions) ? questions : []).map((item) => item?.text || '').filter(Boolean).join('. ') || 'Medical questions'} label="Hear questions" />
          </div>
        </div>
        {previousVisit && !continuityLoading && (
          <div className="ai-bubble" style={{ marginBottom: '1.5rem' }}>
            <strong>🕒 Previous Visit Context</strong>
            <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.35rem' }}>
              <div><strong>Previous complaint:</strong> {previousComplaint || 'Not reported'}</div>
              <div><strong>Previous visit:</strong> {previousVisit.completed_at ? new Date(previousVisit.completed_at).toLocaleDateString() : 'Date unavailable'}</div>
              {previousDetails.length > 0 && (
                <div>
                  <strong>Previously reported:</strong>
                  <ul style={{ margin: '0.35rem 0 0 1.25rem' }}>
                    {previousDetails.map((value) => <li key={value}>{value}</li>)}
                  </ul>
                </div>
              )}
              {previousVisit.red_flag && <div style={{ color: 'var(--danger)', fontWeight: 700 }}>Previous visit included a red-flag status{previousVisit.red_flag_reason ? `: ${previousVisit.red_flag_reason}` : ''}. This current visit starts fresh.</div>}
            </div>
          </div>
        )}
        <div style={{ color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.04em', marginBottom: '0.75rem' }}>CURRENT VISIT</div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontWeight: 700 }}>
            <span>Question {Math.min(askedCount, Math.max(questions.length, 1))} of {Math.max(questions.length, 1)}</span><span>{completeness.percent}%</span>
          </div>
          <div style={{ height: 8, background: 'var(--bg-subtle)', borderRadius: 8, marginTop: 6 }}>
            <div style={{ height: '100%', width: `${completeness.percent}%`, background: 'var(--primary)', borderRadius: 8 }} />
          </div>
        </div>

        {intelligenceMessage && <div className="ai-bubble" style={{ marginBottom: '1rem' }}>{intelligenceMessage}</div>}
        {(emergencyAlert || redFlagReason) && (
          <div className="emergency-alert-banner" style={{ marginBottom: '1.5rem' }}>
            <IconAlertTriangle size={30} color="var(--danger)" />
            <div><strong>{t('emergencyTitle')}</strong><div>{t('emergencyText')}</div></div>
          </div>
        )}

        <div className="ai-bubble" style={{ marginBottom: '1.5rem' }}>
          <div className="ai-name"><IconSparkles size={18} /><span>{t('aiAssistant')}</span></div>
          <div className="ai-question">{branch === 'general' ? 'Starting with your main concern and relevant health history.' : `Focused ${branch} history — your answers determine the next question.`}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <span className="badge badge-normal">History completeness: {completeness.percent}%</span>
          <span className="badge badge-normal">Adaptive path: {branch}</span>
          <span className="badge badge-normal">Doctor review required</span>
        </div>

        {activeQuestion ? (
          <section style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <div style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '0.7rem' }}>Medical Questions</div>
            <div style={{ fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.7rem' }}>Question {Math.min(askedCount, Math.max(questions.length, 1))} of {Math.max(questions.length, 1)}</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.8rem' }}>{activeQuestion.text || 'Please describe your answer.'}</div>
            {Array.isArray(activeQuestion.quickAnswers) && activeQuestion.quickAnswers.length > 0 && (
              <div className="quick-chips-grid" style={{ marginBottom: '0.8rem' }}>
                {activeQuestion.quickAnswers.map(([answer, icon]) => answer ? (
                  <button type="button" key={answer} className={`chip-btn ${emergencyAnswer(answer) ? 'emergency' : ''} ${activeAnswerValue === answer ? 'active' : ''}`} onClick={() => { setTypedDraft(answer); completeCurrentAnswer(activeQuestion.id, answer); }}>
                    <span>{icon}</span><span>{answer}</span>{activeAnswerValue === answer && <IconCheckCircle size={18} />}
                  </button>
                ) : null)}
              </div>
            )}
            <textarea value={typedDraft || activeAnswerValue || ''} rows={2} onChange={(event) => { setTypedDraft(event.target.value); }} placeholder="Your answer..." style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '1rem' }} />
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.7rem', flexWrap: 'wrap' }}>
              <VoiceButton text={activeQuestion.text || 'Medical question'} label="Hear question" />
            </div>
            <AdaptiveVoiceInput questionId={activeQuestion.id} language={safeLanguage} emergencyOpen={showEmergencyModal} onTranscriptSubmit={(transcript) => completeCurrentAnswer(activeQuestion.id, transcript)} />
            {intelligenceMessage && <div style={{ color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.7rem' }}>{intelligenceMessage}</div>}
            {saveError && <div role="alert" style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 700, marginTop: '0.7rem' }}>{saveError}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn-touch-secondary" onClick={() => navigate('/health-issue')}><IconArrowLeft size={20} />{t('back')}</button>
              <button type="button" className="btn-touch-primary" onClick={() => completeCurrentAnswer(activeQuestion.id, typedDraft || activeAnswerValue)}>{t('next') || 'Continue / Next'}</button>
            </div>
          </section>
        ) : questions.length > 0 ? (
          <section style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <div style={{ fontWeight: 800, marginBottom: '0.6rem' }}>History complete</div>
            <button type="button" className="btn-touch-primary" onClick={() => submitHistory()}>Submit to Doctor</button>
          </section>
        ) : (
          <section style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <div style={{ fontWeight: 800, marginBottom: '0.6rem' }}>We could not load your questions right now.</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Please start again with your main health problem.</p>
            <button type="button" className="btn-touch-primary" onClick={() => { setAnswers({}); setTypedDraft(''); }}>Restart questions</button>
          </section>
        )}
      </div>
    </div>
  );
};
