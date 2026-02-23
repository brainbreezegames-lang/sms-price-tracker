/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './App.{tsx,ts,jsx,js}',
    './components/**/*.{tsx,ts,jsx,js}',
    './contexts/**/*.{tsx,ts,jsx,js}',
    './services/**/*.{tsx,ts,jsx,js}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        ink: {
          DEFAULT: '#000000',
          deep:    '#060606',
          card:    '#0a0a0a',
          muted:   '#0e0e0e',
          border:  '#1a1a1a',
        },
      },
      boxShadow: {
        soft:           '0 2px 16px -2px rgba(0,0,0,0.12)',
        glow:           '0 0 24px rgba(6,182,212,0.18)',
        'glow-dark':    '0 0 50px rgba(6,182,212,0.40), 0 0 100px rgba(6,182,212,0.15)',
        'price-glow':   '0 0 40px rgba(6,182,212,0.35)',
        'cta-glow':     '0 0 0 1px rgba(6,182,212,0.25), 0 4px 20px rgba(8,145,178,0.30)',
        'card-lift':    '0 10px 40px -10px rgba(0,0,0,0.5)',
        'section-glow': '0 0 80px -20px rgba(255,255,255,0.03)',
        subtle:         '0 1px 3px 0 rgb(0 0 0 / 0.3)',
      },
    },
  },
  plugins: [],
};
