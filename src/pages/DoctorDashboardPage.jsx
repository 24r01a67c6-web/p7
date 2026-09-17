import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';
import { Sidebar } from '../components/Sidebar';
import { useDoctorPatients } from '../hooks/useDoctorPatients';
import { CONSULTATION_STATUS, STATUS_LABELS, normalizeConsultationStatus, getConsultationWorkflows, transitionConsultation } from '../services/consultationWorkflowService';
import {
  IconUsers,
  IconClock,
  IconCheckCircle,
  IconAlertTriangle,
  IconSearch,
  IconArrowRight,
  IconActivity,
  IconShield
} from '../components/Icons';

const priorityBadgeStyle = (level) => ({
  HIGH: { background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger-border)' },
  MEDIUM: { background: 'var(--warning-light)', color: 'var(--warning)', border: '1px solid var(--warning-border)' },
  NORMAL: { background: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success-border)' }
}[level] || {});

export const DoctorDashboardPage = () => {
  const navigate = useNavigate();
  const { setSelectedPatientId } = useKiosk();
  const [workflows, setWorkflows] = useState({});
  const [workflowError, setWorkflowError] = useState('');
  const { patients: queue, histories, loading, error } = useDoctorPatients();
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  React.useEffect(() => {
    let active = true;
    const loadWorkflows = () => getConsultationWorkflows(queue).then((map) => { if (active) setWorkflows(map); });
    loadWorkflows();
    const timer = window.setInterval(loadWorkflows, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [queue]);

  const handleWorkflow = async (event, patient) => {
    event.stopPropagation();
    setWorkflowError('');
    try {
      const current = normalizeConsultationStatus(workflows[patient.id]?.status || patient.status);
      const next = current === CONSULTATION_STATUS.READY_FOR_DOCTOR
        ? CONSULTATION_STATUS.IN_CONSULTATION
        : current === CONSULTATION_STATUS.IN_CONSULTATION
          ? CONSULTATION_STATUS.COMPLETED
          : null;
      if (!next) throw new Error('Patient is not ready for a doctor workflow action.');
      const workflow = await transitionConsultation(patient, next, { priority: patient.priority?.level || undefined });
      setWorkflows((prev) => ({ ...prev, [patient.id]: workflow }));
    } catch (error) {
      setWorkflowError(error.message);
    }
  };

  const counts = useMemo(() => queue.reduce((totals, patient) => {
    totals[patient.priority.level] += 1;
    return totals;
  }, { HIGH: 0, MEDIUM: 0, NORMAL: 0 }), [queue]);

  const stats = [
    { label: 'High Priority', val: counts.HIGH, icon: IconAlertTriangle, color: 'var(--danger)', bg: 'var(--danger-light)' },
    { label: 'Medium Priority', val: counts.MEDIUM, icon: IconClock, color: 'var(--warning)', bg: 'var(--warning-light)' },
    { label: 'Normal', val: counts.NORMAL, icon: IconCheckCircle, color: 'var(--success)', bg: 'var(--success-light)' },
    { label: 'Patients in Queue', val: queue.length, icon: IconUsers, color: 'var(--primary)', bg: 'var(--primary-light)' }
  ];

  const filteredQueue = queue.filter((patient) => {
    const matchesFilter = priorityFilter === 'ALL' || patient.priority.level === priorityFilter;
    if (!matchesFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      patient.name?.toLowerCase().includes(term) ||
      patient.id?.toLowerCase().includes(term) ||
      patient.department?.toLowerCase().includes(term) ||
      (histories[patient.id]?.chief_complaint || '').toLowerCase().includes(term)
    );
  });

  const handlePatientClick = (patient) => {
    setSelectedPatientId(patient.id);
    navigate(`/doctor/patient/${patient.id}`);
  };

  return (
    <div className="doctor-layout">
      <Sidebar />

      <main className="doctor-main">
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Doctor Dashboard
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>
              Clinical workspace — highest-priority patients appear first
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              className="btn-touch-secondary"
              style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)' }}
              onClick={() => navigate('/ayush')}
            >
              <IconActivity size={18} />
              <span>AYUSH History Mode</span>
            </button>

            <button
              type="button"
              className="btn-touch-primary"
              style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)' }}
              onClick={() => navigate('/abdm')}
            >
              <IconShield size={18} />
              <span>ABDM / FHIR Integration</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div key={idx} className="stat-card">
                <div className="stat-icon-wrapper" style={{ background: st.bg, color: st.color }}>
                  <Icon size={28} />
                </div>
                <div>
                  <div className="stat-val" style={{ color: st.color }}>{st.val}</div>
                  <div className="stat-lbl">{st.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Patient Queue Section */}
        <div className="table-container">
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-surface)'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Smart Priority Queue</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Who should I review first? Sorted by clinical priority.</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {['ALL', 'HIGH', 'MEDIUM', 'NORMAL'].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className="btn-touch-secondary"
                    style={{
                      padding: '0.45rem 0.8rem',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      borderColor: priorityFilter === filter ? 'var(--primary)' : undefined,
                      color: priorityFilter === filter ? 'var(--primary-dark)' : undefined
                    }}
                    onClick={() => setPriorityFilter(filter)}
                  >
                    {filter === 'ALL' ? 'All' : filter}
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative', width: '280px' }}>
                <IconSearch size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, patient ID, concern..."
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem 0.5rem 2.4rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>
          </div>

          {loading && <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading patient queue...</div>}
          {error && !loading && <div role="alert" style={{ padding: '1rem 1.5rem', color: 'var(--danger)', fontWeight: 700 }}>{error}</div>}
          {workflowError && <div role="alert" style={{ padding: '0.85rem 1.5rem', color: 'var(--danger)', fontWeight: 700, background: 'var(--danger-light)' }}>{workflowError}</div>}

          <table className="custom-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Patient ID</th>
                <th>Age / Gender</th>
                <th>Chief Concern</th>
                <th>Priority</th>
                <th>Red Flag</th>
                <th>Completeness</th>
                <th>Visit</th>
                <th>Workflow</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.length === 0 && !loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No patients match this view.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((patient) => {
                  const history = histories[patient.id];
                  return (
                    <tr key={patient.id} onClick={() => handlePatientClick(patient)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{patient.name}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient.id}</td>
                      <td>{patient.age} yrs / {patient.gender}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: 220 }}>{history?.chief_complaint || 'History pending'}</td>
                      <td>
                        <span className="badge" style={priorityBadgeStyle(patient.priority.level)}>
                          {patient.priority.level === 'HIGH' ? 'HIGH PRIORITY' : patient.priority.level}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', fontWeight: 700, color: patient.priority.level === 'HIGH' ? 'var(--danger)' : 'var(--success)' }}>
                        {patient.priority.level === 'HIGH' ? 'Red flag detected' : 'None'}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {patient.priority.completeness === null || patient.priority.completeness === undefined ? 'Pending' : `${patient.priority.completeness}%`}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {history?.completed_at ? new Date(history.completed_at).toLocaleDateString() : 'Registered'}
                      </td>
                      <td>
                        {(() => {
                          const status = normalizeConsultationStatus(workflows[patient.id]?.status || patient.status);
                          const canAct = [CONSULTATION_STATUS.READY_FOR_DOCTOR, CONSULTATION_STATUS.IN_CONSULTATION].includes(status);
                          const label = status === CONSULTATION_STATUS.READY_FOR_DOCTOR ? 'Start consultation' : status === CONSULTATION_STATUS.IN_CONSULTATION ? 'Complete visit' : STATUS_LABELS[status];
                          return <button type="button" className="btn-touch-secondary" style={{ padding: '0.4rem 0.65rem', fontSize: '0.78rem' }} onClick={(event) => handleWorkflow(event, patient)} disabled={!canAct}>{label}</button>;
                        })()}
                      </td>
                      <td>
                        <button
                          type="button"
                          style={{
                            color: 'var(--primary)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}
                        >
                          <span>Review</span>
                          <IconArrowRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};
