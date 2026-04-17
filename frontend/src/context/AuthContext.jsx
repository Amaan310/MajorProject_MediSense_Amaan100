import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("ms_token_v2"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => setUser(r.data))
        .catch(() => { localStorage.removeItem("ms_token_v2"); setToken(null); })
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const r = await axios.post(`${API}/api/auth/login`, { email, password });
    localStorage.setItem("ms_token_v2", r.data.token);
    setToken(r.data.token); setUser(r.data.user); return r.data;
  };
  const signup = async (name, email, password) => {
    const r = await axios.post(`${API}/api/auth/signup`, { name, email, password });
    localStorage.setItem("ms_token_v2", r.data.token);
    setToken(r.data.token); setUser(r.data.user); return r.data;
  };
  const logout = () => { localStorage.removeItem("ms_token_v2"); setToken(null); setUser(null); };
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, authHeader }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
