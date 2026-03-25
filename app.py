"""
Dementia BioTracker — Flask Backend
Deploy this on Render.com
"""
import logging
logging.basicConfig(level=logging.DEBUG)
from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile, os, sys, pickle, zipfile
import numpy as np
import pandas as pd
from pathlib import Path

app = Flask(__name__)
CORS(app)  # allow Next.js frontend to call this

# ── Load model once at startup ──────────────────────────────────────
MODEL_PATH = Path(__file__).parent / "python" / "dementia_model.pkl"
model = label_encoder = FEATURES = MEDIANS = None

def load_model():
    global model, label_encoder, FEATURES, MEDIANS
    if not MODEL_PATH.exists():
        print(f"ERROR: Model not found at {MODEL_PATH}", file=sys.stderr)
        return False
    with open(MODEL_PATH, "rb") as f:
        saved = pickle.load(f)
    model         = saved["model"]
    label_encoder = saved["label_encoder"]
    FEATURES      = saved["features"]
    MEDIANS       = saved["medians"]
    print("✅ Model loaded successfully")
    return True

try:
    load_model()
except Exception as e:
    import traceback
    print("STARTUP ERROR:", e, file=sys.stderr)
    traceback.print_exc()


# ── Helpers ─────────────────────────────────────────────────────────
def find_file(zf, keyword):
    for name in zf.namelist():
        base = os.path.basename(name)
        if keyword in base and base.endswith(".csv"):
            return name
    return None

def parse_samsung_csv(zf, zip_path):
    raw   = zf.read(zip_path)
    lines = raw.decode("utf-8", errors="replace").split("\n")
    if len(lines) < 3:
        return pd.DataFrame()
    headers = lines[1].split(",")
    data = []
    for line in lines[2:]:
        if line.strip():
            vals = line.split(",")
            if len(vals) >= len(headers):
                data.append(vals[:len(headers)])
    if not data:
        return pd.DataFrame()
    return pd.DataFrame(data, columns=headers)

