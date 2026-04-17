import React, { useState, memo } from "react";
import {
  AlertTriangle, CheckCircle2, Download, MapPin, ChevronDown, ChevronUp,
  Utensils, Brain, Pill, AlertOctagon, TrendingUp, Star, Heart
} from "lucide-react";
import { generatePDFReport } from "../utils/pdfReport";

const RISK_CONFIG = {
  High:   { color: "#ef4444", bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.18)",  icon: AlertTriangle, label: "High Risk" },
  Medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.18)", icon: AlertTriangle, label: "Medium Risk" },
  Low:    { color: "#16a34a", bg: "rgba(22,163,74,0.06)",  border: "rgba(22,163,74,0.18)",  icon: CheckCircle2,  label: "Low Risk" },
};

// ── Collapsible section ───────────────────────────────────────────────────
const Section = memo(function Section({ title, icon: Icon, color = "var(--brand)", children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 14, overflow: "hidden", marginBottom: 10
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "13px 16px", background: "transparent", border: "none",
        cursor: "pointer", color: "var(--text)", textAlign: "left"
      }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5, color: "var(--text)" }}>{title}</span>
        {open
          ? <ChevronUp size={14} color="var(--text-3)" />
          : <ChevronDown size={14} color="var(--text-3)" />
        }
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--border)", animation: "fadeUp 0.2s ease forwards" }}>
          {children}
        </div>
      )}
    </div>
  );
});

// ── Tag pill ──────────────────────────────────────────────────────────────
function Tag({ children, color = "var(--brand)" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "4px 10px",
      borderRadius: 20, fontSize: 12, fontWeight: 500,
      background: `${color}12`, color,
      border: `1px solid ${color}22`, margin: "3px"
    }}>
      {children}
    </span>
  );
}

// ── List item ─────────────────────────────────────────────────────────────
function ListItem({ text, icon, color }) {
  return (
    <div style={{
      display: "flex", gap: 10, padding: "7px 0",
      borderBottom: "1px solid var(--border)", alignItems: "flex-start"
    }}>
      <span style={{ color, flexShrink: 0, marginTop: 1, fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55 }}>{text}</span>
    </div>
  );
}

