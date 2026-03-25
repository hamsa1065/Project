'use client';

import { useEffect, useState } from 'react';
import RiskGauge from './RiskGauge';

/* ── Static config: display metadata only (no values) ── */
const FEAT_META = {
  daily_steps:          { label: 'Daily Steps',          unit: 'steps/day', icon: '🚶', src: 'step_daily_trend.csv',      healthy: '>7,000 steps',  healthy_val: [7000, 99999] },
  sleep_duration_hours: { label: 'Sleep Duration',       unit: 'hrs/night', icon: '😴', src: 'shealth.sleep.csv',          healthy: '7–9 hours',     healthy_val: [7, 9]        },
  sleep_efficiency:     { label: 'Sleep Efficiency',     unit: '%',         icon: '🌙', src: 'shealth.sleep.csv',          healthy: '>85%',          healthy_val: [85, 100]     },
  awake_minutes:        { label: 'Awake Time',           unit: 'min/night', icon: '👁️', src: 'sleep_stage.csv (40001)',    healthy: '<20 min',       healthy_val: [0, 20]       },
  light_minutes:        { label: 'Light Sleep',          unit: 'min/night', icon: '💤', src: 'sleep_stage.csv (40002)',    healthy: '60–250 min',    healthy_val: [60, 250]     },
  deep_minutes:         { label: 'Deep Sleep',           unit: 'min/night', icon: '🧠', src: 'sleep_stage.csv (40003)',    healthy: '>60 min',       healthy_val: [60, 999]     },
  rem_minutes:          { label: 'REM Sleep',            unit: 'min/night', icon: '🔄', src: 'sleep_stage.csv (40004)',    healthy: '>80 min',       healthy_val: [80, 999]     },
  avg_heart_rate:       { label: 'Avg Heart Rate',       unit: 'bpm',       icon: '❤️', src: 'tracker.heart_rate.csv',    healthy: '55–75 bpm',     healthy_val: [55, 75]      },
  hrv_sdnn:             { label: 'HRV (SDNN)',           unit: 'ms',        icon: '📈', src: 'health.hrv.csv',             healthy: '>50 ms',        healthy_val: [50, 999]     },
  movement_variability: { label: 'Movement Variability', unit: 'index',     icon: '📡', src: 'tracker.heart_rate.csv',    healthy: '0.3–1.2',       healthy_val: [0.3, 1.2]    },
  spo2_avg:             { label: 'Blood Oxygen (SpO2)',  unit: '%',         icon: '🩸', src: 'oxygen_saturation.csv',      healthy: '>95%',          healthy_val: [95, 100]     },
  skin_temperature:     { label: 'Skin Temperature',     unit: '°C',        icon: '🌡️', src: 'skin_temperature.csv',       healthy: '33–37°C',       healthy_val: [33, 37]      },
  stress_level:         { label: 'Stress Level',         unit: '/100',      icon: '⚡', src: 'shealth.stress.csv',         healthy: '<40',           healthy_val: [0, 40]       },
};

/* ── Compute health status from ACTUAL user value ── */
function getStatus(key, rawVal) {
  const val = Number(rawVal);
  const thresholds = {
    stress_level:         { good: [0,40],    warn: [40,65],    bad: [65,100]   },
    sleep_efficiency:     { good: [85,100],  warn: [75,85],    bad: [0,75]     },
    hrv_sdnn:             { good: [50,999],  warn: [30,50],    bad: [0,30]     },
    daily_steps:          { good: [7000,99999], warn: [4000,7000], bad: [0,4000] },
    spo2_avg:             { good: [95,100],  warn: [93,95],    bad: [0,93]     },
    avg_heart_rate:       { good: [55,75],   warn: [75,90],    bad: [90,999]   },
    sleep_duration_hours: { good: [7,9],     warn: [5.5,7],    bad: [0,5.5]    },
    rem_minutes:          { good: [80,999],  warn: [50,80],    bad: [0,50]     },
    deep_minutes:         { good: [60,999],  warn: [30,60],    bad: [0,30]     },
    awake_minutes:        { good: [0,20],    warn: [20,45],    bad: [45,999]   },
    movement_variability: { good: [0.3,1.2], warn: [1.2,2.0],  bad: [2.0,999]  },
    skin_temperature:     { good: [33,37],   warn: [32,33],    bad: [0,32]     },
    light_minutes:        { good: [60,250],  warn: [30,60],    bad: [0,30]     },
  };
  const t = thresholds[key];
  if (!t) return { label: 'Data',    color: 'text-gray-400',    dot: 'bg-gray-500',    ring: 'border-gray-700',   bg: 'bg-gray-800/30'    };
  if (val >= t.good[0] && val <= t.good[1]) return { label: 'Normal',   color: 'text-emerald-400', dot: 'bg-emerald-500', ring: 'border-emerald-500/30', bg: 'bg-emerald-500/5'  };
  if (val >= t.warn[0] && val <= t.warn[1]) return { label: 'Watch',    color: 'text-amber-400',   dot: 'bg-amber-500',   ring: 'border-amber-500/30',   bg: 'bg-amber-500/5'    };
  return                                           { label: 'Concern',  color: 'text-red-400',     dot: 'bg-red-500',     ring: 'border-red-500/30',     bg: 'bg-red-500/5'      };
}

