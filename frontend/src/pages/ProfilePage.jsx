import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "../context/AuthContext";
import { User, Save, Loader2, CheckCircle, Scale, Ruler, Calendar, Users } from "lucide-react";

function FieldGroup({ label, icon: Icon, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 12, fontWeight: 600, color: "var(--text-3)",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 7
      }}>
        <Icon size={12} /> {label}
      </label>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { user, authHeader, setUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]     = useState({ name: "", age: "", gender: "", weight_kg: "", height_cm: "" });
  const [loading, setLoading]   = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    setForm({
      name:      user.name      || "",
      age:       user.age       || "",
      gender:    user.gender    || "",
      weight_kg: user.weight_kg || "",
      height_cm: user.height_cm || "",
    });
  }, [user]);

  // ── Derived stats ────────────────────────────────────────────────────────
  const bmi = form.weight_kg && form.height_cm
    ? (parseFloat(form.weight_kg) / Math.pow(parseFloat(form.height_cm) / 100, 2)).toFixed(1)
    : null;

  const bmiLabel = bmi
    ? bmi < 18.5 ? { text: "Underweight", color: "#3b82f6" }
      : bmi < 25  ? { text: "Normal",      color: "#16a34a" }
      : bmi < 30  ? { text: "Overweight",  color: "#f59e0b" }
      : { text: "Obese",        color: "#ef4444" }
    : null;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setSaved(false);
    try {
      const payload = {};
      if (form.name)      payload.name      = form.name;
      if (form.age)       payload.age       = parseInt(form.age);
      if (form.gender)    payload.gender    = form.gender;
      if (form.weight_kg) payload.weight_kg = parseFloat(form.weight_kg);
      if (form.height_cm) payload.height_cm = parseFloat(form.height_cm);

      const res = await axios.put(`${API}/api/auth/profile`, payload, { headers: authHeader });
      if (setUser) setUser(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 24px 80px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "var(--brand)", display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: "white" }}>
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
        <div>
          <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 24, margin: "0 0 3px", letterSpacing: "-0.02em" }}>
            My Profile
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: 13, margin: 0 }}>{user?.email}</p>
        </div>
      </div>

      {/* BMI live preview */}
      {bmi && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "14px 18px", marginBottom: 22
        }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
              Your BMI
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: bmiLabel.color, lineHeight: 1 }}>{bmi}</div>
          </div>
          <div style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
            background: `${bmiLabel.color}15`, color: bmiLabel.color,
            border: `1px solid ${bmiLabel.color}30`
          }}>
            {bmiLabel.text}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="card" style={{ padding: 24 }}>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column" }}>

          <FieldGroup label="Full Name" icon={User}>
            <input
              type="text" className="input-field"
              placeholder="e.g. Rahul Sharma"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </FieldGroup>

          <FieldGroup label="Age" icon={Calendar}>
            <input
              type="number" className="input-field"
              placeholder="e.g. 28" min={1} max={120}
              value={form.age}
              onChange={e => setForm(p => ({ ...p, age: e.target.value }))}
            />
          </FieldGroup>

          <FieldGroup label="Gender" icon={Users}>
            <select
              className="input-field"
              value={form.gender}
              onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
              style={{ cursor: "pointer" }}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </FieldGroup>

          {/* Weight + Height side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 7 }}>
                <Scale size={12} /> Weight (kg)
              </label>
              <input
                type="number" className="input-field"
                placeholder="e.g. 70" min={1} max={300} step={0.1}
                value={form.weight_kg}
                onChange={e => setForm(p => ({ ...p, weight_kg: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 7 }}>
                <Ruler size={12} /> Height (cm)
              </label>
              <input
                type="number" className="input-field"
                placeholder="e.g. 170" min={50} max={250} step={0.1}
                value={form.height_cm}
                onChange={e => setForm(p => ({ ...p, height_cm: e.target.value }))}
              />
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: "#dc2626", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="btn-primary"
            style={{ justifyContent: "center", padding: "12px", marginTop: 4, display: "flex", alignItems: "center", gap: 7 }}
          >
            {loading
              ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving...</>
              : saved
                ? <><CheckCircle size={14} /> Saved!</>
                : <><Save size={14} /> Save Profile</>}
          </button>
        </form>
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-3)", marginTop: 16, lineHeight: 1.6 }}>
        Your profile data helps personalise your diet charts and health insights.
        It is never shared with third parties.
      </p>
    </div>
  );
}
