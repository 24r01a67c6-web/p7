import React from 'react';
import { Sidebar } from './Sidebar';

export const StaffWorkspaceShell = ({ role, kicker, title, description, search, actions, stats = [], children }) => (
  <div className="staff-workspace-layout">
    <Sidebar role={role} />
    <main className="staff-workspace-main">
      <div className="staff-workspace-top">
        <div className="staff-workspace-heading">
          <span className="staff-kicker">{kicker}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="staff-workspace-actions">
          {search}
          {actions}
        </div>
      </div>
      {stats.length > 0 && (
        <div className="staff-stat-grid">
          {stats.map(({ label, value, icon: Icon, tone = 'default', detail }) => (
            <article className={`staff-stat-card ${tone}`} key={label}>
              <div className="staff-stat-icon"><Icon size={18} /></div>
              <div className="staff-stat-copy"><strong>{value}</strong><span>{label}</span>{detail ? <small>{detail}</small> : null}</div>
            </article>
          ))}
        </div>
      )}
      {children}
    </main>
  </div>
);
