from fastapi import FastAPI, HTTPException, Depends, UploadFile, File   # type: ignore
from fastapi.middleware.cors import CORSMiddleware                        # type: ignore
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials    # type: ignore
from pydantic import BaseModel, validator                                 # type: ignore
from typing import Optional, List
import google.generativeai as genai                                       # type: ignore
import sqlite3, secrets, json, os, base64, re, bcrypt                     # type: ignore
from datetime import datetime
from dotenv import load_dotenv                                           # type: ignore

# ── Setup ─────────────────────────────────────────────────────────────────────
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="MediSense v2 API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

security  = HTTPBearer(auto_error=False)
BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DB_PATH   = os.path.join(BASE_DIR, "medisense.db")

MODEL_TEXT   = "gemini-3-flash-preview"
MODEL_VISION = "gemini-3-flash-preview"

DISEASES = ["Diabetes", "Heart Disease", "Liver Disease", "Kidney Disease",
            "Parkinson's Disease", "Hypertension", "Thyroid Disease", "Anemia"]

MAX_CHAT_MSG_LEN = 2000   # ← input length cap


# ── DB Setup ──────────────────────────────────────────────────────────────────
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        token         TEXT,
        age           INTEGER,
        gender        TEXT,
        weight_kg     REAL,
        height_cm     REAL,
        created_at    TEXT DEFAULT CURRENT_TIMESTAMP)""")
    # Add profile columns if upgrading from old DB (safe to run repeatedly)
    for col, typedef in [("age","INTEGER"), ("gender","TEXT"),
                          ("weight_kg","REAL"), ("height_cm","REAL")]:
        try:
            c.execute(f"ALTER TABLE users ADD COLUMN {col} {typedef}")
        except Exception:
            pass
    c.execute("""CREATE TABLE IF NOT EXISTS predictions (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER,
        disease     TEXT,
        risk_level  TEXT,
        confidence  TEXT,
        summary     TEXT,
        input_type  TEXT,
        raw_input   TEXT,
        created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id))""")
    c.execute("""CREATE TABLE IF NOT EXISTS chats (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        prediction_id INTEGER,
        role          TEXT,
        message       TEXT,
        created_at    TEXT DEFAULT CURRENT_TIMESTAMP)""")
    conn.commit()
    conn.close()

init_db()


# ── DB helper ─────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ── Password hashing (bcrypt) ─────────────────────────────────────────────────
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


# ── Auth dependency ───────────────────────────────────────────────────────────
def get_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    if not creds:
        return None
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE token=?",
                        (creds.credentials,)).fetchone()
    conn.close()
    return dict(user) if user else None


# ── Gemini helpers ────────────────────────────────────────────────────────────
def call_gemini(prompt: str, image_data: dict = None) -> str:
    try:
        model = genai.GenerativeModel(MODEL_VISION if image_data else MODEL_TEXT)
        if image_data:
            response = model.generate_content([{"inline_data": image_data}, prompt])
        else:
            response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")


def parse_json_response(text: str) -> dict:
    try:
        return json.loads(text)
    except Exception:
        pass
    m = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass
    m = re.search(r'\{[\s\S]*\}', text)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    return {"raw": text}


# ── Phatic / FAQ / Symptom Handler (zero API calls) ──────────────────────────
def _contains(msg: str, *phrases) -> bool:
    return any(p in msg for p in phrases)

def _startswith(msg: str, *phrases) -> bool:
    return any(msg.startswith(p) for p in phrases)

def _exact(msg: str, *phrases) -> bool:
    return msg in phrases

def _any_word(msg: str, *words) -> bool:
    return any(re.search(rf'\b{re.escape(w)}\b', msg) for w in words)


def get_instant_response(raw_message: str) -> Optional[str]:
    msg = raw_message.strip().lower()
    msg = re.sub(r"[!?.,'\"]+$", "", msg).strip()
    msg = re.sub(r"\s+", " ", msg)

    # ══ A — CONVERSATIONAL / SOCIAL ══════════════════════════════════════════

    greet_exact = {
        "hi","hello","hey","heyy","heya","hiya","howdy","yo","sup",
        "what's up","whats up","wassup","wazzup",
        "good morning","good evening","good afternoon","good night","good day",
        "namaste","namaskar","kaise ho","kaise hain","aap kaise hain",
        "kya haal hai","kya haal he","नमस्ते","नमस्कार","आप कैसे हैं",
        "क्या हाल है","helo","hii","hiii","hiiii","helloo","hy",
    }
    if msg in greet_exact:
        return "Hello! I'm MediSense AI. How can I help you with your health and lab reports today? 😊"
    if _startswith(msg,"good morning","good evening","good afternoon",
                   "good night","good day","namaste","namaskar"):
        return "Hello! I'm MediSense AI. How can I help you with your health and lab reports today? 😊"
    if _startswith(msg,"नमस्ते","नमस्कार") or _exact(msg,"kaise ho","kaise hain",
                                                       "aap kaise hain","kya haal hai"):
        return ("नमस्ते! मैं MediSense AI हूँ। आज मैं आपकी स्वास्थ्य "
                "और लैब रिपोर्ट में कैसे मदद कर सकता हूँ?")

    how_are_you = {
        "how are you","how r u","how are u","hows you","how's you",
        "how you doing","how are you doing","you okay","you ok","u ok",
        "u okay","you good","u good","are you okay","are you fine",
        "theek ho","theek hain","kya haal","aap theek hain",
    }
    if msg in how_are_you or _contains(msg,"how are you","how r u"):
        return ("I'm doing great, thank you for asking! 😊 I'm always here to help "
                "you understand your health reports and answer your medical questions. "
                "What can I do for you today?")

    identity_triggers = [
        "who are you","what are you","are you a bot","are you ai",
        "are you an ai","are you a robot","are you human","are you real",
        "are you a machine","are you gpt","are you chatgpt","are you gemini",
        "are you claude","tum kaun ho","aap kaun hain","aap kaun ho",
        "tum kya ho","bot ho kya","तुम कौन हो","आप कौन हैं",
        "tell me about yourself","introduce yourself","your name",
        "what is your name","what's your name","tumhara naam",
        "aapka naam","apna naam batao",
    ]
    if any(_contains(msg,t) for t in identity_triggers):
        is_hindi = any(w in msg for w in ["kaun","naam","तुम","आप","hain","tum","aapka"])
        if is_hindi:
            return ("मैं MediSense AI हूँ — एक स्मार्ट वर्चुअल हेल्थ असिस्टेंट। "
                    "मैं आपकी मेडिकल रिपोर्ट का विश्लेषण करता हूँ, मेडिकल शब्दों को "
                    "सरल भाषा में समझाता हूँ, और डाइट व एक्सरसाइज के सुझाव देता हूँ।")
        return ("I'm MediSense AI — a smart virtual health assistant built to help you "
                "understand your medical reports, explain lab values in plain language, "
                "suggest personalised diet charts, and answer your health questions. "
                "I'm not a human, but I'm here to make healthcare information more accessible!")

    creator_triggers = [
        "who created you","who made you","who built you","who developed you",
        "who designed you","who programmed you","who is your creator",
        "who is your developer","who owns you","which company made you",
        "who is behind you","who runs you","who manages you",
        "kisne banaya","tumhe kisne banaya","aapko kisne banaya",
        "किसने बनाया","kisne develop kiya","kisne likha",
    ]
    launch_triggers = [
        "when were you created","when were you launched","when were you made",
        "when were you built","when did you launch","when was medisense made",
        "when was medisense launched","when was medisense created",
        "how old are you","since when","launch date","release date",
        "kab banaya","kab launch hua","कब बनाया","कब लॉन्च हुआ",
    ]
    if any(_contains(msg,t) for t in creator_triggers):
        is_hindi = any(w in msg for w in ["kisne","banaya","किसने"])
        if is_hindi:
            return ("मुझे MediSense टीम ने बनाया है। हमारा लक्ष्य है कि हर व्यक्ति "
                    "अपनी स्वास्थ्य जानकारी को आसानी से समझ सके।")
        return ("I was created by the MediSense team with a mission to make "
                "healthcare information accessible to everyone — regardless of "
                "their medical background.")
    if any(_contains(msg,t) for t in launch_triggers):
        return ("MediSense AI was developed and launched by the MediSense team. "
                "We're continuously improving to bring you the most accurate and "
                "helpful health insights possible! 🚀")

    help_triggers = [
        "help","i need help","help me","can you help","please help",
        "what can you do","what do you do","how does this work",
        "how can you help","how can you help me","get started",
        "how to use","how to use this","what features","what are your features",
        "what can you tell me","what do you know","what can i ask you",
        "madad","mujhe madad chahiye","meri madad karo",
        "kya kar sakte ho","kaise use kare","kaise use karein",
        "मदद","क्या कर सकते हो","कैसे उपयोग करें",
    ]
    if any(_exact(msg,t) or _contains(msg,t) for t in help_triggers):
        is_hindi = any(w in msg for w in ["madad","karo","sakte","मदद","कैसे"])
        if is_hindi:
            return ("मैं इन चीज़ों में आपकी मदद कर सकता हूँ:\n\n"
                    "🔬 **लैब रिपोर्ट विश्लेषण** — अपनी रिपोर्ट अपलोड करें\n"
                    "📊 **7-दिन डाइट चार्ट** — आपकी बीमारी के अनुसार\n"
                    "💊 **मेडिकल शब्दों की व्याख्या** — सरल भाषा में\n"
                    "🏃 **व्यायाम सुझाव** — आपकी स्थिति के अनुसार\n"
                    "🤒 **सामान्य लक्षणों की जानकारी** — बुखार, सर्दी, सिरदर्द आदि\n\n"
                    "शुरू करने के लिए **Analyze** पेज पर जाएं!")
        return ("Here's what I can help you with:\n\n"
                "🔬 **Analyse lab reports** — upload your report to get started\n"
                "📊 **7-day personalised diet charts** — based on your condition\n"
                "💊 **Explain medical terms** — in plain, simple language\n"
                "🏃 **Exercise & fitness advice** — tailored to your health status\n"
                "😴 **Sleep & wellness tips** — for a healthier lifestyle\n"
                "🤒 **Common symptoms** — fever, cold, headache, cough & more\n"
                "🩺 **General health questions** — ask me anything\n\n"
                "Head to the **Analyze** page to upload a report and get started!")

    thanks_exact = {
        "thanks","thank you","thank u","ty","thx","thnx","thku","tysm",
        "thank you so much","thanks a lot","thanks a ton","many thanks",
        "much appreciated","appreciate it","appreciate that",
        "you're great","you are great","you're awesome","you are awesome",
        "great job","good job","well done","wonderful",
        "shukriya","dhanyawad","dhanyavaad","bahut shukriya",
        "शुक्रिया","धन्यवाद",
    }
    if msg in thanks_exact or any(_contains(msg,t) for t in [
        "thank you","thanks a","appreciate","shukriya","dhanyawad",
        "you're great","you are great","you're awesome",
    ]):
        return ("You're welcome! 😊 I'm always happy to help. "
                "Feel free to ask me anything about your health or reports.")

    bye_exact = {
        "bye","goodbye","good bye","see you","see ya","cya","take care",
        "good night","gn","gotta go","i have to go","i'm going","i am going",
        "leaving now","talk later","ttyl","talk to you later",
        "alvida","shubh ratri","phir milenge","chalte hain",
        "अलविदा","शुभ रात्रि","फिर मिलेंगे",
    }
    if msg in bye_exact or _contains(msg,"good night","goodbye","see you",
                                      "take care","alvida","shubh ratri"):
        return ("Take care! 👋 Remember, staying informed about your health is "
                "the first step to a healthier life. Come back anytime you need help!")

    affirm = {
        "ok","okay","sure","got it","understood","alright","fine",
        "noted","cool","perfect","yes","yeah","yep","yup",
        "nope","no","nah","haan","nahi","theek hai","theek he",
        "accha","acha","bilkul","हाँ","नहीं","ठीक है","अच्छा",
    }
    if msg in affirm:
        return ("Got it! 😊 Let me know if there's anything specific you'd like "
                "help with — lab reports, diet advice, or any health question.")

    confused_triggers = [
        "i don't understand","i dont understand","what do you mean",
        "what does that mean","explain again","say that again","repeat that",
        "i'm confused","i am confused","not clear","samjha nahi",
        "samajh nahi aaya","phir se batao","dobara batao",
        "समझ नहीं आया","फिर से बताएं",
    ]
    if any(_contains(msg,t) for t in confused_triggers):
        return ("I'm sorry for any confusion! Could you tell me more about what "
                "you'd like help with? For example:\n\n"
                "- Upload a lab report for analysis\n"
                "- Ask about a specific medical term or symptom\n"
                "- Request a diet chart for a condition\n\n"
                "I'll do my best to give you a clear answer! 😊")

    compliment_triggers = [
        "you're helpful","you are helpful","you're amazing","you are amazing",
        "you're the best","you are the best","love you","love this",
        "this is great","this is amazing","this is awesome",
        "bahut acha","bahut accha","bahut helpful","acha hai",
    ]
    if any(_contains(msg,t) for t in compliment_triggers):
        return ("Thank you so much, that means a lot! 😊 I'm always here to help "
                "you stay on top of your health. What can I assist you with today?")

    negative_triggers = [
        "bad bot","stupid","useless","you're useless","you are useless",
        "you're stupid","you're dumb","worst","you suck","i hate you",
        "hate this","this is bad","bekaar","faltu","bakwas",
        "बेकार","फालतू","बकवास",
    ]
    if any(_contains(msg,t) for t in negative_triggers):
        return ("I'm sorry you feel that way! 😔 I'm constantly learning and improving. "
                "Could you tell me what went wrong so I can do better? "
                "Your feedback helps me improve for everyone.")

    test_exact = {"test","testing","123","1234","hello world","ping","check","trial","dummy"}
    if msg in test_exact or _startswith(msg,"test","testing"):
        return ("Everything looks good on my end! ✅ I'm ready to help you with "
                "your health queries and medical report analysis. What would you like to know?")
    if len(msg) <= 2 or (len(msg) >= 6 and not re.search(r"[aeiouअआइईउऊ]", msg)):
        return ("I didn't quite catch that! 😊 Could you please rephrase or ask "
                "me a health-related question? I'm here to help!")

    # ══ B — APP FAQs ═════════════════════════════════════════════════════════

    if any(_contains(msg,t) for t in [
        "is this free","is medisense free","free to use","how much does it cost",
        "cost of medisense","do i need to pay","is it paid","subscription",
        "pricing","kya ye free hai","kitne paise","paisa lagta hai",
    ]):
        return ("MediSense offers a **free** plan that lets you analyse lab reports, "
                "chat with the AI assistant, and get personalised health insights. "
                "Create a free account to save your history and access all features! 🎉")

    if any(_contains(msg,t) for t in [
        "is this accurate","how accurate","can i trust","should i trust",
        "is it reliable","is medisense reliable","accuracy","how correct",
        "kitna accurate","sahi hai kya",
    ]):
        return ("MediSense AI is designed to provide **educational health insights** based "
                "on your lab values and symptoms. Our analysis achieves ~95% accuracy on "
                "common conditions. However, always consult a qualified doctor before making "
                "any medical decisions. Think of me as a knowledgeable health companion, "
                "not a replacement for professional care. 🩺")

    if any(_contains(msg,t) for t in [
        "how to upload","how do i upload","upload report","upload lab",
        "how to analyze","how to analyse","where to upload",
        "report kaise upload","kaise upload kare",
    ]):
        return ("To upload your lab report:\n\n"
                "1. Click **Analyze** in the top navigation\n"
                "2. Choose **Upload Report** (PDF or image)\n"
                "3. Select your file and click **Analyse**\n"
                "4. Get your full health insights in seconds! ⚡\n\n"
                "You can also use the **Form** option if you want to enter values manually.")

    if any(_contains(msg,t) for t in [
        "what diseases","which diseases","what conditions","which conditions",
        "what can you detect","diseases you detect","kaunsi bimari",
        "kya detect kar sakte","kaun si bimariyan",
    ]):
        return ("MediSense can currently detect and analyse **8 major conditions**:\n\n"
                "1. 🩸 Diabetes\n2. ❤️ Heart Disease\n3. 🫁 Liver Disease\n"
                "4. 🫘 Kidney Disease\n5. 🧠 Parkinson's Disease\n"
                "6. 💉 Hypertension\n7. 🦋 Thyroid Disease\n8. 🩺 Anemia\n\n"
                "Upload your lab report and I'll analyse it for any of these conditions!")

    if any(_contains(msg,t) for t in [
        "is my data safe","is my data secure","data privacy","privacy",
        "do you store my data","do you share my data","data security",
        "mera data safe hai","data kahan jata hai",
    ]):
        return ("Your privacy is our top priority. 🔒 MediSense stores your reports "
                "and chat history **only to improve your personal experience**. "
                "We do **not** share your data with third parties.")

    # ══ C — HEALTH BASICS ════════════════════════════════════════════════════

    if any(_contains(msg,t) for t in [
        "normal blood pressure","what is normal bp","healthy blood pressure",
        "bp kitna hona chahiye","blood pressure range","bp range","normal bp","ideal blood pressure",
    ]):
        return ("## Normal Blood Pressure Ranges 💉\n\n"
                "| Category | Systolic | Diastolic |\n|---|---|---|\n"
                "| **Normal** | < 120 mmHg | < 80 mmHg |\n"
                "| **Elevated** | 120–129 mmHg | < 80 mmHg |\n"
                "| **High (Stage 1)** | 130–139 mmHg | 80–89 mmHg |\n"
                "| **High (Stage 2)** | ≥ 140 mmHg | ≥ 90 mmHg |\n"
                "| **Crisis** | > 180 mmHg | > 120 mmHg |\n\n"
                "> [!WARNING] Always consult your doctor if your BP is consistently high or low.")

    if any(_contains(msg,t) for t in [
        "normal blood sugar","normal glucose","normal sugar level","blood sugar range",
        "glucose range","sugar kitna hona chahiye","fasting sugar","fasting glucose",
    ]):
        return ("## Normal Blood Sugar Levels 🩸\n\n"
                "| Test | Normal Range |\n|---|---|\n"
                "| **Fasting glucose** | 70–99 mg/dL |\n"
                "| **Post-meal (2hr)** | < 140 mg/dL |\n"
                "| **HbA1c (Normal)** | Below 5.7% |\n"
                "| **HbA1c (Prediabetes)** | 5.7–6.4% |\n"
                "| **HbA1c (Diabetes)** | 6.5% and above |\n\n"
                "> [!WARNING] Always consult your doctor for personalised targets.")

    if any(_contains(msg,t) for t in [
        "normal heart rate","normal pulse","healthy heart rate","resting heart rate",
        "pulse rate","dil ki dhadkan","normal bpm","heart rate range",
    ]):
        return ("## Normal Heart Rate 💓\n\n"
                "- **Adults (resting):** 60–100 beats per minute (bpm)\n"
                "- **Well-trained athletes:** 40–60 bpm\n"
                "- **Children (1–10 yrs):** 70–130 bpm\n\n"
                "> [!TIP] Regular aerobic exercise naturally lowers your resting heart rate over time.")

    if any(_contains(msg,t) for t in [
        "normal temperature","body temperature","normal body temp",
        "fever temperature","normal temp","bukhar kitne pe hota hai",
    ]):
        return ("## Body Temperature Guide 🌡️\n\n"
                "- **Normal:** 97–99°F (36.1–37.2°C)\n"
                "- **Low-grade fever:** 99–100.4°F\n"
                "- **Fever:** Above 100.4°F (38°C)\n"
                "- **High fever:** Above 103°F — see a doctor\n"
                "- **Dangerous:** Above 104°F — seek emergency care\n\n"
                "> [!TIP] Oral readings are most common. Rectal runs ~0.5°F higher.")

    if any(_contains(msg,t) for t in [
        "how much water","daily water intake","water intake","pani kitna pina chahiye",
        "drink water","hydration","stay hydrated","water per day",
    ]):
        return ("## Daily Water Intake 💧\n\n"
                "- **Men:** ~3.7 litres/day\n- **Women:** ~2.7 litres/day\n"
                "- **Hot weather / exercise:** Add 0.5–1 litre extra\n\n"
                "> [!TIP] Pale yellow urine = well hydrated. Dark yellow = drink more!")

    if any(_contains(msg,t) for t in [
        "healthy diet","what should i eat","healthy food","good diet",
        "balanced diet","diet tips","healthy eating","nutrition tips",
        "healthy khana","kya khana chahiye",
    ]):
        return ("## Tips for a Healthy Diet 🥗\n\n"
                "- **Eat more:** vegetables, fruits, whole grains, legumes, nuts\n"
                "- **Good proteins:** eggs, fish, chicken, dal, tofu, paneer\n"
                "- **Healthy fats:** olive oil, avocado, nuts, seeds\n"
                "- **Limit:** sugar, salt, processed/fried foods\n"
                "- **Drink:** 8+ glasses of water daily\n\n"
                "> [!TIP] Upload your report on **Analyze** for a personalised diet plan!")

    # ══ D — EXERCISE ═════════════════════════════════════════════════════════

    if any(_contains(msg,t) for t in [
        "how much exercise","how much should i exercise","exercise daily",
        "how often exercise","exercise per week","exercise kitna karna chahiye",
        "how long to exercise","exercise duration","workout kitna karo",
    ]):
        return ("## Recommended Exercise Guidelines 🏃\n\n"
                "**WHO recommends for adults:**\n"
                "- **Moderate activity:** at least **150–300 min/week**\n"
                "- **Vigorous activity:** at least **75–150 min/week**\n"
                "- **Strength training:** at least **2 days/week**\n\n"
                "> [!TIP] Even a 10-minute walk after meals improves blood sugar control!")

    if any(_contains(msg,t) for t in [
        "best exercise","what exercise","exercise for weight loss","exercise for diabetes",
        "exercise for heart","exercise for bp","exercise for beginners",
        "beginner workout","easy exercise","ghar pe exercise","home exercise",
    ]):
        return ("## Best Exercises for General Health 💪\n\n"
                "**Cardio:** Brisk walking, cycling, swimming, jogging\n"
                "**Strength:** Squats, push-ups, lunges, planks, light dumbbells\n"
                "**Flexibility:** Yoga, daily stretching\n\n"
                "> [!TIP] For condition-specific exercise advice, upload your report on **Analyze**!")

    if any(_contains(msg,t) for t in [
        "yoga benefits","yoga ke fayde","should i do yoga","is yoga good","yoga for health",
    ]):
        return ("## Benefits of Yoga 🧘\n\n"
                "- Reduces **stress and anxiety**\n- Improves **flexibility and posture**\n"
                "- Helps manage **diabetes, BP, back pain**\n"
                "- Promotes **better sleep**\n- Boosts **mental clarity**\n\n"
                "> [!TIP] Even 15–20 minutes daily shows benefits within 2 weeks!")

    # ══ E — SLEEP ════════════════════════════════════════════════════════════

    if any(_contains(msg,t) for t in [
        "how much sleep","how many hours of sleep","sleep hours","how long to sleep",
        "sleep duration","kitne ghante sona chahiye","recommended sleep",
    ]):
        return ("## Recommended Sleep by Age 😴\n\n"
                "| Age Group | Hours Needed |\n|---|---|\n"
                "| Children (6–12 yrs) | 9–12 hours |\n"
                "| Teenagers (13–18) | 8–10 hours |\n"
                "| **Adults (18–64)** | **7–9 hours** |\n"
                "| Older adults (65+) | 7–8 hours |\n\n"
                "> [!TIP] Consistent schedule matters more than hitting exact hours.")

    if any(_contains(msg,t) for t in [
        "can't sleep","unable to sleep","trouble sleeping","insomnia","not sleeping well",
        "poor sleep","sleep problems","neend nahi aati","sleep tips","how to sleep better",
    ]):
        return ("## Tips to Sleep Better 🌙\n\n"
                "- Fixed sleep/wake time every day\n"
                "- No screens 1 hour before bed\n"
                "- Cool, dark room (18–20°C ideal)\n"
                "- No caffeine after 2 PM\n"
                "- Light dinner 2–3 hrs before sleep\n"
                "- Deep breathing or light stretching\n\n"
                "> [!WARNING] Persistent insomnia (3+ weeks) should be checked by a doctor.")

    # ══ F — COMMON SYMPTOMS ══════════════════════════════════════════════════

    if any(_contains(msg,t) for t in [
        "i have fever","i have a fever","mujhe bukhar hai","bukhar hai","fever hai",
        "running fever","high temperature","feeling feverish","fever since","fever for",
        "fever symptoms","what to do for fever","fever ka ilaj","fever me kya kare",
    ]) or _exact(msg,"fever","bukhar"):
        return ("## Fever — What to Do 🌡️\n\n"
                "- Rest and stay **well hydrated** (water, ORS, coconut water)\n"
                "- **Paracetamol** (Crocin/Dolo 650) for temp above 100.4°F\n"
                "- Cool damp cloth on forehead\n"
                "- Light clothing, ventilated room\n"
                "- **Eat:** Khichdi, dal rice, bananas, yogurt\n\n"
                "> [!WARNING] See a doctor if fever > 103°F, lasts > 3 days, or comes with rash/stiff neck.")

    if any(_contains(msg,t) for t in [
        "i have a cold","runny nose","stuffy nose","blocked nose","nasal congestion",
        "sardi hai","nazla","zukam","common cold","sneezing","cold and cough",
    ]) or _exact(msg,"cold","sardi","zukam"):
        return ("## Common Cold — Relief Tips 🤧\n\n"
                "- **Steam inhalation** 2–3x/day\n"
                "- **Warm salt water gargle** 3x/day\n"
                "- **Ginger-honey-lemon tea**\n"
                "- **Turmeric milk** before bed\n"
                "- Plenty of warm fluids\n\n"
                "> [!NOTE] Cold resolves in 5–7 days. If symptoms worsen after day 7, see a doctor.")

    if any(_contains(msg,t) for t in [
        "i have cough","dry cough","wet cough","khansi hai","khansi","coughing",
        "persistent cough","cough remedy","cough ka ilaj","cough with phlegm",
    ]) or _exact(msg,"cough","khansi"):
        return ("## Cough — Relief Tips 😮‍💨\n\n"
                "- **Honey** (1 tsp) — proven cough suppressant\n"
                "- **Ginger tea with honey**\n"
                "- **Steam inhalation** for wet cough\n"
                "- **Tulsi tea** — helps both dry and wet cough\n"
                "- Stay hydrated\n\n"
                "> [!WARNING] See a doctor if cough lasts > 2–3 weeks or you cough up blood.")

    if any(_contains(msg,t) for t in [
        "i have headache","i have a headache","sir dard","sir dard hai","headache hai",
        "my head hurts","head pain","migraine","tension headache","headache remedy",
    ]) or _exact(msg,"headache","sirdard"):
        return ("## Headache — Relief Tips 🤕\n\n"
                "**Common causes:** dehydration, stress, poor sleep, eye strain\n\n"
                "- Drink **1–2 glasses of water** first\n"
                "- Rest in a quiet, dark room\n"
                "- Cold/warm pack on forehead\n"
                "- Gentle neck massage with peppermint oil\n"
                "- Break from screens\n"
                "- Paracetamol 500mg if needed\n\n"
                "> [!WARNING] Sudden severe headache, or with fever/stiff neck — go to emergency.")

    if any(_contains(msg,t) for t in [
        "stomach pain","stomach ache","pet dard","pait dard","tummy ache",
        "stomach hurts","acidity","gas problem","bloating","indigestion",
    ]) or _exact(msg,"acidity","bloating","indigestion"):
        return ("## Stomach Pain / Acidity — Relief 🫃\n\n"
                "- **Warm water** sipped slowly\n"
                "- **Ginger tea** or **jeera water**\n"
                "- **Ajwain with warm water** — great for gas\n"
                "- **Avoid:** spicy, oily, fried, carbonated drinks\n"
                "- Antacids (Gelusil, Digene) for acidity\n\n"
                "> [!WARNING] Severe/persistent pain (> 2 days) or fever/blood in stool — see a doctor.")

    if any(_contains(msg,t) for t in [
        "i feel nauseous","nausea","i feel like vomiting","i want to vomit",
        "vomiting","ulti","ulti aa rahi hai","feel sick","feeling sick","motion sickness",
    ]):
        return ("## Nausea & Vomiting — Relief 🤢\n\n"
                "- Sit/lie down and rest quietly\n"
                "- Slow deep breaths of fresh air\n"
                "- Sip **cold water or ice chips** slowly\n"
                "- **Ginger** in any form — proven anti-nausea\n"
                "- ORS if vomiting has occurred\n\n"
                "> [!WARNING] Vomiting > 24 hrs, blood in vomit, or severe dehydration — seek medical help.")

    if any(_contains(msg,t) for t in [
        "diarrhea","diarrhoea","loose motion","loose motions","loose stool",
        "watery stool","dast","dast ho raha hai","pet kharab",
    ]):
        return ("## Loose Motion / Diarrhea 🚽\n\n"
                "**Prevent dehydration first:**\n"
                "- **ORS** — 1 packet in 1 litre water\n"
                "- Coconut water, nimbu pani with salt\n\n"
                "**Diet (BRAT):** Banana, Rice, Applesauce, Toast + curd\n"
                "**Avoid:** Dairy (except curd), spicy/oily food\n\n"
                "> [!WARNING] Diarrhea > 2 days, blood/mucus in stool, or dehydration signs — see a doctor.")

    if any(_contains(msg,t) for t in [
        "sore throat","throat pain","gale me dard","gala dard","throat infection",
        "difficulty swallowing","tonsils","tonsil pain",
    ]):
        return ("## Sore Throat — Relief 🗣️\n\n"
                "- **Warm salt water gargle** 3–4x/day\n"
                "- **Honey + warm water or ginger tea**\n"
                "- **Turmeric milk** before bed\n"
                "- Rest your voice\n"
                "- Strepsils lozenges / Paracetamol for pain\n\n"
                "> [!WARNING] White patches on tonsils, high fever, difficulty breathing — see a doctor.")

    if any(_contains(msg,t) for t in [
        "body pain","body ache","muscle pain","badan dard","body dard",
        "joint pain","back pain","kamar dard","my body hurts","feeling body pain",
    ]):
        return ("## Body Pain / Muscle Ache — Relief 💪\n\n"
                "- **Rest** and warm compress on painful areas\n"
                "- **Gentle stretching**\n"
                "- Stay **hydrated**\n"
                "- Warm bath with Epsom salt\n"
                "- Paracetamol or Ibuprofen (not on empty stomach)\n\n"
                "> [!WARNING] Severe or persistent pain (> 5–7 days) — see a doctor.")

    if any(_contains(msg,t) for t in [
        "i feel tired","feeling tired","fatigue","always tired","constantly tired",
        "weakness","feeling weak","kamzori","thakaan","no energy","low energy",
    ]):
        return ("## Fatigue & Weakness 😴\n\n"
                "**Common causes:** poor sleep, anemia, thyroid, diabetes, vitamin deficiency\n\n"
                "- Ensure **7–9 hrs sleep**\n"
                "- Eat **iron-rich foods**: spinach, dates, pomegranate\n"
                "- **Vitamin D**: 15–20 min sunlight daily\n"
                "- Stay **hydrated**, eat regular balanced meals\n\n"
                "> [!TIP] Persistent fatigue > 2 weeks? Upload your lab report on **Analyze** to check for anemia/thyroid.")

    if any(_contains(msg,t) for t in [
        "feeling dizzy","i feel dizzy","dizziness","vertigo","head spinning",
        "chakkar aa raha","chakkar","sir ghoom raha","lightheaded",
    ]) or _exact(msg,"dizzy","chakkar"):
        return ("## Dizziness — What to Do 💫\n\n"
                "- **Sit or lie down immediately**\n"
                "- Drink water or a sweet drink\n"
                "- Breathe slowly and deeply\n"
                "- Stand up slowly — avoid sudden movements\n\n"
                "> [!WARNING] With chest pain, numbness, or difficulty speaking — call emergency.")

    if any(_contains(msg,t) for t in [
        "i feel stressed","feeling stressed","stress","anxiety","i feel anxious",
        "mental health","depression","feeling low","feeling sad","overthinking",
        "tension ho rahi","chinta","pareshan hoon",
    ]):
        return ("## Managing Stress & Anxiety 🧠\n\n"
                "**Immediate relief:**\n"
                "- **4-7-8 breathing:** Inhale 4s → Hold 7s → Exhale 8s\n"
                "- **5-4-3-2-1 grounding:** 5 things you see, 4 you hear, 3 you can touch\n"
                "- 10-minute walk\n\n"
                "**Long-term:**\n"
                "- Regular exercise, meditation, consistent sleep\n"
                "- Limit caffeine, news, social media\n\n"
                "> [!WARNING] Persistent sadness or thoughts of self-harm — please speak to a mental health professional. 💙")

    # ══ G — MISC HEALTH ══════════════════════════════════════════════════════

    if any(_contains(msg,t) for t in [
        "how to lose weight","weight loss tips","lose weight fast","weight kam karna",
        "fat loss","how to reduce weight",
    ]):
        return ("## Weight Loss Tips ⚖️\n\n"
                "- **Calorie deficit** (~500 cal/day = ~0.5 kg/week loss)\n"
                "- **Eat more:** vegetables, protein, fibre\n"
                "- **Eat less:** sugar, refined carbs, fried foods\n"
                "- **Exercise:** 150+ min cardio/week + 2 days strength\n"
                "- **Sleep 7–9 hours** — sleep deprivation raises hunger hormones\n\n"
                "> [!TIP] Sustainable 0.5–1 kg/week is healthiest. Upload your report for a personalised plan!")

    if any(_contains(msg,t) for t in [
        "how to boost immunity","improve immunity","boost immune system",
        "immunity badhana","weak immunity","baar baar bimar hona",
    ]):
        return ("## How to Boost Your Immunity 🛡️\n\n"
                "- **Vitamin C:** amla, oranges, guava\n"
                "- **Vitamin D:** 15–20 min morning sunlight\n"
                "- **Probiotics:** curd, buttermilk\n"
                "- **Turmeric + black pepper**\n"
                "- Regular exercise, 7–9 hrs sleep, manage stress\n"
                "- No smoking, minimal alcohol\n\n"
                "> [!TIP] Frequent illness? A CBC blood test can check for underlying deficiencies.")

    if any(_contains(msg,t) for t in [
        "what is bmi","how to calculate bmi","bmi kya hai","bmi calculator",
        "healthy bmi","body mass index",
    ]):
        return ("## BMI (Body Mass Index) 📏\n\n"
                "**Formula:** BMI = Weight (kg) ÷ Height² (m²)\n\n"
                "| BMI Range | Category |\n|---|---|\n"
                "| Below 18.5 | Underweight |\n"
                "| 18.5–24.9 | **Normal / Healthy** |\n"
                "| 25.0–29.9 | Overweight |\n"
                "| 30.0+ | Obese |\n\n"
                "> [!NOTE] BMI is a screening tool, not a diagnosis. Consult a doctor for full assessment.")

    return None  # → Gemini


# ── Schemas ───────────────────────────────────────────────────────────────────
class SignupReq(BaseModel):
    name: str
    email: str
    password: str

class LoginReq(BaseModel):
    email: str
    password: str

class FormPredictReq(BaseModel):
    disease: str
    symptoms: dict

class ChatReq(BaseModel):
    prediction_id: Optional[int] = None
    message: str
    history: List[dict] = []
    disease_context: str = ""

    @validator("message")
    def msg_length(cls, v):
        if len(v) > MAX_CHAT_MSG_LEN:
            raise ValueError(f"Message too long (max {MAX_CHAT_MSG_LEN} characters).")
        return v

class ProfileUpdateReq(BaseModel):
    name:      Optional[str]   = None
    age:       Optional[int]   = None
    gender:    Optional[str]   = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None


# ── Master Gemini prompt ──────────────────────────────────────────────────────
def build_analysis_prompt(disease_context: str, values: str, input_type: str) -> str:
    return f"""You are MediSense AI, an expert medical AI assistant. Analyze the following {input_type} and provide a comprehensive health assessment.