def extract_features(zip_path):
    feats = dict(MEDIANS)
    log   = []
    with zipfile.ZipFile(zip_path, "r") as zf:
        # Sleep
        path = None
        for n in zf.namelist():
            b = os.path.basename(n)
            if (b.startswith("com.samsung.shealth.sleep.") and b.endswith(".csv")
                    and "combined" not in b and "snoring" not in b
                    and "coaching" not in b and "stage" not in b):
                path = n; break
        if path:
            df = parse_samsung_csv(zf, path)
            df["sleep_duration"] = pd.to_numeric(df.get("sleep_duration", pd.Series()), errors="coerce")
            df["efficiency"]     = pd.to_numeric(df.get("efficiency",     pd.Series()), errors="coerce")
            valid = df[df["sleep_duration"] > 30]
            if len(valid) > 0:
                feats["sleep_duration_hours"] = round(float(valid["sleep_duration"].median()) / 60, 2)
                feats["sleep_efficiency"]     = round(float(valid["efficiency"].median()), 1)
                log.append({"source": "Sleep", "status": "ok", "records": len(valid)})

        # Sleep stages
        path = find_file(zf, "sleep_stage.")
        if path:
            df = parse_samsung_csv(zf, path)
            df["stage"]      = pd.to_numeric(df.get("stage", pd.Series()), errors="coerce")
            df["start_time"] = pd.to_datetime(df.get("start_time", pd.Series()), errors="coerce", format="mixed")
            df["end_time"]   = pd.to_datetime(df.get("end_time",   pd.Series()), errors="coerce", format="mixed")
            df = df.dropna(subset=["stage","start_time","end_time"])
            df["dur_min"] = (df["end_time"] - df["start_time"]).dt.total_seconds() / 60
            if "sleep_id" in df.columns:
                nightly = df.groupby(["sleep_id","stage"])["dur_min"].sum().unstack(fill_value=0)
                feats["awake_minutes"] = round(float(nightly.get(40001, pd.Series([MEDIANS["awake_minutes"]])).median()), 1)
                feats["light_minutes"] = round(float(nightly.get(40002, pd.Series([MEDIANS["light_minutes"]])).median()), 1)
                feats["deep_minutes"]  = round(float(nightly.get(40003, pd.Series([MEDIANS["deep_minutes"]])).median()),  1)
                feats["rem_minutes"]   = round(float(nightly.get(40004, pd.Series([MEDIANS["rem_minutes"]])).median()),   1)
                log.append({"source": "Sleep Stages", "status": "ok", "records": len(nightly)})

        # Heart rate + HRV
        path = find_file(zf, "tracker.heart_rate.")
        if path:
            df  = parse_samsung_csv(zf, path)
            col = "com.samsung.health.heart_rate.heart_rate"
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
                valid   = df[col].dropna()
                valid   = valid[(valid > 30) & (valid < 220)]
                if len(valid) > 0:
                    feats["avg_heart_rate"]       = round(float(valid.median()), 1)
                    rr_ms                         = 60000 / valid
                    feats["hrv_sdnn"]             = max(10.0, min(120.0, round(float(rr_ms.std()), 1)))
                    feats["movement_variability"] = round(float((valid.std() / valid.mean()) * 10), 3)
                    log.append({"source": "Heart Rate", "status": "ok", "records": len(valid)})

        # Stress
        path = find_file(zf, "shealth.stress.")
        if path:
            df = parse_samsung_csv(zf, path)
            if "score" in df.columns:
                df["score"] = pd.to_numeric(df["score"], errors="coerce")
                valid = df["score"].dropna()
                valid = valid[(valid >= 0) & (valid <= 100)]
                if len(valid) > 0:
                    feats["stress_level"] = round(float(valid.median()), 1)
                    log.append({"source": "Stress", "status": "ok", "records": len(valid)})

        # SpO2
        path = find_file(zf, "oxygen_saturation.")
        if path:
            df  = parse_samsung_csv(zf, path)
            col = "com.samsung.health.oxygen_saturation.spo2"
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
                valid   = df[col].dropna()
                valid   = valid[(valid > 70) & (valid <= 100)]
                if len(valid) > 0:
                    feats["spo2_avg"] = round(float(valid.median()), 1)
                    log.append({"source": "SpO2", "status": "ok", "records": len(valid)})

        # Skin temp
        path = find_file(zf, "skin_temperature.")
        if path:
            df = parse_samsung_csv(zf, path)
            if "temperature" in df.columns:
                df["temperature"] = pd.to_numeric(df["temperature"], errors="coerce")
                valid = df["temperature"].dropna()
                valid = valid[(valid > 28) & (valid < 42)]
                if len(valid) > 0:
                    feats["skin_temperature"] = round(float(valid.median()), 2)
                    log.append({"source": "Skin Temp", "status": "ok", "records": len(valid)})

        # Steps
        path = find_file(zf, "step_daily_trend.")
        if path:
            df = parse_samsung_csv(zf, path)
            if "count" in df.columns:
                df["count"] = pd.to_numeric(df["count"], errors="coerce")
                valid = df["count"].dropna()
                valid = valid[valid > 0]
                if len(valid) > 0:
                    feats["daily_steps"] = int(valid.median())
                    log.append({"source": "Daily Steps", "status": "ok", "records": len(valid)})

    return feats, log

