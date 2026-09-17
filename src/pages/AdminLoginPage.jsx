import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { writeAuditEvent } from '../services/auditLog';
import { getCurrentStaffProfile, STAFF_ROLE_META, STAFF_ROLES } from '../services/staffAccess';
import { IconStethoscope, IconUsers, IconActivity, IconShield } from '../components/Icons';
import { Eye, EyeOff, Lock } from 'lucide-react';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('doctor');

  const ROLE_ICONS = {
    doctor: IconStethoscope,
    nurse: IconUsers,
    queue_handler: IconActivity,
    admin: IconShield,
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/staff', { replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { error: loginError } = supabase
      ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      : { error: new Error('Supabase Auth is not configured') };
    setIsLoading(false);
    if (loginError) {
      setError('Invalid email or password');
      return;
    }

    const { profile, error: profileError } = await getCurrentStaffProfile();
    if (profileError || !profile) {
      if (supabase) await supabase.auth.signOut();
      setError(profileError?.message || 'No active staff profile is linked to this account.');
      return;
    }

    if (profile.role !== selectedRole) {
      if (supabase) await supabase.auth.signOut();
      setError(`This account is assigned to ${STAFF_ROLE_META[profile.role]?.label || 'another workspace'}. Select that workspace and sign in again.`);
      return;
    }

    await writeAuditEvent({ action: 'staff_login' });
    navigate('/staff', { replace: true, state: { selectedRole: profile.role } });
  };

  return (
    <div className="staff-login-page">
      <div className="staff-login-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 1rem', borderRadius: 'var(--radius-lg)', background: 'var(--primary)', color: 'white', display: 'grid', placeItems: 'center' }}><IconStethoscope size={34} /></div>
          <h1 className="kiosk-title">Staff Portal</h1>
          <p className="kiosk-subtitle" style={{ marginBottom: 0 }}>Secure Pravedā staff workspace</p>
        </div>
        <div className="staff-login-workspaces">
          <div className="staff-login-workspace-head">
            <strong>Choose your workspace</strong>
            <span>Your account must be assigned to the selected role.</span>
          </div>
          <div className="staff-login-workspace-grid">
            {STAFF_ROLES.map((role) => {
              const Icon = ROLE_ICONS[role];
              const meta = STAFF_ROLE_META[role];
              const selected = selectedRole === role;
              return (
                <button
                  type="button"
                  key={role}
                  className={`staff-login-workspace ${selected ? 'selected' : ''}`}
                  onClick={() => { setSelectedRole(role); setError(''); }}
                  aria-pressed={selected}
                >
                  <span className="staff-login-workspace-icon"><Icon size={18} /></span>
                  <span><strong>{meta.label}</strong><small>{meta.description}</small></span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
          <label style={{ display: 'grid', gap: '0.5rem', fontWeight: 700 }}>Email
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="doctor@hospital.com" style={{ padding: '1rem', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)' }} />
          </label>
          <label style={{ display: 'grid', gap: '0.5rem', fontWeight: 700 }}>Password
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" style={{ width: '100%', padding: '1rem 3rem', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)' }} />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </div>
          </label>
          {error && <div role="alert" style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 700 }}>{error}</div>}
          <button type="submit" className="btn-touch-primary" disabled={isLoading}>{isLoading ? 'Signing in...' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
};