{values}

Respond ONLY with a valid JSON object (no markdown, no extra text) with this EXACT structure:

{{
  "detected_disease": "Primary disease name or 'No significant disease detected'",
  "risk_level": "High/Medium/Low",
  "confidence": "85%",
  "summary": "2-3 sentence plain English summary of findings",
  "explanation": {{
    "why_detected": "Very clear explanation in simple language",
    "key_indicators": ["indicator 1 with value", "indicator 2 with value", "indicator 3 with value"],
    "what_it_means": "What this means for the patient's daily life"
  }},
  "extracted_values": {{ "parameter_name": "value with unit" }},
  "abnormal_values": [
    {{"parameter": "name", "value": "actual", "normal_range": "range", "status": "High/Low/Normal"}}
  ],
  "dos": ["Specific actionable do", "Another do", "Another do", "Another do", "Another do"],
  "donts": ["Specific dont", "Another dont", "Another dont", "Another dont"],
  "diet_chart": {{
    "morning": ["food 1", "food 2"],
    "breakfast": ["meal 1", "meal 2"],
    "mid_morning": ["snack"],
    "lunch": ["meal 1", "meal 2"],
    "evening": ["snack"],
    "dinner": ["dinner 1", "dinner 2"],
    "avoid": ["food 1", "food 2", "food 3"],
    "notes": "Special dietary note"
  }},
  "specialist": {{
    "type": "Type of doctor",
    "urgency": "Immediate/Within 1 week/Within 1 month/Routine checkup",
    "reason": "Why this specialist",
    "search_terms": ["term 1", "term 2"]
  }},
  "emergency_signs": ["Sign 1", "Sign 2", "Sign 3"],
  "lifestyle_changes": ["Change 1", "Change 2", "Change 3"],
  "follow_up_tests": ["Test 1", "Test 2"],
  "positive_findings": ["What is normal/good"]
}}