/* ── Compute how much each feature deviates (drives risk) ── */
function computeRiskContribution(features) {
  // Each feature's deviation from its healthy midpoint, scaled 0–100
  const deviations = {
    stress_level:         { val: features.stress_level,         optimal: 20,   worst: 100,  invert: false },
    sleep_efficiency:     { val: features.sleep_efficiency,     optimal: 92,   worst: 55,   invert: true  },
    hrv_sdnn:             { val: features.hrv_sdnn,             optimal: 70,   worst: 10,   invert: true  },
    daily_steps:          { val: features.daily_steps,          optimal: 9000, worst: 500,  invert: true  },
    spo2_avg:             { val: features.spo2_avg,             optimal: 98,   worst: 88,   invert: true  },
  };

  const contributions = {};
  for (const [key, cfg] of Object.entries(deviations)) {
    const range = Math.abs(cfg.optimal - cfg.worst);
    const raw   = cfg.invert
      ? (cfg.optimal - Number(cfg.val)) / range
      : (Number(cfg.val) - cfg.optimal) / range;
    // 0 = perfectly healthy, 1 = worst possible
    contributions[key] = Math.min(1, Math.max(0, raw));
  }

  // Normalise so bars are relative to each other (biggest = 100%)
  const maxVal = Math.max(...Object.values(contributions), 0.001);
  const result = {};
  for (const [key, val] of Object.entries(contributions)) {
    result[key] = (val / maxVal) * 100;
  }
  return result;
}

/* ── Risk metadata from score ── */
function getRiskMeta(score) {
  if (score <= 20) return { label: 'Low Risk',      color: 'text-emerald-400', bg: 'bg-emerald-500/8',  border: 'border-emerald-500/20', emoji: '✅', scoreColor: '#10b981' };
  if (score <= 40) return { label: 'Mild Concern',  color: 'text-lime-400',    bg: 'bg-lime-500/8',     border: 'border-lime-500/20',    emoji: '🟡', scoreColor: '#84cc16' };
  if (score <= 60) return { label: 'Moderate Risk', color: 'text-amber-400',   bg: 'bg-amber-500/8',    border: 'border-amber-500/20',   emoji: '⚠️', scoreColor: '#f59e0b' };
  if (score <= 80) return { label: 'High Risk',     color: 'text-orange-400',  bg: 'bg-orange-500/8',   border: 'border-orange-500/20',  emoji: '🚨', scoreColor: '#f97316' };
  return               { label: 'Critical Risk',  color: 'text-red-400',     bg: 'bg-red-500/8',      border: 'border-red-500/20',     emoji: '🆘', scoreColor: '#ef4444' };
}

/* ── Animated bar (width driven by prop, not hardcoded) ── */
function AnimatedBar({ pct, color, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(Math.min(100, Math.max(0, pct))), 150 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className="h-2 bg-gray-800/80 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${w}%`, background: color }}
      />
    </div>
  );
}

