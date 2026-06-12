// ─── Turtle ───────────────────────────────────────────────────────────────────

export type TurtleGender = 'male' | 'female' | 'unknown';
export type TurtleSpecies =
  | 'green' | 'loggerhead' | 'leatherback' | 'hawksbill'
  | 'kemp_ridley' | 'olive_ridley' | 'flatback' | 'unknown';

export interface Turtle {
  _id: string;
  turtleId: string;
  species: TurtleSpecies;
  gender: TurtleGender;
  birthLocation?: string;
  birthDate?: string;
  firstSightingDate: string;
  latestSightingDate: string;
  totalSightings: number;
  profileImage?: string;
  identificationData?: {
    neckPatternHash?: string;
    featureVersion?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Sighting ─────────────────────────────────────────────────────────────────

export interface Sighting {
  _id: string;
  turtleId: string;
  image: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  sightingDate: string;
  confidenceScore?: number;
  yearsSinceLastSeen?: number;
  notes?: string;
  createdAt: string;
}

// ─── Pending Verification ─────────────────────────────────────────────────────

export type PendingStatus = 'pending' | 'approved' | 'rejected';

export interface SuggestedMatch {
  turtleId: string;
  turtleName?: string;
  confidenceScore: number;
  profileImage?: string;
}

export interface PendingVerification {
  _id: string;
  uploadedImage: string;
  suggestedMatches: SuggestedMatch[];
  topConfidence: number;
  status: PendingStatus;
  submittedNotes?: string;
  submittedLocation?: string;
  submittedLatitude?: number;
  submittedLongitude?: number;
  submittedDate?: string;
  resolvedAt?: string;
  resolvedTurtleId?: string;
  createdAt: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalTurtles: number;
  totalSightings: number;
  returningTurtles: number;
  newTurtlesThisMonth: number;
  avgSightingsPerTurtle: number;
  pendingVerifications: number;
}

// ─── ML / Identification ──────────────────────────────────────────────────────

export type MatchStrength = 'strong' | 'probable' | 'new';

export interface IdentifyMatch {
  turtleId: string;
  score: number;
  rank: number;
}

export interface IdentifyResult {
  type: 'match' | 'pending';
  // match branch
  sighting?: Sighting;
  turtle?: Turtle;
  confidence?: number;
  yearsSinceSeen?: number;
  yearsSinceLabel?: string;
  // pending branch
  pending?: PendingVerification;
  // shared
  matchStrength: MatchStrength;
  allMatches: IdentifyMatch[];
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  '(tabs)': undefined;
  'turtle/[id]': { id: string };
  'sighting/[id]': { id: string };
  'pending/[id]': { id: string };
  'result': { resultData: string }; // JSON stringified IdentifyResult
};
