import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import AnalyzePage from "./pages/AnalyzePage";
import { LoginPage, SignupPage } from "./pages/AuthPages";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";
import AIChat from "./components/AIChat";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative" }}>
            <Navbar />
            <Routes>
              <Route path="/"        element={<HomePage />} />
              <Route path="/analyze" element={<AnalyzePage />} />
              <Route path="/login"   element={<LoginPage />} />
              <Route path="/signup"  element={<SignupPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
            <AIChat />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
