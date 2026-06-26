/**
 * TurtleTrack Design System — Color Tokens
 *
 * Yale Blue palette for a premium, clean, modern UI.
 */

export const Colors = {
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
  
  // ── Backgrounds ────────────────────────────────────────────────────────────
  bg: {
    primary: '#e9f4fc',      // Yale Blue 50
    secondary: '#FFFFFF',    // Card surfaces
    tertiary: '#d3e9f8',     // Subtle elevated
    overlay: 'rgba(7, 29, 44, 0.5)', // Yale Blue 900 semi-transparent
  },

  // ── Accent — Yale Blue 500 ──────────────────────────────────────────
  accent: {
    blue: '#218fde',
    blueDark: '#1b73b1',
    blueSubtle: '#d3e9f8',
    blueBorder: '#7abceb',
    teal: '#218fde', // Mapping legacy accent colors to yale blue
    tealDark: '#1b73b1',
    tealSubtle: '#d3e9f8',
    tealBorder: '#7abceb',
  },

  // ── Warm / Muted ────────────────────────────────────
  warm: {
    amber: '#F0A030',
    amberDark: '#C07820',
    amberSubtle: 'rgba(240, 160, 48, 0.10)',
    amberBorder: 'rgba(240, 160, 48, 0.25)',
  },

  // ── Text ──────────────────────────────────────────────────────────────────
  text: {
    primary: '#071d2c',      // Yale Blue 900
    secondary: '#145685',    // Yale Blue 700
    muted: '#1b73b1',        // Yale Blue 600
    disabled: '#7abceb',     // Yale Blue 300
    inverse: '#FFFFFF',      // White
    onAccent: '#FFFFFF',     // White
  },

  // ── Border ────────────────────────────────────────────────────────────────
  border: {
    default: '#d3e9f8',      // Yale Blue 100
    subtle: '#e9f4fc',       // Yale Blue 50
    accent: '#7abceb',       // Yale Blue 300
  },

  // ── Status ────────────────────────────────────────────────────────────────
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
