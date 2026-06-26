/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── TurtleTrack Design System (Yale Blue) ──────────────────────────────
        primary: {
          50: '#e9f4fc',
          100: '#d3e9f8',
          200: '#a6d2f2',
          300: '#7abceb',
          400: '#4ea6e4',
          500: '#218fde',
          600: '#1b73b1',
          700: '#145685',
          800: '#0d3959',
          900: '#071d2c',
          950: '#05141f',
        },
        bg: {
          primary: '#e9f4fc',      // Yale Blue 50
          secondary: '#FFFFFF',    // White Cards
          tertiary: '#d3e9f8',     // Elevated / Subtle background
          overlay: 'rgba(7, 29, 44, 0.5)', // 900 with opacity
        },
        accent: {
          blue: '#218fde',         // 500
          blueDim: '#1b73b1',      // 600
          blueSubtle: '#d3e9f8',   // 100
        },
        text: {
          primary: '#071d2c',      // 900
          secondary: '#145685',    // 700
          muted: '#1b73b1',        // 600
          inverse: '#FFFFFF',      // On-primary text
        },
        border: {
          default: '#d3e9f8',      // 100
          subtle: '#e9f4fc',       // 50
          accent: '#7abceb',       // 300
        },
        status: {
          success: '#22C55E',
          successSubtle: '#DCFCE7',
          warning: '#F59E0B',
          warningSubtle: '#FEF3C7',
          error: '#EF4444',
          errorSubtle: '#FEE2E2',
          pending: '#8B5CF6',
          pendingSubtle: '#EDE9FE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        mono: ['JetBrainsMono', 'Courier'],
      },
    },
  },
  plugins: [],
};