// ── Confidence arc ────────────────────────────────────────────────────────
function ConfidenceArc({ value, color }) {
  const num = parseFloat(value) || 0;
  const r = 28, cx = 36, cy = 36;
  const circ = 2 * Math.PI * r;
  const dash = (num / 100) * circ;

  return (
    <div style={{ position: "relative", width: 72, height: 72 }}>
      <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg3)" strokeWidth="6" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 9, color: "var(--text-3)", lineHeight: 1, marginTop: 1 }}>conf.</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function ResultsPanel({ result, inputData, onFindClinics }) {
  if (!result) return null;

  const risk = RISK_CONFIG[result.risk_level] || RISK_CONFIG.Low;
  const RiskIcon = risk.icon;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, animation: "fadeUp 0.4s ease forwards" }}>

      {/* ── Main result card ── */}
      <div style={{
        background: risk.bg, border: `1.5px solid ${risk.border}`,
        borderRadius: 16, padding: "20px", marginBottom: 12
      }}>
        {/* Top row: icon + disease + confidence arc */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: `${risk.color}18`, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <RiskIcon size={22} color={risk.color} />
          </div>

          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 7, alignItems: "center" }}>
              <h3 style={{
                fontFamily: "'Clash Display', sans-serif", fontSize: "clamp(16px, 4vw, 20px)",
                fontWeight: 700, color: "var(--text)", margin: 0
              }}>
                {result.detected_disease}
              </h3>
              <span className="badge" style={{ background: `${risk.color}18`, color: risk.color, fontSize: 11 }}>
                {risk.label}
              </span>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
              {result.summary}
            </p>
          </div>

          {/* Confidence arc — hide on very small screens */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <ConfidenceArc value={result.confidence} color={risk.color} />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button onClick={onFindClinics} className="btn-primary"
            style={{ flex: "1 1 140px", justifyContent: "center", fontSize: 13 }}>
            <MapPin size={13} /> Find Nearby Clinics
          </button>
          <button onClick={() => generatePDFReport(result, inputData)} className="btn-ghost"
            style={{ flex: "1 1 140px", justifyContent: "center", fontSize: 13 }}>
            <Download size={13} /> Download PDF
          </button>
        </div>
      </div>

      {/* ── Extracted lab values ── */}
      {result.extracted_values && Object.keys(result.extracted_values).length > 0 && (
        <Section title="Extracted Lab Values" icon={TrendingUp} color="#6366f1" defaultOpen>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, paddingTop: 12 }}>
            {Object.entries(result.extracted_values).map(([k, v]) => (
              <div key={k} style={{ background: "var(--bg2)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 3, lineHeight: 1.3 }}>{k}</div>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{v}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Abnormal values ── */}
      {result.abnormal_values?.length > 0 && (
        <Section title={`${result.abnormal_values.length} Abnormal Values Found`} icon={AlertTriangle} color="#ef4444" defaultOpen>
          <div style={{ paddingTop: 12 }}>
            {result.abnormal_values.map((item, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "9px 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 8
              }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{item.parameter}</span>
                  <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: 8 }}>Normal: {item.normal_range}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                  <span style={{
                    fontWeight: 700, fontSize: 14, fontFamily: "'Clash Display', sans-serif",
                    color: item.status === "High" ? "#ef4444" : item.status === "Low" ? "#3b82f6" : "var(--brand)"
                  }}>{item.value}</span>
                  <span className="badge" style={{
                    background: item.status === "High" ? "rgba(239,68,68,0.1)" : item.status === "Low" ? "rgba(59,130,246,0.1)" : "var(--brand-light)",
                    color: item.status === "High" ? "#ef4444" : item.status === "Low" ? "#3b82f6" : "var(--brand)", fontSize: 11
                  }}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── AI explanation ── */}
      {result.explanation && (
        <Section title="Why This Was Detected — AI Explanation" icon={Brain} color="#6366f1" defaultOpen>
          <div style={{ paddingTop: 12 }}>
            <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10, padding: "13px", marginBottom: 12 }}>
              <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.65, margin: 0 }}>{result.explanation.why_detected}</p>
            </div>
            {result.explanation.key_indicators?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 7 }}>Key Indicators</div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {result.explanation.key_indicators.map((ind, i) => <Tag key={i} color="#6366f1">{ind}</Tag>)}
                </div>
              </div>
            )}
            {result.explanation.what_it_means && (
              <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, fontStyle: "italic", borderLeft: "3px solid #6366f1", paddingLeft: 12, margin: 0 }}>
                {result.explanation.what_it_means}
              </p>
            )}
          </div>
        </Section>
      )}

      {/* ── Do's & Don'ts — responsive stack on mobile ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 10, marginBottom: 10
      }}>
        {result.dos?.length > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <CheckCircle2 size={14} color="var(--brand)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--brand)" }}>Do's</span>
            </div>
            {result.dos.map((d, i) => <ListItem key={i} text={d} icon="✓" color="var(--brand)" />)}
          </div>
        )}
        {result.donts?.length > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <AlertTriangle size={14} color="#ef4444" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>Don'ts</span>
            </div>
            {result.donts.map((d, i) => <ListItem key={i} text={d} icon="✗" color="#ef4444" />)}
          </div>
        )}
      </div>

      {/* ── Diet chart ── */}
      {result.diet_chart && (
        <Section title="Personalised Diet Chart" icon={Utensils} color="#f59e0b">
          <div style={{ paddingTop: 12 }}>
            {["morning", "breakfast", "mid_morning", "lunch", "evening", "dinner"].map(meal => {
              const items = result.diet_chart[meal];
              if (!items?.length) return null;
              return (
                <div key={meal} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ width: 88, fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "capitalize", flexShrink: 0, paddingTop: 4 }}>
                    {meal.replace("_", " ")}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", flex: 1 }}>
                    {items.map((item, i) => <Tag key={i} color="#f59e0b">{item}</Tag>)}
                  </div>
                </div>
              );
            })}
            {result.diet_chart.avoid?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>❌ Avoid</div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {result.diet_chart.avoid.map((item, i) => <Tag key={i} color="#ef4444">{item}</Tag>)}
                </div>
              </div>
            )}
            {result.diet_chart.notes && (
              <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(245,158,11,0.06)", borderRadius: 8, fontSize: 13, color: "var(--text-2)", fontStyle: "italic" }}>
                💡 {result.diet_chart.notes}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Specialist ── */}
      {result.specialist && (
        <Section title="Specialist Recommendation" icon={Pill} color="#3b82f6">
          <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
              <div style={{ background: "var(--bg2)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>Specialist</div>
                <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 13.5 }}>{result.specialist.type}</div>
              </div>
              <div style={{ background: "var(--bg2)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>Urgency</div>
                <div style={{
                  fontWeight: 700, fontSize: 13.5,
                  color: result.specialist.urgency?.includes("Immediate") ? "#ef4444" : "#f59e0b"
                }}>{result.specialist.urgency}</div>
              </div>
            </div>
            {result.specialist.reason && (
              <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{result.specialist.reason}</p>
            )}
          </div>
        </Section>
      )}

      {/* ── Emergency signs ── */}
      {result.emergency_signs?.length > 0 && (
        <Section title="Emergency Warning Signs — Seek Immediate Care" icon={AlertOctagon} color="#ef4444">
          <div style={{ paddingTop: 12 }}>
            {result.emergency_signs.map((s, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, padding: "8px 10px",
                background: "rgba(239,68,68,0.05)", borderRadius: 8, marginBottom: 6,
                border: "1px solid rgba(239,68,68,0.1)"
              }}>
                <AlertOctagon size={13} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13.5, color: "var(--text-2)" }}>{s}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Positive findings ── */}
      {result.positive_findings?.length > 0 && (
        <Section title="What Looks Good 👍" icon={Star} color="var(--brand)">
          <div style={{ paddingTop: 12 }}>
            {result.positive_findings.map((p, i) => <ListItem key={i} text={p} icon="✓" color="var(--brand)" />)}
          </div>
        </Section>
      )}

      {/* ── Follow-up tests ── */}
      {result.follow_up_tests?.length > 0 && (
        <Section title="Recommended Follow-up Tests" icon={TrendingUp} color="#8b5cf6">
          <div style={{ paddingTop: 12, display: "flex", flexWrap: "wrap" }}>
            {result.follow_up_tests.map((t, i) => <Tag key={i} color="#8b5cf6">{t}</Tag>)}
          </div>
        </Section>
      )}

      {/* ── Lifestyle changes ── */}
      {result.lifestyle_changes?.length > 0 && (
        <Section title="Lifestyle Changes" icon={Heart} color="#ec4899">
          <div style={{ paddingTop: 12 }}>
            {result.lifestyle_changes.map((l, i) => <ListItem key={i} text={l} icon="→" color="#ec4899" />)}
          </div>
        </Section>
      )}

      {/* ── Disclaimer ── */}
      <div style={{
        background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)",
        borderRadius: 10, padding: "12px 14px", marginTop: 4
      }}>
        <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0, lineHeight: 1.65 }}>
          ⚠️ <strong style={{ color: "var(--text-2)" }}>Medical Disclaimer:</strong> This AI analysis is for informational and educational purposes only. It is not a substitute for professional medical diagnosis, advice, or treatment. Always consult a qualified healthcare provider before making any medical decisions.
        </p>
      </div>
    </div>
  );
}
