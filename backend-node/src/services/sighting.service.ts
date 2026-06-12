import { Sighting } from '../models/Sighting';
import { Turtle } from '../models/Turtle';
import { PendingVerification } from '../models/PendingVerification';
import { MLService } from './ml.service';
import { TurtleService } from './turtle.service';
import { storage, LocalStorageAdapter } from '../utils/storage';
import { createError } from '../middleware/errorHandler';
import { yearsBetween, formatYearsSinceSeen } from '../utils/dateHelper';
import type { IdentifyInput } from '../validators/sighting.validator';
import path from 'path';

export class SightingService {
  static async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Sighting.find().sort({ sightingDate: -1 }).skip(skip).limit(limit).lean(),
      Sighting.countDocuments(),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async findById(sightingId: string) {
    const sighting = await Sighting.findById(sightingId).lean();
    if (!sighting) throw createError('Sighting not found', 404);
    return sighting;
  }

  static async findRecent(limit = 10) {
    return Sighting.find()
      .sort({ sightingDate: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Process an uploaded image through the ML pipeline.
   * Creates a pending verification or directly logs a sighting.
   */
  static async identifyFromImage(imagePath: string, meta: IdentifyInput) {
    const filename = path.basename(imagePath);

    // Call ML service
    const mlResult = await MLService.identify(imagePath);

    if (mlResult.matchStrength === 'strong' && mlResult.matches.length > 0) {
      // Strong match — find turtle and record sighting directly
      const topMatch = mlResult.matches[0];
      const turtle = await Turtle.findOne({ turtleId: topMatch.turtleId }).lean();

      if (turtle) {
        const sightingDate = meta.sightingDate ? new Date(meta.sightingDate) : new Date();
        const yearsSince = yearsBetween(turtle.latestSightingDate, sightingDate);

        // Move image from temp to sightings
        if (storage instanceof LocalStorageAdapter) {
          storage.moveFile('temporary', 'sightings', filename);
        }
        const imageUrl = storage.getPublicUrl('sightings', filename);

        const sighting = await Sighting.create({
          turtleId: topMatch.turtleId,
          image: imageUrl,
          location: meta.location,
          latitude: meta.latitude,
          longitude: meta.longitude,
          sightingDate,
          confidenceScore: topMatch.score,
          yearsSinceLastSeen: yearsSince,
          notes: meta.notes,
        });

        await TurtleService.recordSighting(topMatch.turtleId, sightingDate);

        return {
          type: 'match' as const,
          sighting,
          turtle,
          confidence: topMatch.score,
          yearsSinceSeen: yearsSince,
          yearsSinceLabel: formatYearsSinceSeen(yearsSince),
          matchStrength: mlResult.matchStrength,
          allMatches: mlResult.matches,
        };
      }
    }

    // No strong match — create pending verification
    const imageUrl = storage.getPublicUrl('temporary', filename);

    const suggestedMatches = await Promise.all(
      mlResult.matches.map(async (match) => {
        const turtle = await Turtle.findOne({ turtleId: match.turtleId }).lean();
        return {
          turtleId: match.turtleId,
          turtleName: turtle?.turtleId,
          confidenceScore: match.score,
          profileImage: turtle?.profileImage,
        };
      })
    );

    const pending = await PendingVerification.create({
      uploadedImage: imageUrl,
      extractedFeatures: mlResult.embeddingVector,
      suggestedMatches,
      topConfidence: mlResult.topScore,
      submittedLocation: meta.location,
      submittedLatitude: meta.latitude,
      submittedLongitude: meta.longitude,
      submittedDate: meta.sightingDate ? new Date(meta.sightingDate) : new Date(),
      submittedNotes: meta.notes,
    });

    return {
      type: 'pending' as const,
      pending,
      matchStrength: mlResult.matchStrength,
      allMatches: mlResult.matches,
    };
  }

  /**
   * Manually create a sighting (for known turtles).
   */
  static async createManual(params: {
    turtleId: string;
    imagePath: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    sightingDate?: Date;
    notes?: string;
    confidenceScore?: number;
  }) {
    const turtle = await Turtle.findOne({ turtleId: params.turtleId }).lean();
    if (!turtle) throw createError('Turtle not found', 404);

    const sightingDate = params.sightingDate || new Date();
    const yearsSince = yearsBetween(turtle.latestSightingDate, sightingDate);
    const filename = path.basename(params.imagePath);

    if (storage instanceof LocalStorageAdapter) {
      storage.moveFile('temporary', 'sightings', filename);
    }
    const imageUrl = storage.getPublicUrl('sightings', filename);

    const sighting = await Sighting.create({
      turtleId: params.turtleId,
      image: imageUrl,
      location: params.location,
      latitude: params.latitude,
      longitude: params.longitude,
      sightingDate,
      confidenceScore: params.confidenceScore,
      yearsSinceLastSeen: yearsSince,
      notes: params.notes,
    });

    await TurtleService.recordSighting(params.turtleId, sightingDate);

    return sighting;
  }
}
