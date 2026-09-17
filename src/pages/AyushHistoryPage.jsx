import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';
import { Sidebar } from '../components/Sidebar';
import {
  IconActivity,
  IconArrowLeft,
  IconCheckCircle,
  IconSparkles
} from '../components/Icons';

export const AyushHistoryPage = () => {
  const navigate = useNavigate();
  const { patientData, setPatientData } = useKiosk();

  // Initialize AYUSH factors from patientData or defaults
  const [factors, setFactors] = useState(() => ({
    Prakriti: patientData.ayushData?.prakriti || 'Vata-Kapha',
    Vikriti: patientData.ayushData?.vikriti || 'Vata Dushti',
    Sara: patientData.ayushData?.sara || 'Rasa Sara',
    Samhanana: patientData.ayushData?.samhanana || 'Madhyama (Moderate)',
    Pramana: patientData.ayushData?.pramana || 'Anurupa (Proportionate)',
    Satmya: patientData.ayushData?.satmya || 'Sarva Rasa Satmya',
    Sattva: patientData.ayushData?.sattva || 'Madhyama (Medium)',
    'Ahara Shakti': patientData.ayushData?.aharaShakti || 'Mandagni',
    'Vyayama Shakti': patientData.ayushData?.vyayamaShakti || 'Madhyama',
    Vaya: patientData.ayushData?.vaya || 'Madhyama (Adult)'
  }));

  const [selectedRasa, setSelectedRasa] = useState(
    patientData.ayushData?.aharaRasa || ['Madhura (Sweet)', 'Lavana (Salty)']
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleFactorChange = (key, value) => {
    const updated = { ...factors, [key]: value };
    setFactors(updated);
    setSavedSuccess(false);

    // Persist to current patient in state & localStorage
    setPatientData((prev) => {
      const pUpdated = {
        ...prev,
        ayushData: {
          ...prev.ayushData,
          prakriti: updated.Prakriti,
          vikriti: updated.Vikriti,
          sara: updated.Sara,
          samhanana: updated.Samhanana,
          pramana: updated.Pramana,
          satmya: updated.Satmya,
          sattva: updated.Sattva,
          aharaShakti: updated['Ahara Shakti'],
          vyayamaShakti: updated['Vyayama Shakti'],
          vaya: updated.Vaya,
          aharaRasa: selectedRasa
        }
      };
      try {
        localStorage.setItem('medikiosk_current_patient', JSON.stringify(pUpdated));
      } catch (e) {
        console.warn(e);
      }
      return pUpdated;
    });
  };

  const handleToggleRasa = (rasa) => {
    const updated = selectedRasa.includes(rasa)
      ? selectedRasa.filter((r) => r !== rasa)
      : [...selectedRasa, rasa];
    setSelectedRasa(updated);
  };

  const handleSaveAssessment = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const ayushFactorConfig = [
    { key: 'Prakriti', name: 'Prakriti (Constitutional Type)', options: ['Vata Dominant', 'Pitta Dominant', 'Kapha Dominant', 'Vata-Pitta', 'Vata-Kapha', 'Tridoshaja'] },
    { key: 'Vikriti', name: 'Vikriti (Pathological State)', options: ['Vata Dushti', 'Pitta Kopa', 'Kapha Vriddhi', 'Sannipataja'] },
    { key: 'Sara', name: 'Sara (Tissue Excellence)', options: ['Rasa Sara', 'Rakta Sara', 'Mamsa Sara', 'Meda Sara', 'Asthi Sara', 'Majja Sara', 'Shukra Sara'] },
    { key: 'Samhanana', name: 'Samhanana (Compactness of Body)', options: ['Uttama (Superior)', 'Madhyama (Moderate)', 'Avara (Deficient)'] },
    { key: 'Pramana', name: 'Pramana (Anthropometric Proportion)', options: ['Anurupa (Proportionate)', 'Ayata', 'Parimana Normal'] },
    { key: 'Satmya', name: 'Satmya (Adaptability)', options: ['Sarva Rasa Satmya', 'Eka Rasa Satmya', 'Vyayamasatmya'] },
    { key: 'Sattva', name: 'Sattva (Mental Strength)', options: ['Pravara (High)', 'Madhyama (Medium)', 'Avara (Low)'] },
    { key: 'Ahara Shakti', name: 'Ahara Shakti (Digestive Power)', options: ['Abhyavaharana Shakti (High)', 'Jarana Shakti (High)', 'Mandagni', 'Vishamagni'] },
    { key: 'Vyayama Shakti', name: 'Vyayama Shakti (Physical Endurance)', options: ['Pravara', 'Madhyama', 'Avara'] },
    { key: 'Vaya', name: 'Vaya (Age Category)', options: ['Bala (Childhood)', 'Madhyama (Adult)', 'Vriddha (Elderly)'] }
  ];

  return (
    <div className="doctor-layout">
      <Sidebar />

      <main className="doctor-main">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-touch-secondary"
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.9rem' }}
                onClick={() => navigate('/doctor')}
              >
                <IconArrowLeft size={18} />
              </button>
              <h1 style={{ fontSize: '2rem', color: 'var(--secondary-hover)', margin: 0 }}>
                AYUSH Clinical History
              </h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>
              Dashavidha Pariksha (10-Fold Ayurveda Clinical Assessment Matrix)
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {savedSuccess && (
              <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <IconCheckCircle size={18} /> Assessment Saved!
              </span>
            )}
            <button
              type="button"
              className="btn-touch-primary"
              style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem', background: 'var(--secondary)' }}
              onClick={handleSaveAssessment}
            >
              <IconCheckCircle size={18} />
              <span>Save Assessment</span>
            </button>
          </div>
        </div>

        {/* Dashavidha 10-Fold Tile Grid */}
        <div className="ayush-grid">
          {ayushFactorConfig.map((factor, idx) => (
            <div key={idx} className="ayush-tile">
              <div className="ayush-tile-title">
                <span>{factor.name}</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {factor.options.map((opt, oIdx) => {
                  const isSelected = factors[factor.key] === opt;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      style={{
                        padding: '0.5rem 0.9rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        border: `1.5px solid ${isSelected ? 'var(--secondary)' : 'var(--border-light)'}`,
                        background: isSelected ? 'var(--secondary)' : 'var(--bg-subtle)',
                        color: isSelected ? 'white' : 'var(--text-main)',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => handleFactorChange(factor.key, opt)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Ahara & Vihara Section */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '2px solid var(--border-light)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            marginTop: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary-hover)', marginBottom: '1rem' }}>
            <IconSparkles size={24} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Ahara & Vihara (Diet & Lifestyle Assessment)</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Ahara Rasa Preference (Dietary Habits):
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['Madhura (Sweet)', 'Amla (Sour)', 'Lavana (Salty)', 'Katu (Pungent)', 'Tikta (Bitter)', 'Kashaya (Astringent)'].map((rasa, rIdx) => {
                  const isSelected = selectedRasa.includes(rasa);
                  return (
                    <span
                      key={rIdx}
                      className="badge"
                      style={{
                        background: isSelected ? 'var(--secondary-light)' : 'var(--bg-subtle)',
                        color: isSelected ? 'var(--secondary-hover)' : 'var(--text-main)',
                        border: `1px solid ${isSelected ? 'var(--secondary)' : 'var(--border-light)'}`,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleToggleRasa(rasa)}
                    >
                      {isSelected ? '✓ ' : ''}{rasa}
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Vihara Routine (Sleep & Physical Regimen):
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Nidra: Irregular sleep (6 hrs) | Vyayama: Sedentary lifestyle | Agni: Mandagni
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
