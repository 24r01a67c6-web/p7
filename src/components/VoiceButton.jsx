import React, { useState } from 'react';
import { IconVolume2 } from './Icons';
import { useKiosk } from '../context/KioskContext';
import { useTranslation } from '../translations';

export const VoiceButton = ({ text, label = "🔊 Listen" }) => {
  const [speaking, setSpeaking] = useState(false);
  const { language } = useKiosk();
  const t = useTranslation(language);

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in your browser.');
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    // Set voice language code according to user requirement
    const langCode = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';
    utterance.lang = langCode;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => v.lang === langCode || v.lang.startsWith(langCode.slice(0, 2)));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      className={`btn-audio-listen ${speaking ? 'active' : ''}`}
      onClick={handleSpeak}
      title="Click to hear read-aloud audio"
    >
      <IconVolume2 size={20} className={speaking ? 'animate-pulse' : ''} />
      <span>{speaking ? t('stopListening') : label}</span>
    </button>
  );
};
