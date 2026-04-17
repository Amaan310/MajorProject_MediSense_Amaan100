# MediSense v2 — AI-Powered Disease Prediction & Health Guide

> Final Year B.Tech CSE Major Project — ITM University Gwalior  
> Powered by **Google Gemini AI** (gemini-2.0-flash)

---

## What's New in v2

| Feature | v1 (ML Models) | v2 (Gemini AI) |
|---|---|---|
| Disease prediction | Rule-based ML classifiers | Gemini reads any health data |
| Input method | Form only | **Upload report (PDF/image) OR form** |
| Explanation | Feature importance chart | **Plain-English AI explanation** |
| Health guide | Static JSON database | **Dynamically generated per patient** |
| Diet chart | Generic recommendations | **Personalized to your exact values** |
| Chat | ❌ | **Post-prediction AI chat** |
| Diseases covered | 5 | **8+** (open-ended) |

---

## Key Features

### 1. Lab Report Upload (Gemini Vision)
- Upload any medical report: blood test, CBC, lipid panel, thyroid, liver, kidney, sugar report
- Supports **JPG, PNG, WebP, PDF** — up to 15MB
- Gemini Vision extracts every value automatically — no manual entry needed

### 2. Form-Based Input
- 8 disease categories with pre-built parameter forms
- Diseases: Diabetes, Heart Disease, Liver Disease, Kidney Disease, Parkinson's, Hypertension, Thyroid, Anemia
- Fill as many fields as available — Gemini works with partial data too

### 3. Explainable AI Diagnosis
- Gemini explains **exactly WHY** a disease was flagged
- References specific values: *"Your fasting glucose of 148 mg/dL is above the 126 mg/dL threshold..."*
- Lists key indicators and what they mean in daily life

### 4. Personalized Diet Chart
- AI-generated meal plan: morning to dinner
- Based on your **actual extracted values** — not a generic chart
- Foods to eat, foods to avoid, special notes for the condition

### 5. Do's & Don'ts + Emergency Signs
- Specific, actionable recommendations based on your results
- Emergency warning signs that require immediate ER visit

### 6. Nearest Clinic Finder (OpenStreetMap)
- Real-time map using Leaflet.js + OpenStreetMap (100% free, no API key)
- Filters by specialist type relevant to detected disease
- Click any marker for clinic details, phone, directions

### 7. AI Chat After Analysis
- Ask follow-up questions: *"What does my creatinine level mean?"*
- Gemini has full context of your analysis
- Natural conversation with medical accuracy

### 8. PDF Report Download
- 3-page professional PDF: diagnosis + AI explanation + diet chart + specialist
- Generated entirely client-side using jsPDF

### 9. Dark / Light Mode
- Toggle in the navbar — persists across sessions
- Full dark mode with proper contrast throughout

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Engine | Google Gemini 2.0 Flash (Vision + Text) |
| Backend | FastAPI (Python) |
| Frontend | React 18 + Tailwind CSS |
| Maps | Leaflet.js + OpenStreetMap + Overpass API |
| PDF | jsPDF + jsPDF-autoTable |
| Database | SQLite (auto-created on first run) |
| Auth | Token-based (SHA-256) |
| Fonts | Clash Display + DM Sans |

---

## Project Structure

```
medisense_v2/
├── backend/
│   ├── main.py              # FastAPI + Gemini integration
│   └── requirements.txt
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.jsx
    │   ├── index.js
    │   ├── index.css          # Design system (dark/light variables)
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── pages/
    │   │   ├── HomePage.jsx   # Landing page
    │   │   ├── AnalyzePage.jsx # Main analysis page
    │   │   ├── AuthPages.jsx  # Login + Signup
    │   │   └── HistoryPage.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx     # Glassmorphism navbar
    │   │   ├── ResultsPanel.jsx # Full AI results display
    │   │   ├── AIChat.jsx     # Post-prediction chat
    │   │   └── ClinicMap.jsx  # Leaflet map
    │   └── utils/
    │       └── pdfReport.js   # PDF generation
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── .env
```

---

## Setup & Run

### Prerequisites
- Python 3.9+
- Node.js 18+
- Internet connection (for Gemini API calls)

### Step 1 — Backend

```bash
cd medisense_v2/backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API runs at: `http://localhost:8000`  
Swagger docs: `http://localhost:8000/docs`

### Step 2 — Frontend

