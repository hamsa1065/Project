'use client';

const STAGES = [
  {
    stage: 'Stage 0',
    cdr: 'CDR 0',
    label: 'Healthy / No Impairment',
    color: 'border-emerald-500/30 text-emerald-400',
    bg: 'bg-emerald-500/5',
    dot: 'bg-emerald-500',
    desc: 'Memory and thinking are completely normal for your age. No action needed beyond regular healthy habits.',
  },
  {
    stage: 'Stage 0.5',
    cdr: 'CDR 0.5',
    label: 'Very Mild / Questionable',
    color: 'border-lime-500/30 text-lime-400',
    bg: 'bg-lime-500/5',
    dot: 'bg-lime-500',
    desc: 'You may occasionally forget names or where you left things. Mostly normal, but worth a check-up. Often reversible with lifestyle changes.',
  },
  {
    stage: 'Stage 1 — MCI',
    cdr: 'CDR 0.5–1',
    label: 'Mild Cognitive Impairment',
    color: 'border-amber-500/30 text-amber-400',
    bg: 'bg-amber-500/5',
    dot: 'bg-amber-500',
    desc: 'Noticeable memory lapses — forgetting recent conversations, repeating questions. You still manage daily tasks independently, but this stage needs medical attention. 10–15% chance of progressing to dementia each year without intervention.',
  },
  {
    stage: 'Stage 2',
    cdr: 'CDR 1–2',
    label: 'Mild to Moderate Dementia',
    color: 'border-orange-500/30 text-orange-400',
    bg: 'bg-orange-500/5',
    dot: 'bg-orange-500',
    desc: 'Significant memory loss affecting daily life — trouble with finances, getting lost in familiar places, personality changes. Professional medical care and support is needed immediately.',
  },
  {
    stage: 'Stage 3',
    cdr: 'CDR 2–3',
    label: 'Moderate to Severe Dementia',
    color: 'border-red-500/30 text-red-400',
    bg: 'bg-red-500/5',
    dot: 'bg-red-500',
    desc: 'Severe memory loss, confusion about time and people, difficulty speaking, inability to live independently. Full-time caregiver support and urgent specialist care is required.',
  },
];

const BIOMARKERS = [
  {
    icon: '😴',
    title: 'Sleep Quality',
    why: 'During deep sleep, your brain physically flushes out amyloid plaques — the toxic proteins that build up in Alzheimer\'s disease. Poor sleep = less flushing = higher risk.',
    watch: 'Sleep stages, efficiency, REM duration',
  },
  {
    icon: '💓',
    title: 'Heart Rate Variability (HRV)',
    why: 'HRV reflects the health of your autonomic nervous system — the same system that degrades in early neurodegeneration. A low HRV can signal brain stress years before any memory symptoms appear.',
    watch: 'Beat-to-beat heart rate variation',
  },
  {
    icon: '⚡',
    title: 'Stress Level',
    why: 'Chronic high stress floods the brain with cortisol, which directly damages the hippocampus — your brain\'s memory centre. This is one of the strongest modifiable risk factors.',
    watch: 'Samsung stress score (0–100)',
  },
  {
    icon: '🚶',
    title: 'Daily Physical Activity',
    why: 'Walking increases blood flow to the brain, triggers new neuron growth, and reduces inflammation. People who walk fewer than 4,000 steps/day have a 60% higher dementia risk in long-term studies.',
    watch: 'Daily step count',
  },
  {
    icon: '🩸',
    title: 'Blood Oxygen (SpO2)',
    why: 'When oxygen levels drop — often due to sleep apnea — brain cells begin to die. Sleep apnea affects 1 in 3 people over 60 and is one of the leading undiagnosed causes of dementia.',
    watch: 'Blood oxygen saturation %',
  },
];

