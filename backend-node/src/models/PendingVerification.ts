import { Schema, model, Document } from 'mongoose';
import type { IPendingVerification, ISuggestedMatch, PendingStatus } from '../types';

export interface PendingVerificationDocument extends Omit<IPendingVerification, '_id'>, Document {}

const SuggestedMatchSchema = new Schema<ISuggestedMatch>(
  {
    turtleId: { type: String, required: true },
    turtleName: { type: String },
    confidenceScore: { type: Number, required: true, min: 0, max: 1 },
    profileImage: { type: String },
  },
  { _id: false }
);

const PendingVerificationSchema = new Schema<PendingVerificationDocument>(
  {
    uploadedImage: {
      type: String,
      required: true,
    },
    extractedFeatures: {
      type: [Number],
      select: false, // Large array — excluded by default
    },
    suggestedMatches: {
      type: [SuggestedMatchSchema],
      default: [],
    },
    topConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    } as { type: typeof String; enum: PendingStatus[]; default: PendingStatus },
    submittedNotes: { type: String },
    submittedLocation: { type: String },
    submittedLatitude: { type: Number },
    submittedLongitude: { type: Number },
    submittedDate: { type: Date, default: () => new Date() },
    resolvedAt: { type: Date },
    resolvedTurtleId: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'pending_verifications',
  }
);

PendingVerificationSchema.index({ status: 1, createdAt: -1 });

export const PendingVerification = model<PendingVerificationDocument>(
  'PendingVerification',
  PendingVerificationSchema
);