/* ── Format display value ── */
function fmtVal(key, raw) {
  const v = Number(raw);
  if (isNaN(v)) return raw ?? '—';
  if (key === 'daily_steps')   return v.toLocaleString();
  if (Number.isInteger(v))     return v;
  return v.toFixed(1);
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT — everything renders from `result` prop only
══════════════════════════════════════════════════════════════ */
export default function ResultsDashboard({ result }) {
  // ── Destructure ALL values from the model API response ──────────
  const risk_score     = Number(result.risk_score   ?? 0);
  const prediction     = result.prediction          ?? 'Unknown';
  const stage_code     = result.stage_code          ?? result.stage ?? '—';
  const stage_label    = result.stage_label         ?? '—';
  const cdr            = result.cdr                 ?? '—';
  const gds            = result.gds                 ?? '—';
  const urgency        = result.urgency             ?? '—';
  const consult_doctor = result.consult_doctor      ?? false;
  const message        = result.message             ?? '';
  const probabilities  = result.probabilities       ?? {};   // { Demented: x, MCI: y, Nondemented: z }
  const features       = result.features            ?? {};   // { daily_steps: 3969, stress_level: 38, ... }
  const data_sources   = result.data_sources        ?? [];   // [{ source: 'Sleep', status: 'ok', records: 535 }, ...]

  // ── Derived values (computed from user's real data) ─────────────
  const meta          = getRiskMeta(risk_score);
  const riskContribs  = computeRiskContribution(features);

  // Sort probabilities descending for display
  const probEntries = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);

  const probColors = {
    Demented:    { bar: '#ef4444', text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
    MCI:         { bar: '#f59e0b', text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
    Nondemented: { bar: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  };

  // Count concerns vs normals from user's own data
  const statusCounts = Object.entries(features).reduce(
    (acc, [key, val]) => {
      const s = getStatus(key, val).label;
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {}
  );

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-base">📊</div>
        <div>
          <h2 className="text-white font-display font-semibold text-lg">Diagnosis Result</h2>
          <p className="text-gray-500 text-xs">
            Based on <span className="text-cyan-400 font-medium">{Object.keys(features).length} biomarkers</span> extracted from your Samsung watch data
            &nbsp;·&nbsp;
            <span className="text-gray-400">{new Date().toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* ── Data sources actually found ── */}
      {data_sources.length > 0 && (
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
            📂 Data extracted from your ZIP ({data_sources.length}/7 sources found)
          </p>
          <div className="flex flex-wrap gap-2">
            {data_sources.map((src) => (
              <span
                key={src.source}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {src.source}
                {src.records && <span className="text-emerald-600">({src.records.toLocaleString()})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Risk Score + Verdict ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Gauge */}
        <div className={`glass rounded-2xl p-6 flex flex-col items-center border ${meta.border}`}>
          <RiskGauge score={risk_score} />
          <div className="text-center mt-3">
            <div className="text-4xl font-display font-bold" style={{ color: meta.scoreColor }}>
              {risk_score.toFixed(1)}%
            </div>
            <div className={`inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${meta.bg} ${meta.border} ${meta.color}`}>
              {meta.emoji} {meta.label}
            </div>
          </div>

          {/* Quick biomarker summary */}
          <div className="mt-5 w-full grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Normal',  count: statusCounts['Normal']  || 0, color: 'text-emerald-400' },
              { label: 'Watch',   count: statusCounts['Watch']   || 0, color: 'text-amber-400'   },
              { label: 'Concern', count: statusCounts['Concern'] || 0, color: 'text-red-400'     },
            ].map(({ label, count, color }) => (
              <div key={label} className="glass-light rounded-xl p-2">
                <div className={`text-2xl font-bold font-display ${color}`}>{count}</div>
                <div className="text-xs text-gray-600">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stage + message */}
        <div className={`glass rounded-2xl p-6 flex flex-col border ${meta.border}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Clinical Stage</span>
              <h3 className={`text-2xl font-display font-bold mt-0.5 ${meta.color}`}>{stage_code}</h3>
              <p className="text-gray-400 text-sm mt-0.5">{stage_label}</p>
            </div>
            <span className="text-4xl">{meta.emoji}</span>
          </div>

          {/* CDR / GDS chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { label: 'CDR', value: cdr, desc: 'Clinical Dementia Rating' },
              { label: 'GDS', value: gds, desc: 'Global Deterioration Scale' },
            ].map(item => (
              <div key={item.label} className={`px-3 py-2 rounded-xl border ${meta.bg} ${meta.border} flex-1 min-w-[120px]`}>
                <div className={`text-base font-bold font-display ${meta.color}`}>{item.value}</div>
                <div className="text-xs text-gray-600">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* What this means */}
          <div className={`flex-1 p-4 rounded-xl border ${meta.bg} ${meta.border} text-xs leading-relaxed`}>
            <p className={`font-semibold mb-2 ${meta.color}`}>
              {consult_doctor ? '🩺 Doctor Recommendation' : '✅ Assessment'}
            </p>
            <p className="text-gray-400 whitespace-pre-line leading-relaxed">{message}</p>
          </div>

          {consult_doctor && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-red-500/8 border border-red-500/20">
              <span className="text-xl">🩺</span>
              <div>
                <p className="text-red-400 font-semibold text-sm">Consult a Doctor</p>
                <p className="text-xs text-gray-500">Urgency: <span className="text-red-300 font-medium">{urgency}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Class Probabilities — from model, your data ── */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-white font-display font-semibold mb-1 flex items-center gap-2">
          <span className="text-cyan-400">📊</span> Model Probabilities
          <span className="text-gray-600 text-xs font-normal font-sans">— computed from your biomarkers</span>
        </h3>
        <p className="text-gray-600 text-xs mb-5">These percentages represent what the AI model calculated for YOUR data specifically.</p>

        <div className="space-y-5">
          {probEntries.map(([cls, pct], i) => {
            const c = probColors[cls] || probColors.Nondemented;
            return (
              <div key={cls}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold font-display ${c.text}`}>{cls}</span>
                    {cls === prediction && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${c.bg} ${c.border} ${c.text} font-medium`}>
                        ◄ Your result
                      </span>
                    )}
                  </div>
                  <span className={`text-lg font-bold font-mono ${c.text}`}>{Number(pct).toFixed(2)}%</span>
                </div>
                <AnimatedBar pct={Number(pct)} color={c.bar} delay={i * 150} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Risk Drivers — computed from YOUR values ── */}
      <div>
        <h3 className="text-white font-display font-semibold mb-1 flex items-center gap-2">
          <span className="text-cyan-400">🔬</span> Your Risk Drivers
          <span className="text-gray-600 text-xs font-normal font-sans">— how far YOUR values deviate from healthy range</span>
        </h3>
        <p className="text-gray-600 text-xs mb-4">The longer the bar, the more this biomarker is contributing to YOUR specific risk score.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {['stress_level','sleep_efficiency','hrv_sdnn','daily_steps','spo2_avg'].map((key, i) => {
            const val    = features[key];
            const meta2  = FEAT_META[key];
            const status = getStatus(key, val);
            const contrib= riskContribs[key] ?? 0;
            const contribColor = contrib > 60 ? '#ef4444' : contrib > 30 ? '#f59e0b' : '#10b981';

            return (
              <div key={key} className={`glass rounded-2xl p-4 flex flex-col gap-3 border ${status.ring} transition-colors`}>
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{meta2.icon}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${status.bg} ${status.ring} ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div>
                  <div className="text-2xl font-bold font-display text-white">
                    {fmtVal(key, val)}
                    <span className="text-xs text-gray-500 font-normal ml-1">{meta2.unit}</span>
                  </div>
                  <div className="text-xs text-gray-500">{meta2.label}</div>
                  <div className="text-xs text-gray-700 mt-0.5">Healthy: {meta2.healthy}</div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Risk contribution</span>
                    <span className="font-mono font-semibold" style={{ color: contribColor }}>
                      {contrib.toFixed(0)}%
                    </span>
                  </div>
                  <AnimatedBar pct={contrib} color={contribColor} delay={300 + i * 100} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── All 13 Biomarkers Table — YOUR actual extracted values ── */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-800/50 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-white font-display font-semibold flex items-center gap-2">
              <span className="text-cyan-400">🗂️</span> Your 13 Biomarkers
            </h3>
            <p className="text-gray-600 text-xs mt-0.5">Every value below was extracted from YOUR Samsung Health data</p>
          </div>
          {/* Summary chips */}
          <div className="flex gap-2 flex-wrap">
            {statusCounts['Concern'] > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                {statusCounts['Concern']} concern{statusCounts['Concern'] > 1 ? 's' : ''}
              </span>
            )}
            {statusCounts['Watch'] > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                {statusCounts['Watch']} watch
              </span>
            )}
            {statusCounts['Normal'] > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {statusCounts['Normal']} normal
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800/50">
                {['#', 'Biomarker', 'Your Value', 'Healthy Range', 'Source CSV', 'Status'].map(h => (
                  <th key={h} className={`text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider ${h === 'Source CSV' ? 'hidden sm:table-cell' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(FEAT_META).map(([key, meta2], i) => {
                const val    = features[key];
                const status = getStatus(key, val);
                const isKey  = ['stress_level','sleep_efficiency','hrv_sdnn','daily_steps','spo2_avg'].includes(key);

                return (
                  <tr
                    key={key}
                    className={`border-b border-gray-800/20 transition-colors ${isKey ? 'bg-white/[0.015]' : ''} hover:bg-white/[0.03]`}
                  >
                    <td className="px-4 py-3 text-gray-600 text-xs font-mono">{String(i+1).padStart(2,'0')}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta2.icon}</span>
                        <div>
                          <div className="text-gray-200 text-sm font-medium flex items-center gap-1.5">
                            {meta2.label}
                            {isKey && <span className="text-xs text-cyan-600">★ key</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-white font-mono font-bold text-sm">{fmtVal(key, val)}</span>
                      <span className="text-gray-600 text-xs ml-1">{meta2.unit}</span>
                    </td>

                    <td className="px-4 py-3 text-gray-600 text-xs">{meta2.healthy}</td>

                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-gray-700 font-mono">{meta2.src}</span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                        <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Clinical Stage Reference ── */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-white font-display font-semibold mb-4 flex items-center gap-2 text-base">
          <span className="text-cyan-400">📋</span> Clinical Stage Reference
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { score: '0–20%',   code: 'Stage 0',   cdr: 'CDR 0',     label: 'No Impairment',   match: risk_score <= 20 },
            { score: '21–40%',  code: 'Stage 0.5', cdr: 'CDR 0.5',   label: 'Questionable',    match: risk_score > 20 && risk_score <= 40 },
            { score: '41–60%',  code: 'Stage 1',   cdr: 'CDR 0.5–1', label: 'Mild MCI',        match: risk_score > 40 && risk_score <= 60 },
            { score: '61–80%',  code: 'Stage 2',   cdr: 'CDR 1–2',   label: 'Mild–Moderate',   match: risk_score > 60 && risk_score <= 80 },
            { score: '81–100%', code: 'Stage 3',   cdr: 'CDR 2–3',   label: 'Mod–Severe',      match: risk_score > 80 },
          ].map(s => (
            <div
              key={s.code}
              className={`rounded-xl p-3 border text-center transition-all ${
                s.match
                  ? `border-cyan-500/40 bg-cyan-500/8 ring-1 ring-cyan-500/20`
                  : 'border-gray-800/50 opacity-40'
              }`}
            >
              <div className={`text-sm font-bold font-display ${s.match ? 'text-cyan-400' : 'text-gray-500'}`}>{s.code}</div>
              <div className="text-xs text-gray-600 mt-0.5">{s.cdr}</div>
              <div className={`text-xs mt-1 ${s.match ? 'text-gray-300' : 'text-gray-600'}`}>{s.label}</div>
              <div className="text-xs text-gray-600">{s.score}</div>
              {s.match && <div className="text-xs font-bold text-cyan-400 mt-1">← Your result</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="glass rounded-2xl p-4 border border-amber-500/10">
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">⚠️</span>
          <p className="text-gray-600 text-xs leading-relaxed">
            <span className="text-amber-400 font-semibold">Medical Disclaimer — </span>
            Dementia BioTracker is a research-grade screening tool trained on population data.
            It is <strong className="text-gray-400">not a clinical diagnosis</strong>.
            All results must be reviewed by a qualified neurologist.
            Standard clinical tests: MMSE · MoCA · MRI · PET scan · Neuropsychological battery.
          </p>
        </div>
      </div>

    </div>
  );
}

