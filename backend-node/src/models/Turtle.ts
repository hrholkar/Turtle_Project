import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import type { ITurtle, TurtleGender, TurtleSpecies } from '../types';

export interface TurtleDocument extends Omit<ITurtle, '_id'>, Document {}

const TurtleSchema = new Schema<TurtleDocument>(
  {
    turtleId: {
      type: String,
      required: true,
      unique: true,
      default: () => `TT-${uuidv4().split('-')[0].toUpperCase()}`,
      index: true,
    },
    species: {
      type: String,
      enum: ['green', 'loggerhead', 'leatherback', 'hawksbill', 'kemp_ridley', 'olive_ridley', 'flatback', 'unknown'],
      default: 'unknown',
    } as { type: typeof String; enum: TurtleSpecies[]; default: TurtleSpecies },
    gender: {
      type: String,
      enum: ['male', 'female', 'unknown'],
      default: 'unknown',
    } as { type: typeof String; enum: TurtleGender[]; default: TurtleGender },
    birthLocation: { type: String },
    birthDate: { type: Date },
    firstSightingDate: { type: Date, required: true },
    latestSightingDate: { type: Date, required: true },
    totalSightings: { type: Number, default: 1, min: 0 },
    profileImage: { type: String },
    identificationData: {
      embeddingVector: { type: [Number], select: false }, // excluded by default — large array
      neckPatternHash: { type: String },
      featureVersion: { type: String, default: 'mobilenet_v2_v1' },
    },
    notes: { type: String },
  },
  {
    timestamps: true,
    collection: 'turtles',
  }
);

// Index for geographic queries on birth location
TurtleSchema.index({ species: 1 });
TurtleSchema.index({ latestSightingDate: -1 });
TurtleSchema.index({ firstSightingDate: 1 });

export const Turtle = model<TurtleDocument>('Turtle', TurtleSchema);
