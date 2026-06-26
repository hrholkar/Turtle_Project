// ─── Turtle Types ────────────────────────────────────────────────────────────

export type TurtleGender = 'male' | 'female' | 'unknown';
export type TurtleSpecies =
  | 'green'
  | 'loggerhead'
  | 'leatherback'
  | 'hawksbill'
  | 'kemp_ridley'
  | 'olive_ridley'
  | 'flatback'
  | 'unknown';

export interface ITurtle {
  turtleId: string;
  species: TurtleSpecies;
  gender: TurtleGender;
  birthLocation?: string;
  birthDate?: Date;
  firstSightingDate: Date;
  latestSightingDate: Date;
  totalSightings: number;
  profileImage?: string;
  identificationData?: {
    embeddingVector?: number[];
    neckPatternHash?: string;
    featureVersion?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sighting Types ───────────────────────────────────────────────────────────

export interface ISighting {
  _id: string;
  turtleId: string;
  image: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  sightingDate: Date;
  confidenceScore?: number;
  yearsSinceLastSeen?: number;
  notes?: string;
  createdAt: Date;
}

// ─── Pending Verification Types ───────────────────────────────────────────────

export type PendingStatus = 'pending' | 'approved' | 'rejected';

export interface ISuggestedMatch {
  turtleId: string;
  turtleName?: string;
  confidenceScore: number;
  profileImage?: string;
}

export interface IPendingVerification {
  _id: string;
  uploadedImage: string;
  extractedFeatures?: number[];
  suggestedMatches: ISuggestedMatch[];
  topConfidence: number;
  status: PendingStatus;
  submittedNotes?: string;
  submittedLocation?: string;
  submittedLatitude?: number;
  submittedLongitude?: number;
  submittedDate?: Date;
  resolvedAt?: Date;
  resolvedTurtleId?: string;
  createdAt: Date;
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface IDashboardStats {
  totalTurtles: number;
  totalSightings: number;
  returningTurtles: number;
  newTurtlesThisMonth: number;
  avgSightingsPerTurtle: number;
  pendingVerifications: number;
}

// ─── ML Service Types (v1 legacy) ────────────────────────────────────────────

export interface IMLIdentifyRequest {
  imagePath: string;
  topK?: number;
}

export interface IMLMatch {
  turtleId: string;
  score: number;
  rank: number;
}

export interface IMLIdentifyResponse {
  matches: IMLMatch[];
  topScore: number;
  isNewTurtle: boolean;
  matchStrength: 'strong' | 'probable' | 'new';
  processingTimeMs: number;
  embeddingVector?: number[];
}

export interface IMLRegisterRequest {
  turtleId: string;
  imagePath: string;
  embeddingVector?: number[];
}

// ─── ML Service Types (v2 — /predict endpoint) ───────────────────────────────

export type ImageSide = 'AUTO' | 'LEFT' | 'RIGHT';

export interface IMLTopMatch {
  identity:    string;
  similarity:  number;          // 0–100 %
  species?:    string;
  first_seen?: number;
  latest_seen?: number;
  location?:   string;
}

/** Returned by POST /predict when a match is found */
export interface IMLPredictMatchedResponse {
  matched:             true;
  predicted_species:   string;
  species_confidence:  number;  // 0–100 %
  image_side:          string;
  top_matches:         IMLTopMatch[];
}

/** Returned by POST /predict when no match exceeds threshold */
export interface IMLPredictNewTurtleResponse {
  matched:             false;
  predicted_species:   string;
  species_confidence:  number;
  image_side:          string;
  message:             'NEW TURTLE DETECTED';
  new_identity:        string;
}

export type IMLPredictResponse = IMLPredictMatchedResponse | IMLPredictNewTurtleResponse;

export interface IMLPredictRequest {
  imagePath:  string;
  image_side?: ImageSide;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}>;
