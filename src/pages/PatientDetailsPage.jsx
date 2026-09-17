import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { supabase } from "../lib/supabase";
import { calculatePatientPriority } from "../utils/patientPriority";
import { getPatientWorkspaceSnapshot } from "../services/projectIntegrationService";
import { buildMedicalTimeline } from "../utils/medicalTimeline";
import { STATUS_LABELS, normalizeConsultationStatus } from "../services/consultationWorkflowService";
import { MedicalDocumentsSection } from "../components/MedicalDocumentsSection";
import { MedicalTimelineView } from "../components/MedicalTimelineView";
import { ClinicalIntelligencePanel } from "../components/ClinicalIntelligencePanel";
import { FiveSecondDoctorBrief } from "../components/FiveSecondDoctorBrief";
import {
  analyzeHistoryCompleteness,
  createDoctorBrief,
  getHistoryQuality,
} from "../utils/historyCompleteness";
import {
  IconArrowLeft,
  IconAlertTriangle,
  IconCheckCircle,
  IconClock,
  IconFileText,
} from "../components/Icons";

export const PatientDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [docRecords, setDocRecords] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editChiefComplaint, setEditChiefComplaint] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [workflow, setWorkflow] = useState(null);

  useEffect(() => {
    let active = true;

    const loadCase = async () => {
      if (!supabase || !id) {
        if (active) {
          setLoadError("This patient record could not be loaded.");
          setLoading(false);
        }
        return;
      }

      try {
        const snapshot = await getPatientWorkspaceSnapshot(id);
        const patientRow = snapshot?.profile || null;
        const rows = [snapshot?.clinicalHistory?.current, ...(snapshot?.clinicalHistory?.previous || [])].filter(Boolean);

        if (!patientRow) throw new Error('Patient record not found.');
        if (!active) return;

        setPatient(patientRow);
        setHistoryRows(rows);
        if (active) {
          setWorkflow(snapshot?.currentConsultation?.workflow || null);
          setDocRecords(Array.isArray(snapshot?.documents?.list) ? snapshot.documents.list : []);
          setDocsLoading(false);
        }
        setLoadError("");
      } catch (loadFailure) {
        console.error(
          "Patient case load failed:",
          loadFailure?.message || loadFailure,
        );

        if (active) {
          setLoadError("This patient record could not be loaded.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCase();

    return () => {
      active = false;
    };
  }, [id]);

  const currentHistory = historyRows[0] || null;
  const previousHistory = historyRows[1] || null;

  const completeness = useMemo(
    () => analyzeHistoryCompleteness(currentHistory || {}),
    [currentHistory],
  );

  const priority = useMemo(
    () => calculatePatientPriority(currentHistory || {}),
    [currentHistory],
  );

  const quality = useMemo(
    () =>
      getHistoryQuality(
        completeness,
        Boolean(currentHistory?.id || currentHistory?.completed_at),
      ),
    [completeness, currentHistory],
  );

  const brief = useMemo(
    () => createDoctorBrief(currentHistory || {}),
    [currentHistory],
  );

  const documents = useMemo(() => {
    if (docRecords && docRecords.length) return docRecords;
    const fromHistory = Array.isArray(currentHistory?.documents) ? currentHistory.documents : [];
    const fromPatient = Array.isArray(patient?.documents) ? patient.documents : [];
    return [...fromHistory, ...fromPatient];
  }, [docRecords, currentHistory, patient]);

  const timeline = useMemo(() => buildMedicalTimeline({ documents, currentHistory, previousHistories: previousHistory ? [previousHistory] : [] }), [documents, currentHistory, previousHistory]);

  const workflowStatus = normalizeConsultationStatus(workflow?.status || patient?.status);
  const nurseVitals = workflow?.nurse_vitals && typeof workflow.nurse_vitals === 'object' ? workflow.nurse_vitals : {};
  const hasNurseHandoff = Object.values(nurseVitals).some((value) => String(value ?? '').trim() !== '') || Boolean(workflow?.nurse_notes || workflow?.identity_verified_at);

  const isPriority = priority.level === "HIGH";

  const nurseHandoffCard = hasNurseHandoff ? (
    <section className="kiosk-card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <div><div style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)", fontWeight: 800 }}>Nurse handoff</div><h2 style={{ margin: ".2rem 0 0", fontSize: "1.12rem" }}>Preparation and vitals</h2></div>
        <span className="badge badge-normal">{STATUS_LABELS[workflowStatus] || workflowStatus}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: ".7rem", marginTop: "1rem" }}>
        {[["Temp", nurseVitals.temperature, "°C"],["Pulse", nurseVitals.pulse, "bpm"],["Resp", nurseVitals.respiratoryRate, "/min"],["BP", nurseVitals.systolic && nurseVitals.diastolic ? `${nurseVitals.systolic}/${nurseVitals.diastolic}` : "", "mmHg"],["SpO₂", nurseVitals.spo2, "%"]].filter(([,value]) => String(value ?? '').trim() !== '').map(([label,value,unit]) => <div key={label} style={{ background: "var(--bg-subtle)", borderRadius: 10, padding: ".75rem" }}><div style={{ fontSize: ".58rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>{label}</div><strong style={{ fontSize: ".82rem", color: "var(--text-main)" }}>{value}{unit ? ` ${unit}` : ""}</strong></div>)}
      </div>
      {workflow?.nurse_notes && <p style={{ margin: "1rem 0 0", fontSize: ".72rem", color: "var(--text-muted)" }}><strong>Nurse note:</strong> {workflow.nurse_notes}</p>}
    </section>
  ) : null;

  const langDisplay =
    patient?.language === "hi"
      ? "Hindi"
      : patient?.language === "te"
        ? "Telugu"
        : "English";

  const handleConfirmHistory = () => {
    setConfirmed((previous) => !previous);
  };

  const handleEditToggle = () => {
    setEditChiefComplaint(
      patient?.chiefComplaint || currentHistory?.chief_complaint || "",
    );

    setEditNotes(patient?.hpi || patient?.summary?.hpi || "Not reported");

    setIsEditing((previous) => !previous);
  };

  const handleSaveEdit = async () => {
    const nextChief = editChiefComplaint.trim();
    const nextHpi = editNotes.trim();

    setPatient((previous) => ({
      ...previous,
      chiefComplaint: nextChief || previous.chiefComplaint,
      hpi: nextHpi,
      summary: {
        ...(previous.summary || {}),
        chiefComplaint: nextChief || previous.chiefComplaint,
        hpi: nextHpi,
      },
    }));

    if (currentHistory?.id && supabase) {
      try {
        const { error } = await supabase
          .from("medical_history")
          .update({
            chief_complaint: nextChief || currentHistory.chief_complaint,
          })
          .eq("id", currentHistory.id);

        if (error) {
          console.error("Doctor edit save failed:", error?.message || error);
        } else {
          setHistoryRows((previous) =>
            previous.map((row) =>
              row.id === currentHistory.id
                ? {
                    ...row,
                    chief_complaint: nextChief || row.chief_complaint,
                  }
                : row,
            ),
          );
        }
      } catch (saveError) {
        console.error(
          "Doctor edit save failed:",
          saveError?.message || saveError,
        );
      }
    }

    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="doctor-layout">
        <Sidebar />

        <main className="doctor-main">
          <div
            className="table-container"
            style={{
              padding: "2rem",
              textAlign: "center",
            }}
          >
            Loading patient case...
          </div>
        </main>
      </div>
    );
  }

  if (loadError || !patient) {
    return (
      <div className="doctor-layout">
        <Sidebar />

        <main className="doctor-main">
          <div
            className="table-container"
            style={{
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <h2>Patient Case</h2>

            <p style={{ color: "var(--danger)" }}>
              {loadError || "Patient record not found."}
            </p>

            <button
              type="button"
              className="btn-touch-primary"
              onClick={() => navigate("/doctor")}
            >
              Back to Queue
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="doctor-layout">
      <Sidebar />

      <main className="doctor-main">
        {nurseHandoffCard}

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <button
              type="button"
              className="btn-touch-secondary"
              style={{
                padding: "0.6rem 1rem",
                fontSize: "0.9rem",
              }}
              onClick={() => navigate("/doctor")}
            >
              <IconArrowLeft size={20} />
              <span>Back to Queue</span>
            </button>

            <div>
              <h1
                style={{
                  fontSize: "1.8rem",
                  color: "var(--text-main)",
                  margin: 0,
                }}
              >
                Patient Case Review
              </h1>

              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                  margin: 0,
                }}
              >
                {patient.name} | {patient.age} yrs | {patient.gender} |{" "}
                {patient.department} OPD | Lang: {langDisplay}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              className="btn-touch-secondary"
              style={{
                fontSize: "0.9rem",
                padding: "0.6rem 1.25rem",
              }}
              onClick={handleEditToggle}
            >
              {isEditing ? "Cancel Edit" : "Edit Summary"}
            </button>

            <button
              type="button"
              className="btn-touch-primary"
              style={{
                fontSize: "0.9rem",
                padding: "0.6rem 1.25rem",
                background: confirmed ? "var(--success)" : "var(--primary)",
              }}
              onClick={handleConfirmHistory}
            >
              <IconCheckCircle size={20} />

              <span>
                {confirmed ? "History Confirmed ✓" : "Confirm History"}
              </span>
            </button>
          </div>
        </div>

        <ClinicalIntelligencePanel
          completeness={completeness}
          quality={quality}
          priority={priority}
          documents={documents}
          timeline={timeline}
          previousHistory={previousHistory}
          currentHistory={currentHistory}
          workflowStatus={workflowStatus}
        />

        <FiveSecondDoctorBrief
          patient={patient}
          currentHistory={currentHistory}
          previousHistory={previousHistory}
          completeness={completeness}
          priority={priority}
          onViewTimeline={() => document.getElementById("doctor-medical-timeline")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          title="Doctor Attention Brief"
        />

        {/* Priority Alert */}
        {isPriority && (
          <div className="emergency-alert-banner">
            <IconAlertTriangle size={36} color="var(--danger)" />

            <div>
              <h3
                style={{
                  fontSize: "1.3rem",
                  color: "var(--danger)",
                  fontWeight: 800,
                  marginBottom: "0.25rem",
                }}
              >
                🚨 PRIORITY ALERT
              </h3>

              <p
                style={{
                  fontSize: "1.05rem",
                  color: "var(--text-main)",
                  fontWeight: 600,
                }}
              >
                Potential high-risk symptoms detected. Immediate physician
                evaluation recommended.
              </p>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <div
            style={{
              background: "white",
              border: "2px solid var(--primary)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-md)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginTop: "1.5rem",
            }}
          >
            <h3
              style={{
                fontSize: "1.2rem",
                color: "var(--primary-dark)",
                margin: 0,
              }}
            >
              Edit Clinical Summary
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <label
                style={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                Chief Complaint
              </label>

              <input
                type="text"
                value={editChiefComplaint}
                onChange={(e) => setEditChiefComplaint(e.target.value)}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)",
                  fontSize: "1rem",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <label
                style={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                History of Present Illness
              </label>

              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                className="btn-touch-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-touch-primary"
                onClick={handleSaveEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "1.75rem",
            marginTop: "1.5rem",
          }}
        >
          {/* LEFT SIDE */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            {/* Clinical Summary */}
            <div className="table-container" style={{ padding: "2rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "var(--primary-dark)",
                  marginBottom: "1.25rem",
                }}
              >
                <IconFileText size={24} />

                <h3
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 800,
                  }}
                >
                  Structured Clinical Summary
                </h3>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                <div
                  style={{
                    background: "var(--bg-subtle)",
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div className="summary-label">Chief Complaint</div>

                  <div className="summary-value">
                    {patient.chiefComplaint ||
                      currentHistory?.chief_complaint ||
                      "Not reported"}
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-subtle)",
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div className="summary-label">HPI</div>

                  <div className="summary-text">
                    {patient.hpi || patient.summary?.hpi || "Not reported"}
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-subtle)",
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div className="summary-label">Past Medical History</div>

                  <div className="summary-text">
                    {patient.pmh || patient.summary?.pmh || "Not reported"}
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-subtle)",
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div className="summary-label">Current Medications</div>

                  <div className="summary-text">
                    {patient.medications ||
                      patient.summary?.medications ||
                      "Not reported"}
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-subtle)",
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div className="summary-label">Allergies</div>

                  <div className="summary-text">
                    {patient.allergies ||
                      patient.summary?.allergies ||
                      "Not reported"}
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-subtle)",
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div className="summary-label">Investigations</div>

                  <div className="summary-text">
                    {patient.investigations ||
                      patient.summary?.investigations ||
                      "Not reported"}
                  </div>
                </div>
              </div>

              {/* HISTORY QUALITY */}
              <div
                style={{
                  marginTop: "1.5rem",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "1.15rem",
                        color: "var(--primary-dark)",
                      }}
                    >
                      History Quality
                    </h4>

                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.85rem",
                        marginTop: "0.2rem",
                      }}
                    >
                      {completeness.type} history
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      color:
                        quality.level === "GOOD"
                          ? "var(--success)"
                          : quality.level === "PARTIAL"
                            ? "var(--warning)"
                            : "var(--danger)",
                    }}
                  >
                    {quality.percentage}% — {quality.level}
                  </div>
                </div>

                {/* Progress */}
                <div
                  style={{
                    height: "10px",
                    background: "var(--bg-subtle)",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${completeness.percentage}%`,
                      height: "100%",
                      background:
                        quality.level === "GOOD"
                          ? "var(--success)"
                          : quality.level === "PARTIAL"
                            ? "var(--warning)"
                            : "var(--danger)",
                      borderRadius: "10px",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  {/* Captured */}
                  <div
                    style={{
                      background: "var(--bg-subtle)",
                      padding: "1rem",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        color: "var(--success)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      ✓ Captured
                    </div>

                    {completeness.available.length > 0 ? (
                      completeness.available.map((item) => (
                        <div
                          key={item}
                          style={{
                            fontSize: "0.9rem",
                            marginBottom: "0.3rem",
                          }}
                        >
                          ✓ {item}
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          color: "var(--text-muted)",
                        }}
                      >
                        No information captured.
                      </div>
                    )}
                  </div>

                  {/* Missing */}
                  <div
                    style={{
                      background: "var(--bg-subtle)",
                      padding: "1rem",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        color: "var(--danger)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      ⚠ Doctor still needs
                    </div>

                    {completeness.missing.length > 0 ? (
                      completeness.missing.map((item) => (
                        <div
                          key={item}
                          style={{
                            fontSize: "0.9rem",
                            marginBottom: "0.3rem",
                          }}
                        >
                          ⚠ {item}
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          color: "var(--success)",
                        }}
                      >
                        ✓ Required history captured.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* DOCTOR BRIEF */}
              <div
                style={{
                  marginTop: "1.5rem",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                  }}
                >
                  <IconFileText size={22} />

                  <h4
                    style={{
                      margin: 0,
                      fontSize: "1.15rem",
                      color: "var(--primary-dark)",
                    }}
                  >
                    2-Minute Doctor Brief
                  </h4>
                </div>

                <div
                  style={{
                    background: "var(--bg-subtle)",
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div
                    style={{
                      marginBottom: "0.75rem",
                    }}
                  >
                    <strong>Chief Complaint:</strong> {brief.chiefComplaint}
                  </div>

                  {brief.historySummary.length > 0 ? (
                    brief.historySummary.map((item, index) => (
                      <div
                        key={`${item.label}-${index}`}
                        style={{
                          display: "flex",
                          gap: "0.4rem",
                          marginBottom: "0.45rem",
                          fontSize: "0.9rem",
                        }}
                      >
                        <strong>{item.label}:</strong>

                        <span>{item.answer}</span>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        color: "var(--text-muted)",
                      }}
                    >
                      No additional structured history reported.
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: "0.75rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid var(--border-light)",
                    }}
                  >
                    <strong>Red Flags:</strong>{" "}
                    <span
                      style={{
                        color: brief.hasRedFlag
                          ? "var(--danger)"
                          : "var(--success)",
                        fontWeight: 700,
                      }}
                    >
                      {brief.hasRedFlag ? brief.redFlagReason : "None detected"}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: "0.75rem",
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                    }}
                  >
                    {brief.disclaimer}
                  </div>
                </div>
              </div>

              {/* MEDICAL DOCUMENTS */}
              <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-light)" }}>
                <h4 style={{ fontSize: "1.1rem", color: "var(--primary-dark)", marginBottom: "0.75rem" }}>Medical Documents</h4>
                <MedicalDocumentsSection documents={documents} loading={docsLoading} />
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Document-extracted information — requires doctor review. Not doctor-verified.</div>
              </div>

              {/* RED FLAGS */}
              <div
                style={{
                  marginTop: "1.5rem",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    fontWeight: 700,
                    marginBottom: "0.4rem",
                  }}
                >
                  Red Flags Evaluation
                </div>

                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: isPriority ? "var(--danger)" : "var(--success)",
                  }}
                >
                  {currentHistory?.red_flag
                    ? `⚠️ ${currentHistory.red_flag_reason || "Potential emergency symptoms reported"}`
                    : "None reported"}
                </div>
              </div>

              {/* ROS */}
              <div
                style={{
                  marginTop: "1.25rem",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <h4
                  style={{
                    fontSize: "1.1rem",
                    color: "var(--primary-dark)",
                    marginBottom: "0.75rem",
                  }}
                >
                  Review of Systems
                </h4>

                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    className={
                      isPriority ? "badge badge-priority" : "badge badge-normal"
                    }
                  >
                    🫀 Cardiovascular:{" "}
                    {isPriority ? "Chest Pressure (+)" : "Normal"}
                  </span>

                  <span
                    className={
                      isPriority ? "badge badge-priority" : "badge badge-normal"
                    }
                  >
                    🫁 Respiratory: {isPriority ? "Dyspnea (+)" : "Normal"}
                  </span>

                  <span className="badge badge-normal">
                    🧠 Neurological: Dizziness (-)
                  </span>

                  <span className="badge badge-normal">
                    🦴 Musculoskeletal: Joint Pain (-)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - TIMELINE */}
          <div id="doctor-medical-timeline" className="table-container" style={{ padding: "1.75rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--secondary-hover)",
                marginBottom: "1.25rem",
              }}
            >
              <IconClock size={24} />

              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                }}
              >
                Medical Timeline
              </h3>
            </div>

            <MedicalTimelineView events={timeline} />

            {/* Previous History */}
            {previousHistory && (
              <div
                style={{
                  marginTop: "2rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Previous Visit
                </div>

                <div
                  style={{
                    marginTop: "0.5rem",
                    fontWeight: 700,
                  }}
                >
                  {previousHistory.chief_complaint ||
                    "Previous history recorded"}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
