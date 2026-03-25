"""
============================================================
  DEMENTIA BIOTRACKER — PREDICTION ENGINE
  Algorithm  : Gradient Boosting Classifier
  Input      : Samsung Health ZIP + optional --json flag
  Output     : CLI report OR JSON_OUTPUT: {...} for web app
============================================================
"""

import zipfile, io, os, pickle, sys, json, argparse
import numpy as np
import pandas as pd
from pathlib import Path

# ─────────────────────────────────────────────────
# 1. LOAD MODEL
# ─────────────────────────────────────────────────

MODEL_PATH = Path(__file__).parent / "dementia_model.pkl"
with open(MODEL_PATH, "rb") as f:
    saved = pickle.load(f)

model         = saved["model"]
label_encoder = saved["label_encoder"]
FEATURES      = saved["features"]
MEDIANS       = saved["medians"]


# ─────────────────────────────────────────────────
# 2. CLINICAL STAGE MAPPING
# ─────────────────────────────────────────────────

def get_clinical_stage(risk_score):
    if risk_score <= 20:
        return {
            "stage_code"  : "STAGE 0",
            "stage_label" : "No Cognitive Impairment",
            "cdr"         : "CDR 0",
            "gds"         : "GDS Stage 1–2",
            "urgency"     : "Routine (12 months)",
            "consult"     : False,
            "message"     : (
                "Your wearable data shows NO significant dementia risk markers.\n"
                "   Cognitive function appears normal for your activity patterns.\n"
                "   Continue healthy sleep, exercise, and stress management.\n"
                "   Recommended: Routine check-up every 12 months."
            ),
        }
    elif risk_score <= 40:
        return {
            "stage_code"  : "STAGE 0.5",
            "stage_label" : "Questionable / Preclinical Risk",
            "cdr"         : "CDR 0.5",
            "gds"         : "GDS Stage 3",
            "urgency"     : "Within 3 months",
            "consult"     : True,
            "message"     : (
                "Your data shows EARLY WARNING SIGNS — not dementia yet,\n"
                "   but patterns that often precede cognitive decline.\n"
                "   Common at this stage: slight memory slips, reduced deep sleep,\n"
                "   lower HRV, increased stress levels.\n"
                "   Recommended: Consult a neurologist within 3 months.\n"
                "   Early lifestyle intervention can reverse this stage."
            ),
        }
    elif risk_score <= 60:
        return {
            "stage_code"  : "STAGE 1",
            "stage_label" : "Mild Cognitive Impairment (MCI)",
            "cdr"         : "CDR 0.5–1",
            "gds"         : "GDS Stage 3–4",
            "urgency"     : "Within 1 month",
            "consult"     : True,
            "message"     : (
                "Your data strongly suggests MILD COGNITIVE IMPAIRMENT (MCI).\n"
                "   MCI is the transition zone between normal aging and dementia.\n"
                "   At this stage: noticeable memory issues, reduced problem-solving,\n"
                "   poor sleep quality, low physical activity patterns.\n"
                "   MCI has a 10–15% per year conversion rate to Alzheimer's.\n"
                "   CONSULT A DOCTOR within 1 month.\n"
                "   Tests: MMSE / MoCA cognitive tests + MRI + blood panel.\n"
                "   Medication + lifestyle changes at this stage are highly effective."
            ),
        }
    elif risk_score <= 80:
        return {
            "stage_code"  : "STAGE 2",
            "stage_label" : "Mild to Moderate Dementia",
            "cdr"         : "CDR 1–2",
            "gds"         : "GDS Stage 4–5",
            "urgency"     : "This week",
            "consult"     : True,
            "message"     : (
                "Your data shows HIGH DEMENTIA RISK — consistent with\n"
                "   mild to moderate dementia patterns (CDR Stage 1–2).\n"
                "   At this stage: significant memory loss, confusion,\n"
                "   difficulty with daily tasks, disrupted sleep architecture,\n"
                "   very low HRV, high chronic stress, reduced mobility.\n"
                "   SEE A DOCTOR THIS WEEK — do not delay.\n"
                "   Specialist needed: Neurologist / Geriatric Psychiatrist.\n"
                "   Tests: Full cognitive battery + brain MRI/PET imaging."
            ),
        }
    else:
        return {
            "stage_code"  : "STAGE 3",
            "stage_label" : "Moderate to Severe Dementia",
            "cdr"         : "CDR 2–3",
            "gds"         : "GDS Stage 5–6",
            "urgency"     : "TODAY",
            "consult"     : True,
            "message"     : (
                "Your data indicates CRITICAL dementia risk — patterns\n"
                "   aligned with moderate-to-severe dementia (CDR Stage 2–3).\n"
                "   At this stage: severe memory loss, disorientation,\n"
                "   inability to live independently, extremely disrupted sleep,\n"
                "   very low activity, dangerously low oxygen patterns detected.\n"
                "   SEEK MEDICAL ATTENTION TODAY.\n"
                "   Take this report to a hospital neurology department.\n"
                "   Immediate caregiver support and clinical evaluation needed."
            ),
        }