Be specific to the actual values provided. Always be medically accurate but use simple language."""


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "MediSense v2 API running", "version": "2.0.0"}


# ── Auth ──────────────────────────────────────────────────────────────────────
@app.post("/api/auth/signup")
def signup(data: SignupReq):
    conn = get_db()
    if conn.execute("SELECT id FROM users WHERE email=?", (data.email,)).fetchone():
        conn.close()
        raise HTTPException(400, "Email already registered")
    token = secrets.token_hex(32)
    conn.execute("INSERT INTO users (name,email,password_hash,token) VALUES (?,?,?,?)",
                 (data.name, data.email, hash_pw(data.password), token))
    conn.commit()
    user = conn.execute("SELECT * FROM users WHERE email=?", (data.email,)).fetchone()
    conn.close()
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}


@app.post("/api/auth/login")
def login(data: LoginReq):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email=?", (data.email,)).fetchone()
    if not user or not verify_pw(data.password, user["password_hash"]):
        conn.close()
        raise HTTPException(401, "Invalid credentials")
    token = secrets.token_hex(32)
    conn.execute("UPDATE users SET token=? WHERE id=?", (token, user["id"]))
    conn.commit()
    conn.close()
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}


@app.get("/api/auth/me")
def me(user=Depends(get_user)):
    if not user:
        raise HTTPException(401, "Not authenticated")
    return {
        "id": user["id"], "name": user["name"], "email": user["email"],
        "age": user.get("age"), "gender": user.get("gender"),
        "weight_kg": user.get("weight_kg"), "height_cm": user.get("height_cm")
    }


# ── Profile update ────────────────────────────────────────────────────────────
@app.put("/api/auth/profile")
def update_profile(data: ProfileUpdateReq, user=Depends(get_user)):
    if not user:
        raise HTTPException(401, "Not authenticated")
    fields, values = [], []
    for col in ["name", "age", "gender", "weight_kg", "height_cm"]:
        val = getattr(data, col)
        if val is not None:
            fields.append(f"{col}=?")
            values.append(val)
    if not fields:
        raise HTTPException(400, "No fields to update")
    values.append(user["id"])
    conn = get_db()
    conn.execute(f"UPDATE users SET {', '.join(fields)} WHERE id=?", values)
    conn.commit()
    updated = conn.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
    conn.close()
    return {
        "id": updated["id"], "name": updated["name"], "email": updated["email"],
        "age": updated["age"], "gender": updated["gender"],
        "weight_kg": updated["weight_kg"], "height_cm": updated["height_cm"]
    }


# ── Form-Based Prediction ─────────────────────────────────────────────────────
@app.post("/api/predict/form")
async def predict_form(data: FormPredictReq, user=Depends(get_user)):
    values_text = "\n".join([f"- {k}: {v}" for k, v in data.symptoms.items()])
    context = f"Disease of concern: {data.disease}\n\nPatient parameters:\n{values_text}"
    prompt = build_analysis_prompt(data.disease, context, "health parameters form")
    raw = call_gemini(prompt)
    result = parse_json_response(raw)
    pred_id = None
    if user:
        conn = get_db()
        cur = conn.execute(
            "INSERT INTO predictions (user_id,disease,risk_level,confidence,summary,input_type,raw_input,created_at) VALUES (?,?,?,?,?,?,?,?)",
            (user["id"], result.get("detected_disease", data.disease),
             result.get("risk_level", "Unknown"), result.get("confidence", "N/A"),
             result.get("summary", ""), "form", json.dumps(data.symptoms),
             datetime.now().isoformat()))
        pred_id = cur.lastrowid
        conn.commit()
        conn.close()
    result["prediction_id"] = pred_id
    return result


# ── Report Upload & Analysis ──────────────────────────────────────────────────
@app.post("/api/predict/report")
async def predict_report(file: UploadFile = File(...), user=Depends(get_user)):
    content = await file.read()
    mime = file.content_type or "image/jpeg"
    if mime == "application/pdf" or file.filename.lower().endswith(".pdf"):
        b64 = base64.b64encode(content).decode()
        prompt = build_analysis_prompt("", "Please analyze this medical lab report document completely.", "medical lab report/document")
        try:
            model = genai.GenerativeModel(MODEL_VISION)
            response = model.generate_content([
                {"inline_data": {"mime_type": "application/pdf", "data": b64}},
                prompt
            ])
            raw = response.text.strip()
        except Exception as e:
            raise HTTPException(500, f"Error processing PDF: {str(e)}")
    else:
        b64 = base64.b64encode(content).decode()
        image_data = {"mime_type": mime, "data": b64}
        prompt = build_analysis_prompt("", "Analyze this medical lab report/test image completely.", "medical lab report image")
        raw = call_gemini(prompt, image_data)
    result = parse_json_response(raw)
    pred_id = None
    if user:
        conn = get_db()
        cur = conn.execute(
            "INSERT INTO predictions (user_id,disease,risk_level,confidence,summary,input_type,raw_input,created_at) VALUES (?,?,?,?,?,?,?,?)",
            (user["id"], result.get("detected_disease", "Lab Report Analysis"),
             result.get("risk_level", "Unknown"), result.get("confidence", "N/A"),
             result.get("summary", ""), "report", file.filename,
             datetime.now().isoformat()))
        pred_id = cur.lastrowid
        conn.commit()
        conn.close()
    result["prediction_id"] = pred_id
    return result


# ── AI Chat ───────────────────────────────────────────────────────────────────
@app.post("/api/chat")
async def chat(data: ChatReq, user=Depends(get_user)):
    # Step 1 — instant local response
    instant = get_instant_response(data.message)
    if instant:
        if data.prediction_id and user:
            conn = get_db()
            conn.execute("INSERT INTO chats (prediction_id,role,message,created_at) VALUES (?,?,?,?)",
                         (data.prediction_id, "user", data.message, datetime.now().isoformat()))
            conn.execute("INSERT INTO chats (prediction_id,role,message,created_at) VALUES (?,?,?,?)",
                         (data.prediction_id, "ai", instant, datetime.now().isoformat()))
            conn.commit()
            conn.close()
        return {"response": instant}

    # Step 2 — build history
    history_text = ""
    for msg in data.history[-10:]:
        role = "User" if msg["role"] == "user" else "MediSense AI"
        history_text += f"{role}: {msg['content']}\n\n"

    # Step 3 — call Gemini
    prompt = f"""You are MediSense AI, an empathetic, multilingual, and professional health assistant.

