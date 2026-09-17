import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { KioskProvider } from './context/KioskContext';
import { Header } from './components/Header';

import { LandingPage } from './pages/LandingPage';
import { LanguagePage } from './pages/LanguagePage';
import { ConsentPage } from './pages/ConsentPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { RegistrationSuccessPage } from './pages/RegistrationSuccessPage';
import { HistoryTakingPage } from './pages/HistoryTakingPage';
import { DocumentUploadPage } from './pages/DocumentUploadPage';
import { HealthIssuePage } from './pages/HealthIssuePage';
import { AyushAssessmentPage } from './pages/AyushAssessmentPage';
import { ClinicalSummaryPage } from './pages/ClinicalSummaryPage';

import { DoctorDashboardPage } from './pages/DoctorDashboardPage';
import { PatientDetailsPage } from './pages/PatientDetailsPage';
import { AyushHistoryPage } from './pages/AyushHistoryPage';
import { AbdmDemoPage } from './pages/AbdmDemoPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminPatientCasePage } from './pages/AdminPatientCasePage';
import { PatientPortalPage } from './pages/PatientPortalPage';
import { IdentificationPage } from './pages/IdentificationPage';
import { PatientRecordsLoginPage } from './pages/PatientRecordsLoginPage';
import { PatientRecordsPage } from './pages/PatientRecordsPage';
import { StaffRoute } from './components/StaffRoute';
import { StaffPortalPage } from './pages/StaffPortalPage';
import { NurseDashboardPage } from './pages/NurseDashboardPage';
import { QueueHandlerDashboardPage } from './pages/QueueHandlerDashboardPage';

function AppShell() {
  const location = useLocation();
  const hideGlobalHeader = location.pathname === '/' || location.pathname.startsWith('/staff') || location.pathname.startsWith('/doctor') || location.pathname.startsWith('/nurse') || location.pathname.startsWith('/queue') || location.pathname.startsWith('/admin');

  return (
    <div className="app-container">
          {!hideGlobalHeader && <Header />}
          <div className="main-content">
            <Routes>
              {/* Kiosk Outpatient Flow */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/identify" element={<IdentificationPage />} />
              <Route path="/language" element={<LanguagePage />} />
              <Route path="/consent" element={<ConsentPage />} />
              <Route path="/registration" element={<RegistrationPage />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/registration-success" element={<RegistrationSuccessPage />} />
              <Route path="/health-issue" element={<HealthIssuePage />} />
              <Route path="/history" element={<HistoryTakingPage />} />
              <Route path="/ayush-assessment" element={<AyushAssessmentPage />} />
              <Route path="/documents" element={<DocumentUploadPage />} />
              <Route path="/upload" element={<DocumentUploadPage />} />
              <Route path="/summary" element={<ClinicalSummaryPage />} />
              <Route path="/patient" element={<PatientPortalPage />} />
              <Route path="/patient-records" element={<PatientRecordsLoginPage />} />
              <Route path="/patient-records/home" element={<PatientRecordsPage />} />

              {/* Separate authenticated staff portal */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/staff" element={<StaffRoute><StaffPortalPage /></StaffRoute>} />
              <Route path="/admin/dashboard" element={<StaffRoute allowedRoles={['admin']}><AdminDashboardPage /></StaffRoute>} />
              <Route path="/admin/patient/:id" element={<StaffRoute allowedRoles={['admin','doctor']}><AdminPatientCasePage /></StaffRoute>} />

              {/* Role-specific staff workspaces */}
              <Route path="/doctor" element={<StaffRoute allowedRoles={['doctor','admin']}><DoctorDashboardPage /></StaffRoute>} />
              <Route path="/doctor/patient/:id" element={<StaffRoute allowedRoles={['doctor','admin']}><PatientDetailsPage /></StaffRoute>} />
              <Route path="/nurse" element={<StaffRoute allowedRoles={['nurse','admin']}><NurseDashboardPage /></StaffRoute>} />
              <Route path="/queue" element={<StaffRoute allowedRoles={['queue_handler','admin']}><QueueHandlerDashboardPage /></StaffRoute>} />
              <Route path="/ayush" element={<StaffRoute allowedRoles={['doctor','admin']}><AyushHistoryPage /></StaffRoute>} />
              <Route path="/abdm" element={<StaffRoute allowedRoles={['doctor','admin']}><AbdmDemoPage /></StaffRoute>} />

              {/* Fallback Catch-All Route */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <KioskProvider>
        <AppShell />
      </KioskProvider>
    </BrowserRouter>
  );
}
