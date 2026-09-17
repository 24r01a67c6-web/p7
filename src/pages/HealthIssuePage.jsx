import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';
import { ProgressBar } from '../components/ProgressBar';
import { VoiceButton } from '../components/VoiceButton';
import { AdaptiveVoiceInput } from '../components/AdaptiveVoiceInput';
import { IconArrowLeft, IconArrowRight, IconCheckCircle, IconSparkles } from '../components/Icons';
import { getQuestionDefinitions } from '../data/adaptiveQuestions';
import { updateActiveConsultation } from '../services/patientSessionService';

const COPY = {
  en: {
    title: 'Health Issue / Symptoms',
    subtitle: 'Tell us the main health problem you want the doctor to review today.',
    question: 'What is your main health problem today?',
    placeholder: 'Type your main health problem...',
    back: 'Back', next: 'Continue to Medical Questions',
    choose: 'Choose one or describe it in your own words.',
    required: 'Please enter or select your main health problem.'
  },
  hi: {
    title: 'स्वास्थ्य समस्या / लक्षण',
    subtitle: 'आज डॉक्टर से बात करने के लिए अपनी मुख्य समस्या बताएं।',
    question: 'आज आपकी मुख्य स्वास्थ्य समस्या क्या है?',
    placeholder: 'अपनी मुख्य समस्या लिखें...',
    back: 'वापस', next: 'मेडिकल सवालों पर जाएँ',
    choose: 'एक विकल्प चुनें या अपने शब्दों में बताएं।',
    required: 'कृपया अपनी मुख्य स्वास्थ्य समस्या बताएं।'
  },
  te: {
    title: 'ఆరోగ్య సమస్య / లక్షణాలు',
    subtitle: 'ఈరోజు డాక్టర్ చూడాల్సిన ప్రధాన సమస్యను చెప్పండి.',
    question: 'ఈరోజు మీ ప్రధాన ఆరోగ్య సమస్య ఏమిటి?',
    placeholder: 'మీ ప్రధాన సమస్యను రాయండి...',
    back: 'వెనక్కి', next: 'వైద్య ప్రశ్నలకు వెళ్లండి',
    choose: 'ఒక ఎంపికను ఎంచుకోండి లేదా మీ మాటల్లో చెప్పండి.',
    required: 'మీ ప్రధాన ఆరోగ్య సమస్యను చెప్పండి.'
  }
};

export const HealthIssuePage = () => {
  const navigate = useNavigate();
  const { language, patientData, setPatientData, setSymptoms } = useKiosk();
  const safeLanguage = ['en', 'hi', 'te'].includes(language) ? language : 'en';
  const copy = COPY[safeLanguage];
  const definitions = useMemo(() => getQuestionDefinitions(safeLanguage) || {}, [safeLanguage]);
  const question = definitions.chiefComplaint || { quickAnswers: [] };
  const [value, setValue] = useState(String(patientData?.chiefComplaint || ''));
  const [error, setError] = useState('');

  const saveAndContinue = (nextValue = value) => {
    const text = String(nextValue || '').trim();
    if (!text) {
      setError(copy.required);
      return;
    }
    setError('');
    setValue(text);
    setSymptoms([text]);
    setPatientData((previous) => ({
      ...previous,
      chiefComplaint: text,
      answers: { ...(previous.answers || {}), chiefComplaint: text },
      adaptiveAnswers: { ...(previous.adaptiveAnswers || {}), chiefComplaint: text },
      status: previous.status || 'Intake in progress'
    }));
    updateActiveConsultation({
      chiefComplaint: text,
      answers: { ...(patientData?.answers || {}), chiefComplaint: text },
      adaptiveAnswers: { ...(patientData?.adaptiveAnswers || {}), chiefComplaint: text },
      status: 'Intake in progress'
    });
    navigate('/history');
  };

  const quickAnswers = Array.isArray(question.quickAnswers) ? question.quickAnswers : [];

  return (
    <div className="kiosk-container">
      <ProgressBar currentStep={4} totalSteps={7} stepTitle={copy.title} />
      <div className="kiosk-card" style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ color: 'var(--primary-dark)', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>First clinical touchpoint</div>
            <h1 className="kiosk-title" style={{ textAlign: 'left', marginBottom: '0.35rem' }}>{copy.title}</h1>
            <p className="kiosk-subtitle" style={{ textAlign: 'left', margin: 0 }}>{copy.subtitle}</p>
          </div>
          <VoiceButton text={copy.question} label="Hear question" />
        </div>

        <div className="ai-bubble" style={{ marginBottom: '1.25rem' }}>
          <div className="ai-name"><IconSparkles size={18} /><span>Pravedā</span></div>
          <div className="ai-question">{copy.question}</div>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>{copy.choose}</div>
        </div>

        {quickAnswers.length > 0 && (
          <div className="quick-chips-grid" style={{ marginBottom: '1rem' }}>
            {quickAnswers.map(([answer, icon]) => (
              <button
                type="button"
                key={answer}
                className={`chip-btn ${value === answer ? 'active' : ''}`}
                onClick={() => { setValue(answer); setError(''); }}
              >
                <span>{icon}</span><span>{answer}</span>{value === answer && <IconCheckCircle size={18} />}
              </button>
            ))}
          </div>
        )}

        <textarea
          rows={4}
          value={value}
          onChange={(event) => { setValue(event.target.value); setError(''); }}
          placeholder={copy.placeholder}
          style={{ width: '100%', boxSizing: 'border-box', padding: '1rem 1.1rem', border: error ? '2px solid var(--danger)' : '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '1.1rem', resize: 'vertical' }}
        />

        <AdaptiveVoiceInput
          questionId="chiefComplaint"
          language={safeLanguage}
          emergencyOpen={false}
          onTranscriptSubmit={(transcript) => saveAndContinue(transcript)}
        />

        {error && <div role="alert" style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 700, marginTop: '0.8rem' }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn-touch-secondary" onClick={() => navigate('/consent')}><IconArrowLeft size={20} />{copy.back}</button>
          <button type="button" className="btn-touch-primary" onClick={() => saveAndContinue()}>{copy.next}<IconArrowRight size={22} /></button>
        </div>
      </div>
    </div>
  );
};
