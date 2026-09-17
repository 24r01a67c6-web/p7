import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';
import { ProgressBar } from '../components/ProgressBar';
import { IconArrowLeft, IconArrowRight, IconCheckCircle, IconSparkles } from '../components/Icons';
import { VoiceButton } from '../components/VoiceButton';
import { AdaptiveVoiceInput } from '../components/AdaptiveVoiceInput';
import { updateActiveConsultation } from '../services/patientSessionService';

const QUESTIONS = {
  en: [
    ['prakriti', 'PRAKRITI — Which pattern best describes your usual body, appetite, sleep and temperament?', ['Vata', 'Pitta', 'Kapha', 'Mixed / not sure']],
    ['vikriti', 'VIKRITI — What has changed recently compared with your normal state?', ['Digestion', 'Sleep', 'Energy', 'Mood', 'No major change']],
    ['agni', 'AGNI — How is your usual digestion?', ['Regular', 'Irregular', 'Sluggish / heavy after eating', 'Highly variable']],
    ['koshtha', 'KOSHTHA — What is your usual bowel pattern?', ['Soft / frequent', 'Moderate / regular', 'Hard / infrequent']],
    ['aharaVihara', 'AHARA-VIHARA — Which best describes your usual diet and lifestyle?', ['Regular meals + regular sleep + active', 'Irregular meals', 'Irregular sleep', 'Low physical activity']],
    ['nidana', 'NIDANA — What do you feel triggers or worsens your current complaint?', ['Food', 'Stress', 'Sleep change', 'Activity', 'Not sure']],
    ['samprapti', 'SAMPRAPTI — How has your complaint changed since it started?', ['Improving', 'Worsening', 'Comes and goes', 'About the same', 'Not sure']]
  ],
  hi: [
    ['prakriti', 'PRAKRITI — आपके सामान्य शरीर, भूख, नींद और स्वभाव के लिए कौन सा विकल्प सही है?', ['वात', 'पित्त', 'कफ', 'मिश्रित / पता नहीं']],
    ['vikriti', 'VIKRITI — आपके सामान्य हाल से हाल में क्या बदला है?', ['पाचन', 'नींद', 'ऊर्जा', 'मूड', 'कोई बड़ा बदलाव नहीं']],
    ['agni', 'AGNI — आपका सामान्य पाचन कैसा है?', ['नियमित', 'अनियमित', 'भोजन के बाद भारीपन', 'बहुत बदलता है']],
    ['koshtha', 'KOSHTHA — आपकी सामान्य मल त्याग की आदत कैसी है?', ['नरम / बार-बार', 'सामान्य / नियमित', 'कठोर / कम बार']],
    ['aharaVihara', 'AHARA-VIHARA — आपका सामान्य भोजन और जीवनशैली कैसी है?', ['नियमित भोजन + नियमित नींद + सक्रिय', 'अनियमित भोजन', 'अनियमित नींद', 'कम शारीरिक गतिविधि']],
    ['nidana', 'NIDANA — आपको क्या लगता है आपकी मौजूदा समस्या किससे बढ़ती है?', ['खाना', 'तनाव', 'नींद में बदलाव', 'गतिविधि', 'पता नहीं']],
    ['samprapti', 'SAMPRAPTI — शुरू होने के बाद आपकी समस्या कैसे बदली है?', ['बेहतर', 'बदतर', 'कभी होती है कभी नहीं', 'लगभग समान', 'पता नहीं']]
  ],
  te: [
    ['prakriti', 'PRAKRITI — మీ సాధారణ శరీర నిర్మాణం, ఆకలి, నిద్ర, స్వభావానికి ఏది సరిపోతుంది?', ['వాత', 'పిత్త', 'కఫ', 'మిశ్రమం / తెలియదు']],
    ['vikriti', 'VIKRITI — మీ సాధారణ స్థితితో పోలిస్తే ఇటీవల ఏమి మారింది?', ['జీర్ణం', 'నిద్ర', 'శక్తి', 'మనస్థితి', 'పెద్ద మార్పు లేదు']],
    ['agni', 'AGNI — మీ సాధారణ జీర్ణం ఎలా ఉంటుంది?', ['సాధారణంగా', 'అసమంగా', 'తిన్న తర్వాత భారంగా', 'చాలా మారుతూ ఉంటుంది']],
    ['koshtha', 'KOSHTHA — మీ సాధారణ మల విసర్జన ఎలా ఉంటుంది?', ['మెత్తగా / ఎక్కువసార్లు', 'సాధారణంగా / క్రమంగా', 'గట్టిగా / తక్కువసార్లు']],
    ['aharaVihara', 'AHARA-VIHARA — మీ సాధారణ ఆహారం మరియు జీవనశైలి ఎలా ఉంటుంది?', ['క్రమమైన భోజనం + క్రమమైన నిద్ర + చురుకుగా', 'అసమయ భోజనం', 'అసమయ నిద్ర', 'తక్కువ శారీరక చలనం']],
    ['nidana', 'NIDANA — మీ ప్రస్తుత సమస్యను ఏది పెంచుతుందని మీరు అనుకుంటున్నారు?', ['ఆహారం', 'ఒత్తిడి', 'నిద్ర మార్పు', 'చలనం', 'తెలియదు']],
    ['samprapti', 'SAMPRAPTI — సమస్య మొదలైనప్పటి నుంచి ఎలా మారింది?', ['తగ్గుతోంది', 'పెరుగుతోంది', 'మధ్య మధ్యలో', 'అలానే ఉంది', 'తెలియదు']]
  ]
};

