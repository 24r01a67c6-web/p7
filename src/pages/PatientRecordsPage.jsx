import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  getPatientHistory,
  getPatientDocuments,
  getPatientTimeline
} from "../services/patientRecordService";
import { getActiveSession, clearActivePatientSession } from "../services/patientSessionService";
import { MedicalTimelineView } from "../components/MedicalTimelineView";
import {
  IconArrowLeft,
  IconFileText,
  IconCheckCircle,
  IconClock,
  IconUser,
  IconAlertTriangle
} from "../components/Icons";

export const PatientRecordsPage = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [histories, setHistories] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const token = localStorage.getItem("medikiosk_patient_record_token");
      const activeSession = getActiveSession();
      const cachedPatientId = activeSession?.patient?.id || localStorage.getItem("medikiosk_current_patient_id");

      if (!token && !cachedPatientId) {
        navigate("/patient-records", { replace: true });
        return;
      }

      setLoading(true);
      setError("");

      try {
        let patientProfile = null;

        // 1. Try to fetch profile via session token RPC
        if (supabase && token) {
          try {
            const { data: record, error: recordError } = await supabase.rpc("get_patient_record", {
              p_session_token: token
            });
            if (!recordError && record?.patient) {
              patientProfile = record.patient;
            }
          } catch (e) {
            console.warn("RPC session lookup failed, falling back:", e);
          }
        }

        // 2. Fallback to direct patient query or session cache
        if (!patientProfile && cachedPatientId) {
          if (supabase) {
            const { data: pData } = await supabase
              .from("patients")
              .select("id, name, age, gender, phone, language, department, created_at")
              .eq("id", cachedPatientId)
              .maybeSingle();
            if (pData) patientProfile = pData;
          }
          if (!patientProfile && activeSession?.patient?.id === cachedPatientId) {
            patientProfile = activeSession.patient;
          }
        }

        if (!patientProfile) {
          throw new Error("Patient record session has expired. Please log in again.");
        }

        // 3. Load full medical history and documents from normalized service
        const patientId = patientProfile.id;
        const [patientHistoryList, patientDocsList] = await Promise.all([
          getPatientHistory(patientId),
          getPatientDocuments(patientId)
        ]);

        if (!active) return;

        setPatient(patientProfile);
        setHistories(patientHistoryList || []);
        setDocuments(patientDocsList || []);
        setTimeline(getPatientTimeline(patientHistoryList || [], patientDocsList || []));
      } catch (loadError) {
        console.error("Patient digital record load failed:", loadError);
        if (active) setError(loadError?.message || "Your digital health record could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [navigate]);

  const logout = async () => {
    clearActivePatientSession();
    localStorage.removeItem("medikiosk_patient_record_token");
    localStorage.removeItem("medikiosk_current_patient_id");
    localStorage.removeItem("medikiosk_current_patient");
    navigate("/", { replace: true });
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Date not available";
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "Date not available";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="kiosk-container" style={{ maxWidth: 1080 }}>
        <div className="kiosk-card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "4px solid var(--primary-light)", borderTopColor: "var(--primary)", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }} />
          <h2 style={{ fontSize: "1.3rem", color: "var(--text-main)" }}>Loading your digital health record…</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kiosk-container" style={{ maxWidth: 640 }}>
        <div className="kiosk-card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--danger-light)", color: "var(--danger)", display: "grid", placeItems: "center", margin: "0 auto 1.25rem" }}>
            <IconAlertTriangle size={28} />
          </div>
          <p style={{ color: "var(--danger)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "1.5rem" }}>{error}</p>
          <button type="button" className="btn-touch-secondary" onClick={() => navigate("/patient-records")}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-container" style={{ maxWidth: 1100 }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1rem" }}>
        <button type="button" className="btn-touch-secondary" onClick={() => navigate("/")}>
          <IconArrowLeft size={20} />
          <span>Home</span>
        </button>
        <button type="button" className="btn-touch-secondary" onClick={logout}>
          Logout
        </button>
      </div>

      {/* Patient Profile Header — Strictly NO Medical ID */}
      <div className="kiosk-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary-dark)", display: "grid", placeItems: "center" }}>
              <IconUser size={30} />
            </div>
            <div>
              <p style={{ color: "var(--primary-dark)", fontWeight: 800, margin: 0, fontSize: "0.85rem", letterSpacing: "0.05em" }}>
                DIGITAL HEALTH RECORD
              </p>
              <h1 className="kiosk-title" style={{ textAlign: "left", margin: "0.2rem 0", fontSize: "1.75rem" }}>
                {patient?.name || "Patient"}
              </h1>
              <p className="kiosk-subtitle" style={{ textAlign: "left", margin: 0, fontSize: "0.95rem" }}>
                Age: {patient?.age || "—"} yrs · Gender: {patient?.gender || "—"} · Phone: +91 {patient?.phone || "—"}
              </p>
            </div>
          </div>
          <div className="ai-bubble" style={{ margin: 0 }}>
            <IconCheckCircle size={18} />
            <span>Authenticated Records</span>
          </div>
        </div>
      </div>

      {/* 2-Column: Previous Consultations & Medical Timeline */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Previous Consultations / Visits */}
        <section className="kiosk-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ color: "var(--primary-dark)", margin: 0, fontSize: "1.25rem" }}>Previous Consultations</h2>
            <span className="badge badge-normal">{histories.length} {histories.length === 1 ? "Record" : "Records"}</span>
          </div>

          {histories.length === 0 ? (
            <p style={{ color: "var(--text-muted)", padding: "1rem 0" }}>No completed consultation records found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {histories.map((visit, index) => (
                <article
                  key={visit.id || index}
                  style={{
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-md)",
                    padding: "1rem",
                    background: "var(--bg-surface)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      <IconClock size={16} />
                      <span>{formatDate(visit.completed_at || visit.created_at)}</span>
                    </div>
                    <span className={visit.red_flag ? "badge badge-priority" : "badge badge-normal"}>
                      {visit.red_flag ? "Priority Alert" : "Completed"}
                    </span>
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                    {visit.chief_complaint || "Consultation Intake"}
                  </div>
                  {Array.isArray(visit.questions) && visit.questions.length > 0 && (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                      {visit.questions.slice(0, 3).map((q) => `${q.question || q.questionId}: ${q.answer}`).join(" · ")}
                    </div>
                  )}
                  {visit.red_flag && (
                    <p style={{ color: "var(--danger)", fontWeight: 700, fontSize: "0.85rem", margin: "0.4rem 0 0" }}>
                      ⚠️ Potential alert recorded: {visit.red_flag_reason || "Clinical review required"}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Medical Timeline */}
        <section className="kiosk-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ color: "var(--primary-dark)", margin: 0, fontSize: "1.25rem" }}>Medical Timeline</h2>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Chronological</span>
          </div>
          <MedicalTimelineView events={timeline} />
        </section>
      </div>

      {/* Documents & Records Section */}
      <section className="kiosk-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ color: "var(--primary-dark)", margin: 0, fontSize: "1.25rem" }}>
            <IconFileText size={22} style={{ verticalAlign: "middle", marginRight: 8 }} />
            Documents & Records
          </h2>
          <span className="badge badge-normal">{documents.length} Uploaded</span>
        </div>

        {documents.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: "1rem 0" }}>No medical documents or lab reports are linked to your record yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.85rem" }}>
            {documents.map((doc, index) => (
              <div
                key={doc.id || `${doc.file_name}-${index}`}
                style={{
                  padding: "0.9rem",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-surface)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <strong style={{ fontSize: "0.95rem", color: "var(--text-main)", wordBreak: "break-word" }}>
                    {doc.document_name || doc.file_name || "Medical Document"}
                  </strong>
                  <span
                    className="badge"
                    style={{
                      fontSize: "0.75rem",
                      background: doc.processing_status === "processed" ? "var(--success-light)" : "var(--warning-light)",
                      color: doc.processing_status === "processed" ? "var(--success)" : "var(--warning)"
                    }}
                  >
                    {doc.processing_status === "processed" ? "Processed" : "Pending extraction"}
                  </span>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  {doc.document_type || "Medical document"} · {doc.document_date_label || formatDate(doc.document_date || doc.created_at)}
                </div>
                {doc.structured?.medications?.length > 0 && (
                  <div style={{ fontSize: "0.8rem", color: "var(--primary-dark)", fontWeight: 600, marginTop: "0.25rem" }}>
                    💊 {doc.structured.medications.map((m) => m.name || m.text).join(", ")}
                  </div>
                )}
                {doc.structured?.labs?.length > 0 && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-main)", marginTop: "0.15rem" }}>
                    🔬 {doc.structured.labs.map((l) => `${l.test || l.name}: ${l.value}`).join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
