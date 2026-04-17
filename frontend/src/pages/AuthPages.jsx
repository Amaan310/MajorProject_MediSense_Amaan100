import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react";

function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Activity size={24} color="white" />
          </div>
          <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 26, margin: "0 0 6px", letterSpacing: "-0.02em" }}>{title}</h1>
          <p style={{ color: "var(--text-2)", fontSize: 14, margin: 0 }}>{subtitle}</p>
        </div>
        <div className="card" style={{ padding: "28px" }}>{children}</div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-2)" }}>{footer}</div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); const [show, setShow] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try { await login(form.email, form.password); navigate("/analyze"); }
    catch (err) { setError(err.response?.data?.detail || "Login failed."); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your MediSense account"
      footer={<>Don't have an account? <Link to="/signup" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>Create one</Link></>}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div><label className="label">Email</label><input type="email" className="input-field" placeholder="you@example.com" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
        <div>
          <label className="label">Password</label>
          <div style={{ position: "relative" }}>
            <input type={show ? "text" : "password"} className="input-field" placeholder="••••••••" required style={{ paddingRight: 40 }} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        {error && <div style={{ fontSize: 13, color: "#dc2626", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
        <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: "center", padding: "12px", marginTop: 4 }}>
          {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Signing in...</> : "Sign In"}
        </button>
      </form>
    </AuthLayout>
  );
}

export function SignupPage() {
  const { signup } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [show, setShow] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try { await signup(form.name, form.email, form.password); navigate("/analyze"); }
    catch (err) { setError(err.response?.data?.detail || "Signup failed."); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Create account" subtitle="Join MediSense for free"
      footer={<>Already have an account? <Link to="/login" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link></>}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[{ f: "name", l: "Full Name", t: "text", p: "Rahul Sharma" }, { f: "email", l: "Email", t: "email", p: "you@example.com" }].map(({ f, l, t, p }) => (
          <div key={f}><label className="label">{l}</label><input type={t} className="input-field" placeholder={p} required value={form[f]} onChange={e => setForm(prev => ({ ...prev, [f]: e.target.value }))} /></div>
        ))}
        <div>
          <label className="label">Password</label>
          <div style={{ position: "relative" }}>
            <input type={show ? "text" : "password"} className="input-field" placeholder="Min 6 characters" required style={{ paddingRight: 40 }} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div><label className="label">Confirm Password</label><input type="password" className="input-field" placeholder="Re-enter password" required value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} /></div>
        {error && <div style={{ fontSize: 13, color: "#dc2626", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
        <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: "center", padding: "12px", marginTop: 4 }}>
          {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Creating account...</> : "Create Account"}
        </button>
      </form>
    </AuthLayout>
  );
}
