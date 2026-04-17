import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Activity, Moon, Sun, Menu, X, LogOut, History, Stethoscope, Home } from "lucide-react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/analyze", label: "Analyze", icon: Stethoscope },
    ...(user ? [{ to: "/history", label: "History", icon: History }] : []),
  ];

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: scrolled
        ? (dark ? "rgba(10,10,15,0.85)" : "rgba(255,255,255,0.85)")
        : "transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
      transition: "all 0.3s ease"
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 24px",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr auto" : "1fr auto 1fr",
        alignItems: "center",
        height: 64
      }}>

        {/* ── LEFT: Logo ─────────────────────────────────────────────── */}
        <Link to="/" style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          justifyContent: "flex-start"
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <Activity size={18} color="white" />
          </div>
          <span style={{
            fontFamily: "'Clash Display', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--text)",
            letterSpacing: "-0.03em",
            whiteSpace: "nowrap"
          }}>
            MediSense<span style={{ color: "var(--brand)" }}>.</span>
          </span>
        </Link>

        {/* ── CENTER: Nav Pills — desktop only ───────────────────────── */}
        {!isMobile && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "var(--bg3)",
            borderRadius: 12,
            padding: "4px"
          }}>
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={{
                  padding: "7px 18px",
                  borderRadius: 9,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  background: pathname === to ? "var(--surface)" : "transparent",
                  color: pathname === to ? "var(--text)" : "var(--text-2)",
                  boxShadow: pathname === to ? "var(--shadow)" : "none",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap"
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* ── RIGHT: Actions ─────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "flex-end"
        }}>

          {/* Theme Toggle */}
          <button
            onClick={toggle}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              border: "1px solid var(--border-strong)",
              background: "var(--bg2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-2)",
              transition: "all 0.2s ease",
              flexShrink: 0
            }}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Desktop auth — only rendered when NOT mobile */}
          {!isMobile && (
            user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 12px 5px 6px",
                  borderRadius: 10,
                  background: "var(--bg2)",
                  border: "1px solid var(--border)"
                }}>
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "var(--brand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "white",
                    flexShrink: 0
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", whiteSpace: "nowrap" }}>
                    {user.name.split(" ")[0]}
                  </span>
                </div>
                <button
                  onClick={() => { logout(); navigate("/"); }}
                  className="btn-ghost"
                  style={{ padding: "6px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
                >
                  <LogOut size={13} /> Logout
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <Link to="/login" className="btn-ghost" style={{ padding: "8px 16px", textDecoration: "none", whiteSpace: "nowrap" }}>
                  Login
                </Link>
                <Link to="/signup" className="btn-primary" style={{ padding: "8px 16px", textDecoration: "none", whiteSpace: "nowrap" }}>
                  Get Started
                </Link>
              </div>
            )
          )}

          {/* Mobile hamburger — conditionally rendered, never shown on desktop */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                border: "1px solid var(--border-strong)",
                background: "var(--bg2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-2)",
                flexShrink: 0
              }}
            >
              {menuOpen ? <X size={15} /> : <Menu size={15} />}
            </button>
          )}

        </div>
      </div>

      {/* ── Mobile Dropdown ─────────────────────────────────────────────── */}
      {isMobile && menuOpen && (
        <div style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          padding: "12px 24px 16px"
        }}>
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 0",
                borderBottom: "1px solid var(--border)",
                textDecoration: "none",
                color: pathname === to ? "var(--brand)" : "var(--text-2)",
                fontWeight: 500,
                fontSize: 14
              }}
            >
              <Icon size={15} /> {label}
            </Link>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {user ? (
              <button
                onClick={() => { logout(); navigate("/"); setMenuOpen(false); }}
                className="btn-ghost"
                style={{ flex: 1, justifyContent: "center", display: "flex", alignItems: "center", gap: 6 }}
              >
                <LogOut size={13} /> Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="btn-ghost"
                  style={{ flex: 1, justifyContent: "center", textDecoration: "none", display: "flex", alignItems: "center" }}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: "center", textDecoration: "none", display: "flex", alignItems: "center" }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}