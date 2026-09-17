import React, { useMemo, useState } from 'react';
import { Search, Users, Clock3, ArrowUpRight, UserRoundCheck, MoveRight, ListOrdered, SlidersHorizontal } from 'lucide-react';
import { StaffWorkspaceShell } from '../components/StaffWorkspaceShell';
import { getStaffWorkspaceSnapshot, movePatientWorkflow } from '../services/projectIntegrationService';
import { CONSULTATION_STATUS, STATUS_LABELS, normalizeConsultationStatus, getConsultationWorkflows } from '../services/consultationWorkflowService';

export const QueueHandlerDashboardPage = () => {
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [workflows, setWorkflows] = useState({});
  const [actionError, setActionError] = useState('');

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      setLoadingPatients(true);
      try {
        const data = await getStaffWorkspaceSnapshot('queue_handler');
        if (active) setPatients(Array.isArray(data) ? data : []);
      } catch (error) {
        console.warn('[QueueHandler] Operational patient load failed:', error?.message || error);
        if (active) setPatients([]);
      } finally {
        if (active) setLoadingPatients(false);
      }
    };
    load();
    const timer = window.setInterval(load, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [queue]);

  React.useEffect(() => {
    let active = true;
    const loadWorkflows = async () => {
      const map = await getConsultationWorkflows(patients);
      if (active) setWorkflows(map);
    };
    if (!loadingPatients) loadWorkflows();
    const timer = window.setInterval(loadWorkflows, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [patients, loadingPatients]);

  const moveToCheckedIn = async (patient) => {
    setActionError('');
    try {
      const workflow = await movePatientWorkflow(patient, CONSULTATION_STATUS.CHECKED_IN);
      setWorkflows((prev) => ({ ...prev, [patient.id]: workflow }));
      setPatients((prev) => prev.map((item) => item.id === patient.id ? { ...item, status: workflow.status } : item));
    } catch (error) {
      setActionError(error.message || 'Unable to check in patient.');
    }
  };
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const term = search.trim().toLowerCase();
  const filteredPatients = useMemo(() => patients.filter((p) => {
    const matchesSearch = !term || [p.name, p.token, p.department].some((v) => String(v || '').toLowerCase().includes(term));
    const status = normalizeConsultationStatus(workflows[p.id]?.status || p.status);
    const matchesFilter = filter === 'ALL' || (filter === 'PRIORITY' ? Boolean(p.priority || p.redFlag) : status === filter);
    return matchesSearch && matchesFilter;
  }), [patients, term, filter, workflows]);
  const stats = [
    { label: 'In queue', value: patients.length, icon: Users, tone: 'default' },
    { label: 'Priority', value: patients.filter((p) => p.priority || p.redFlag).length, icon: ArrowUpRight, tone: 'attention' },
    { label: 'Waiting', value: patients.filter((p) => [CONSULTATION_STATUS.WAITING, CONSULTATION_STATUS.CHECKED_IN].includes(normalizeConsultationStatus(workflows[p.id]?.status || p.status))).length, icon: Clock3, tone: 'neutral' },
    { label: 'Ready', value: patients.filter((p) => normalizeConsultationStatus(workflows[p.id]?.status || p.status) === CONSULTATION_STATUS.READY_FOR_DOCTOR).length, icon: UserRoundCheck, tone: 'success' },
  ];

  return (
    <StaffWorkspaceShell
      role="queue_handler"
      kicker="Queue operations"
      title="Consultation flow"
      description="Keep the operational queue moving while clinical information stays inside the appropriate staff workspace."
      search={<label className="staff-search" aria-label="Search queue"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient or token" /></label>}
      stats={stats}
    >
      <section className="staff-panel">
        <div className="staff-panel-head">
          <div><span>Live queue</span><h2>Patients in flow</h2></div>
          <div className="staff-filter-row"><SlidersHorizontal size={15} />{['ALL', 'PRIORITY', CONSULTATION_STATUS.WAITING, CONSULTATION_STATUS.READY_FOR_DOCTOR].map((item) => <button type="button" key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item === 'PRIORITY' ? 'Priority' : item === CONSULTATION_STATUS.WAITING ? 'Waiting' : 'Ready'}</button>)}</div>
        </div>
        <div className="queue-table">
          <div className="queue-table-head"><span>Token</span><span>Patient</span><span>Department</span><span>Priority</span><span>Status</span><span>Action</span></div>
          {loadingPatients ? <div className="staff-empty"><ListOrdered size={20} /><strong>Loading queue</strong><span>Synchronising the consultation workflow.</span></div> : filteredPatients.length ? filteredPatients.map((patient, index) => (
            <div className="queue-table-row" key={patient.id}>
              <strong>#{patient.token || index + 1}</strong>
              <div><b>{patient.name || 'Unnamed patient'}</b><small>{patient.language === 'te' ? 'Telugu' : patient.language === 'hi' ? 'Hindi' : 'English'}</small></div>
              <span>{patient.department || 'General Medicine'}</span>
              <span className={`staff-status-pill ${patient.priority || patient.redFlag ? 'priority' : ''}`}>{patient.priority || patient.redFlag ? 'Priority' : 'Routine'}</span>
              <span className="staff-status-text">{STATUS_LABELS[normalizeConsultationStatus(workflows[patient.id]?.status || patient.status)]}</span>
              <button type="button" className="queue-action-btn" onClick={() => moveToCheckedIn(patient)} disabled={normalizeConsultationStatus(workflows[patient.id]?.status || patient.status) !== CONSULTATION_STATUS.WAITING}><MoveRight size={15} /> {normalizeConsultationStatus(workflows[patient.id]?.status || patient.status) === CONSULTATION_STATUS.WAITING ? 'Check in' : 'Checked in'}</button>
            </div>
          )) : (
            <div className="staff-empty"><ListOrdered size={20} /><strong>Queue is clear</strong><span>New registrations will appear here automatically.</span></div>
          )}
        </div>
        {actionError && <div className="staff-portal-error" role="alert">{actionError}</div>}
      </section>
    </StaffWorkspaceShell>
  );
};
