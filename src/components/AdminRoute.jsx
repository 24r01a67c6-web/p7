import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentStaffProfile } from '../services/staffAccess';

export const AdminRoute = ({ children }) => {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, profile: null, error: null });
  useEffect(() => {
    let active = true;
    getCurrentStaffProfile().then(({ profile, error }) => {
      if (active) setState({ loading: false, profile, error });
    });
    return () => { active = false; };
  }, []);
  if (state.loading) return <div className="staff-auth-loading"><div className="staff-auth-card"><div className="staff-loading-dot" />Checking secure staff access...</div></div>;
  if (state.error || !state.profile) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
};
