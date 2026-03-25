/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-sora)', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#040810',
          900: '#0a0f1e',
          800: '#0f1629',
          700: '#141d35',
          600: '#1a2540',
        },
        surface: {
          DEFAULT: '#111827',
          2: '#1f2937',
          3: '#374151',
        },
        brand: {
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          teal: '#14b8a6',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'gauge-fill': 'gaugeFill 1.5s ease-out forwards',
        'bar-fill': 'barFill 1s ease-out forwards',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        barFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--target-width)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-cyan': 'radial-gradient(ellipse 800px 600px at 20% 30%, rgba(6,182,212,0.06) 0%, transparent 70%)',
        'mesh-violet': 'radial-gradient(ellipse 600px 500px at 80% 70%, rgba(139,92,246,0.06) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};
