'use client';

import { useRef, useState, useEffect } from 'react';

export default function UploadSection({
  file, onFileSelect, onDiagnose, onReset, loading, error, hasResult,
}) {
  const inputRef  = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sysCheck, setSysCheck]     = useState(null); // null=checking, obj=done

  // Run system health check once on mount
  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => setSysCheck(data))
      .catch(() => setSysCheck({ status: 'error', python: { found: false } }));
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFileSelect(dropped);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const ready = sysCheck?.status === 'ready';

  return (
    <div className="animate-fade-up opacity-0 delay-300">

      {/* ── Section header ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm">
          📁
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg font-display">Upload Health Data</h2>
          <p className="text-gray-500 text-xs">Samsung Health export ZIP → AI risk assessment</p>
        </div>
      </div>

      {/* ── System status bar ── */}
      <div className={`mb-4 flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl text-xs border
        ${sysCheck === null
          ? 'bg-gray-900/50 border-gray-800 text-gray-500'
          : ready
          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
          : 'bg-red-500/5 border-red-500/20 text-red-400'
        }`}
      >
        {sysCheck === null ? (
          <>
            <svg className="spinner w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span>Checking system...</span>
          </>
        ) : (
          <>
            <span className={`font-semibold ${ready ? 'text-emerald-400' : 'text-red-400'}`}>
              {ready ? '✅  System Ready' : '❌  Setup Required'}
            </span>
            <span className="text-gray-600">·</span>
            {[
              { label: 'Python',           ok: sysCheck.python?.found },
              { label: 'Model (.pkl)',      ok: sysCheck.model },
              { label: 'scikit-learn',     ok: sysCheck.packages?.sklearn },
              { label: 'pandas',           ok: sysCheck.packages?.pandas },
              { label: 'numpy',            ok: sysCheck.packages?.numpy },
            ].map(({ label, ok }) => (
              <span key={label} className={ok ? 'text-gray-400' : 'text-red-400 font-medium'}>
                {ok ? '✓' : '✗'} {label}
              </span>
            ))}
          </>
        )}
      </div>

      {/* Setup instructions if system not ready */}
      {sysCheck && !ready && (
        <div className="mb-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300 space-y-2">
          <p className="font-semibold text-amber-400">⚠️ Before you can run diagnosis:</p>
          {!sysCheck.python?.found && (
            <p>1. Install Python 3 from <span className="font-mono bg-black/30 px-1 rounded">python.org</span> — check <strong>"Add Python to PATH"</strong></p>
          )}
          {sysCheck.python?.found && (!sysCheck.packages?.sklearn || !sysCheck.packages?.pandas || !sysCheck.packages?.numpy) && (
            <p>2. Open CMD / Terminal and run:
              <span className="block font-mono bg-black/40 px-3 py-1.5 rounded mt-1 text-white">
                pip install scikit-learn pandas numpy
              </span>
            </p>
          )}
          <p className="text-amber-500/70">After fixing, refresh this page.</p>
        </div>
      )}

      <div className="glass rounded-2xl p-5 sm:p-7">

        {/* ── Upload zone ── */}
        {!file ? (
          <div
            className={`upload-zone rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300
              ${isDragging ? 'dragover bg-cyan-500/5' : 'bg-gray-900/30'}`}
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
          >
            <div className="text-5xl mb-4 select-none">{isDragging ? '📂' : '📦'}</div>
            <p className="text-white font-semibold text-base mb-1">
              {isDragging ? 'Drop it!' : 'Drop your Samsung Health ZIP here'}
            </p>
            <p className="text-gray-500 text-xs mb-5 max-w-xs mx-auto leading-relaxed">
              Samsung Health app → My page → Settings → Download personal data
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold text-sm hover:opacity-90 transition-all"
            >
              📂 Browse Files
            </button>
            <p className="text-gray-700 text-xs mt-3">Only .zip files · max 100 MB</p>
            <input
              ref={inputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => e.target.files[0] && onFileSelect(e.target.files[0])}
            />
          </div>
        ) : (
          /* ── File selected ── */
          <div className="space-y-4">

            {/* File card */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-xl flex-shrink-0">🗜️</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{file.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{formatSize(file.size)}</p>
              </div>
              <button
                onClick={() => { onReset(); }}
                className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xs"
              >✕</button>
            </div>

            {/* What will be parsed */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ['😴','Sleep stages & duration'],
                ['❤️','Heart rate & HRV'],
                ['⚡','Stress score'],
                ['🩸','Blood oxygen (SpO2)'],
                ['🌡️','Skin temperature'],
                ['🚶','Daily steps'],
              ].map(([icon, label]) => (
                <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/40 text-xs text-gray-400">
                  <span>{icon}</span>{label}
                </div>
              ))}
            </div>

            {/* Run button */}
            <button
              onClick={onDiagnose}
              disabled={loading || (sysCheck && !ready)}
              className="w-full py-4 rounded-xl font-display font-bold text-base tracking-wide transition-all duration-200
                bg-gradient-to-r from-cyan-500 to-violet-600 text-white
                hover:opacity-95 hover:scale-[1.01] active:scale-[0.99]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
                shadow-lg shadow-cyan-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="spinner w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Analysing biomarkers...
                </span>
              ) : hasResult ? '🔁  Re-run Diagnosis' : '🧠  Run Diagnosis'}
            </button>

            {hasResult && (
              <button
                onClick={onReset}
                className="w-full py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 border border-gray-800 hover:border-gray-600 transition-colors"
              >Upload a different file</button>
            )}
          </div>
        )}

        {/* ── Error display ── */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs leading-relaxed whitespace-pre-wrap">
            <p className="font-semibold text-red-400 mb-1">⚠️ Error</p>
            {error}
          </div>
        )}

        {/* ── How to export ── */}
        <div className="mt-5 pt-5 border-t border-gray-800/50">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            How to get your Samsung Health ZIP
          </p>
          <ol className="space-y-2">
            {[
              'Open Samsung Health on your phone',
              'Tap your profile picture (top-right)',
              'Go to Settings → Download personal data',
              'Tap "Request data" and wait for email/download',
              'Upload the downloaded ZIP here',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-gray-500">
                <span className="w-5 h-5 rounded-full bg-gray-800 text-gray-500 flex items-center justify-center flex-shrink-0 font-mono text-xs mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

      </div>
    </div>
  );
}

