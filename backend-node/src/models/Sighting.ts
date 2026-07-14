import { Schema, model, Document, Types } from 'mongoose';
import type { ISighting } from '../types';

export interface SightingDocument extends Omit<ISighting, '_id'>, Document {}

const SightingSchema = new Schema<SightingDocument>(
  {
    turtleId: {
      type: String,
      required: true,
      index: true,
    },
    image: {
      type: String,
      required: true,
    },
    location: { type: String },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    sightingDate: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
    },
    yearsSinceLastSeen: {
      type: Number,
      min: 0,
    },
    notes: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'sightings',
  }
);

SightingSchema.index({ turtleId: 1, sightingDate: -1 });
SightingSchema.index({ sightingDate: -1 });
SightingSchema.index({ latitude: 1, longitude: 1 });

export const Sighting = model<SightingDocument>('Sighting', SightingSchema);
