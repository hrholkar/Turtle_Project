import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,     // Updated to 16px radius for cards
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#071d2c',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#071d2c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#071d2c',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
  }),
  teal: Platform.select({
    ios: {
      shadowColor: '#218fde',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
  }),
} as const;

// ── API URL Configuration ─────────────────────────────────────────────────────
//
// Production endpoints only.
//
function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL || "https://api-turtle.pxpanel.in/api";
}

function getUploadsBaseUrl(): string {
  return process.env.EXPO_PUBLIC_UPLOADS_URL || "https://api-turtle.pxpanel.in";
}

export const API_BASE_URL = getApiBaseUrl();
export const UPLOADS_BASE_URL = getUploadsBaseUrl();

console.log(`[CONFIG] Platform: ${Platform.OS}, isDevice: ${Constants.isDevice}`);
console.log(`[CONFIG] API_BASE_URL resolves to: ${API_BASE_URL}`);

// Re-export for convenience
export { UPLOADS_BASE_URL as BASE_URL };
