'use client';

import { useState, useEffect } from 'react';

const STEPS = [
  { icon: '📦', text: 'Reading Samsung Health ZIP...',    delay: 0 },
  { icon: '🗂️', text: 'Parsing CSV biomarker files...',   delay: 1200 },
  { icon: '🧮', text: 'Extracting 13 features...',        delay: 2800 },
  { icon: '🧠', text: 'Running Gradient Boosting model...', delay: 4200 },
  { icon: '📊', text: 'Generating risk assessment...',    delay: 5500 },
];

export default function LoadingOverlay() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((step, i) =>
      setTimeout(() => setActiveStep(i), step.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy-950/90 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative glass rounded-2xl p-8 sm:p-10 w-full max-w-sm mx-4 text-center border border-cyan-500/10">

        {/* Spinner ring */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <svg className="spinner w-20 h-20" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="34" stroke="rgba(6,182,212,0.1)" strokeWidth="4"/>
            <circle
              cx="40" cy="40" r="34"
              stroke="url(#spin-grad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="50 163"
            />
            <defs>
              <linearGradient id="spin-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4"/>
                <stop offset="100%" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl">
            {STEPS[activeStep]?.icon}
          </span>
        </div>

        <h3 className="text-white font-display font-semibold text-lg mb-1">
          Analysing your data
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          {STEPS[activeStep]?.text}
        </p>

        {/* Progress steps */}
        <div className="space-y-2 text-left">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                i < activeStep  ? 'text-emerald-400 opacity-100' :
                i === activeStep ? 'text-cyan-300 opacity-100' :
                'text-gray-700 opacity-50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                i < activeStep  ? 'bg-emerald-500/20 border border-emerald-500/40' :
                i === activeStep ? 'bg-cyan-500/20 border border-cyan-500/40' :
                'bg-gray-800 border border-gray-700'
              }`}>
                {i < activeStep ? (
                  <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : i === activeStep ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot"/>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600"/>
                )}
              </div>
              <span className="text-xs">{step.text}</span>
            </div>
          ))}
        </div>

        <p className="text-gray-600 text-xs mt-6">
          This may take 20–60 seconds depending on ZIP size
        </p>
      </div>
    </div>
  );
}
