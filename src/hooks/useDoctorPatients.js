import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculatePatientPriority } from '../utils/patientPriority';
import { getStaffWorkspaceSnapshot } from '../services/projectIntegrationService';

/**
 * Shared doctor-side data hook.
 * Loads REAL Supabase patients + their medical_history rows (keyed by
 * patient_id, newest first). No mock queue, no invented values.
 * Priority uses the existing calculatePatientPriority() logic.
 */
export const useDoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [histories, setHistories] = useState({});
  const [historyLists, setHistoryLists] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getStaffWorkspaceSnapshot('doctor');
      const latest = {};
      const lists = {};
      rows.forEach((row) => {
        const latestHistory = row.latestHistory || null;
        if (latestHistory) {
          latest[row.id] = latestHistory;
          lists[row.id] = [latestHistory];
        }
      });
      setPatients(rows);
      setHistories(latest);
      setHistoryLists(lists);
      setError('');
    } catch (loadError) {
      console.error('Doctor queue load failed:', loadError?.message || loadError);
      setError('Patient records could not be loaded. Please try again.');
      setPatients([]);
      setHistories({});
      setHistoryLists({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const prioritized = useMemo(() => patients
    .map((patient) => ({ ...patient, priority: calculatePatientPriority(histories[patient.id] || {}) }))
    .sort((first, second) => {
      if (first.priority.rank !== second.priority.rank) return first.priority.rank - second.priority.rank;
      const firstDate = histories[first.id]?.completed_at || first.created_at || '';
      const secondDate = histories[second.id]?.completed_at || second.created_at || '';
      return new Date(secondDate || 0) - new Date(firstDate || 0);
    }), [patients, histories]);

  return { patients: prioritized, histories, historyLists, loading, error, reload: load };
};
