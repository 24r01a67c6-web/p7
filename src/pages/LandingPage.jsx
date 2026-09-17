import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowRight,
  IconCheckCircle,
  IconClock,
  IconFileText,
  IconMic,
  IconShield,
  IconStethoscope,
  IconUsers,
  IconSparkles
} from '../components/Icons';
import { useKiosk } from '../context/KioskContext';

const journey = [
  ['01', 'Identify', 'Start a new consultation or return to your record'],
  ['02', 'Choose language', 'English, हिंदी or తెలుగు'],
  ['03', 'Health issue', 'Start with what the patient is experiencing'],
  ['04', 'Adaptive history', '6–8 focused questions with voice + touch'],
  ['05', 'Clinical intelligence', 'Documents, timeline, completeness and priority'],
  ['06', 'Doctor handoff', 'A concise, review-ready patient picture']
];

const capabilities = [
  { icon: IconMic, title: 'Voice + touch', text: 'Patients can speak naturally or use large, accessible controls.' },
  { icon: IconActivity, title: 'Adaptive case-taking', text: 'Follow-up questions respond to the answers already given.' },
  { icon: IconFileText, title: 'Document intelligence', text: 'Prescriptions and reports are digitized and linked to the patient record.' },
  { icon: IconClock, title: 'Longitudinal timeline', text: 'Current and previous events stay connected across visits.' },
  { icon: IconAlertTriangle, title: 'Clinical priority', text: 'Concerning combinations are surfaced for staff review.' },
  { icon: IconShield, title: 'Doctor-controlled record', text: 'Information is organized first; clinical decisions remain with staff.' }
];

export const LandingPage = () => {
  const navigate = useNavigate();
  const { startNewConsultation } = useKiosk();

  const startConsultation = () => {
    startNewConsultation();
    navigate('/identify');
  };

  return (
    <main className="pr-home-v3">
      <section className="pr-hero-v3">
        <div className="pr-hero-nav-v3">
          <button type="button" className="pr-brand-v3" onClick={() => navigate('/')} aria-label="Pravedā home">
            <span className="pr-brand-icon-v3"><IconStethoscope size={20} /></span>
            <span className="pr-brand-copy-v3"><strong>Pravedā</strong><small>Intelligent pre-consultation care</small></span>
          </button>
          <div className="pr-nav-actions-v3">
            <button type="button" className="pr-nav-link-v3" onClick={() => navigate('/patient-records')}>Previous records</button>
            <button type="button" className="pr-nav-staff-v3" onClick={() => navigate('/admin/login')}><IconUsers size={17} /> Staff portal</button>
          </div>
        </div>

        <div className="pr-hero-grid-v3">
          <div className="pr-hero-copy-v3">
            <div className="pr-kicker-v3"><span className="pr-live-dot-v3" /> Patient intake, organized before the consultation</div>
            <h1>Turn a patient’s story into a <span>clear clinical handoff.</span></h1>
            <p>Pravedā gathers the patient’s concern, adapts the interview, organizes previous records, and prepares a structured view for clinical staff.</p>
            <div className="pr-hero-actions-v3">
              <button type="button" className="pr-cta-main-v3" onClick={startConsultation}>
                <IconUsers size={19} />
                <span><strong>Start a new consultation</strong><small>Voice, touch and multilingual intake</small></span>
                <IconArrowRight size={20} />
              </button>
              <button type="button" className="pr-cta-secondary-v3" onClick={() => navigate('/patient-records')}>
                <IconFileText size={18} />
                <span><strong>View previous records</strong><small>Continue with an existing patient record</small></span>
              </button>
            </div>
            <div className="pr-proof-v3">
              <span><IconShield size={15} /> Secure record workflow</span>
              <span><IconCheckCircle size={15} /> Doctor review</span>
              <span><IconMic size={15} /> English · हिंदी · తెలుగు</span>
            </div>
          </div>

          <div className="pr-hero-case-v3" aria-label="Example Pravedā clinical handoff">
            <div className="pr-case-top-v3">
              <div><span>Example clinical handoff</span><strong>Ready for review</strong></div>
              <span className="pr-ready-v3"><i /> Active</span>
            </div>
            <div className="pr-case-patient-v3">
              <div className="pr-avatar-v3">RK</div>
              <div><strong>Patient case</strong><span>Structured intake preview</span></div>
            </div>
            <div className="pr-case-grid-v3">
              <div><span>Current concern</span><strong>Chest discomfort</strong></div>
              <div><span>History quality</span><strong>86%</strong></div>
              <div><span>Documents</span><strong>3 records</strong></div>
              <div><span>Priority</span><strong className="pr-priority-high-v3">High review</strong></div>
            </div>
            <div className="pr-case-attention-v3">
              <div className="pr-attention-icon-v3"><IconSparkles size={17} /></div>
              <div><strong>Clinical intelligence layer</strong><span>History + documents + timeline + priority</span></div>
            </div>
            <div className="pr-mini-timeline-v3">
              <div><b />Adaptive history completed</div>
              <div><b />Lab report linked</div>
              <div><b />Doctor brief prepared</div>
            </div>
          </div>
        </div>
      </section>

      <section className="pr-journey-v3">
        <div className="pr-section-frame-v3">
          <div className="pr-section-intro-v3">
            <span className="pr-section-kicker">One connected journey</span>
            <h2>Every step feeds the next one.</h2>
            <p>Pravedā is designed so patient input does not disappear between registration, history-taking, document review and consultation.</p>
          </div>
          <div className="pr-journey-grid-v3">
            {journey.map(([number, title, detail], index) => (
              <div className="pr-journey-item-v3" key={number}>
                <div className="pr-journey-marker-v3">{number}</div>
                <div><strong>{title}</strong><span>{detail}</span></div>
                {index < journey.length - 1 ? <div className="pr-journey-line-v3" /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pr-intelligence-v3">
        <div className="pr-section-frame-v3">
          <div className="pr-intelligence-head-v3">
            <div>
              <span className="pr-section-kicker">The middle layer</span>
              <h2>Pravedā turns scattered inputs into one clinical picture.</h2>
            </div>
            <span className="pr-intelligence-note-v3"><IconSparkles size={17} /> Built for pre-consultation intelligence</span>
          </div>
          <div className="pr-capabilities-v3">
            {capabilities.map(({ icon: Icon, title, text }) => (
              <article className="pr-capability-v3" key={title}>
                <div className="pr-capability-icon-v3"><Icon size={19} /></div>
                <div><h3>{title}</h3><p>{text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pr-bottom-v3">
        <div className="pr-bottom-card-v3">
          <div className="pr-bottom-icon-v3"><IconFileText size={22} /></div>
          <div>
            <span className="pr-section-kicker">Digital health record</span>
            <h2>Keep the patient story connected across visits.</h2>
            <p>Previous histories, uploaded records, timeline events and summaries stay together for the next consultation.</p>
          </div>
          <button type="button" onClick={() => navigate('/patient-records')}>Open records <IconArrowRight size={17} /></button>
        </div>
        <footer className="pr-footer-v3"><strong>Pravedā</strong><span>Intelligent pre-consultation care</span><span>© 2026</span></footer>
      </section>
    </main>
  );
};
