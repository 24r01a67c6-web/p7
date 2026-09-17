import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconLayoutDashboard, IconShield, IconStethoscope, IconUser } from './Icons';
import { useKiosk } from '../context/KioskContext';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useKiosk();

  const isStaffRoute = location.pathname.startsWith('/staff') || location.pathname.startsWith('/doctor') || location.pathname.startsWith('/nurse') || location.pathname.startsWith('/queue') || location.pathname.startsWith('/admin') || location.pathname === '/ayush' || location.pathname === '/abdm';
  const showLanguageBadge = !['/language', '/identify', '/consent'].includes(location.pathname);
  const langNames = { en: 'English', hi: 'हिंदी', te: 'తెలుగు' };
  const selectedLanguageLabel = langNames[language] || 'Choose language';

  return (
    <header className="pr-header-v3">
      <button type="button" className="pr-header-brand-v3" onClick={() => navigate('/')} aria-label="Pravedā home">
        <span className="pr-header-mark-v3"><IconStethoscope size={21} /></span>
        <span><strong>Pravedā</strong><small>Intelligent pre-consultation care</small></span>
      </button>

      <div className="pr-header-actions-v3">
        {showLanguageBadge ? (
          <div className="pr-language-pill-v3" aria-label={`Selected language: ${selectedLanguageLabel}`}>
            <span>◎</span>{selectedLanguageLabel}
          </div>
        ) : null}
        {isStaffRoute ? (
          <button type="button" className="pr-header-mode-v3" onClick={() => navigate('/')}><IconUser size={16} /> Patient mode</button>
        ) : (
          <button type="button" className="pr-header-mode-v3" onClick={() => navigate('/admin/login')}><IconLayoutDashboard size={16} /> Staff portal</button>
        )}
        <div className="pr-header-secure-v3"><IconShield size={15} /> Secure workflow</div>
      </div>
    </header>
  );
};
