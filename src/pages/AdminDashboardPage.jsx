import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOperationalPatients } from '../services/patientRecordService';
import { IconAlertTriangle, IconCheckCircle, IconClock, IconLayoutDashboard, IconSearch, IconUsers } from '../components/Icons';
import { Sidebar } from '../components/Sidebar';
import { calculatePatientPriority } from '../utils/patientPriority';
import { supabase } from '../lib/supabase';


export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [newPatientIds, setNewPatientIds] = useState([]);
  const [histories, setHistories] = useState({});
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const knownPatientIds = useRef(null);

  useEffect(() => {
    let active = true;
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const rows = await getOperationalPatients();
        if (!active) return;
        const nextPatients = rows || [];
        const nextHistories = nextPatients.reduce((result, patient) => {
          if (patient.latestHistory) result[patient.id] = patient.latestHistory;
          return result;
        }, {});
        const nextIds = nextPatients.map((patient) => patient.id);
        if (knownPatientIds.current) {
          setNewPatientIds((previous) => [
            ...new Set([...previous, ...nextIds.filter((id) => !knownPatientIds.current.has(id))])
          ]);
        }
        knownPatientIds.current = new Set(nextIds);
        setPatients(nextPatients);
        setHistories(nextHistories);
        setError('');
      } catch (queryError) {
        console.error('DASHBOARD SELECT ERROR:', queryError);
        if (active) setError('Patient records could not be loaded. Check the staff access policy or try again.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPatients();
    const refreshTimer = window.setInterval(fetchPatients, 5000);
    return () => { active = false; window.clearInterval(refreshTimer); };
  }, []);


  const prioritizedPatients = useMemo(() => patients.map((patient) => {
    const priority = calculatePatientPriority(histories[patient.id] || {});
    return { ...patient, priority };
  }).sort((first, second) => {
    const rankDifference = first.priority.rank - second.priority.rank;
    if (rankDifference) return rankDifference;
    const firstDate = histories[first.id]?.completed_at || first.created_at || '';
    const secondDate = histories[second.id]?.completed_at || second.created_at || '';
    return new Date(secondDate || 0) - new Date(firstDate || 0);
  }), [patients, histories]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    return prioritizedPatients.filter((patient) => {
      const matchesFilter = priorityFilter === 'ALL' || patient.priority.level === priorityFilter;
      const matchesSearch = !term || [patient.id, patient.name, patient.department, patient.gender, patient.language].some((value) => String(value || '').toLowerCase().includes(term));
      return matchesFilter && matchesSearch;
    });
  }, [prioritizedPatients, priorityFilter, search]);

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = patients.filter((patient) => String(patient.created_at || '').startsWith(today)).length;
  const priorityCounts = prioritizedPatients.reduce((counts, patient) => {
    counts[patient.priority.level] += 1;
    return counts;
  }, { HIGH: 0, MEDIUM: 0, NORMAL: 0 });
  const stats = [
    { label: 'High priority', value: priorityCounts.HIGH, icon: IconAlertTriangle, color: 'var(--danger)' },
    { label: 'Medium priority', value: priorityCounts.MEDIUM, icon: IconClock, color: 'var(--warning)' },
    { label: 'Normal priority', value: priorityCounts.NORMAL, icon: IconCheckCircle, color: 'var(--success)' },
    { label: 'Total patients', value: patients.length, icon: IconUsers, color: 'var(--primary)' },
    { label: "Today's patients", value: todayCount, icon: IconClock, color: 'var(--secondary)' },
    { label: 'Pending consultations', value: patients.length, icon: IconLayoutDashboard, color: 'var(--warning)' },
    { label: 'Red-flag patients', value: priorityCounts.HIGH, icon: IconAlertTriangle, color: 'var(--danger)' }
  ];

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="doctor-layout">
      <Sidebar role="admin" />
      <main className="doctor-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div><h1 style={{ fontSize: '2rem' }}>Operations administration</h1><p style={{ color: 'var(--text-muted)' }}>Secure patient intake and consultation queue</p></div>
          <div style={{ position: 'relative', width: 280 }}><IconSearch size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patients..." style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.4rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }} /></div>
        </div>
        <div className="stats-grid">{stats.map(({ label, value, icon: Icon, color }) => <div className="stat-card" key={label}><Icon size={28} color={color} /><div><div className="stat-val" style={{ color }}>{value}</div><div className="stat-lbl">{label}</div></div></div>)}</div>
        <div className="table-container">
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}><h3>Patient queue</h3><div style={{ display: 'flex', gap: '0.5rem' }}>{['ALL', 'HIGH', 'MEDIUM', 'NORMAL'].map((filter) => <button type="button" key={filter} className="btn-touch-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setPriorityFilter(filter)}>{filter === 'ALL' ? 'All' : filter}</button>)}</div></div>
          {loading && <div style={{ padding: '2rem' }}>Loading patient records...</div>}
          {error && <div role="alert" style={{ padding: '1rem', color: 'var(--danger)' }}>{error}</div>}
          {!loading && !error && <table className="custom-table"><thead><tr><th>Patient ID</th><th>Name</th><th>Age</th><th>Gender</th><th>Department</th><th>Language</th><th>Registration time</th><th>Status</th><th>Red Flag</th></tr></thead><tbody>{filteredPatients.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>No patient records found.</td></tr> : filteredPatients.map((patient) => {
            const isNew = newPatientIds.includes(patient.id);
            return <tr key={patient.id} onClick={() => {
              setNewPatientIds((previous) => previous.filter((id) => id !== patient.id));
              navigate(`/admin/patient/${patient.id}`);
            }} style={{ cursor: 'pointer' }}>
              <td>{patient.id}</td>
              <td style={{ fontWeight: 700 }}>{patient.name} {isNew && <span className="badge badge-normal" style={{ marginLeft: '0.4rem' }}>New Patient</span>}<div style={{ color: patient.priority.level === 'HIGH' ? 'var(--danger)' : patient.priority.level === 'MEDIUM' ? 'var(--warning)' : 'var(--success)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{patient.priority.level} PRIORITY</div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>History Quality: {patient.priority.quality.percentage === null ? 'Unavailable' : `${patient.priority.quality.percentage}% (${patient.priority.quality.label})`}</div></td>
              <td>{patient.age}</td>
              <td>{patient.gender}</td>
              <td>{patient.department}</td>
              <td>{patient.language}</td>
              <td>{patient.created_at ? new Date(patient.created_at).toLocaleString() : '—'}</td>
              <td><span className="badge badge-normal">{histories[patient.id] ? 'History completed' : 'Registered'}</span></td>
              <td><span className={`badge ${patient.priority.level === 'HIGH' ? 'badge-danger' : 'badge-normal'}`}>{patient.priority.level === 'HIGH' ? `Potential Red Flag${patient.priority.redFlagReason ? `: ${patient.priority.redFlagReason}` : ''}` : `${patient.priority.completeness}% complete`}</span></td>
            </tr>;
          })}</tbody></table>}
        </div>
      </main>
    </div>
  );
};