export const AyushAssessmentPage = () => {
  const navigate = useNavigate();
  const { language, patientData, setPatientData } = useKiosk();
  const safeLanguage = ['en', 'hi', 'te'].includes(language) ? language : 'en';
  const questions = useMemo(() => QUESTIONS[safeLanguage], [safeLanguage]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() => ({ ...(patientData?.ayushData?.assessment || {}) }));
  const [error, setError] = useState('');
  const current = questions[index];
  const selected = answers[current?.[0]] || '';

  const save = (key, value) => {
    setAnswers((previous) => ({ ...previous, [key]: value }));
    setError('');
  };

  const next = () => {
    if (!selected) { setError(safeLanguage === 'te' ? 'ఒక ఎంపికను ఎంచుకోండి.' : safeLanguage === 'hi' ? 'एक विकल्प चुनें।' : 'Please choose an option.'); return; }
    if (index < questions.length - 1) { setIndex((v) => v + 1); return; }
    const ayushData = { ...(patientData?.ayushData || {}), assessment: answers };
    setPatientData((previous) => ({ ...previous, ayushData }));
    updateActiveConsultation({ ayushData });
    navigate('/documents');
  };

  return (
    <div className="kiosk-container">
      <ProgressBar currentStep={5} totalSteps={7} stepTitle="AYUSH Assessment" />
      <div className="kiosk-card" style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ color: 'var(--secondary-hover)', fontWeight: 800, letterSpacing: '0.05em' }}>OPTIONAL AYUSH LAYER</div>
          <h1 className="kiosk-title" style={{ textAlign: 'left', margin: '0.3rem 0' }}>AYUSH Assessment</h1>
          <p className="kiosk-subtitle" style={{ textAlign: 'left', margin: 0 }}>Short patient-reported assessment. These answers support the summary and do not diagnose a condition.</p>
        </div>
        <div className="ai-bubble" style={{ marginBottom: '1rem' }}><div className="ai-name"><IconSparkles size={18} /><span>Pravedā</span></div><div className="ai-question">{current?.[1]}</div></div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}><VoiceButton text={current?.[1] || 'AYUSH question'} label="Hear question" /></div>
        <div className="quick-chips-grid" style={{ marginBottom: '1rem' }}>
          {current?.[2]?.map((option) => <button key={option} type="button" className={`chip-btn ${selected === option ? 'active' : ''}`} onClick={() => save(current[0], option)}><span>{selected === option ? '✓' : '○'}</span><span>{option}</span>{selected === option && <IconCheckCircle size={18} />}</button>)}
        </div>
        <AdaptiveVoiceInput questionId={current?.[0] || 'ayush'} language={safeLanguage} emergencyOpen={false} onTranscriptSubmit={(transcript) => save(current[0], transcript)} />
        {error && <div role="alert" style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 700, marginBottom: '0.75rem' }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn-touch-secondary" onClick={() => index > 0 ? setIndex((v) => v - 1) : navigate('/history')}><IconArrowLeft size={20} />Back</button>
          <button type="button" className="btn-touch-primary" onClick={next}>{index === questions.length - 1 ? 'Continue to Documents' : 'Next'}<IconArrowRight size={20} /></button>
        </div>
        <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>Question {index + 1} of {questions.length}</div>
      </div>
    </div>
  );
};
