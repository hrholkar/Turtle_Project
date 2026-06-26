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
// For Expo Go on a physical device, the phone must reach the backend server.
// Expo tunnel (--tunnel) only tunnels the Metro bundler port (8081), NOT the
// backend port. So we use the LAN IP of the development machine.
//
// NOTE: Both the phone and the PC must be on the SAME WiFi network.
// If you change networks, update BACKEND_LAN_IP below.
//
const BACKEND_LAN_IP = '172.20.10.2';

function getApiBaseUrl(): string {
  // In CI/test environments, use localhost
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return 'http://localhost:3000/api';
  }

  // Try to get host from expo-constants (works in LAN mode)
  const expoHost = Constants.expoConfig?.hostUri;
  if (expoHost) {
    const host = expoHost.split(':')[0];
    // In LAN mode, hostUri has the LAN IP — use it for the backend too
    if (host && host !== 'localhost' && host !== '127.0.0.1' && !host.includes('.exp.direct')) {
      return `http://${host}:3000/api`;
    }
  }

  // Tunnel mode or fallback: use the hardcoded LAN IP
  // The phone must be on the same WiFi as the dev machine
  return `http://${BACKEND_LAN_IP}:3000/api`;
}

function getUploadsBaseUrl(): string {
  const expoHost = Constants.expoConfig?.hostUri;
  if (expoHost) {
    const host = expoHost.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1' && !host.includes('.exp.direct')) {
      return `http://${host}:3000`;
    }
  }
  return `http://${BACKEND_LAN_IP}:3000`;
}

export const API_BASE_URL = getApiBaseUrl();
export const UPLOADS_BASE_URL = getUploadsBaseUrl();

// Re-export for convenience
export { UPLOADS_BASE_URL as BASE_URL };