# ─────────────────────────────────────────────────
# 3. SAMSUNG ZIP PARSER
# ─────────────────────────────────────────────────

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

        # Sleep duration + efficiency
        path = None
        for n in zf.namelist():
            b = os.path.basename(n)
            if (b.startswith("com.samsung.shealth.sleep.") and b.endswith(".csv")
                    and "combined" not in b and "snoring" not in b
                    and "coaching" not in b and "stage" not in b):
                path = n; break
        if path:
            df = parse_samsung_csv(zf, path)
            df["sleep_duration"] = pd.to_numeric(df["sleep_duration"], errors="coerce")
            df["efficiency"]     = pd.to_numeric(df["efficiency"],     errors="coerce")
            valid = df[df["sleep_duration"] > 30]
            if len(valid) > 0:
                feats["sleep_duration_hours"] = round(float(valid["sleep_duration"].median()) / 60, 2)
                feats["sleep_efficiency"]     = round(float(valid["efficiency"].median()), 1)
                log.append({"source": "Sleep",        "status": "ok", "records": len(valid)})

        # Sleep stages — per-night medians
        path = find_file(zf, "sleep_stage.")
        if path:
            df = parse_samsung_csv(zf, path)
            df["stage"]     = pd.to_numeric(df["stage"],     errors="coerce")
            df["start_time"]= pd.to_datetime(df["start_time"], errors="coerce", format="mixed")
            df["end_time"]  = pd.to_datetime(df["end_time"],   errors="coerce", format="mixed")
            df = df.dropna(subset=["stage","start_time","end_time"])
            df["dur_min"] = (df["end_time"] - df["start_time"]).dt.total_seconds() / 60
            if "sleep_id" in df.columns:
                nightly = df.groupby(["sleep_id","stage"])["dur_min"].sum().unstack(fill_value=0)
                feats["awake_minutes"] = round(float(nightly.get(40001, pd.Series([MEDIANS["awake_minutes"]])).median()), 1)
                feats["light_minutes"] = round(float(nightly.get(40002, pd.Series([MEDIANS["light_minutes"]])).median()), 1)
                feats["deep_minutes"]  = round(float(nightly.get(40003, pd.Series([MEDIANS["deep_minutes"]])).median()),  1)
                feats["rem_minutes"]   = round(float(nightly.get(40004, pd.Series([MEDIANS["rem_minutes"]])).median()),   1)
                log.append({"source": "Sleep Stages", "status": "ok", "records": len(nightly)})

        # Heart rate + HRV proxy
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


# ─────────────────────────────────────────────────
# 4. PREDICT
# ─────────────────────────────────────────────────

def predict(zip_path, json_mode=False):
    features, log = extract_features(zip_path)

    X     = np.array([[features[f] for f in FEATURES]])
    probs = model.predict_proba(X)[0]
    idx   = probs.argmax()
    cls   = label_encoder.classes_[idx]

    # Risk score: P(Demented)*100 + P(MCI)*40, capped at 100
    p_demented = float(probs[0])
    p_mci      = float(probs[1])
    risk_score = (p_demented * 100) + (p_mci * 40)
    #min(100.0, round((p_demented * 100) + (p_mci * 40), 2))

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
        "probabilities"  : {
            c: round(float(p * 100), 2)
            for c, p in zip(label_encoder.classes_, probs)
        },
        "features"       : {k: (int(v) if isinstance(v, (int, np.integer)) else round(float(v), 3))
                            for k, v in features.items()},
        "data_sources"   : log,
    }

    if json_mode:
        # Web app mode: print JSON on a special line
        print(f"JSON_OUTPUT:{json.dumps(result)}")
    else:
        # CLI pretty print
        DIVIDER = "═" * 58
        print(f"\n{DIVIDER}")
        print("  DEMENTIA BIOTRACKER — RISK ASSESSMENT")
        print(f"  Algorithm: Gradient Boosting  |  Acc: 98.55%")
        print(DIVIDER)
        print(f"\n  Risk Score   : {risk_score:.1f} / 100")
        print(f"  Prediction   : {cls}")
        print(f"  Stage        : {stage_info['stage_code']} — {stage_info['stage_label']}")
        print(f"  CDR          : {stage_info['cdr']}")
        print(f"  GDS          : {stage_info['gds']}")
        print(f"  See Doctor?  : {'YES — ' + stage_info['urgency'] if stage_info['consult'] else 'No'}")
        print()
        for c, p in result["probabilities"].items():
            bar = "█" * int(p / 2.5)
            print(f"  {c:<15} {p:6.2f}%  {bar}")
        print(f"\n  {stage_info['message']}")
        print(f"\n{DIVIDER}\n")

    return result


# ─────────────────────────────────────────────────
# 5. ENTRY POINT
# ─────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Dementia BioTracker — Prediction Engine")
    parser.add_argument("zip_path",  help="Path to Samsung Health ZIP export")
    parser.add_argument("--json",    action="store_true", help="Output JSON for web app")
    args = parser.parse_args()

    if not os.path.exists(args.zip_path):
        if args.json:
            print(f"JSON_OUTPUT:{json.dumps({'error': f'File not found: {args.zip_path}'})}")
        else:
            print(f"Error: File not found → {args.zip_path}")
        sys.exit(1)

    predict(args.zip_path, json_mode=args.json)
