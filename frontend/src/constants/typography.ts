/**
 * TurtleTrack Design System — Typography
 *
 * Inter for UI, JetBrains Mono for IDs and coordinates.
 * Scale follows a modified fluid scale optimized for mobile readability.
 */

export const Typography = {
  // ── Font Families ─────────────────────────────────────────────────────────
  fonts: {
    sans: 'Inter',
    mono: 'JetBrainsMono',
    system: undefined, // system default
  },

  // ── Size Scale ────────────────────────────────────────────────────────────
  sizes: {
    xs: 11,
    sm: 13,
    base: 16,
    md: 18,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
    '4xl': 40,
  },

  // ── Weight ────────────────────────────────────────────────────────────────
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // ── Line Height ───────────────────────────────────────────────────────────
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },

  // ── Letter Spacing ────────────────────────────────────────────────────────
  tracking: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
    widest: 2.0,
  },
} as const;

/** Preset text styles for common elements */
export const TextStyles = {
  // ── Display ───────────────────────────────────────────────────────────────
  displayLarge: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -0.5 },
  displayMedium: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },

  // ── Headings ──────────────────────────────────────────────────────────────
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.3 }, // Heading 28 Bold
  h2: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2 }, // Section 20 SemiBold
  h3: { fontSize: 18, fontWeight: '500' as const },                      // Card Title 18 Medium

  // ── Body ──────────────────────────────────────────────────────────────────
  bodyLarge: { fontSize: 18, fontWeight: '400' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },    // Body 16 Regular
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },// Caption 13 Regular

  // ── Labels ────────────────────────────────────────────────────────────────
  label: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.2 },
  labelSmall: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.5 },
  overline: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1.5 },

  // ── Monospace (IDs, coordinates, scores) ─────────────────────────────────
  mono: { fontSize: 13, fontFamily: 'JetBrainsMono', letterSpacing: 0.3 },
  monoSmall: { fontSize: 11, fontFamily: 'JetBrainsMono' },
} as const;
