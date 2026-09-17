import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { loginPatientAccount, normalizePatientPhone } from "./PatientAuth";
import { IconArrowLeft, IconArrowRight, IconFileText, IconShield } from "../components/Icons";
import { initPatientSession } from "../services/patientSessionService";

export const PatientRecordsLoginPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (event) => {
    event.preventDefault();
    setError("");
    const normalized = normalizePatientPhone(phone);
    if (!normalized) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (password.length < 6) {
      setError("Enter your password.");
      return;
    }
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    setLoading(true);
    try {
      const account = await loginPatientAccount(normalized, password);
      initPatientSession(account.patient, {});
      localStorage.setItem("medikiosk_patient_record_token", account.session_token);
      localStorage.setItem("medikiosk_current_patient_id", account.patient.id);
      localStorage.setItem("medikiosk_current_patient", JSON.stringify(account.patient));
      navigate("/patient-records/home", { replace: true });
    } catch (loginError) {
      console.error("Patient records login failed:", loginError);
      setError("Invalid phone number or password.");
    } finally {
      setLoading(false);
    }
  };


  return <div className="kiosk-container" style={{ maxWidth: 620 }}>
    <div className="kiosk-card">
      <button type="button" className="btn-touch-secondary" onClick={() => navigate("/")} style={{ marginBottom: "1.5rem" }}><IconArrowLeft size={20} />Back</button>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ width: 68, height: 68, margin: "0 auto 1rem", borderRadius: "var(--radius-lg)", background: "var(--primary-light)", color: "var(--primary-dark)", display: "grid", placeItems: "center" }}><IconFileText size={34} /></div>
        <h1 className="kiosk-title">View Previous Records</h1>
        <p className="kiosk-subtitle">Login to access your personal digital health record. This area is for record viewing, not consultation.</p>
      </div>
      <form onSubmit={login} style={{ display: "grid", gap: "1.1rem" }}>
        <label style={{ display: "grid", gap: "0.45rem", fontWeight: 700 }}>Phone Number
          <input value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }} placeholder="10-digit mobile number" inputMode="numeric" maxLength={10} autoComplete="tel" style={{ padding: "1rem", border: "2px solid var(--border-light)", borderRadius: "var(--radius-md)", fontSize: "1.1rem" }} />
        </label>
        <label style={{ display: "grid", gap: "0.45rem", fontWeight: 700 }}>Password
          <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="Enter your password" autoComplete="current-password" style={{ padding: "1rem", border: "2px solid var(--border-light)", borderRadius: "var(--radius-md)", fontSize: "1.1rem" }} />
        </label>
        {error && <div role="alert" style={{ color: "var(--danger)", background: "var(--danger-light)", padding: "0.8rem 1rem", borderRadius: "var(--radius-md)", fontWeight: 600 }}>{error}</div>}
        <button type="submit" className="btn-touch-primary" disabled={loading}>{loading ? "Signing in..." : "Login to My Records"}<IconArrowRight size={22} /></button>
      </form>
      <div className="ai-bubble" style={{ marginTop: "1.25rem" }}><IconShield size={20} /><span>Your records are shown only after successful account authentication.</span></div>
    </div>
  </div>;
};
