'use client';

import { useState, useRef } from 'react';
import HeroSection    from '@/components/HeroSection';
import UploadSection  from '@/components/UploadSection';
import ResultsDashboard from '@/components/ResultsDashboard';
import LoadingOverlay from '@/components/LoadingOverlay';
import DementiaInfo   from '@/components/DementiaInfo';

export default function Home() {
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const resultsRef            = useRef(null);

  const handleFileSelect = (f) => { setFile(f); setResult(null); setError(''); };

  const handleDiagnose = async () => {
    if (!file) { setError('Please select a Samsung Health ZIP file first.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('zipFile', file);
      const res  = await fetch('/api/diagnose', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Diagnosis failed.');
      setResult(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setFile(null); setResult(null); setError(''); };

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {loading && <LoadingOverlay />}

      {/* ── Hero — title only ── */}
      <HeroSection />

      {/* ── Upload + Results — full-width two-col on large screens ── */}
      <section className="relative z-10 w-full px-4 sm:px-8 lg:px-16 pb-12">
        {!result ? (
          /* Upload centred, max-width cap so it doesn't stretch absurdly */
          <div className="max-w-3xl mx-auto">
            <UploadSection
              file={file}
              onFileSelect={handleFileSelect}
              onDiagnose={handleDiagnose}
              onReset={handleReset}
              loading={loading}
              error={error}
              hasResult={false}
            />
          </div>
        ) : (
          /* After result: upload on left, results on right (desktop), stacked (mobile) */
          <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">
            {/* Left: upload panel */}
            <div className="xl:sticky xl:top-6">
              <UploadSection
                file={file}
                onFileSelect={handleFileSelect}
                onDiagnose={handleDiagnose}
                onReset={handleReset}
                loading={loading}
                error={error}
                hasResult={!!result}
              />
            </div>

            {/* Right: full dashboard */}
            <div ref={resultsRef}>
              <ResultsDashboard result={result} />
            </div>
          </div>
        )}
      </section>

      {/* ── Dementia Education Section ── */}
      <DementiaInfo />

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-gray-800/50 py-8">
        <div className="w-full px-4 sm:px-8 lg:px-16 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-gray-400 text-sm font-medium">Dementia BioTracker</p>
            <p className="text-gray-600 text-xs mt-0.5">
              K.L.N. College of Engineering · Department of AI &amp; Data Science
            </p>
          </div>
          <p className="text-gray-700 text-xs text-right max-w-sm">
            ⚠️ Screening tool only — not a clinical diagnosis.
            Always consult a certified neurologist.
          </p>
        </div>
      </footer>
    </main>
  );
}
