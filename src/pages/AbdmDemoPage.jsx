import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import {
  IconShield,
  IconCheckCircle,
  IconArrowLeft,
  IconFileText,
  IconSparkles
} from '../components/Icons';

export const AbdmDemoPage = () => {
  const navigate = useNavigate();
  const [showJsonModal, setShowJsonModal] = useState(false);

  const sampleFhirJson = {
    resourceType: "Bundle",
    id: "pravada-fhir-intake-bundle-102",
    type: "document",
    timestamp: "2026-09-08T23:00:00Z",
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: "91-4829-1029-3841",
          name: [{ text: "Ravi Kumar" }],
          gender: "male",
          birthDate: "1974-05-12"
        }
      },
      {
        resource: {
          resourceType: "Condition",
          code: { text: "Acute Chest Discomfort (Red-Flag Triage)" },
          clinicalStatus: "active"
        }
      },
      {
        resource: {
          resourceType: "MedicationStatement",
          medicationCodeableConcept: { text: "Amlodipine 5 mg oral tablet" }
        }
      }
    ]
  };

  return (
    <div className="doctor-layout">
      <Sidebar />

      <main className="doctor-main">
        {/* Top Header */}
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
              <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: 0 }}>
                Digital Health Integration
              </h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>
              Ayushman Bharat Digital Mission (ABDM) & FHIR R4 Prototype Sandbox
            </p>
          </div>

          <div
            style={{
              background: 'var(--warning-light)',
              color: 'var(--warning)',
              border: '1px solid var(--warning-border)',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 800,
              fontSize: '0.9rem'
            }}
          >
            ⚠️ Prototype / Demo - SIH 2026 Hackathon
          </div>
        </div>

        {/* Integration Status Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <IconShield size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>ABHA Address ID</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-dark)' }}>91-4829-1029-3841</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 700 }}>Demo identifier only</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
              <IconCheckCircle size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Consent Artefact</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>✓ Granted</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Valid until OPD Session completion</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
              <IconFileText size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Clinical Record</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--secondary-hover)' }}>✓ Structured</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SNOMED CT & LOINC mapped</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              <IconSparkles size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>FHIR R4 Bundle</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>✓ Generated</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>JSON payload ready</div>
            </div>
          </div>
        </div>

        {/* System Architecture & HIS Integration Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Hospital Information System (HIS) Middleware
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                ABDM Health Information Exchange & Consent Manager Interface
              </p>
            </div>

            <button
              type="button"
              className="btn-touch-primary"
              style={{ fontSize: '0.95rem', padding: '0.75rem 1.5rem' }}
              onClick={() => setShowJsonModal(!showJsonModal)}
            >
              <IconFileText size={20} />
              <span>{showJsonModal ? 'Hide FHIR JSON' : 'Inspect FHIR R4 Payload'}</span>
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Hospital HIS Gateway</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 700, marginTop: '0.25rem' }}>
                Demo flow only — no live gateway
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>ABDM Gateway Status</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--primary-dark)', fontWeight: 700, marginTop: '0.25rem' }}>
                Demo / Prototype — No live ABDM transmission
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Data Exchange Format</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--secondary-hover)', fontWeight: 700, marginTop: '0.25rem' }}>
                HL7 FHIR Release 4
              </div>
            </div>
          </div>

          {/* FHIR JSON Payload Viewer */}
          {showJsonModal && (
            <div
              style={{
                background: 'var(--bg-dark)',
                color: '#38bdf8',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                maxHeight: '350px',
                overflowY: 'auto'
              }}
            >
              <pre>{JSON.stringify(sampleFhirJson, null, 2)}</pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
