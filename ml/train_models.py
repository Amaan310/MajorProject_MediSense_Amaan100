"""
MediSense - Disease Prediction Models Training Script
Trains 5 models: Diabetes, Heart Disease, Liver Disease, Kidney Disease, Parkinson's
"""

import numpy as np
import pandas as pd
import joblib
import json
import os
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix, roc_auc_score
)
from sklearn.pipeline import Pipeline

np.random.seed(42)
MODELS_DIR = "../models"
os.makedirs(MODELS_DIR, exist_ok=True)

results_summary = {}

# ─────────────────────────────────────────────
# 1. DIABETES  (Pima Indians style)
# ─────────────────────────────────────────────
def generate_diabetes_data(n=1500):
    pos = int(n * 0.35)
    neg = n - pos

    def pos_samples(n):
        return pd.DataFrame({
            "Pregnancies":          np.random.randint(3, 12, n),
            "Glucose":              np.random.normal(148, 20, n).clip(80, 250),
            "BloodPressure":        np.random.normal(78, 12, n).clip(40, 120),
            "SkinThickness":        np.random.normal(32, 10, n).clip(10, 60),
            "Insulin":              np.random.normal(200, 80, n).clip(20, 500),
            "BMI":                  np.random.normal(34, 6, n).clip(18, 55),
            "DiabetesPedigreeFunction": np.random.normal(0.65, 0.2, n).clip(0.08, 2.4),
            "Age":                  np.random.randint(35, 75, n),
            "Outcome":              1
        })

    def neg_samples(n):
        return pd.DataFrame({
            "Pregnancies":          np.random.randint(0, 5, n),
            "Glucose":              np.random.normal(108, 18, n).clip(60, 160),
            "BloodPressure":        np.random.normal(68, 10, n).clip(40, 100),
            "SkinThickness":        np.random.normal(22, 8, n).clip(5, 45),
            "Insulin":              np.random.normal(80, 40, n).clip(10, 250),
            "BMI":                  np.random.normal(27, 5, n).clip(15, 45),
            "DiabetesPedigreeFunction": np.random.normal(0.35, 0.15, n).clip(0.08, 1.2),
            "Age":                  np.random.randint(18, 55, n),
            "Outcome":              0
        })

    df = pd.concat([pos_samples(pos), neg_samples(neg)]).sample(frac=1).reset_index(drop=True)
    return df

df = generate_diabetes_data()
X = df.drop("Outcome", axis=1)
y = df["Outcome"]
features = list(X.columns)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("model", RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42, class_weight="balanced"))
])
pipe.fit(X_train, y_train)
y_pred = pipe.predict(X_test)
acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, pipe.predict_proba(X_test)[:, 1])

joblib.dump(pipe, f"{MODELS_DIR}/diabetes_model.pkl")
joblib.dump(features, f"{MODELS_DIR}/diabetes_features.pkl")

results_summary["diabetes"] = {
    "accuracy": round(acc * 100, 2),
    "auc": round(auc, 4),
    "features": features,
    "label_map": {0: "No Diabetes", 1: "Diabetes Detected"}
}
print(f"[1/5] Diabetes   → Accuracy: {acc*100:.1f}%  AUC: {auc:.4f}")


# ─────────────────────────────────────────────
# 2. HEART DISEASE  (UCI Cleveland style)
# ─────────────────────────────────────────────
def generate_heart_data(n=1400):
    pos = int(n * 0.45)
    neg = n - pos

    def pos_samples(n):
        return pd.DataFrame({
            "age":          np.random.randint(50, 78, n),
            "sex":          np.random.choice([0, 1], n, p=[0.3, 0.7]),
            "cp":           np.random.choice([0, 1, 2, 3], n, p=[0.5, 0.2, 0.2, 0.1]),
            "trestbps":     np.random.normal(145, 18, n).clip(90, 200).astype(int),
            "chol":         np.random.normal(260, 45, n).clip(150, 400).astype(int),
            "fbs":          np.random.choice([0, 1], n, p=[0.55, 0.45]),
            "restecg":      np.random.choice([0, 1, 2], n, p=[0.4, 0.45, 0.15]),
            "thalach":      np.random.normal(138, 22, n).clip(70, 195).astype(int),
            "exang":        np.random.choice([0, 1], n, p=[0.4, 0.6]),
            "oldpeak":      np.random.normal(2.0, 1.2, n).clip(0, 6.2).round(1),
            "slope":        np.random.choice([0, 1, 2], n, p=[0.25, 0.5, 0.25]),
            "ca":           np.random.choice([0, 1, 2, 3], n, p=[0.25, 0.35, 0.25, 0.15]),
            "thal":         np.random.choice([1, 2, 3], n, p=[0.1, 0.6, 0.3]),
            "target":       1
        })

    def neg_samples(n):
        return pd.DataFrame({
            "age":          np.random.randint(30, 65, n),
            "sex":          np.random.choice([0, 1], n, p=[0.5, 0.5]),
            "cp":           np.random.choice([0, 1, 2, 3], n, p=[0.15, 0.25, 0.35, 0.25]),
            "trestbps":     np.random.normal(128, 14, n).clip(90, 180).astype(int),
            "chol":         np.random.normal(220, 40, n).clip(140, 340).astype(int),
            "fbs":          np.random.choice([0, 1], n, p=[0.8, 0.2]),
            "restecg":      np.random.choice([0, 1, 2], n, p=[0.55, 0.35, 0.1]),
            "thalach":      np.random.normal(162, 18, n).clip(100, 200).astype(int),
            "exang":        np.random.choice([0, 1], n, p=[0.8, 0.2]),
            "oldpeak":      np.random.normal(0.6, 0.6, n).clip(0, 3.5).round(1),
            "slope":        np.random.choice([0, 1, 2], n, p=[0.1, 0.3, 0.6]),
            "ca":           np.random.choice([0, 1, 2, 3], n, p=[0.6, 0.25, 0.1, 0.05]),
            "thal":         np.random.choice([1, 2, 3], n, p=[0.05, 0.7, 0.25]),
            "target":       0
        })

    df = pd.concat([pos_samples(pos), neg_samples(neg)]).sample(frac=1).reset_index(drop=True)
    return df

