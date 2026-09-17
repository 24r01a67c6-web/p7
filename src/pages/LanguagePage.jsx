import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';
import { ProgressBar } from '../components/ProgressBar';
import { VoiceButton } from '../components/VoiceButton';
import { IconArrowRight, IconCheckCircle } from '../components/Icons';
import { useTranslation } from '../translations';

export const LanguagePage = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useKiosk();
  const t = useTranslation(language);

  const languages = [
    { id: 'en', native: 'English', english: 'English', sub: 'Default Kiosk' },
    { id: 'hi', native: 'हिंदी', english: 'Hindi', sub: 'भारतीय भाषा' },
    { id: 'te', native: 'తెలుగు', english: 'Telugu', sub: 'భారతీయ భాష' }
  ];

  const continueFromLanguage = () => {
    // Language is selected exactly once per consultation, then the flow continues to consent.
    navigate('/consent');
  };

  return (
    <div className="kiosk-container">
      <ProgressBar currentStep={2} totalSteps={7} stepTitle={t('languageTitle')} />

      <div className="kiosk-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 className="kiosk-title" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>
              {t('languageTitle')}
            </h1>
            <p className="kiosk-subtitle" style={{ textAlign: 'left', margin: 0 }}>
              {t('languageSubtitle')}
            </p>
          </div>
          <VoiceButton text="Please choose your preferred language to start your consultation." />
        </div>

        <div className="language-grid">
          {languages.map((lang) => {
            const isSelected = language === lang.id;
            return (
              <div
                key={lang.id}
                className={`language-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setLanguage(lang.id);
                }}
              >
                <div className="lang-native">{lang.native}</div>
                <div className="lang-english">{lang.english}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 500 }}>{lang.sub}</div>

                {isSelected && (
                  <div style={{ color: 'var(--primary)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <IconCheckCircle size={24} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('selected')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button
            type="button"
            className="btn-touch-primary"
            onClick={continueFromLanguage}
          >
            <span>{t('continue')}</span>
            <IconArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
