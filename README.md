# Dementia BioTracker 🧠

> **"Digital Biomarker for Dementia & Circadian Rhythm Disorder"**  
> K.L.N. College of Engineering · Department of AI & Data Science

---

## ⚡ Quick Setup (Windows)

### Step 1 — Install Python
Download from **https://python.org/downloads** → Run installer → **✅ CHECK "Add Python to PATH"**

Verify it works:
```
python --version
```

### Step 2 — Install Python packages
```
pip install scikit-learn pandas numpy
```

### Step 3 — Install Node.js
Download from **https://nodejs.org** → Install (LTS version)

Verify:
```
node --version
npm --version
```

### Step 4 — Run the app

Extract the ZIP. Open CMD inside the `dementia-biotracker` folder (the one with `package.json`):
```
npm install
npm run dev
```

Open browser → **http://localhost:3000**

---

## Folder Structure

```
dementia-biotracker/
├── app/
│   ├── page.js                    ← Main page
│   ├── layout.js                  ← Root HTML
│   ├── globals.css                ← Dark navy theme
│   └── api/
│       ├── diagnose/route.js      ← POST: receives ZIP → runs Python → returns JSON
│       └── health/route.js        ← GET: checks Python + packages are installed
├── components/
│   ├── HeroSection.jsx            ← Title
│   ├── UploadSection.jsx          ← File upload + system check + Run button
│   ├── ResultsDashboard.jsx       ← Full dynamic results dashboard
│   ├── RiskGauge.jsx              ← Animated SVG gauge
│   ├── LoadingOverlay.jsx         ← Loading screen
│   └── DementiaInfo.jsx           ← Plain-language dementia explainer
├── python/
│   ├── dementia_model.pkl         ← Trained Gradient Boosting model (2.4 MB)
│   └── dementia_predict.py        ← Prediction engine (use --json flag for API)
├── package.json
├── tailwind.config.js
├── next.config.mjs
└── README.md
```

---

## How It Works (end-to-end)

```
1. User opens http://localhost:3000
2. Page runs GET /api/health → checks Python, model, packages
3. User uploads Samsung Health ZIP
4. Clicks "Run Diagnosis"
5. Frontend sends ZIP → POST /api/diagnose
6. API saves ZIP to temp folder (cross-platform)
7. API runs: python dementia_predict.py upload.zip --json
8. Python parses 7 Samsung CSVs → extracts 13 biomarkers → runs model
9. Python prints: JSON_OUTPUT:{...}
10. API captures JSON → returns to frontend
11. React renders full dashboard: gauge, stage, table, probabilities
```

---

## Risk Score Scale

| Score   | Stage     | CDR       | Meaning                    | Action          |
|---------|-----------|-----------|----------------------------|-----------------|
| 0–20%   | Stage 0   | CDR 0     | No impairment              | Monitor yearly  |
| 21–40%  | Stage 0.5 | CDR 0.5   | Questionable / Preclinical | Check in 3 mo   |
| 41–60%  | Stage 1   | CDR 0.5–1 | Mild Cognitive Impairment  | Doctor in 1 mo  |
| 61–80%  | Stage 2   | CDR 1–2   | Mild–Moderate Dementia     | Doctor this week|
| 81–100% | Stage 3   | CDR 2–3   | Moderate–Severe Dementia   | Doctor TODAY    |

---

## Troubleshooting

**"python is not recognized"** → Python not in PATH. Reinstall Python and check "Add to PATH".

**"No module named sklearn"** → Run `pip install scikit-learn pandas numpy`

**"Model file not found"** → Make sure `dementia_model.pkl` is inside the `python/` folder.

**Page loads but no result after clicking Run** → Open browser DevTools (F12) → Network tab → look at the `/api/diagnose` request for the actual error message.

**Still stuck?** → Open CMD and run:
```
python python/dementia_predict.py "path/to/your/csv_files.zip"
```
If that works, the API will work too.

---

## Medical Disclaimer
Screening tool only. Not a clinical diagnosis. Always consult a neurologist.
