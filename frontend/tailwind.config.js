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
        // ── TurtleTrack Design System ──────────────────────────────
        // Deep ocean-inspired palette — professional, research-grade
        bg: {
          primary: '#0B1929',      // Deep midnight navy
          secondary: '#0F2137',    // Card surfaces
          tertiary: '#162B44',     // Elevated surfaces
          overlay: '#1A3354',      // Modal overlays
        },
        accent: {
          teal: '#00D4B4',         // Primary — bioluminescent teal
          tealDim: '#009B84',      // Pressed/hover state
          tealSubtle: '#00D4B41A', // Ghost background
        },
        warm: {
          amber: '#F0A030',        // Sighting dates, years
          amberDim: '#C07820',
          amberSubtle: '#F0A0301A',
        },
        text: {
          primary: '#E8F4F8',      // Headings, primary content
          secondary: '#A8C4D8',    // Body text
          muted: '#6B8FA8',        // Captions, metadata
          inverse: '#0B1929',      // On-accent text
        },
        border: {
          default: '#1E3A5F',
          subtle: '#162B44',
          accent: '#00D4B440',
        },
        status: {
          success: '#22C55E',
          successSubtle: '#22C55E1A',
          warning: '#F59E0B',
          warningSubtle: '#F59E0B1A',
          error: '#EF4444',
          errorSubtle: '#EF44441A',
          pending: '#8B5CF6',
          pendingSubtle: '#8B5CF61A',
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
