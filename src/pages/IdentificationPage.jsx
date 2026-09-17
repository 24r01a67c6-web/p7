import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKiosk } from "../context/KioskContext";
import { supabase } from "../lib/supabase";
import { loginPatientAccount, normalizePatientPhone } from "./PatientAuth";
import { initPatientSession } from "../services/patientSessionService";
import {
  IconArrowRight,
  IconCheckCircle,
  IconFileText,
  IconShield,
  IconUser,
} from "../components/Icons";


export const IdentificationPage = () => {
  const navigate = useNavigate();
  const { setPatientData, startNewConsultation } = useKiosk();
  const [mode, setMode] = useState("");
  const [abha, setAbha] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [foundPatient, setFoundPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectMode = (next) => {
    setMode(next);
    setAbha("");
    setPhone("");
    setPassword("");
    setMessage("");
    setFoundPatient(null);
  };

  const storeSessionPatient = (row) => {
    const record = {
      ...row,
      id: row.id,
      token: row.patient_code || row.id,
      patient_code: row.patient_code || "",
      chiefComplaint: "",
      adaptiveAnswers: {},
      answers: {},
      history: [],
      documents: [],
      redFlag: false,
      priority: false,
      redFlagReason: "",
      status: "Normal",
      createdAt: row.created_at || "",
    };
    initPatientSession(record, record);
    setPatientData(record);
  };

  const findAbha = async () => {
    if (!/^\d{14}$/.test(abha.trim())) {
      setMessage("Please enter a valid 14-digit ABHA number.");
      return;
    }
    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }
    setLoading(true);
    setMessage("");
    setFoundPatient(null);
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("abha_number", abha.trim())
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      if (!data?.[0]) {
        setMessage("We couldn't find a matching ABHA record.");
        return;
      }
      setFoundPatient(data[0]);
    } catch (error) {
      console.error("ABHA lookup failed:", error);
      setMessage("We couldn't connect to your record right now.");
    } finally {
      setLoading(false);
    }
  };

  const loginRegisteredPatient = async (event) => {
    event.preventDefault();
    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }
    const normalized = normalizePatientPhone(phone);
    if (!normalized) {
      setMessage("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const account = await loginPatientAccount(normalized, password);
      const patient = account.patient;
      storeSessionPatient(patient);
      localStorage.setItem("medikiosk_patient_record_token", account.session_token);
      navigate("/language");
    } catch (error) {
      console.error("Patient login failed:", error);
      setMessage("Invalid phone number or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startNewPatient = () => {
    // Reset the previous consultation completely, including the previously selected language.
    startNewConsultation();
    navigate("/language");
  };

  const proceedToHistory = () => {
    if (!foundPatient) return;
    storeSessionPatient(foundPatient);
    navigate("/language");
  };

  return (
    <div className="kiosk-container">
      <div className="kiosk-card" style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <p style={{ fontWeight: 800, color: "var(--primary-dark)", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>STEP 1</p>
          <h1 className="kiosk-title" style={{ marginBottom: "0.4rem" }}>Identify Yourself</h1>
          <p className="kiosk-subtitle" style={{ margin: 0 }}>Choose how you want to continue.</p>
        </div>

        <div className="language-grid">
          <button type="button" className={mode === "abha" ? "language-card selected" : "language-card"} onClick={() => selectMode("abha")}>
            <IconFileText size={38} /><strong>ABHA</strong><span>Continue with your ABHA number</span>
          </button>
          <button type="button" className={mode === "registered" ? "language-card selected" : "language-card"} onClick={() => selectMode("registered")}>
            <IconShield size={38} /><strong>Registered Patient</strong><span>Login with your phone number and password</span>
          </button>
          <button type="button" className="language-card" onClick={startNewPatient}>
            <IconUser size={38} /><strong>New Patient</strong><span>Create a new patient account</span>
          </button>
        </div>

        {mode === "abha" && (
          <div style={{ marginTop: "1.5rem", display: "grid", gap: "0.9rem" }}>
            <label htmlFor="abha-number" style={{ fontWeight: 700 }}>ABHA Number</label>
            <input id="abha-number" value={abha} onChange={(e) => setAbha(e.target.value.replace(/\D/g, "").slice(0, 14))} placeholder="Enter 14-digit ABHA number" inputMode="numeric" maxLength={14} style={{ width: "100%", boxSizing: "border-box", padding: "1rem", borderRadius: 12, border: "2px solid var(--border-light)", fontSize: "1.1rem" }} />
            <button type="button" className="btn-touch-secondary" onClick={findAbha} disabled={loading}>{loading ? "Searching..." : "Find my ABHA record"}</button>
            {foundPatient && <div className="ai-bubble"><IconCheckCircle size={22} /><span>Record found for {foundPatient.name || "Patient"}.</span></div>}
            {foundPatient && <button type="button" className="btn-touch-primary" onClick={proceedToHistory}><span>Continue to Medical History</span><IconArrowRight size={24} /></button>}
          </div>
        )}

        {mode === "registered" && (
          <form onSubmit={loginRegisteredPatient} style={{ marginTop: "1.5rem", display: "grid", gap: "0.9rem" }}>
            <label htmlFor="registered-phone" style={{ fontWeight: 700 }}>Phone Number</label>
            <input id="registered-phone" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setMessage(""); }} placeholder="Enter your 10-digit mobile number" inputMode="numeric" maxLength={10} autoComplete="tel" style={{ width: "100%", boxSizing: "border-box", padding: "1rem", borderRadius: 12, border: "2px solid var(--border-light)", fontSize: "1.1rem" }} />
            <label htmlFor="registered-password" style={{ fontWeight: 700 }}>Password</label>
            <input id="registered-password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setMessage(""); }} placeholder="Enter your password" autoComplete="current-password" style={{ width: "100%", boxSizing: "border-box", padding: "1rem", borderRadius: 12, border: "2px solid var(--border-light)", fontSize: "1.1rem" }} />
            <button type="submit" className="btn-touch-primary" disabled={loading}>{loading ? "Signing in..." : "Login"}<IconArrowRight size={24} /></button>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>Use the phone number and password you created during registration.</p>
          </form>
        )}

        {message && <div role="alert" style={{ marginTop: "1rem", color: "var(--danger)", background: "var(--danger-light)", borderRadius: "var(--radius-md)", padding: "0.8rem 1rem", fontWeight: 600 }}>{message}</div>}
      </div>
    </div>
  );
};
