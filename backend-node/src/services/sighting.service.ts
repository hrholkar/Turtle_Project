import { Sighting } from '../models/Sighting';
import { Turtle } from '../models/Turtle';
import { PendingVerification } from '../models/PendingVerification';
import { MLService } from './ml.service';
import { TurtleService } from './turtle.service';
import { storage, LocalStorageAdapter } from '../utils/storage';
import { createError } from '../middleware/errorHandler';
import { yearsBetween, formatYearsSinceSeen } from '../utils/dateHelper';
import type { IdentifyInput } from '../validators/sighting.validator';
import type { ImageSide, IMLPredictMatchedResponse } from '../types';
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
   * Process an uploaded image through the v2 ML pipeline.
   *
   * Flow:
   *   1. Call POST /predict with image + image_side
   *   2a. Matched (similarity ≥ threshold):
   *       - Look up turtle in DB by identity
   *       - Record sighting
   *       - Return { type: 'match', turtle, sighting, ... }
   *   2b. New turtle (similarity < threshold):
   *       - Create PendingVerification for admin review
   *       - Return { type: 'pending', pending, ... }
   */
  static async identifyFromImage(imagePath: string, meta: IdentifyInput) {
    const filename  = path.basename(imagePath);
    const imageSide = (meta.image_side ?? 'AUTO') as ImageSide;

    // ── Call v2 ML service ────────────────────────────────────────────────────
    const v2Result = await MLService.predict(imagePath, imageSide);

    if (v2Result.matched) {
      // ── Strong / probable match branch ────────────────────────────────────
      const matched = v2Result as IMLPredictMatchedResponse;
      const topMatch = matched.top_matches[0];

      // Find the turtle in MongoDB by the identity returned by ML
      const turtle = await Turtle.findOne({ turtleId: topMatch.identity }).lean();

      if (turtle) {
        const sightingDate  = meta.sightingDate ? new Date(meta.sightingDate) : new Date();
        const yearsSince    = yearsBetween(turtle.latestSightingDate, sightingDate);
        const similarity    = parseFloat((topMatch.similarity / 100).toFixed(4));  // 0-1

        // Move image from temp → permanent storage (local or Cloudinary)
        const imageUrl = await storage.saveFile('temporary', 'sightings', filename);

        const sighting = await Sighting.create({
          turtleId:         topMatch.identity,
          image:            imageUrl,
          location:         meta.location,
          latitude:         meta.latitude,
          longitude:        meta.longitude,
          sightingDate,
          confidenceScore:  similarity,
          yearsSinceLastSeen: yearsSince,
          notes:            meta.notes,
        });

        await TurtleService.recordSighting(topMatch.identity, sightingDate);

        const matchStrength = similarity >= 0.85 ? 'strong' : 'probable';

        return {
          type:           'match' as const,
          sighting,
          turtle,
          confidence:     similarity,
          yearsSinceSeen: yearsSince,
          yearsSinceLabel: formatYearsSinceSeen(yearsSince),
          matchStrength,
          predictedSpecies: matched.predicted_species,
          imageSide:       matched.image_side,
          // Full top-3 list for the result screen
          allMatches: matched.top_matches.map((m, i) => ({
            turtleId: m.identity,
            score:    parseFloat((m.similarity / 100).toFixed(4)),
            rank:     i + 1,
          })),
        };
      }
    }

    // ── New turtle / no DB match branch ───────────────────────────────────────
    const imageUrl = await storage.saveFile('temporary', 'temporary', filename);

    // Build suggested matches for PendingVerification from top_matches (if any)
    const suggestedMatches = v2Result.matched
      ? await Promise.all(
          (v2Result as IMLPredictMatchedResponse).top_matches.map(async (m) => {
            const t = await Turtle.findOne({ turtleId: m.identity }).lean();
            return {
              turtleId:       m.identity,
              turtleName:     t?.turtleId,
              confidenceScore: parseFloat((m.similarity / 100).toFixed(4)),
              profileImage:   t?.profileImage,
            };
          })
        )
      : [];

    const topConfidence = v2Result.matched
      ? parseFloat(((v2Result as IMLPredictMatchedResponse).top_matches[0]?.similarity ?? 0) / 100 + '').valueOf()
      : 0;

    const pending = await PendingVerification.create({
      uploadedImage:       imageUrl,
      suggestedMatches,
      topConfidence,
      submittedLocation:   meta.location,
      submittedLatitude:   meta.latitude,
      submittedLongitude:  meta.longitude,
      submittedDate:       meta.sightingDate ? new Date(meta.sightingDate) : new Date(),
      submittedNotes:      meta.notes,
    });

    const allMatches = v2Result.matched
      ? (v2Result as IMLPredictMatchedResponse).top_matches.map((m, i) => ({
          turtleId: m.identity,
          score:    parseFloat((m.similarity / 100).toFixed(4)),
          rank:     i + 1,
        }))
      : [];

    return {
      type:             'pending' as const,
      pending,
      matchStrength:    'new' as const,
      predictedSpecies: v2Result.predicted_species,
      imageSide:        v2Result.image_side,
      newIdentity:      v2Result.matched ? null : (v2Result as any).new_identity ?? null,
      allMatches,
    };
  }

  /**
   * Manually create a sighting (for known turtles).
   */
  static async createManual(params: {
    turtleId:       string;
    imagePath:      string;
    location?:      string;
    latitude?:      number;
    longitude?:     number;
    sightingDate?:  Date;
    notes?:         string;
    confidenceScore?: number;
  }) {
    const turtle = await Turtle.findOne({ turtleId: params.turtleId }).lean();
    if (!turtle) throw createError('Turtle not found', 404);

    const sightingDate = params.sightingDate || new Date();
    const yearsSince   = yearsBetween(turtle.latestSightingDate, sightingDate);
    const filename     = path.basename(params.imagePath);

    const imageUrl = await storage.saveFile('temporary', 'sightings', filename);

    const sighting = await Sighting.create({
      turtleId:          params.turtleId,
      image:             imageUrl,
      location:          params.location,
      latitude:          params.latitude,
      longitude:         params.longitude,
      sightingDate,
      confidenceScore:   params.confidenceScore,
      yearsSinceLastSeen: yearsSince,
      notes:             params.notes,
    });

    await TurtleService.recordSighting(params.turtleId, sightingDate);
    return sighting;
  }
}
