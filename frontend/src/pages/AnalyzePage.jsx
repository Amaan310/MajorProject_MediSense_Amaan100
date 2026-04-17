import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import { API, useAuth } from "../context/AuthContext";
import ResultsPanel from "../components/ResultsPanel";
import AIChat from "../components/AIChat";
import ClinicMap from "../components/ClinicMap";
import {
  Upload,
  FileText,
  ClipboardList,
  Loader2,
  Sparkles,
  X,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

const DISEASE_FORMS = {
  Diabetes: [
    {
      name: "Blood Glucose (Fasting)",
      placeholder: "70-99 mg/dL",
      unit: "mg/dL",
    },
    { name: "HbA1c", placeholder: "5.7-6.4%", unit: "%" },
    {
      name: "Blood Glucose (Post-meal)",
      placeholder: "e.g. 140 mg/dL",
      unit: "mg/dL",
    },
    { name: "Age", placeholder: "e.g. 45", unit: "years" },
    { name: "BMI", placeholder: "e.g. 27.5", unit: "kg/m²" },
    { name: "Blood Pressure", placeholder: "e.g. 120/80", unit: "mmHg" },
    { name: "Family History of Diabetes", placeholder: "Yes/No", unit: "" },
    {
      name: "Physical Activity Level",
      placeholder: "Sedentary/Moderate/Active",
      unit: "",
    },
  ],
  "Heart Disease": [
    { name: "Total Cholesterol", placeholder: "e.g. 240 mg/dL", unit: "mg/dL" },
    { name: "LDL Cholesterol", placeholder: "e.g. 160 mg/dL", unit: "mg/dL" },
    { name: "HDL Cholesterol", placeholder: "e.g. 35 mg/dL", unit: "mg/dL" },
    { name: "Triglycerides", placeholder: "e.g. 200 mg/dL", unit: "mg/dL" },
    { name: "Blood Pressure", placeholder: "e.g. 145/90", unit: "mmHg" },
    { name: "Resting Heart Rate", placeholder: "e.g. 85", unit: "bpm" },
    { name: "Age", placeholder: "e.g. 55", unit: "years" },
    { name: "Smoking Status", placeholder: "Never/Former/Current", unit: "" },
    { name: "Chest Pain Type", placeholder: "Typical/Atypical/None", unit: "" },
  ],
  "Liver Disease": [
    { name: "Total Bilirubin", placeholder: "e.g. 2.5 mg/dL", unit: "mg/dL" },
    { name: "Direct Bilirubin", placeholder: "e.g. 1.2 mg/dL", unit: "mg/dL" },
    { name: "ALT (SGPT)", placeholder: "e.g. 65 IU/L", unit: "IU/L" },
    { name: "AST (SGOT)", placeholder: "e.g. 70 IU/L", unit: "IU/L" },
    {
      name: "Alkaline Phosphatase",
      placeholder: "e.g. 280 IU/L",
      unit: "IU/L",
    },
    { name: "Total Proteins", placeholder: "e.g. 6.2 g/dL", unit: "g/dL" },
    { name: "Albumin", placeholder: "e.g. 3.0 g/dL", unit: "g/dL" },
    {
      name: "Alcohol Consumption",
      placeholder: "None/Occasional/Regular",
      unit: "",
    },
  ],
  "Kidney Disease": [
    { name: "Serum Creatinine", placeholder: "e.g. 2.5 mg/dL", unit: "mg/dL" },
    {
      name: "Blood Urea Nitrogen (BUN)",
      placeholder: "e.g. 45 mg/dL",
      unit: "mg/dL",
    },
    { name: "eGFR", placeholder: "e.g. 35 mL/min", unit: "mL/min" },
    { name: "Urine Protein", placeholder: "e.g. 2+ or 300 mg/dL", unit: "" },
    { name: "Sodium", placeholder: "e.g. 135 mEq/L", unit: "mEq/L" },
    { name: "Potassium", placeholder: "e.g. 5.5 mEq/L", unit: "mEq/L" },
    { name: "Hemoglobin", placeholder: "e.g. 10 g/dL", unit: "g/dL" },
    { name: "Blood Pressure", placeholder: "e.g. 150/90", unit: "mmHg" },
  ],
  "Parkinson's Disease": [
    { name: "Tremor Present", placeholder: "Yes/No", unit: "" },
    {
      name: "Muscle Rigidity",
      placeholder: "None/Mild/Moderate/Severe",
      unit: "",
    },
    {
      name: "Movement Slowness (Bradykinesia)",
      placeholder: "Yes/No",
      unit: "",
    },
    { name: "Postural Instability", placeholder: "Yes/No", unit: "" },
    { name: "Speech Changes", placeholder: "Yes/No", unit: "" },
    { name: "Age", placeholder: "e.g. 65", unit: "years" },
    { name: "Family History", placeholder: "Yes/No", unit: "" },
  ],
  Hypertension: [
    { name: "Systolic BP", placeholder: "e.g. 160 mmHg", unit: "mmHg" },
    { name: "Diastolic BP", placeholder: "e.g. 100 mmHg", unit: "mmHg" },
    { name: "Pulse Rate", placeholder: "e.g. 88 bpm", unit: "bpm" },
    { name: "Age", placeholder: "e.g. 50", unit: "years" },
    { name: "BMI", placeholder: "e.g. 29", unit: "kg/m²" },
    { name: "Smoking", placeholder: "Yes/No", unit: "" },
    { name: "Salt Intake", placeholder: "Low/Normal/High", unit: "" },
  ],
  "Thyroid Disease": [
    { name: "TSH", placeholder: "e.g. 8.5 mIU/L", unit: "mIU/L" },
    { name: "T3", placeholder: "e.g. 0.8 ng/dL", unit: "ng/dL" },
    { name: "T4 (Free T4)", placeholder: "e.g. 0.6 ng/dL", unit: "ng/dL" },
    {
      name: "Symptoms",
      placeholder: "Fatigue/Weight gain/Hair loss/etc.",
      unit: "",
    },
    { name: "Age", placeholder: "e.g. 35", unit: "years" },
    { name: "Gender", placeholder: "Male/Female", unit: "" },
  ],
  Anemia: [
    { name: "Hemoglobin", placeholder: "e.g. 9.5 g/dL", unit: "g/dL" },
    { name: "Hematocrit (PCV)", placeholder: "e.g. 28%", unit: "%" },
    {
      name: "RBC Count",
      placeholder: "e.g. 3.5 million/μL",
      unit: "million/μL",
    },
    { name: "MCV", placeholder: "e.g. 72 fL", unit: "fL" },
    { name: "MCH", placeholder: "e.g. 22 pg", unit: "pg" },
    { name: "Serum Iron", placeholder: "e.g. 40 μg/dL", unit: "μg/dL" },
    { name: "Ferritin", placeholder: "e.g. 8 ng/mL", unit: "ng/mL" },
    {
      name: "Symptoms",
      placeholder: "Fatigue/Pale skin/Shortness of breath",
      unit: "",
    },
  ],
};

const DISEASES = Object.keys(DISEASE_FORMS);

export default function AnalyzePage() {
  const { authHeader } = useAuth();
  const [mode, setMode] = useState("upload"); // "upload" | "form"
  const [selectedDisease, setSelectedDisease] = useState("Diabetes");
  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [showClinics, setShowClinics] = useState(false);
  const fileRef = useRef();
  const resultsRef = useRef();

  const handleFile = (f) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowed.includes(f.type) && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a JPG, PNG, WebP image or PDF file.");
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError("File too large. Max 15MB.");
      return;
    }
    setFile(f);
    setError("");
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const analyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setShowClinics(false);
    try {
      let res;
      if (mode === "upload") {
        if (!file) {
          setError("Please upload a file first.");
          setLoading(false);
          return;
        }
        const fd = new FormData();
        fd.append("file", file);
        res = await axios.post(`${API}/api/predict/report`, fd, {
          headers: { ...authHeader, "Content-Type": "multipart/form-data" },
        });
      } else {
        const filled = Object.entries(formData)
          .filter(([, v]) => v.trim())
          .reduce((a, [k, v]) => ({ ...a, [k]: v }), {});
        if (Object.keys(filled).length < 2) {
          setError("Please fill at least 2 fields.");
          setLoading(false);
          return;
        }
        res = await axios.post(
          `${API}/api/predict/form`,
          { disease: selectedDisease, symptoms: filled },
          { headers: authHeader },
        );
      }
      setResult(res.data);
      setTimeout(
        () =>
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        100,
      );
    } catch (e) {
      setError(
        e.response?.data?.detail || "Analysis failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Clash Display', sans-serif",
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: "-0.02em",
            margin: "0 0 8px",
          }}
        >
          AI Health Analysis
        </h1>
        <p style={{ color: "var(--text-2)", fontSize: 15, margin: 0 }}>
          Upload any lab report or enter your health parameters — MediSense AI does
          the rest.
        </p>
      </div>

      {/* Mode Toggle */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          background: "var(--bg3)",
          borderRadius: 12,
          padding: 4,
          width: "fit-content",
        }}
      >
        {[
          { key: "upload", label: "Upload Report", icon: Upload },
          { key: "form", label: "Enter Parameters", icon: ClipboardList },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setMode(key);
              setResult(null);
              setError("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              borderRadius: 9,
              fontSize: 14,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              background: mode === key ? "var(--surface)" : "transparent",
              color: mode === key ? "var(--text)" : "var(--text-2)",
              boxShadow: mode === key ? "var(--shadow)" : "none",
              transition: "all 0.15s",
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Upload Mode */}
      {mode === "upload" && (
        <div style={{ marginBottom: 24 }}>
          <div
            className={`upload-zone${dragging ? " dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current.click()}
            style={{ padding: "48px 24px", textAlign: "center" }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              style={{ display: "none" }}
              onChange={(e) =>
                e.target.files[0] && handleFile(e.target.files[0])
              }
            />
            {file ? (
              <div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: "var(--brand-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <FileText size={24} color="var(--brand)" />
                </div>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: "var(--text)",
                    margin: "0 0 4px",
                  }}
                >
                  {file.name}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-3)",
                    margin: "0 0 12px",
                  }}
                >
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  style={{
                    fontSize: 12,
                    color: "#ef4444",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    borderRadius: 20,
                    padding: "4px 12px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <X size={11} /> Remove
                </button>
              </div>
            ) : (
              <>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: "var(--bg3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Upload size={22} color="var(--text-3)" />
                </div>
                <p
                  style={{
                    fontWeight: 600,
                    color: "var(--text)",
                    margin: "0 0 6px",
                    fontSize: 15,
                  }}
                >
                  Drop your lab report here
                </p>
                <p
                  style={{
                    color: "var(--text-3)",
                    fontSize: 13,
                    margin: "0 0 16px",
                  }}
                >
                  Supports blood tests, CBC, lipid panel, thyroid, liver, kidney
                  reports
                </p>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-3)",
                    background: "var(--bg2)",
                    padding: "4px 12px",
                    borderRadius: 20,
                    border: "1px solid var(--border-strong)",
                  }}
                >
                  JPG • PNG • WebP • PDF — Max 15MB
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Form Mode */}
      {mode === "form" && (
        <div style={{ marginBottom: 24 }}>
          {/* Disease Selector */}
          <div style={{ marginBottom: 20 }}>
            <label className="label">Select Disease to Analyze</label>
            <div style={{ position: "relative" }}>
              <select
                className="input-field"
                value={selectedDisease}
                onChange={(e) => {
                  setSelectedDisease(e.target.value);
                  setFormData({});
                }}
              >
                {DISEASES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fields */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "20px",
            }}
          >
            <h3
              style={{
                fontWeight: 600,
                fontSize: 15,
                margin: "0 0 16px",
                color: "var(--text)",
              }}
            >
              {selectedDisease} Parameters
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              {DISEASE_FORMS[selectedDisease].map((field) => (
                <div key={field.name}>
                  <label className="label">
                    {field.name}{" "}
                    {field.unit && (
                      <span style={{ color: "var(--text-3)", fontWeight: 400 }}>
                        ({field.unit})
                      </span>
                    )}
                  </label>
                  <input
                    className="input-field"
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field.name]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-3)",
                marginTop: 14,
                marginBottom: 0,
              }}
            >
              💡 Fill as many fields as you can. MediSense AI will analyze
              everything you provide and explain each finding.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "12px 16px",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          <AlertCircle
            size={16}
            color="#ef4444"
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <p style={{ fontSize: 13.5, color: "#dc2626", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={analyze}
        disabled={loading}
        className="btn-primary"
        style={{
          width: "100%",
          justifyContent: "center",
          padding: "14px",
          fontSize: 15,
          borderRadius: 12,
        }}
      >
        {loading ? (
          <>
            <Loader2
              size={16}
              style={{ animation: "spin 1s linear infinite" }}
            />{" "}
            MediSense is analyzing your{" "}
            {mode === "upload" ? "report" : "parameters"}...
          </>
        ) : (
          <>
            <Sparkles size={16} /> Analyze with MediSense AI
          </>
        )}
      </button>

      {loading && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {[
              "Reading values...",
              "Detecting patterns...",
              "Generating diet plan...",
              "Finding specialist...",
            ].map((s, i) => (
              <span
                key={s}
                style={{
                  fontSize: 12,
                  color: "var(--text-3)",
                  background: "var(--bg2)",
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  animation: `fadeIn 0.4s ease ${i * 0.3}s both`,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div ref={resultsRef} style={{ marginTop: 32 }}>
          <ResultsPanel
            result={result}
            inputData={mode === "form" ? formData : { file: file?.name }}
            onFindClinics={() => setShowClinics(true)}
          />

          {/* AI Chat */}
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button
              className="btn-primary"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("medisense-open-chat", {
                    detail: {
                      predictionId: result.prediction_id,
                      diseaseContext: result.detected_disease,
                    },
                  }),
                );
              }}
              style={{ padding: "12px 24px", borderRadius: 12 }}
            >
              <Sparkles size={16} /> Discuss Results with MediSense AI
            </button>
          </div>

          {/* Clinic Map */}
          {showClinics && (
            <div
              style={{
                marginTop: 20,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "20px",
              }}
            >
              <ClinicMap
                searchTerms={
                  result.specialist?.search_terms || ["hospital", "clinic"]
                }
                specialist={result.specialist?.type}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
