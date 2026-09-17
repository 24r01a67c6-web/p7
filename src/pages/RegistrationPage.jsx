import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKiosk } from "../context/KioskContext";
import { ProgressBar } from "../components/ProgressBar";
import { VoiceButton } from "../components/VoiceButton";
import { IconArrowRight, IconArrowLeft } from "../components/Icons";
import { useTranslation } from "../translations";
import { supabase } from "../lib/supabase";
import { registerPatientAccount } from "./PatientAuth";
import { initPatientSession } from "../services/patientSessionService";

const normalizePhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return "";
};

export const RegistrationPage = () => {
  const navigate = useNavigate();
  const { language, patientData, setPatientData } = useKiosk();
  const t = useTranslation(language);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current) return;
    cleared.current = true;
    // Start each new registration from the active session only; do not revive stale legacy IDs.
    setPatientData((previous) => previous?.id ? previous : { ...previous, id: "", token: "", patient_code: "", name: "", age: "", phone: "", adaptiveAnswers: {}, answers: {}, history: [], documents: [], redFlag: false, priority: false, redFlagReason: "", completedAt: "", summary: {} });
    localStorage.removeItem("medikiosk_current_patient_history");
  }, [setPatientData]);

  const departments = ["General Medicine", "Cardiology", "Orthopedics", "Pediatrics", "AYUSH"];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setPatientData((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
    setSubmitError("");
  };

  const handleContinue = async (event) => {
    event?.preventDefault();
    if (isSaving) return;
    const nextErrors = {};
    if (!patientData.name?.trim()) nextErrors.name = t("nameError");
    if (!patientData.age || Number(patientData.age) <= 0 || Number(patientData.age) > 130) nextErrors.age = t("ageError");
    if (!/^\d{10}$/.test(String(patientData.phone || "").trim())) nextErrors.phone = "Enter a valid 10-digit mobile number.";
    if (!patientData.password || patientData.password.length < 6) nextErrors.password = "Password must contain at least 6 characters.";
    if (patientData.password !== patientData.confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    if (!supabase) {
      setSubmitError(t("supabaseNotConfigured"));
      return;
    }

    const phone = normalizePhone(patientData.phone);
    if (!phone) {
      setSubmitError("Enter a valid Indian mobile number.");
      return;
    }

    setIsSaving(true);
    setSubmitError("");
    try {
      const account = await registerPatientAccount({
        name: patientData.name.trim(),
        age: patientData.age,
        gender: patientData.gender,
        phone,
        password: patientData.password,
        language: language || "en",
        department: patientData.department || "General Medicine",
      });

      const currentPatient = {
        ...patientData,
        id: account.id,
        token: account.patient_code,
        patient_code: account.patient_code,
        name: account.name,
        age: account.age,
        gender: account.gender,
        phone: account.phone,
        language: account.language,
        department: account.department,
        identity_type: account.identity_type,
        session_token: account.session_token || null
      };
      initPatientSession(currentPatient, currentPatient);
      setPatientData(currentPatient);
      navigate("/registration-success");

    } catch (error) {
      console.error("Patient registration failed:", error);
      setSubmitError(error?.message || t("savePatientError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="kiosk-container">
      <ProgressBar currentStep={1} totalSteps={7} stepTitle={t("patientTitle")} />
      <div className="kiosk-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h1 className="kiosk-title" style={{ textAlign: "left", marginBottom: "0.25rem" }}>{t("patientTitle")}</h1>
            <p className="kiosk-subtitle" style={{ textAlign: "left", margin: 0 }}>Create your Pravedā account using your phone number and password.</p>
          </div>
          <VoiceButton text="Please fill in your name, age, phone number, password, and department." />
        </div>

        <form onSubmit={handleContinue} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
          <Field label={`${t("fullName")} *`} error={errors.name}><input name="name" value={patientData.name || ""} onChange={handleChange} placeholder={t("enterName")} /></Field>
          <Field label={`${t("age")} *`} error={errors.age}><input type="number" name="age" value={patientData.age || ""} onChange={handleChange} placeholder={t("enterAge")} /></Field>
          <Field label={t("gender")}><select name="gender" value={patientData.gender || "Male"} onChange={handleChange}><option value="Male">{t("male")}</option><option value="Female">{t("female")}</option><option value="Other">{t("other")}</option></select></Field>
          <Field label={`${t("phone")} *`} error={errors.phone}><input name="phone" value={patientData.phone || ""} onChange={(e) => setPatientData((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="10-digit mobile number" inputMode="numeric" maxLength={10} autoComplete="tel" /></Field>
          <Field label="Create Password *" error={errors.password}><input type="password" name="password" value={patientData.password || ""} onChange={handleChange} placeholder="At least 6 characters" autoComplete="new-password" /></Field>
          <Field label="Confirm Password *" error={errors.confirmPassword}><input type="password" name="confirmPassword" value={patientData.confirmPassword || ""} onChange={handleChange} placeholder="Re-enter password" autoComplete="new-password" /></Field>
          <Field label={t("department")} full><select name="department" value={patientData.department || "General Medicine"} onChange={handleChange}>{departments.map((dept) => <option key={dept} value={dept}>{t({ "General Medicine": "generalMedicine", Cardiology: "cardiology", Orthopedics: "orthopedics", Pediatrics: "pediatrics", AYUSH: "ayush" }[dept])}</option>)}</select></Field>
        </form>

        {submitError && <div role="alert" style={{ color: "var(--danger)", background: "var(--danger-light)", borderRadius: "var(--radius-md)", padding: "0.8rem 1rem", marginBottom: "1rem", fontWeight: 600 }}>{submitError}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <button type="button" className="btn-touch-secondary" onClick={() => navigate("/identify")} disabled={isSaving}><IconArrowLeft size={24} /><span>{t("back")}</span></button>
          <button type="button" className="btn-touch-primary" onClick={handleContinue} disabled={isSaving}><span>{isSaving ? "Creating account..." : "Create Account"}</span><IconArrowRight size={24} /></button>
        </div>
      </div>
    </div>
  );
};

function Field({ label, error, full, children }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: full ? "1 / -1" : undefined }}><label style={{ fontSize: "1.05rem", fontWeight: 700 }}>{label}</label>{React.cloneElement(children, { style: { width: "100%", boxSizing: "border-box", padding: "1rem 1.1rem", borderRadius: "var(--radius-md)", border: error ? "2px solid var(--danger)" : "2px solid var(--border-light)", fontSize: "1.1rem", background: "white", ...(children.props.style || {}) } })}{error && <span style={{ color: "var(--danger)", fontSize: "0.9rem", fontWeight: 600 }}>{error}</span>}</div>;
}
