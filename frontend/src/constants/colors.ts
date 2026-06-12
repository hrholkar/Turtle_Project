/**
 * TurtleTrack Design System — Color Tokens
 *
 * Deep ocean-inspired palette for a professional conservation research application.
 * Dark mode first. Every color has a semantic name — never use raw hex in components.
 */

export const Colors = {
  // ── Backgrounds ────────────────────────────────────────────────────────────
  bg: {
    primary: '#0B1929',      // App background — deep midnight navy
    secondary: '#0F2137',    // Card/sheet surfaces
    tertiary: '#162B44',     // Elevated elements (modals, dropdowns)
    overlay: '#0B192980',    // Semi-transparent overlay
  },

  // ── Accent — Bioluminescent Teal ──────────────────────────────────────────
  accent: {
    teal: '#00D4B4',
    tealDark: '#009B84',
    tealSubtle: 'rgba(0, 212, 180, 0.10)',
    tealBorder: 'rgba(0, 212, 180, 0.25)',
  },

  // ── Warm — Amber (time, history, age) ────────────────────────────────────
  warm: {
    amber: '#F0A030',
    amberDark: '#C07820',
    amberSubtle: 'rgba(240, 160, 48, 0.10)',
    amberBorder: 'rgba(240, 160, 48, 0.25)',
  },

  // ── Text ──────────────────────────────────────────────────────────────────
  text: {
    primary: '#E8F4F8',
    secondary: '#A8C4D8',
    muted: '#6B8FA8',
    disabled: '#3D6080',
    inverse: '#0B1929',
    onAccent: '#0B1929',
  },

  // ── Border ────────────────────────────────────────────────────────────────
  border: {
    default: '#1E3A5F',
    subtle: '#162B44',
    accent: 'rgba(0, 212, 180, 0.25)',
  },

  // ── Status ────────────────────────────────────────────────────────────────
  status: {
    success: '#22C55E',
    successSubtle: 'rgba(34, 197, 94, 0.12)',
    warning: '#F59E0B',
    warningSubtle: 'rgba(245, 158, 11, 0.12)',
    error: '#EF4444',
    errorSubtle: 'rgba(239, 68, 68, 0.12)',
    pending: '#8B5CF6',
    pendingSubtle: 'rgba(139, 92, 246, 0.12)',
  },

  // ── Special ───────────────────────────────────────────────────────────────
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

/** Match strength → visual color mapping */
export const MatchStrengthColors = {
  strong: Colors.status.success,
  probable: Colors.status.warning,
  new: Colors.status.pending,
} as const;

/** Species → display name mapping */
export const SpeciesLabels: Record<string, string> = {
  green: 'Green Turtle',
  loggerhead: 'Loggerhead',
  leatherback: 'Leatherback',
  hawksbill: 'Hawksbill',
  kemp_ridley: "Kemp's Ridley",
  olive_ridley: "Olive Ridley",
  flatback: 'Flatback',
  unknown: 'Unknown Species',
};