export default function DementiaInfo() {
  return (
    <section className="w-full px-4 sm:px-8 lg:px-16 py-16 border-t border-gray-800/40">

      {/* Section title */}
      <div className="text-center mb-12">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-3 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/15">
          Know Your Risk
        </span>
        <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mt-2">
          What is Dementia?
        </h2>
        <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto">
          A simple, plain-language guide — written the way a doctor would explain it to a patient.
        </p>
      </div>

      {/* What is dementia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <div className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl">🧠</div>
            <h3 className="text-white font-display font-semibold text-lg">What exactly is it?</h3>
          </div>
          <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
            <p>
              Think of your brain as a city with millions of roads connecting buildings. Dementia is when those roads start to break down — slowly, quietly, over many years — until messages can no longer get through properly.
            </p>
            <p>
              It is <span className="text-white font-medium">not</span> a single disease — it is an umbrella term for a group of symptoms affecting memory, thinking, and daily function.{' '}
              <span className="text-cyan-400/80">Alzheimer's disease</span> accounts for 60–70% of all cases.
            </p>
            <p>
              Over <span className="text-white font-medium">55 million people</span> worldwide live with dementia as of 2025. In India alone, approximately{' '}
              <span className="text-white font-medium">8.8 million people</span> are affected — and most don't know it until the disease is already in an advanced stage.
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xl">⏰</div>
            <h3 className="text-white font-display font-semibold text-lg">Why does early detection matter?</h3>
          </div>
          <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
            <p>
              Here is the most important thing to understand: <span className="text-white font-medium">dementia starts 10–15 years before you notice any symptoms.</span> By the time someone forgets where they live, the damage has been building for over a decade.
            </p>
            <p>
              But if we catch it at the <span className="text-amber-400 font-medium">MCI stage</span> — Mild Cognitive Impairment — timely treatment and lifestyle changes can{' '}
              <span className="text-white font-medium">delay the onset of dementia by 5–10 years</span> and reduce caregiver burden by up to 40%.
            </p>
            <p>
              Traditional screening (MRI, PET scan, cognitive tests) costs ₹20,000–₹50,000 per session and requires hospital visits every 12–18 months. Most people simply don't get screened. This tool changes that.
            </p>
          </div>
        </div>
      </div>

      {/* How it develops */}
      <div className="glass rounded-2xl p-6 sm:p-8 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl">📈</div>
          <h3 className="text-white font-display font-semibold text-lg">How dementia progresses — the 5 stages</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STAGES.map((s, i) => (
            <div key={i} className={`rounded-xl p-4 border ${s.color} ${s.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                <span className={`text-xs font-bold font-display ${s.color.split(' ')[1]}`}>{s.stage}</span>
              </div>
              <div className="text-xs text-gray-500 mb-1">{s.cdr}</div>
              <div className={`text-sm font-semibold mb-2 ${s.color.split(' ')[1]}`}>{s.label}</div>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why wearables work */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-xl">⌚</div>
          <div>
            <h3 className="text-white font-display font-semibold text-lg">Why can a smartwatch detect this?</h3>
            <p className="text-gray-500 text-xs mt-0.5">The science behind each biomarker</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {BIOMARKERS.map((b, i) => (
            <div key={i} className="glass rounded-2xl p-5 flex flex-col gap-3 hover:border-gray-700 border border-gray-800/50 transition-colors">
              <div className="text-3xl">{b.icon}</div>
              <div>
                <div className="text-white font-semibold text-sm">{b.title}</div>
                <div className="text-xs text-cyan-500/70 mt-0.5">Measured via: {b.watch}</div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed flex-1">{b.why}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Warning signs */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl">⚠️</div>
          <h3 className="text-white font-display font-semibold text-lg">10 early warning signs — don't ignore these</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { sign: 'Memory loss that disrupts daily life', detail: 'Forgetting recently learned information, asking the same question repeatedly' },
            { sign: 'Difficulty planning or solving problems', detail: 'Trouble following a familiar recipe or keeping track of monthly bills' },
            { sign: 'Confusion with time or place', detail: 'Losing track of dates, seasons, the passage of time' },
            { sign: 'Trouble with familiar tasks', detail: 'Difficulty driving to a familiar location or managing a budget' },
            { sign: 'New problems with words', detail: 'Stopping mid-sentence, struggling to name a familiar object' },
            { sign: 'Misplacing things frequently', detail: 'Putting objects in unusual places (keys in the fridge)' },
            { sign: 'Decreased or poor judgement', detail: 'Paying less attention to personal hygiene, falling for scams' },
            { sign: 'Withdrawal from social activities', detail: 'Avoiding hobbies, work projects, or friends without clear reason' },
            { sign: 'Changes in mood or personality', detail: 'Increased anxiety, depression, suspicion, or mood swings' },
            { sign: 'Disrupted sleep patterns', detail: 'Waking at unusual hours, sleeping during the day, sundowning' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-900/40 hover:bg-gray-900/70 transition-colors">
              <span className="text-red-400/70 font-bold text-sm font-mono mt-0.5 flex-shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="text-gray-300 text-sm font-medium">{item.sign}</p>
                <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-5 text-center">
          Source: Alzheimer's Association · World Health Organization · 10 Early Signs and Symptoms of Alzheimer's
        </p>
      </div>

    </section>
  );
}