def get_clinical_stage(risk_score):
    if risk_score <= 20:
        return {"stage_code":"STAGE 0","stage_label":"No Cognitive Impairment","cdr":"CDR 0",
                "gds":"GDS Stage 1–2","urgency":"Routine (12 months)","consult":False,
                "message":"Your wearable data shows NO significant dementia risk markers. Cognitive function appears normal for your activity patterns. Continue healthy sleep, exercise, and stress management. Recommended: Routine check-up every 12 months."}
    elif risk_score <= 40:
        return {"stage_code":"STAGE 0.5","stage_label":"Questionable / Preclinical Risk","cdr":"CDR 0.5",
                "gds":"GDS Stage 3","urgency":"Within 3 months","consult":True,
                "message":"Your data shows EARLY WARNING SIGNS. Not dementia yet, but patterns that often precede cognitive decline. Recommended: Consult a neurologist within 3 months."}
    elif risk_score <= 60:
        return {"stage_code":"STAGE 1","stage_label":"Mild Cognitive Impairment (MCI)","cdr":"CDR 0.5–1",
                "gds":"GDS Stage 3–4","urgency":"Within 1 month","consult":True,
                "message":"Your data strongly suggests MILD COGNITIVE IMPAIRMENT (MCI). MCI is the transition zone between normal aging and dementia. CONSULT A DOCTOR within 1 month. Tests: MMSE / MoCA + MRI + blood panel."}
    elif risk_score <= 80:
        return {"stage_code":"STAGE 2","stage_label":"Mild to Moderate Dementia","cdr":"CDR 1–2",
                "gds":"GDS Stage 4–5","urgency":"This week","consult":True,
                "message":"Your data shows HIGH DEMENTIA RISK consistent with mild to moderate dementia. SEE A DOCTOR THIS WEEK. Specialist needed: Neurologist / Geriatric Psychiatrist."}
    else:
        return {"stage_code":"STAGE 3","stage_label":"Moderate to Severe Dementia","cdr":"CDR 2–3",
                "gds":"GDS Stage 5–6","urgency":"TODAY","consult":True,
                "message":"CRITICAL dementia risk detected. SEEK MEDICAL ATTENTION TODAY. Take this report to a hospital neurology department."}


# ── Routes ──────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def index():
    return jsonify({"status": "Dementia BioTracker API running", "model_loaded": model is not None})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok" if model is not None else "model_missing",
        "python": True,
        "model": model is not None,
        "sklearn": True,
        "pandas": True,
        "numpy": True,
    })

@app.route("/diagnose", methods=["POST"])
def diagnose():
    if model is None:
        return jsonify({"error": "Model not loaded on server."}), 500

    if "zipFile" not in request.files:
        return jsonify({"error": "No file uploaded. Send a ZIP file as 'zipFile'."}), 400

    file = request.files["zipFile"]
    if not file.filename.endswith(".zip"):
        return jsonify({"error": "Please upload a .zip Samsung Health export."}), 400

    # Save to temp
    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        features, log = extract_features(tmp_path)

        X     = np.array([[features[f] for f in FEATURES]])
        probs = model.predict_proba(X)[0]
        idx   = probs.argmax()
        cls   = label_encoder.classes_[idx]

        # Safe probability lookup by class name
        classes  = list(label_encoder.classes_)
        prob_map = {c: float(p) for c, p in zip(classes, probs)}

        p_dem_pure = 0.0
        for k, v in prob_map.items():
            if "demented" in k.lower() and "non" not in k.lower():
                p_dem_pure = v; break
        p_mci         = next((v for k,v in prob_map.items() if "mci" in k.lower()), 0.0)
        p_nondemented = next((v for k,v in prob_map.items() if "non" in k.lower()), 0.0)

        risk_score = round(
            (p_nondemented * 15) + (p_mci * 55) + (p_dem_pure * 100), 2
        )
        risk_score = min(100.0, max(0.0, risk_score))

        stage_info = get_clinical_stage(risk_score)

        result = {
            "risk_score"     : risk_score,
            "prediction"     : cls,
            "stage_code"     : stage_info["stage_code"],
            "stage_label"    : stage_info["stage_label"],
            "stage"          : stage_info["stage_code"],
            "cdr"            : stage_info["cdr"],
            "gds"            : stage_info["gds"],
            "urgency"        : stage_info["urgency"],
            "consult_doctor" : stage_info["consult"],
            "message"        : stage_info["message"],
            "probabilities"  : {c: round(v*100, 2) for c,v in prob_map.items()},
            "features"       : {k: (int(v) if isinstance(v, (int, np.integer)) else round(float(v), 3))
                                for k,v in features.items()},
            "data_sources"   : log,
        }
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        os.unlink(tmp_path)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
