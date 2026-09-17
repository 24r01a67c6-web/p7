import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentStaffProfile, STAFF_ROLE_META } from '../services/staffAccess';
import { supabase } from '../lib/supabase';
import { IconShield, IconStethoscope, IconUsers, IconActivity } from '../components/Icons';

const STAFF_SLIDES = [
  {
    key: 'doctor',
    icon: IconStethoscope,
    title: 'Doctor workspace',
    kicker: 'Clinical review',
    copy: 'Review patient cases, history, priority signals, documents, timeline and the doctor brief.'
  },
  {
    key: 'nurse',
    icon: IconUsers,
    title: 'Nurse workspace',
    kicker: 'Patient preparation',
    copy: 'Prepare patients, capture vitals and move consultations safely toward the doctor.'
  },
  {
    key: 'queue_handler',
    icon: IconActivity,
    title: 'Queue handler',
    kicker: 'Operations',
    copy: 'Manage waiting patients, queue status, tokens and doctor handoff.'
  },
  {
    key: 'admin',
    icon: IconShield,
    title: 'Administration',
    kicker: 'Governance',
    copy: 'Manage staff access and operational configuration for the Pravedā workspace.'
  }
];

const safeText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

export const StaffPortalPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const result = await getCurrentStaffProfile();
        if (!mounted) return;

        if (result?.error) {
          setError(result.error.message || 'Unable to load staff profile.');
          setProfile(null);
          setLoading(false);
          return;
        }

        const nextProfile = result?.profile || null;
        setProfile(nextProfile);

        setLoading(false);
      } catch (profileError) {
        if (!mounted) return;
        setProfile(null);
        setError(profileError?.message || 'Unable to load staff profile.');
        setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return undefined;
    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % STAFF_SLIDES.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [loading]);

  const currentSlide = STAFF_SLIDES[active] || STAFF_SLIDES[0];
  const SlideIcon = currentSlide.icon;
  const roleMeta = profile?.role ? STAFF_ROLE_META[profile.role] : null;
  const displayName = safeText(profile?.full_name, safeText(profile?.email, 'Staff member'));
  const displayRole = safeText(roleMeta?.label, 'Staff');
  const avatar = displayName.trim().slice(0, 1).toUpperCase() || 'S';

  const goToRole = (role) => {
    const target = STAFF_ROLE_META[role];
    if (!target) {
      setError('That workspace is not available.');
      return;
    }
    if (!profile) {
      setError('Your staff profile could not be loaded.');
      return;
    }
    if (profile.role !== role) {
      setError(`This workspace is restricted to ${target.label}.`);
      return;
    }
    navigate(target.path);
  };

  const logout = async () => {
    try {
      if (supabase) await supabase.auth.signOut();
    } finally {
      navigate('/admin/login', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="staff-portal-page">
        <div className="staff-auth-loading">
          <div className="staff-auth-card">Checking secure staff access...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-portal-page">
      <header className="staff-portal-topbar">
        <button
          type="button"
          className="staff-brand"
          onClick={() => navigate('/staff')}
          aria-label="Pravedā staff home"
        >
          <span className="staff-brand-mark"><IconShield size={20} /></span>
          <span><strong>Pravedā</strong><small>Care operations</small></span>
        </button>

        <div className="staff-top-actions">
          <span className="staff-secure-pill">Secure staff session</span>
          <button type="button" className="staff-logout-btn" onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="staff-portal-main">
        <section className="staff-portal-hero">
          <div className="staff-hero-copy">
            <span className="staff-kicker">Staff workspace</span>
            <h1>One platform.<br /><span>Focused staff workspaces.</span></h1>
            <p>
              Pravedā keeps clinical review, patient preparation and queue operations connected
              while giving each team member a focused workspace.
            </p>

            <div className="staff-profile-chip">
              <span className="staff-profile-avatar">{avatar}</span>
              <div>
                <strong>{displayName}</strong>
                <small>{displayRole}{profile?.department ? ` · ${safeText(profile.department)}` : ''}</small>
              </div>
            </div>
          </div>

          <div className="staff-slideshow" aria-live="polite">
            <div className="staff-slide-progress">
              <span style={{ width: `${((active + 1) / STAFF_SLIDES.length) * 100}%` }} />
            </div>
            <div className="staff-slide-meta">
              <span>{currentSlide.kicker}</span>
              <b>{active + 1} / {STAFF_SLIDES.length}</b>
            </div>
            <div className="staff-slide-icon"><SlideIcon size={28} /></div>
            <h2>{currentSlide.title}</h2>
            <p>{currentSlide.copy}</p>
            <button
              type="button"
              className="staff-slide-open"
              onClick={() => goToRole(currentSlide.key)}
            >
              {profile?.role === currentSlide.key ? 'Open my workspace' : 'Role-restricted workspace'}
            </button>
            <div className="staff-slide-nav">
              <button
                type="button"
                aria-label="Previous staff workspace"
                onClick={() => setActive((active - 1 + STAFF_SLIDES.length) % STAFF_SLIDES.length)}
              >
                ←
              </button>
              <div className="staff-slide-dots">
                {STAFF_SLIDES.map((slide, index) => (
                  <button
                    type="button"
                    key={slide.key}
                    aria-label={`Show ${slide.title}`}
                    className={index === active ? 'active' : ''}
                    onClick={() => setActive(index)}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Next staff workspace"
                onClick={() => setActive((active + 1) % STAFF_SLIDES.length)}
              >
                →
              </button>
            </div>
          </div>
        </section>

        <section className="staff-role-section">
          <div className="staff-section-head">
            <div>
              <span className="staff-kicker">Choose your workspace</span>
              <h2>Role-based access, without the clutter</h2>
            </div>
            <p>Your account can only enter the workspace assigned to it.</p>
          </div>

          <div className="staff-role-grid">
            {STAFF_SLIDES.map((slide) => {
              const meta = STAFF_ROLE_META[slide.key];
              const Icon = slide.icon;
              const assigned = profile?.role === slide.key;

              return (
                <button
                  type="button"
                  key={slide.key}
                  className={`staff-role-card ${assigned ? 'assigned' : ''}`}
                  onClick={() => goToRole(slide.key)}
                >
                  <span className="staff-role-icon"><Icon size={22} /></span>
                  <span className="staff-role-copy">
                    <strong>{meta.label}</strong>
                    <small>{meta.description}</small>
                  </span>
                  <span className={`staff-role-state ${assigned ? 'assigned' : ''}`}>
                    {assigned ? 'Assigned' : 'Restricted'}
                  </span>
                </button>
              );
            })}
          </div>

          {error ? <div className="staff-portal-error" role="alert">{error}</div> : null}
        </section>
      </main>

      <footer className="staff-portal-footer">
        <span>Pravedā Care Operations</span>
        <span>Role-based workspace · Patient data remains under controlled access</span>
      </footer>
    </div>
  );
};
