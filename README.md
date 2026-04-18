# 🏥 MediSense — AI-Powered Multi-Disease Prediction & Health Intelligence System

<div align="center">

![MediSense Banner](https://img.shields.io/badge/MediSense-AI%20Health%20Platform-16a34a?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==)

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-61DAFB?style=flat-square&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**A Final Year B.Tech Major Project — ITM University Gwalior (2022–26)**

[📋 Features](#-features) • [🛠 Tech Stack](#-tech-stack) • [⚙️ Setup](#️-setup--installation) • [📁 Project Structure](#-project-structure) • [👥 Team](#-team)

</div>

---

## 📌 About the Project

**MediSense** is a full-stack AI-powered health intelligence web application that allows users to upload any medical lab report (image/PDF) or manually enter health parameters, and receive an instant, comprehensive health assessment — including disease risk prediction, personalized diet charts, do's & don'ts, specialist recommendations, and a real-time AI chat assistant.

The platform is designed to make intelligent health insights accessible to every Indian citizen, regardless of their medical literacy or geographic location.

> ⚠️ **Medical Disclaimer:** MediSense is built for educational and informational purposes only. It is not a licensed medical device and does not replace professional medical diagnosis or treatment. Always consult a qualified healthcare professional.

---

### 🎬 Quick Demo
https://github.com/user-attachments/assets/316f94ba-25e6-432e-aa60-3214c6784315


## ✨ Features

| Feature | Description |
|---|---|
| 🔬 **Lab Report Upload** | Upload JPG, PNG, WebP, or PDF lab reports — AI reads and extracts all values automatically |
| 📝 **Parameter Entry** | Manually enter health parameters for 8 disease categories via structured forms |
| 🧠 **AI Disease Analysis** | Detects risk for Diabetes, Heart Disease, Liver Disease, Kidney Disease, Hypertension, Thyroid, Anemia, Parkinson's |
| 💬 **Streaming AI Chat** | Real-time word-by-word AI chat (like ChatGPT) to ask follow-up questions about results |
| 🥗 **Personalized Diet Chart** | AI-generated 7-day meal plan tailored to exact test values |
| 📍 **Clinic Finder** | Real-time map of nearby hospitals and specialists using OpenStreetMap |
| 📄 **PDF Report** | Download a complete diagnostic report with all findings and recommendations |
| 🔐 **User Auth** | Secure signup/login with prediction history tracking |
| 🌙 **Dark / Light Mode** | Full dark mode support with system preference detection |
| 📱 **Responsive Design** | Works on mobile, tablet, and desktop |

---

## 🛠 Tech Stack

### Frontend
- **React.js 18** — Component-based UI
- **Tailwind CSS** — Utility-first styling
- **Recharts** — Data visualization
- **Leaflet.js** — Interactive maps
- **Axios** — HTTP client
- **Fetch API + ReadableStream** — SSE streaming for chat
- **jsPDF + jsPDF-AutoTable** — Client-side PDF generation

### Backend
- **Python 3.11 + FastAPI** — REST API server
- **Uvicorn** — ASGI server
- **Google Gemini 2.5 Flash** — Multimodal AI (vision + text + streaming)
- **google-generativeai** — Gemini Python SDK
- **SQLite (sqlite3)** — Database for users, predictions, chat history
- **SHA-256 + secrets.token_hex** — Authentication

### Tools & Deployment
- **Git + GitHub** — Version control
- **VS Code** — Development environment
- **OpenStreetMap Overpass API** — Clinic geolocation

---

## 🗂 Project Structure

```
MediSense/
├── backend/
│   ├── main.py                  # FastAPI server — all routes
│   ├── health_guide.json        # Disease guidance data
│   ├── requirements.txt         # Python dependencies
│   └── medisense.db             # SQLite database (auto-created)
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx     # Landing page with animations
│   │   │   ├── AnalyzePage.jsx  # Main analysis page
│   │   │   └── HistoryPage.jsx  # Prediction history
│   │   ├── components/
│   │   │   ├── AIChat.jsx       # Streaming AI chat widget
│   │   │   ├── ResultsPanel.jsx # Full analysis results display
│   │   │   ├── Navbar.jsx       # Navigation with auth state
│   │   │   └── ClinicMap.jsx    # Leaflet.js clinic finder
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Global auth state
│   │   ├── utils/
│   │   │   └── pdfReport.js     # PDF generation utility
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css            # Global styles + CSS variables
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env                     # API URL config
│
├── ml/
│   └── train_models.py          # ML model training script
│
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.11
- A Google Gemini API key (free at [ai.google.dev](https://ai.google.dev))

### 1. Clone the repository
```bash
git clone https://github.com/Amaan310/MajorProject_MediSense_Amaan100.git
cd MajorProject_MediSense_Amaan100
```

### 2. Backend setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in `backend/` or set your Gemini API key directly in `main.py`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:
```bash
python main.py
# Server runs at http://localhost:8000
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
npm start
# App runs at http://localhost:3000
```

### 4. Open in browser
Navigate to **http://localhost:3000**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/predict/report` | Upload lab report image/PDF for AI analysis |
| `POST` | `/api/predict/form` | Submit form parameters for analysis |
| `POST` | `/api/chat` | Send chat message, get full response |
| `POST` | `/api/chat/stream` | Send chat message, get SSE streaming response |
| `GET` | `/api/history` | Get user's prediction history |
| `POST` | `/api/auth/signup` | Register new user |
| `POST` | `/api/auth/login` | Login existing user |
| `GET` | `/api/auth/me` | Get current user info |

---

## 🩺 Diseases Detected

| Disease | Input Type | Key Parameters |
|---|---|---|
| Diabetes | Form / Report | Glucose, HbA1c, BMI, Insulin |
| Heart Disease | Form / Report | Cholesterol, BP, ECG, Thalach |
| Liver Disease | Form / Report | Bilirubin, ALT, AST, Albumin |
| Kidney Disease | Form / Report | Creatinine, BUN, eGFR, Sodium |
| Hypertension | Form / Report | Systolic BP, Diastolic BP, Pulse |
| Thyroid Disease | Form / Report | TSH, T3, Free T4 |
| Anemia | Form / Report | Hemoglobin, RBC, MCV, Ferritin |
| Parkinson's Disease | Form | Tremor, Rigidity, Bradykinesia |

---

## 📸 Screenshots


| Home Page | Analyze Page | Results |
|---|---|---|
| ![Home](home.png) | ![Analyze](analyze.png) | ![Results](results.png) |

| AI Chat | Clinic Finder | History |
|---|---|---|
| ![Chat](chat.png) | ![Map](map.png) | ![History](history.png) |

---

## 👥 Team

| Name | Roll Number | Role |
|---|---|---|
| **Amaan Haque** | BETN1CS22100 | Full Stack Development, AI Integration, ML |
| **Kuldeep Singh Rana** | BETN1CS22040 | Backend Development, Database, API Design |
| **Krishna Jain** | BETN1CS22179 | Frontend Development, UI/UX, Testing |

**Guide/Mentor:** Ms. Pragya Jain / Mr. Suraj Sharma, Assistant Professor, Department of CSA

**Institution:** ITM University Gwalior (M.P)

**Course:** CSD0804 — Major Project II (B.Tech CSE, 2022–26)

---

## 📄 License

This project is submitted as a Major Project for academic evaluation at ITM University Gwalior. It is open-sourced under the [MIT License](LICENSE) for educational reference.

---

<div align="center">
Made with ❤️ by Team MediSense — ITM University Gwalior, April 2026
</div>
