import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '../translations';
import { createSpeechRecognition } from '../utils/speechRecognition';
import { getSpeechRecognitionLocale } from '../utils/speechRecognition';
import { isSpeechRecognitionSupported } from '../utils/speechRecognition';

let activeRecognition = null;

const stopActiveRecognition = () => {
  try {
    if (activeRecognition && activeRecognition.abort) activeRecognition.abort();
  } catch { /* ignore */ }
  try {
    if (activeRecognition && activeRecognition.stop) activeRecognition.stop();
  } catch { /* ignore */ }
  activeRecognition = null;
};

export const AdaptiveVoiceInput = (props) => {
  const questionId = props.questionId;
  const language = props.language || 'en';
  const t = useTranslation(language);
  const supported = isSpeechRecognitionSupported();
  const state = useState('idle');
  const voiceState = state[0];
  const setVoiceState = state[1];
  const interimState = useState('');
  const interimTranscript = interimState[0];
  const setInterimTranscript = interimState[1];
  const draftState = useState('');
  const draft = draftState[0];
  const setDraft = draftState[1];
  const errorState = useState('');
  const errorMessage = errorState[0];
  const setErrorMessage = errorState[1];
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const submittedRef = useRef('');
  const draftRef = useRef('');
  const questionIdRef = useRef(questionId);

  useEffect(() => { draftRef.current = draft; }, [draft]);

  const stopRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    try { if (rec && rec.abort) rec.abort(); } catch { /* ignore */ }
    try { if (rec && rec.stop) rec.stop(); } catch { /* ignore */ }
    if (activeRecognition === rec) activeRecognition = null;
    recognitionRef.current = null;
    setInterimTranscript('');
  }, [setInterimTranscript]);

  useEffect(() => {
    if (questionIdRef.current !== questionId) {
      stopRecognition();
      questionIdRef.current = questionId;
      setVoiceState('idle');
      setDraft('');
      setErrorMessage('');
      finalTranscriptRef.current = '';
      submittedRef.current = '';
    }
  }, [questionId, stopRecognition, setVoiceState, setDraft, setErrorMessage]);

  useEffect(() => {
    if (props.emergencyOpen) stopRecognition();
  }, [props.emergencyOpen, stopRecognition]);

  useEffect(() => () => stopRecognition(), [stopRecognition]);
  const startListening = useCallback(() => {
    if (!supported || props.emergencyOpen) return;
    stopActiveRecognition();
    stopRecognition();
    setErrorMessage('');
    setDraft('');
    finalTranscriptRef.current = '';
    submittedRef.current = '';
    const recognition = createSpeechRecognition({ language });
    if (!recognition) {
      setVoiceState('error');
      setErrorMessage(t('voiceUnsupported'));
      return;
    }
    recognitionRef.current = recognition;
    activeRecognition = recognition;
    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0] ? event.results[i][0].transcript : '';
        if (event.results[i].isFinal) finalText += text;
        else interim += text;
      }
      if (finalText) finalTranscriptRef.current = finalTranscriptRef.current + ' ' + finalText;
      setInterimTranscript(interim.trim());
    };
    recognition.onerror = (event) => {
      const kind = event ? event.error : '';
      if (kind === 'aborted') return;
      if (kind === 'not-allowed') setErrorMessage('Microphone permission is required.');
      else setErrorMessage(t('voiceError'));
      setVoiceState('error');
      if (activeRecognition === recognition) activeRecognition = null;
    };
    recognition.onend = () => {
      if (activeRecognition === recognition) activeRecognition = null;
      recognitionRef.current = null;
      const finalText = (finalTranscriptRef.current || '').trim();
      setInterimTranscript('');
      if (finalText) {
        setDraft(finalText.trim());
        setVoiceState('review');
      } else {
        setVoiceState('error');
        setErrorMessage(t('voiceError'));
      }
    };
    try {
      recognition.lang = getSpeechRecognitionLocale(language);
      recognition.start();
      setVoiceState('listening');
    } catch (e) {
      setVoiceState('error');
      setErrorMessage(t('voiceUnsupported'));
    }
  }, [supported, props.emergencyOpen, stopRecognition, language, t, setDraft, setErrorMessage, setVoiceState, setInterimTranscript]);
  const handleStop = () => {
    stopRecognition();
    const finalText = (finalTranscriptRef.current || draftRef.current || '').trim();
    if (finalText) {
      setDraft(finalText);
      setVoiceState('review');
      setErrorMessage('');
    }
  };

  const handleSubmit = () => {
    const transcript = draft.trim();
    if (!transcript) {
      setErrorMessage(t('voiceError'));
      return;
    }
    const key = questionId + ':' + transcript.toLowerCase();
    if (submittedRef.current === key) return;
    submittedRef.current = key;
    stopRecognition();
    if (props.onTranscriptSubmit) props.onTranscriptSubmit(transcript);
    setVoiceState('idle');
    setDraft('');
    setErrorMessage('');
    finalTranscriptRef.current = '';
  };

  const handleTryAgain = () => {
    setDraft('');
    setErrorMessage('');
    finalTranscriptRef.current = '';
    submittedRef.current = '';
    startListening();
  };

  if (!supported) {
    return (
      <div style={{ marginTop: '0.6rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
        Voice input is not available in this browser. You can type your answer instead.
      </div>
    );
  }

  return (
    <div style={{ marginTop: '0.6rem', display: 'grid', gap: '0.6rem' }}>
      {voiceState === 'idle' ? (
        <button type="button" className="btn-touch-secondary" onClick={startListening} disabled={props.emergencyOpen}>
          Tap to speak
        </button>
      ) : null}
      {voiceState === 'listening' ? (
        <div style={{ border: '2px solid var(--danger-border)', background: 'var(--danger-light)', borderRadius: '12px', padding: '0.75rem 1rem' }}>
          <div style={{ fontWeight: 800, color: 'var(--danger)' }}>
            Listening... {interimTranscript ? interimTranscript : 'Speak now'}
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.6rem' }}>
            <button type="button" className="btn-touch-secondary" onClick={handleStop}>Stop</button>
          </div>
        </div>
      ) : null}
      {voiceState === 'review' ? (
        <div style={{ border: '2px solid var(--border-light)', borderRadius: '12px', padding: '0.75rem 1rem' }}>
          <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Your answer</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Review your answer</div>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} style={{ width: '100%', padding: '0.7rem', fontSize: '1rem' }} />
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn-touch-primary" onClick={handleSubmit}>Submit</button>
            <button type="button" className="btn-touch-secondary" onClick={handleTryAgain}>Try again</button>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem' }}>Edit above if needed, then Submit.</div>
        </div>
      ) : null}
      {voiceState === 'error' ? (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div style={{ color: 'var(--danger)', fontWeight: 700 }}>
            {errorMessage || t('voiceError')}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Voice input unavailable. You can type instead.</div>
          <div>
            <button type="button" className="btn-touch-secondary" onClick={startListening} disabled={props.emergencyOpen}>Try again</button>
          </div>
        </div>
      ) : null}
    </div>
  );
};