## PATIENT CONTEXT
Condition: {data.disease_context if data.disease_context else "General"}

## CONVERSATION SO FAR
{history_text.strip() if history_text.strip() else "Start of conversation."}

## USER'S INPUT
{data.message}

---

## RESPONDING PROTOCOL

**1. PHATICS, GREETINGS & SMALL TALK:**
- Reply VERY briefly (1-2 sentences), warmly, in the EXACT same language the user used.
- DO NOT output medical disclaimers, tables, or markdown formatting. Stop here.

**2. MEDICAL & SYSTEM QUERIES:**
- Use `**bold**` for key medical terms, values, food names
- Use `## Section Title` headings for multi-section responses
- Use `- item` bullet lists for tips, foods, symptoms
- Use `1. item` numbered lists for steps or schedules
- Use markdown pipe tables for diet charts, weekly plans, comparisons
- Use `> [!TIP]`, `> [!WARNING]`, `> [!NOTE]` callouts
- Use `==value==` to highlight specific numbers like ==148 mg/dL==
- ALWAYS provide diet charts as a full 7-day markdown table when asked
- End medical advice responses with:
> [!WARNING] Note: This information is for educational purposes only. Always consult your doctor before making changes to your diet, medication, or exercise routine.
"""
    response = call_gemini(prompt)

    # Step 4 — persist
    if data.prediction_id and user:
        conn = get_db()
        conn.execute("INSERT INTO chats (prediction_id,role,message,created_at) VALUES (?,?,?,?)",
                     (data.prediction_id, "user", data.message, datetime.now().isoformat()))
        conn.execute("INSERT INTO chats (prediction_id,role,message,created_at) VALUES (?,?,?,?)",
                     (data.prediction_id, "ai", response, datetime.now().isoformat()))
        conn.commit()
        conn.close()
    return {"response": response}


# ── History ───────────────────────────────────────────────────────────────────
@app.get("/api/history")
def history(user=Depends(get_user)):
    if not user:
        raise HTTPException(401, "Login required")
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM predictions WHERE user_id=? ORDER BY created_at DESC LIMIT 20",
        (user["id"],)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/stats")
def stats():
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) as c FROM predictions").fetchone()["c"]
    conn.close()
    return {"total_predictions": total}


if __name__ == "__main__":
    import uvicorn  # type: ignore
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
