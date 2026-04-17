import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowRight, Upload, Brain, MapPin, FileText,
  Sparkles, Shield, Zap, Activity, ChevronDown,
  TrendingUp, CheckCircle, ScanLine, MessageSquare,
  ClipboardList, Stethoscope
} from "lucide-react";

/* ── Intersection Observer hook ── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── Animated counter ── */
function Counter({ target, suffix = "", duration = 1800 }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useInView(0.3);
  useEffect(() => {
    if (!visible) return;
    const num = parseFloat(target);
    const steps = 60;
    const inc = num / steps;
    let cur = 0;
    const id = setInterval(() => {
      cur += inc;
      if (cur >= num) { setCount(num); clearInterval(id); }
      else setCount(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(id);
  }, [visible, target, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

const stats = [
  { label: "Diseases Detected", value: "8", suffix: "+" },
  { label: "AI Accuracy", value: "95", suffix: "%" },
  { label: "Reports Analyzed", value: "10", suffix: "K+" },
  { label: "Response Time", value: "3", suffix: "s" },
];

const features = [
  {
    icon: Upload, title: "Upload Any Lab Report",
    desc: "Drop blood tests, CBC, lipid panels, thyroid reports. MediSense Vision reads and extracts every value automatically.",
    color: "#6366f1", gradient: "135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.03)",
    tag: "Vision AI",
  },
  {
    icon: Brain, title: "Explainable AI Diagnosis",
    desc: "Not just a result — get a plain-English explanation of exactly why a condition was flagged, with specific values cited.",
    color: "#16a34a", gradient: "135deg, rgba(22,163,74,0.12), rgba(22,163,74,0.03)",
    tag: "MediSense AI",
  },
  {
    icon: Sparkles, title: "Personalized Diet Chart",
    desc: "AI-generated 7-day meal plan tailored to your exact test values — morning to dinner, foods to eat and avoid.",
    color: "#f59e0b", gradient: "135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.03)",
    tag: "Personalized",
  },
  {
    icon: MapPin, title: "Nearest Clinic Finder",
    desc: "Real-time map of hospitals and specialists near you, with Google Maps directions and search in one click.",
    color: "#ef4444", gradient: "135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.03)",
    tag: "Live Map",
  },
  {
    icon: FileText, title: "AI Chat After Analysis",
    desc: "Ask anything about your results in natural language. Tables, exercise plans, explanations — MediSense AI handles it all.",
    color: "#3b82f6", gradient: "135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.03)",
    tag: "Chat AI",
  },
  {
    icon: Shield, title: "Full PDF Report",
    desc: "Download a professional PDF with all findings, diet chart, do's & don'ts, and specialist recommendation.",
    color: "#8b5cf6", gradient: "135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.03)",
    tag: "PDF Export",
  },
];

const diseases = [
  { name: "Diabetes", icon: "🩸", color: "#ef4444" },
  { name: "Heart Disease", icon: "❤️", color: "#f43f5e" },
  { name: "Liver Disease", icon: "🫀", color: "#f59e0b" },
  { name: "Kidney Disease", icon: "🫘", color: "#3b82f6" },
  { name: "Parkinson's", icon: "🧠", color: "#8b5cf6" },
  { name: "Hypertension", icon: "💊", color: "#06b6d4" },
  { name: "Thyroid", icon: "🦋", color: "#10b981" },
  { name: "Anemia", icon: "💉", color: "#6366f1" },
];

/* ── Parallax bubble ── */
function ParallaxBubble({ size, top, left, right, speed = 0.08, delay = "0s", color = "var(--brand)" }) {
  const ref = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const y = window.scrollY * speed;
      ref.current.style.transform = `translateY(${y}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);
  return (
    <div ref={ref} style={{
      position: "absolute",
      width: size, height: size,
      borderRadius: "50%",
      background: color,
      opacity: 0.055,
      top, left, right,
      animation: `float 9s ease-in-out ${delay} infinite`,
      pointerEvents: "none",
      willChange: "transform",
      transition: "transform 0.1s linear",
    }} />
  );
}

/* ── Feature card ── */
function FeatureCard({ feature, index }) {
  const [ref, visible] = useInView(0.1);
  const { icon: Icon, title, desc, color, gradient, tag } = feature;
  return (
    <div ref={ref} style={{
      background: `linear-gradient(${gradient})`,
      border: `1px solid ${color}20`,
      borderRadius: 20, padding: "28px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s, box-shadow 0.3s ease, border-color 0.3s ease`,
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = `0 20px 40px ${color}20`;
        e.currentTarget.style.borderColor = `${color}40`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = `${color}20`;
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}15`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={22} color={color} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: `${color}12`, color: color, border: `1px solid ${color}20`, letterSpacing: "0.04em" }}>{tag}</span>
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 8, lineHeight: 1.3 }}>{title}</h3>
      <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.65, margin: 0 }}>{desc}</p>
    </div>
  );
}

/* ── Flow step ── */
const FLOW_STEPS = [
  {
    icon: Upload, color: "#6366f1", label: "Step 1", title: "Upload or Fill In",
    desc: "Drop your lab report (JPG, PNG, PDF) or manually enter health parameters like glucose, cholesterol, or blood pressure.",
    detail: "Supports 8+ test types including CBC, lipid panel, thyroid, liver function, kidney function reports.",
  },
  {
    icon: ScanLine, color: "var(--brand)", label: "Step 2", title: "MediSense Scans & Reads",
    desc: "Our AI engine reads every value from your report — even handwritten ones — and maps them to known medical parameters.",
    detail: "Values are extracted, normalized, and cross-referenced against clinical reference ranges instantly.",
  },
  {
    icon: Brain, color: "#f59e0b", label: "Step 3", title: "AI Detects & Explains",
    desc: "MediSense AI analyzes patterns across all your values to detect conditions and explain exactly why — in plain English.",
    detail: "You get a risk level, confidence score, key indicators, and a full plain-language explanation of each finding.",
  },
  {
    icon: ClipboardList, color: "#3b82f6", label: "Step 4", title: "Personalized Plan Generated",
    desc: "A complete action plan is created: 7-day diet chart, do's & don'ts, lifestyle changes, and follow-up tests.",
    detail: "Every recommendation is tailored to your exact values — not generic advice.",
  },
  {
    icon: MapPin, color: "#ef4444", label: "Step 5", title: "Find the Right Specialist",
    desc: "MediSense finds hospitals and clinics near you, filtered by the exact specialist your condition requires.",
    detail: "One click for Google Maps directions or a full local search — no manual searching needed.",
  },
  {
    icon: MessageSquare, color: "#8b5cf6", label: "Step 6", title: "Ask Anything with AI Chat",
    desc: "After your analysis, ask MediSense AI any follow-up — diet tables, medication questions, exercise plans — it handles it all.",
    detail: "Rich responses with tables, lists, and highlighted values — like having a doctor on call.",
  },
];

function StepCard({ step, color }) {
  const [hovered, setHovered] = useState(false);
  const { label, title, desc, detail } = step;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `linear-gradient(135deg, ${color}10, ${color}04)` : "var(--surface)",
        border: `1px solid ${hovered ? color + "35" : "var(--border)"}`,
        borderRadius: 18, padding: "20px 22px", maxWidth: 340,
        boxShadow: hovered ? `0 12px 32px ${color}18` : "var(--shadow)",
        transition: "all 0.3s ease", cursor: "default",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <h3 style={{ fontWeight: 700, fontSize: 15.5, color: "var(--text)", marginBottom: 8, lineHeight: 1.3 }}>{title}</h3>
      <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.65, margin: "0 0 10px" }}>{desc}</p>
      <p style={{
        fontSize: 12, color: "var(--text-3)", lineHeight: 1.6, margin: 0,
        borderTop: `1px solid ${color}15`, paddingTop: 8,
        opacity: hovered ? 1 : 0.7, transition: "opacity 0.3s"
      }}>{detail}</p>
    </div>
  );
}

function FlowStep({ step, index, isLast }) {
  const [ref, visible] = useInView(0.15);
  const isEven = index % 2 === 0;
  const { icon: Icon, color } = step;
  return (
    <div ref={ref} style={{
      display: "grid", gridTemplateColumns: "1fr 60px 1fr",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.55s ease ${index * 0.1}s, transform 0.55s ease ${index * 0.1}s`,
    }}>
      <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: 28, paddingBottom: 40, alignItems: "flex-start" }}>
        {isEven ? <StepCard step={step} color={color} /> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: `${color}18`, border: `2.5px solid ${color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, zIndex: 1, boxShadow: `0 0 0 6px ${color}10`,
        }}>
          <Icon size={20} color={color} />
        </div>
        {!isLast && (
          <div style={{
            width: 2, flex: 1,
            background: `linear-gradient(to bottom, ${color}60, ${FLOW_STEPS[index + 1]?.color || color}30)`,
            minHeight: 48,
          }} />
        )}
      </div>
      <div style={{ paddingLeft: 28, paddingBottom: 40, alignItems: "flex-start" }}>
        {!isEven ? <StepCard step={step} color={color} /> : null}
      </div>
    </div>
  );
}

function MobileFlowStep({ step, index, isLast }) {
  const [ref, visible] = useInView(0.15);
  const { icon: Icon, color, label, title, desc } = step;
  return (
    <div ref={ref} style={{
      display: "flex", gap: 16,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(-20px)",
      transition: `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s`,
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${color}15`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={color} />
        </div>
        {!isLast && <div style={{ width: 2, flex: 1, minHeight: 24, background: `${color}30`, margin: "6px 0" }} />}
      </div>
      <div style={{ paddingBottom: 28, flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
        <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 5 }}>{title}</h3>
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function HomePage() {
  // ── FIX 1: Read auth state ──────────────────
  const { user } = useAuth();

  const [heroRef, heroVisible] = useInView(0.1);
  const [statsRef, statsVisible] = useInView(0.2);
  const [previewRef, previewVisible] = useInView(0.1);
  const [ctaRef, ctaVisible] = useInView(0.2);

  /* Typewriter */
  const words = ["Diabetes", "Heart Disease", "Thyroid Issues", "Liver Disease", "Anemia"];
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    const word = words[wordIdx];
    const speed = deleting ? 40 : 80;
    const timeout = setTimeout(() => {
      if (!deleting && charIdx < word.length) {
        setDisplayed(word.slice(0, charIdx + 1)); setCharIdx(c => c + 1);
      } else if (!deleting && charIdx === word.length) {
        setTimeout(() => setDeleting(true), 1400);
      } else if (deleting && charIdx > 0) {
        setDisplayed(word.slice(0, charIdx - 1)); setCharIdx(c => c - 1);
      } else {
        setDeleting(false); setWordIdx(i => (i + 1) % words.length);
      }
    }, speed);
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ─── HERO ── */}
      <section style={{ position: "relative", padding: "90px 24px 110px", textAlign: "center", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, var(--brand-glow), transparent 70%)"
        }} />
        <ParallaxBubble size={320} top="-100px" left="-100px" speed={0.28} delay="0s" />
        <ParallaxBubble size={220} top="20px" right="-60px" speed={0.42} delay="2s" />
        <ParallaxBubble size={160} top="200px" left="15%" speed={-0.22} delay="4s" color="#6366f1" />
        <ParallaxBubble size={100} top="300px" right="20%" speed={0.35} delay="1s" color="#f59e0b" />

        <div ref={heroRef} style={{
          maxWidth: 820, margin: "0 auto", position: "relative", zIndex: 1,
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.7s ease, transform 0.7s ease"
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--brand-light)", border: "1px solid rgba(22,163,74,0.25)",
            borderRadius: 40, padding: "6px 16px", marginBottom: 32
          }}>
            <Zap size={13} color="var(--brand)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--brand)" }}>Powered by MediSense AI</span>
          </div>

          <h1 style={{
            fontFamily: "'Clash Display', sans-serif", fontWeight: 700,
            fontSize: "clamp(40px, 6.5vw, 72px)", lineHeight: 1.04,
            letterSpacing: "-0.03em", color: "var(--text)", marginBottom: 20
          }}>
            Your Personal<br />
            <span style={{ color: "var(--brand)", textShadow: "0 0 40px var(--brand-glow)" }}>
              AI Health Analyst
            </span>
          </h1>

          <div style={{ marginBottom: 16, height: 36 }}>
            <span style={{ fontSize: 18, color: "var(--text-2)" }}>Detects </span>
            <span style={{
              fontSize: 18, fontWeight: 700, color: "var(--brand)",
              borderRight: "2px solid var(--brand)", paddingRight: 2,
              animation: "blink 1s infinite"
            }}>{displayed}</span>
          </div>

          <p style={{ fontSize: 17, color: "var(--text-2)", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Upload any lab report or enter your symptoms. Get AI-powered disease prediction, personalized diet plans, and nearby specialist finder — all in seconds.
          </p>

          {/* ── FIX 2: Auth-aware hero CTAs ── */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/analyze" className="btn-primary" style={{
              fontSize: 15, padding: "13px 32px", textDecoration: "none",
              borderRadius: 12, boxShadow: "0 8px 24px var(--brand-glow)"
            }}>
              Analyze Now <ArrowRight size={16} />
            </Link>

            {/* Only show when NOT logged in */}
            {!user && (
              <Link to="/signup" className="btn-ghost" style={{
                fontSize: 15, padding: "13px 28px", textDecoration: "none", borderRadius: 12
              }}>
                Create Free Account
              </Link>
            )}

            {/* Show history link when logged in */}
            {user && (
              <Link to="/history" className="btn-ghost" style={{
                fontSize: 15, padding: "13px 28px", textDecoration: "none", borderRadius: 12
              }}>
                View My History
              </Link>
            )}
          </div>

          <div style={{ marginTop: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.08em" }}>SCROLL TO EXPLORE</span>
            <div style={{ animation: "scrollBounce 1.8s ease infinite" }}>
              <ChevronDown size={18} color="var(--text-3)" />
            </div>
          </div>
        </div>
      </section>

      //

      {/* ─── DASHBOARD PREVIEW ── */}
      <section style={{ padding: "0 24px 90px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--brand)", textTransform: "uppercase" }}>Overview</span>
            <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "clamp(26px,4vw,38px)", margin: "10px 0 0", letterSpacing: "-0.02em" }}>See What You'll Get</h2>
          </div>

          <div ref={previewRef} style={{
            background: "var(--bg3)", borderRadius: 24, padding: 20,
            border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)",
            opacity: previewVisible ? 1 : 0,
            transform: previewVisible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.98)",
            transition: "opacity 0.7s ease, transform 0.7s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              {["#ef4444", "#f59e0b", "#22c55e"].map(c => (
                <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
              ))}
              <div style={{ flex: 1, background: "var(--bg2)", borderRadius: 8, height: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginLeft: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand)", opacity: 0.6 }} />
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>medisense.app/analyze</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 10 }}>
              {[
                { icon: "⚠️", label: "Risk Level", val: "Medium", color: "#f59e0b" },
                { icon: "🎯", label: "Confidence", val: "91%", color: "var(--brand)" },
                { icon: "🩸", label: "Condition", val: "Diabetes Type 2", color: "#6366f1" },
              ].map(item => (
                <div key={item.label} style={{ background: "var(--surface)", borderRadius: 14, padding: "14px 16px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 15, color: item.color }}>{item.val}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--surface)", borderRadius: 14, padding: 18, border: "1px solid var(--border)", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--brand-light)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Brain size={15} color="var(--brand)" />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>MediSense AI Explanation</div>
                  <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                    Your <strong style={{ color: "var(--text)" }}>fasting glucose of 148 mg/dL</strong> and <strong style={{ color: "var(--text)" }}>HbA1c of 7.2%</strong> are above the normal threshold. Combined with elevated BMI of 28.5, these indicators suggest Type 2 Diabetes requiring medical attention.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "var(--surface)", borderRadius: 14, padding: 16, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Today's Diet Plan</div>
                {["🌅 Morning: Methi water + almonds", "🍳 Breakfast: Oats + low-fat milk", "🥗 Lunch: Brown rice + dal + salad", "🌙 Dinner: Grilled fish + vegetables"].map(meal => (
                  <div key={meal} style={{ fontSize: 12, color: "var(--text-2)", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>{meal}</div>
                ))}
              </div>
              <div style={{ background: "var(--surface)", borderRadius: 14, padding: 16, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Specialist Needed</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Activity size={16} color="#6366f1" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>Endocrinologist</div>
                    <div style={{ fontSize: 11, color: "#f59e0b" }}>Within 1 week</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>3 clinics found within 5km of your location</div>
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)" }} />
                  <span style={{ fontSize: 11, color: "var(--brand)", fontWeight: 600 }}>Apollo Hospital — 1.2 km</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DISEASES MARQUEE ── */}
      <section style={{ padding: "0 0 80px", overflow: "hidden" }}>
        <div style={{ textAlign: "center", marginBottom: 32, padding: "0 24px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--brand)", textTransform: "uppercase" }}>Detection Coverage</span>
          <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "clamp(26px,4vw,38px)", margin: "10px 0 0", letterSpacing: "-0.02em" }}>8 Conditions Detected</h2>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to right, var(--bg), transparent)", zIndex: 2 }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to left, var(--bg), transparent)", zIndex: 2 }} />
          <div style={{ display: "flex", animation: "marquee 22s linear infinite", width: "max-content" }}>
            {[...diseases, ...diseases].map((d, i) => (
              <Link key={i} to="/analyze" style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 22px", margin: "0 6px", borderRadius: 40,
                background: "var(--surface)", border: "1px solid var(--border)",
                textDecoration: "none", color: "var(--text-2)", fontSize: 14,
                fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.2s", flexShrink: 0,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = d.color; e.currentTarget.style.color = d.color; e.currentTarget.style.background = `${d.color}10`; e.currentTarget.style.transform = "scale(1.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.transform = "scale(1)"; }}
              >
                <span style={{ fontSize: 18 }}>{d.icon}</span> {d.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ── */}
      <section style={{ padding: "0 24px 100px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--brand)", textTransform: "uppercase" }}>What's Included</span>
            <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "clamp(26px,4vw,38px)", margin: "10px 0 8px", letterSpacing: "-0.02em" }}>Everything in One Place</h2>
            <p style={{ color: "var(--text-2)", fontSize: 16 }}>Not just a prediction — a complete AI health companion</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px,1fr))", gap: 14 }}>
            {features.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ── */}
      <section style={{ padding: "0 24px 110px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 50% at 50% 50%, var(--brand-glow), transparent 70%)",
          opacity: 0.4,
        }} />
        <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--brand)", textTransform: "uppercase" }}>Simple Process</span>
            <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "clamp(26px,4vw,38px)", margin: "10px 0 10px", letterSpacing: "-0.02em" }}>How MediSense Works</h2>
            <p style={{ color: "var(--text-2)", fontSize: 15, maxWidth: 480, margin: "0 auto" }}>
              From raw lab report to full health plan — here's exactly what happens in seconds.
            </p>
          </div>
          {!isMobile ? (
            <div>
              {FLOW_STEPS.map((step, i) => (
                <FlowStep key={step.title} step={step} index={i} isLast={i === FLOW_STEPS.length - 1} />
              ))}
            </div>
          ) : (
            <div style={{ paddingLeft: 8 }}>
              {FLOW_STEPS.map((step, i) => (
                <MobileFlowStep key={step.title} step={step} index={i} isLast={i === FLOW_STEPS.length - 1} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── CTA ── */}
      <section style={{ padding: "0 24px 100px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div ref={ctaRef} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 28, padding: "56px 48px", textAlign: "center",
            boxShadow: "var(--shadow-lg)", position: "relative", overflow: "hidden",
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease, transform 0.7s ease"
          }}>
            <div style={{
              position: "absolute", width: 400, height: 400, borderRadius: "50%",
              background: "var(--brand-glow)", top: -150, left: "50%", transform: "translateX(-50%)",
              filter: "blur(60px)", pointerEvents: "none", zIndex: 0
            }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>🏥</div>

              {/* ── FIX 3: Auth-aware CTA heading ── */}
              <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 30, letterSpacing: "-0.02em", marginBottom: 12 }}>
                {user ? `Welcome back, ${user.name.split(" ")[0]}!` : "Start Your Free Analysis"}
              </h2>
              <p style={{ color: "var(--text-2)", marginBottom: 32, fontSize: 15, lineHeight: 1.6 }}>
                {user
                  ? "Your health data is saved. Analyze a new report or review your past predictions anytime."
                  : "No account needed. Upload a report or fill in your health parameters and get an AI-powered diagnosis instantly."
                }
              </p>

              {/* ── FIX 4: Auth-aware CTA checkmarks + buttons ── */}
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
                {(user
                  ? ["Full history saved", "AI chat included", "PDF download ready"]
                  : ["Free to use", "No account needed", "Instant results"]
                ).map(t => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)" }}>
                    <CheckCircle size={14} color="var(--brand)" /> {t}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link to="/analyze" className="btn-primary" style={{
                  fontSize: 15, padding: "14px 36px", textDecoration: "none",
                  borderRadius: 12, boxShadow: "0 8px 24px var(--brand-glow)"
                }}>
                  Analyze My Health <ArrowRight size={16} />
                </Link>
                {/* Only show signup button to guests */}
                {!user && (
                  <Link to="/signup" className="btn-ghost" style={{
                    fontSize: 15, padding: "14px 28px", textDecoration: "none", borderRadius: 12
                  }}>
                    Create Free Account
                  </Link>
                )}
                {/* Show history to logged-in users */}
                {user && (
                  <Link to="/history" className="btn-ghost" style={{
                    fontSize: 15, padding: "14px 28px", textDecoration: "none", borderRadius: 12
                  }}>
                    View History
                  </Link>
                )}
              </div>

              <p style={{ marginTop: 18, fontSize: 12, color: "var(--text-3)" }}>
                ⚠️ For educational purposes only. Not a substitute for professional medical advice.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}