df = generate_heart_data()
X = df.drop("target", axis=1)
y = df["target"]
features = list(X.columns)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("model", RandomForestClassifier(n_estimators=200, max_depth=9, random_state=42, class_weight="balanced"))
])
pipe.fit(X_train, y_train)
y_pred = pipe.predict(X_test)
acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, pipe.predict_proba(X_test)[:, 1])

joblib.dump(pipe, f"{MODELS_DIR}/heart_model.pkl")
joblib.dump(features, f"{MODELS_DIR}/heart_features.pkl")

results_summary["heart"] = {
    "accuracy": round(acc * 100, 2),
    "auc": round(auc, 4),
    "features": features,
    "label_map": {0: "No Heart Disease", 1: "Heart Disease Detected"}
}
print(f"[2/5] Heart      → Accuracy: {acc*100:.1f}%  AUC: {auc:.4f}")


# ─────────────────────────────────────────────
# 3. LIVER DISEASE  (ILPD style)
# ─────────────────────────────────────────────
def generate_liver_data(n=1200):
    pos = int(n * 0.42)
    neg = n - pos

    def pos_samples(n):
        return pd.DataFrame({
            "Age":              np.random.randint(35, 75, n),
            "Gender":           np.random.choice([0, 1], n, p=[0.35, 0.65]),
            "Total_Bilirubin":  np.random.normal(3.5, 2.5, n).clip(0.4, 15),
            "Direct_Bilirubin": np.random.normal(1.8, 1.5, n).clip(0.1, 8),
            "Alkaline_Phosphotase": np.random.normal(280, 120, n).clip(60, 700).astype(int),
            "Alamine_Aminotransferase": np.random.normal(80, 60, n).clip(7, 400).astype(int),
            "Aspartate_Aminotransferase": np.random.normal(90, 70, n).clip(10, 450).astype(int),
            "Total_Protiens":   np.random.normal(6.2, 0.9, n).clip(2.7, 9.6),
            "Albumin":          np.random.normal(3.0, 0.7, n).clip(0.9, 5.5),
            "Albumin_and_Globulin_Ratio": np.random.normal(0.9, 0.3, n).clip(0.3, 2.8),
            "Dataset":          1
        })

    def neg_samples(n):
        return pd.DataFrame({
            "Age":              np.random.randint(20, 65, n),
            "Gender":           np.random.choice([0, 1], n, p=[0.5, 0.5]),
            "Total_Bilirubin":  np.random.normal(0.9, 0.4, n).clip(0.2, 3.5),
            "Direct_Bilirubin": np.random.normal(0.3, 0.15, n).clip(0.1, 1.5),
            "Alkaline_Phosphotase": np.random.normal(180, 60, n).clip(60, 400).astype(int),
            "Alamine_Aminotransferase": np.random.normal(25, 12, n).clip(7, 80).astype(int),
            "Aspartate_Aminotransferase": np.random.normal(28, 12, n).clip(10, 80).astype(int),
            "Total_Protiens":   np.random.normal(7.2, 0.7, n).clip(4.5, 9.6),
            "Albumin":          np.random.normal(4.1, 0.4, n).clip(2.5, 5.5),
            "Albumin_and_Globulin_Ratio": np.random.normal(1.4, 0.3, n).clip(0.5, 2.8),
            "Dataset":          0
        })

    df = pd.concat([pos_samples(pos), neg_samples(neg)]).sample(frac=1).reset_index(drop=True)
    return df

