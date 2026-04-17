import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "../context/AuthContext";
import {
  Loader2, Clock, FileText, ClipboardList,
  AlertTriangle, CheckCircle, Activity, ChevronDown, ChevronUp
} from "lucide-react";

const RISK_CONFIG = {
  High:   { bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.22)",   color: "#dc2626", label: "High Risk",   dot: "#ef4444" },
  Medium: { bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.22)",  color: "#d97706", label: "Medium Risk", dot: "#f59e0b" },
  Low:    { bg: "rgba(22,163,74,0.07)",   border: "rgba(22,163,74,0.22)",   color: "#16a34a", label: "Low Risk",    dot: "#22c55e" },
};

const DISEASE_EMOJI = {
  diabetes: "🩸", heart: "❤️", liver: "🫀", kidney: "🫘",
  parkinsons: "🧠", hypertension: "💉", thyroid: "🦋", anemia: "🩺",
};

function getEmoji(disease = "") {
  const key = disease.toLowerCase().split(" ")[0];
  return DISEASE_EMOJI[key] || "🏥";
}

function RiskBadge({ level }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.Low;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, color = "var(--brand)" }) {
  return (
    <div style={{
      flex: 1, minWidth: 100,
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "14px 16px", textAlign: "center"
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function HistoryPage() {
  const { user, authHeader } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    axios.get(`${API}/api/history`, { headers: authHeader })
      .then(r => setHistory(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
      <Loader2 size={28} color="var(--brand)" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );

  // ── Stats ────────────────────────────────────────────────────────────────
  const highCount   = history.filter(h => h.risk_level === "High").length;
  const medCount    = history.filter(h => h.risk_level === "Medium").length;
  const lowCount    = history.filter(h => h.risk_level === "Low").length;

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 24px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: "'Clash Display', sans-serif", fontWeight: 700,
          fontSize: 28, margin: "0 0 6px", letterSpacing: "-0.02em"
        }}>Analysis History</h1>
        <p style={{ color: "var(--text-2)", fontSize: 14, margin: 0 }}>
          {history.length} past {history.length === 1 ? "analysis" : "analyses"} saved
        </p>
      </div>

      {/* Stat strip */}
      {history.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard label="Total Analyses" value={history.length} color="var(--brand)" />
          <StatCard label="High Risk"       value={highCount}       color="#ef4444" />
          <StatCard label="Medium Risk"     value={medCount}        color="#f59e0b" />
          <StatCard label="Low Risk"        value={lowCount}        color="#16a34a" />
        </div>
      )}

      {/* Empty state */}
      {history.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "64px 24px",
          background: "var(--surface)", borderRadius: 16,
          border: "1px solid var(--border)"
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>No analyses yet</p>
          <p style={{ color: "var(--text-3)", fontSize: 14, marginBottom: 24 }}>
            Your results will appear here after your first analysis
          </p>
          <button onClick={() => navigate("/analyze")} className="btn-primary">
            Start Analysis
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {history.map(item => {
            const risk = RISK_CONFIG[item.risk_level] || RISK_CONFIG.Low;
            const isOpen = expanded === item.id;
            return (
              <div key={item.id} style={{
                background: "var(--surface)",
                border: `1px solid ${isOpen ? risk.border : "var(--border)"}`,
                borderRadius: 14, overflow: "hidden",
                transition: "border-color 0.2s ease",
              }}>
                {/* Card header — clickable */}
                <button
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 14,
                    padding: "16px 18px", background: "transparent", border: "none",
                    cursor: "pointer", color: "var(--text)", textAlign: "left"
                  }}
                >
                  {/* Emoji icon with risk-coloured backdrop */}
                  <div style={{
                    width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                    background: risk.bg,
                    border: `1px solid ${risk.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20
                  }}>
                    {getEmoji(item.disease)}
                  </div>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: "flex", flexWrap: "wrap",
                      alignItems: "center", gap: 7, marginBottom: 5
                    }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
                        {item.disease}
                      </span>
                      {item.risk_level && <RiskBadge level={item.risk_level} />}
                      <span style={{
                        fontSize: 11, padding: "3px 9px", borderRadius: 20,
                        background: "var(--bg3)", color: "var(--text-3)",
                        display: "inline-flex", alignItems: "center", gap: 4
                      }}>
                        {item.input_type === "report"
                          ? <><FileText size={10} /> Report</>
                          : <><ClipboardList size={10} /> Form</>}
                      </span>
                      {item.confidence && (
                        <span style={{
                          fontSize: 11, padding: "3px 9px", borderRadius: 20,
                          background: "var(--bg3)", color: "var(--text-3)"
                        }}>
                          {item.confidence} conf.
                        </span>
                      )}
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4,
                      fontSize: 12, color: "var(--text-3)"
                    }}>
                      <Clock size={11} />
                      {new Date(item.created_at).toLocaleString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                  </div>

                  {isOpen
                    ? <ChevronUp size={15} color="var(--text-3)" />
                    : <ChevronDown size={15} color="var(--text-3)" />}
                </button>

                {/* Expanded summary */}
                {isOpen && (
                  <div style={{
                    borderTop: `1px solid ${risk.border}`,
                    padding: "14px 18px",
                    background: risk.bg,
                    animation: "fadeUp 0.18s ease forwards"
                  }}>
                    {item.summary && (
                      <p style={{
                        fontSize: 13.5, color: "var(--text-2)",
                        lineHeight: 1.65, margin: "0 0 14px"
                      }}>
                        {item.summary}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() => navigate("/analyze")}
                        className="btn-primary"
                        style={{ fontSize: 12, padding: "7px 14px" }}
                      >
                        <Activity size={12} /> Run New Analysis
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