```bash
cd medisense_v2/frontend
npm install
npm start
```

App runs at: `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/predict/report` | Analyze uploaded lab report (multipart/form-data) |
| `POST` | `/api/predict/form` | Analyze form parameters |
| `POST` | `/api/chat` | AI chat with disease context |
| `POST` | `/api/auth/signup` | Register |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/history` | Get prediction history |
| `GET` | `/api/stats` | App stats |

### Example: Form Prediction Request
```json
POST /api/predict/form
{
  "disease": "Diabetes",
  "symptoms": {
    "Blood Glucose (Fasting)": "148 mg/dL",
    "HbA1c": "7.2%",
    "BMI": "28.5",
    "Age": "45"
  }
}
```

### Example: Response (abbreviated)
```json
{
  "detected_disease": "Type 2 Diabetes Mellitus",
  "risk_level": "Medium",
  "confidence": "88%",
  "summary": "Your fasting glucose and HbA1c are above normal thresholds...",
  "explanation": {
    "why_detected": "Fasting glucose of 148 mg/dL exceeds the 126 mg/dL diagnostic threshold...",
    "key_indicators": ["Fasting glucose: 148 mg/dL (High)", "HbA1c: 7.2% (High)"],
    "what_it_means": "Your blood sugar is not being regulated effectively..."
  },
  "dos": ["Monitor blood sugar daily", ...],
  "donts": ["Avoid sugary drinks", ...],
  "diet_chart": {
    "breakfast": ["Oats with chia seeds", "Green tea"],
    "lunch": ["Brown rice with dal", "Salad"],
    ...
  },
  "specialist": {
    "type": "Endocrinologist / Diabetologist",
    "urgency": "Within 1 week",
    "reason": "HbA1c above 7% requires medical management"
  },
  "emergency_signs": ["Blood sugar above 300 mg/dL", ...]
}
```

---

## Deployment

### Backend → Render (Free)
```bash
# render.yaml (place in backend/)
services:
  - type: web
    name: medisense-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: GEMINI_API_KEY
        value: AIzaSyD0C3nJhnO5kJ1lR4Cq6ndiDJxBABI1gAk
```

### Frontend → Vercel (Free)
1. Push `frontend/` folder to GitHub
2. Import on vercel.com
3. Set environment variable: `REACT_APP_API_URL=https://your-render-url.onrender.com`
4. Deploy — done!

---

## Viva Talking Points

- **Why Gemini over pure ML?** Gemini handles any report format, any disease, and gives explainable output — not just a binary classification. It's a generalist AI that a doctor-like assistant.
- **Why Gemini Vision for reports?** Traditional ML needs structured CSV input. Gemini Vision reads raw PDFs and images — much closer to real-world usage where patients just have a paper report.
- **What is Explainable AI here?** We don't use a black-box ML model. Gemini tells the user in plain English WHY a disease was detected, which specific values triggered it, and what those values mean — this is XAI in the most accessible form.
- **Map feature uniqueness:** No existing academic paper in this space integrates geolocation-based specialist recommendation. This is our original contribution.
- **Diet chart generation:** Each diet plan is uniquely generated based on the patient's exact values — not a static template. This is personalized medicine at the application level.

---

## Academic References (cite in report)

1. IEEE Xplore — Multiple Disease Prediction using ML (2023): https://ieeexplore.ieee.org/document/10060903/
2. IEEE Xplore — ML + Web Technology for Disease Prediction (2023): https://ieeexplore.ieee.org/document/10292488
3. Springer — Comprehensive Review of ML for Chronic Disease (2024): https://jesit.springeropen.com/articles/10.1186/s43067-024-00150-4
4. JMIR/PMC — ML for Disease Prediction Systematic Review (2025): https://pmc.ncbi.nlm.nih.gov/articles/PMC12226786/
5. TIJER — Multiple Disease Prediction App using ML (Nov 2024): https://tijer.org/tijer/papers/TIJER2411031.pdf

---

## Disclaimer

> ⚠️ MediSense is developed as an educational and research project for academic purposes only.  
> It is NOT a medical device and should NOT be used for clinical diagnosis or treatment decisions.  
> Always consult a qualified healthcare professional for medical advice.

---

**Institute:** ITM University Gwalior  
**Department:** B.Tech Computer Science Engineering  
**Semester:** 8th (Final Year)  
**Technology:** Full-Stack AI Web Application
