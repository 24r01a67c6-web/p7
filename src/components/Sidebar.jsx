import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';
import { LogOut, ShieldCheck, LayoutDashboard, Users, AlertTriangle, FileText, Clock3, Activity, UserCog, ClipboardList, Stethoscope } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ROLE_CONFIG = {
  doctor: {
    label: 'Doctor workspace',
    initials: 'DR',
    sections: [
      ['CLINICAL WORKSPACE', [
        { label: 'Overview', icon: LayoutDashboard, path: '/doctor' },
        { label: 'Consultation Queue', icon: Users, path: '/doctor' },
        { label: 'Priority Alerts', icon: AlertTriangle, path: '/doctor' },
      ]],
      ['PATIENT RECORDS', [
        { label: 'Patient Records', icon: FileText, path: 'patient' },
        { label: 'Medical Timeline', icon: Clock3, path: 'patient' },
        { label: 'History Quality', icon: Activity, path: '/doctor' },
      ]],
      ['CLINICAL TOOLS', [
        { label: 'AYUSH History', icon: Activity, path: '/ayush' },
        { label: 'ABDM / FHIR', icon: ShieldCheck, path: '/abdm' },
      ]],
    ]
  },
  nurse: {
    label: 'Nurse workspace',
    initials: 'RN',
    sections: [
      ['PATIENT PREPARATION', [
        { label: 'Overview', icon: LayoutDashboard, path: '/nurse' },
        { label: 'Patients to Prepare', icon: Users, path: '/nurse' },
        { label: 'Priority Patients', icon: AlertTriangle, path: '/nurse' },
      ]],
      ['CARE TASKS', [
        { label: 'Intake Status', icon: ClipboardList, path: '/nurse' },
        { label: 'Documents', icon: FileText, path: '/nurse' },
        { label: 'Ready for Doctor', icon: UserCog, path: '/nurse' },
      ]]
    ]
  },
  queue_handler: {
    label: 'Queue operations',
    initials: 'QH',
    sections: [
      ['QUEUE', [
        { label: 'Overview', icon: LayoutDashboard, path: '/queue' },
        { label: 'Live Queue', icon: ClipboardList, path: '/queue' },
        { label: 'Priority Queue', icon: AlertTriangle, path: '/queue' },
      ]],
      ['OPERATIONS', [
        { label: 'Waiting Patients', icon: Clock3, path: '/queue' },
        { label: 'Doctor Handoff', icon: Stethoscope, path: '/queue' },
      ]]
    ]
  },
  admin: {
    label: 'Admin workspace',
    initials: 'AD',
    sections: [
      ['OPERATIONS', [
        { label: 'Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
        { label: 'Staff Workspace', icon: UserCog, path: '/staff' },
        { label: 'Patient Records', icon: FileText, path: '/admin/dashboard' },
      ]],
      ['CLINICAL TOOLS', [
        { label: 'ABDM / FHIR', icon: ShieldCheck, path: '/abdm' },
        { label: 'AYUSH', icon: Activity, path: '/ayush' },
      ]]
    ]
  }
};

export const Sidebar = ({ role = 'doctor' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { queue = [], selectedPatientId } = useKiosk();
  const params = useParams();
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.doctor;
  const alerts = queue.filter((p) => p.priority?.level === 'HIGH' || p.priority || p.redFlag).length;
  const current = params.id || selectedPatientId || queue[0]?.id;

  const resolvePath = (item) => item.path === 'patient' ? (current ? `/doctor/patient/${current}` : '/doctor') : item.path;
  const isActive = (item) => {
    const path = resolvePath(item);
    if (item.label === 'Overview') return location.pathname === path;
    if (['Consultation Queue', 'Priority Alerts', 'History Quality', 'Patients to Prepare', 'Priority Patients', 'Intake Status', 'Documents', 'Ready for Doctor', 'Overview', 'Live Queue', 'Waiting Patients', 'Doctor Handoff', 'Priority Queue'].includes(item.label)) return location.pathname === path;
    return location.pathname === path || (path.startsWith('/doctor/patient/') && location.pathname.startsWith('/doctor/patient/'));
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate('/admin/login', { replace: true });
  };

  return <aside className="sidebar">
    <button className="sidebar-brand-v2" onClick={() => navigate('/staff')} aria-label="Pravedā staff home">
      <span><ShieldCheck size={21}/></span>
      <div><strong>Pravedā</strong><small>{config.label}</small></div>
    </button>
    <div className="sidebar-context"><span className="sidebar-online"/> Live staff workspace</div>
    <nav className="sidebar-nav" aria-label={`${config.label} navigation`}>
      {config.sections.map(([title, items]) => <div className="sidebar-section" key={title}>
        <div className="sidebar-section-title">{title}</div>
        {items.map(({ label, icon: Icon, path }) => <button type="button" className={`sidebar-link ${isActive({ label, path }) ? 'active' : ''}`} key={label} onClick={() => navigate(resolvePath({ label, path }))}>
          <Icon size={18}/><span>{label}</span>{label.includes('Priority') && alerts > 0 ? <b className="sidebar-badge">{alerts}</b> : null}
        </button>)}
      </div>)}
    </nav>
    <div className="sidebar-footer-card"><div className="sidebar-user-dot">{config.initials}</div><div><strong>{config.label}</strong><small>Role-based access</small></div></div>
    <button type="button" className="sidebar-link sidebar-logout" onClick={logout}><LogOut size={17}/><span>Sign out</span></button>
  </aside>;
};