df = generate_liver_data()
X = df.drop("Dataset", axis=1)
y = df["Dataset"]
features = list(X.columns)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("model", RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42, class_weight="balanced"))
])
pipe.fit(X_train, y_train)
y_pred = pipe.predict(X_test)
acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, pipe.predict_proba(X_test)[:, 1])

joblib.dump(pipe, f"{MODELS_DIR}/liver_model.pkl")
joblib.dump(features, f"{MODELS_DIR}/liver_features.pkl")

results_summary["liver"] = {
    "accuracy": round(acc * 100, 2),
    "auc": round(auc, 4),
    "features": features,
    "label_map": {0: "No Liver Disease", 1: "Liver Disease Detected"}
}
print(f"[3/5] Liver      → Accuracy: {acc*100:.1f}%  AUC: {auc:.4f}")


# ─────────────────────────────────────────────
# 4. KIDNEY DISEASE  (UCI CKD style)
# ─────────────────────────────────────────────
def generate_kidney_data(n=1200):
    pos = int(n * 0.4)
    neg = n - pos

    def pos_samples(n):
        return pd.DataFrame({
            "age":      np.random.randint(40, 80, n),
            "bp":       np.random.normal(82, 15, n).clip(50, 130).astype(int),
            "sg":       np.random.choice([1.005, 1.010, 1.015, 1.020, 1.025], n, p=[0.35, 0.35, 0.15, 0.1, 0.05]),
            "al":       np.random.choice([0, 1, 2, 3, 4], n, p=[0.1, 0.2, 0.3, 0.25, 0.15]),
            "su":       np.random.choice([0, 1, 2, 3, 4], n, p=[0.3, 0.25, 0.2, 0.15, 0.1]),
            "bgr":      np.random.normal(170, 70, n).clip(70, 490).astype(int),
            "bu":       np.random.normal(65, 40, n).clip(10, 200).astype(int),
            "sc":       np.random.normal(4.5, 3.0, n).clip(0.5, 15).round(1),
            "sod":      np.random.normal(133, 6, n).clip(110, 150).astype(int),
            "pot":      np.random.normal(5.2, 1.5, n).clip(2.5, 9.0).round(1),
            "hemo":     np.random.normal(10.5, 2.5, n).clip(3.1, 17.8).round(1),
            "pcv":      np.random.normal(31, 7, n).clip(9, 54).astype(int),
            "htn":      np.random.choice([0, 1], n, p=[0.3, 0.7]),
            "dm":       np.random.choice([0, 1], n, p=[0.45, 0.55]),
            "classification": 1
        })

    def neg_samples(n):
        return pd.DataFrame({
            "age":      np.random.randint(15, 65, n),
            "bp":       np.random.normal(70, 10, n).clip(50, 100).astype(int),
            "sg":       np.random.choice([1.005, 1.010, 1.015, 1.020, 1.025], n, p=[0.05, 0.1, 0.25, 0.35, 0.25]),
            "al":       np.random.choice([0, 1, 2, 3, 4], n, p=[0.7, 0.2, 0.06, 0.03, 0.01]),
            "su":       np.random.choice([0, 1, 2, 3, 4], n, p=[0.75, 0.15, 0.06, 0.03, 0.01]),
            "bgr":      np.random.normal(112, 25, n).clip(70, 200).astype(int),
            "bu":       np.random.normal(30, 12, n).clip(10, 80).astype(int),
            "sc":       np.random.normal(1.0, 0.3, n).clip(0.4, 3.0).round(1),
            "sod":      np.random.normal(141, 3, n).clip(130, 150).astype(int),
            "pot":      np.random.normal(4.4, 0.5, n).clip(2.5, 6.5).round(1),
            "hemo":     np.random.normal(14.5, 1.5, n).clip(8, 17.8).round(1),
            "pcv":      np.random.normal(44, 4, n).clip(28, 54).astype(int),
            "htn":      np.random.choice([0, 1], n, p=[0.85, 0.15]),
            "dm":       np.random.choice([0, 1], n, p=[0.9, 0.1]),
            "classification": 0
        })

    df = pd.concat([pos_samples(pos), neg_samples(neg)]).sample(frac=1).reset_index(drop=True)
    return df

df = generate_kidney_data()
X = df.drop("classification", axis=1)
y = df["classification"]
features = list(X.columns)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("model", RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42, class_weight="balanced"))
])
pipe.fit(X_train, y_train)
y_pred = pipe.predict(X_test)
acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, pipe.predict_proba(X_test)[:, 1])

