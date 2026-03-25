'use client';

export default function HeroSection() {
  return (
    <section className="relative z-10 w-full px-4 sm:px-8 lg:px-16 pt-14 pb-10 text-center">

      {/* Top badge */}
      <div className="animate-fade-up opacity-0 inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light text-xs font-medium text-cyan-400 mb-6 tracking-wide uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot" />
        AI-Powered Dementia Screening &nbsp;·&nbsp; No MRI Required
      </div>

      {/* Title */}
      <h1
        className="animate-fade-up opacity-0 delay-100 font-display font-bold leading-tight tracking-tight"
        style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)' }}
      >
        <span className="text-white">Digital Biomarker for&nbsp;</span>
        <span className="gradient-text">Dementia</span>
        <br />
        <span className="text-white">&amp; Circadian Rhythm Disorder</span>
      </h1>

      {/* Divider */}
      <div className="animate-fade-up opacity-0 delay-200 flex items-center justify-center gap-4 mt-8">
        <div className="h-px w-24 bg-gradient-to-r from-transparent to-cyan-500/40" />
        <span className="text-gray-600 text-xs uppercase tracking-widest">Upload your health data below</span>
        <div className="h-px w-24 bg-gradient-to-l from-transparent to-cyan-500/40" />
      </div>
    </section>
  );
}