joblib.dump(pipe, f"{MODELS_DIR}/kidney_model.pkl")
joblib.dump(features, f"{MODELS_DIR}/kidney_features.pkl")

results_summary["kidney"] = {
    "accuracy": round(acc * 100, 2),
    "auc": round(auc, 4),
    "features": features,
    "label_map": {0: "No Kidney Disease", 1: "Kidney Disease Detected"}
}
print(f"[4/5] Kidney     → Accuracy: {acc*100:.1f}%  AUC: {auc:.4f}")


# ─────────────────────────────────────────────
# 5. PARKINSON'S  (UCI style)
# ─────────────────────────────────────────────
def generate_parkinsons_data(n=1000):
    pos = int(n * 0.75)
    neg = n - pos

    def pos_samples(n):
        return pd.DataFrame({
            "MDVP:Fo(Hz)":      np.random.normal(145, 30, n).clip(80, 260),
            "MDVP:Fhi(Hz)":     np.random.normal(195, 55, n).clip(100, 600),
            "MDVP:Flo(Hz)":     np.random.normal(100, 25, n).clip(65, 240),
            "MDVP:Jitter(%)":   np.random.normal(0.008, 0.004, n).clip(0.001, 0.033),
            "MDVP:Shimmer":     np.random.normal(0.045, 0.025, n).clip(0.009, 0.12),
            "NHR":              np.random.normal(0.055, 0.04, n).clip(0.0005, 0.31),
            "HNR":              np.random.normal(19.5, 4.5, n).clip(8, 33),
            "RPDE":             np.random.normal(0.56, 0.1, n).clip(0.26, 0.68),
            "DFA":              np.random.normal(0.72, 0.07, n).clip(0.57, 0.83),
            "spread1":          np.random.normal(-5.2, 1.5, n).clip(-7.96, -2.4),
            "spread2":          np.random.normal(0.28, 0.1, n).clip(0.006, 0.45),
            "D2":               np.random.normal(2.6, 0.4, n).clip(1.4, 3.7),
            "PPE":              np.random.normal(0.26, 0.1, n).clip(0.04, 0.53),
            "status":           1
        })

    def neg_samples(n):
        return pd.DataFrame({
            "MDVP:Fo(Hz)":      np.random.normal(197, 22, n).clip(130, 265),
            "MDVP:Fhi(Hz)":     np.random.normal(224, 38, n).clip(140, 592),
            "MDVP:Flo(Hz)":     np.random.normal(168, 28, n).clip(110, 239),
            "MDVP:Jitter(%)":   np.random.normal(0.003, 0.001, n).clip(0.001, 0.009),
            "MDVP:Shimmer":     np.random.normal(0.018, 0.007, n).clip(0.009, 0.055),
            "NHR":              np.random.normal(0.013, 0.007, n).clip(0.0005, 0.06),
            "HNR":              np.random.normal(24.5, 3.2, n).clip(15, 33),
            "RPDE":             np.random.normal(0.44, 0.08, n).clip(0.26, 0.62),
            "DFA":              np.random.normal(0.67, 0.06, n).clip(0.57, 0.82),
            "spread1":          np.random.normal(-7.0, 0.7, n).clip(-7.96, -4.8),
            "spread2":          np.random.normal(0.13, 0.06, n).clip(0.006, 0.34),
            "D2":               np.random.normal(2.1, 0.3, n).clip(1.4, 2.8),
            "PPE":              np.random.normal(0.10, 0.04, n).clip(0.04, 0.25),
            "status":           0
        })

    df = pd.concat([pos_samples(pos), neg_samples(neg)]).sample(frac=1).reset_index(drop=True)
    return df

df = generate_parkinsons_data()
X = df.drop("status", axis=1)
y = df["status"]
features = list(X.columns)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("model", RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42, class_weight="balanced"))
])
pipe.fit(X_train, y_train)
y_pred = pipe.predict(X_test)
acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, pipe.predict_proba(X_test)[:, 1])

joblib.dump(pipe, f"{MODELS_DIR}/parkinsons_model.pkl")
joblib.dump(features, f"{MODELS_DIR}/parkinsons_features.pkl")

results_summary["parkinsons"] = {
    "accuracy": round(acc * 100, 2),
    "auc": round(auc, 4),
    "features": features,
    "label_map": {0: "No Parkinson's", 1: "Parkinson's Detected"}
}
print(f"[5/5] Parkinson's→ Accuracy: {acc*100:.1f}%  AUC: {auc:.4f}")

# Save results summary
with open(f"{MODELS_DIR}/model_results.json", "w") as f:
    json.dump(results_summary, f, indent=2)

print("\n✅ All 5 models trained and saved to /models/")
print(json.dumps({k: f"{v['accuracy']}% acc, AUC {v['auc']}" for k, v in results_summary.items()}, indent=2))
