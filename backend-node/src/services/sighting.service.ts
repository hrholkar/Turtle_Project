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
    console.log(`[SightingService] Sending image to ML service for prediction: ${filename}, side: ${imageSide}`);
    const v2Result = await MLService.predict(imagePath, imageSide);
    console.log(`[SightingService] ML Result received. Matched: ${v2Result.matched}, Candidates: ${(v2Result as any).top_matches?.length || 0}`);

    // Move image from temp to temporary accessible storage
    const imageUrl = await storage.saveFile('temporary', 'temporary', filename);
    console.log(`[SightingService] Temporary image saved to ${imageUrl}`);

    // Extract all matches (guaranteed to exist due to ML update)
    const allMatches = (v2Result as any).top_matches ? (v2Result as any).top_matches.map((m: any, i: number) => ({
      turtleId: m.identity,
      score:    parseFloat((m.similarity / 100).toFixed(4)),
      rank:     i + 1,
    })) : [];

    if (v2Result.matched) {
      const topMatch = (v2Result as any).top_matches[0];
      const turtle = await Turtle.findOne({ turtleId: topMatch.identity }).lean();

      console.log(`[SightingService] Match found (Strong/Probable) -> Turtle ID: ${topMatch.identity}`);
      return {
        type:           'match' as const,
        turtle,
        confidence:     parseFloat((topMatch.similarity / 100).toFixed(4)),
        matchStrength:  topMatch.similarity >= 85 ? 'strong' : 'probable',
        predictedSpecies: v2Result.predicted_species,
        imageSide:       v2Result.image_side,
        allMatches,
        imageUrl,
      };
    }

    console.log(`[SightingService] No confident match found. Prepared new identity: ${(v2Result as any).new_identity ?? 'None'}`);
    return {
      type:             'nomatch' as const,
      matchStrength:    'new' as const,
      predictedSpecies: v2Result.predicted_species,
      imageSide:        v2Result.image_side,
      newIdentity:      (v2Result as any).new_identity ?? null,
      allMatches,
      imageUrl,
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

    console.log(`[SightingService] Manually creating sighting for Turtle ID: ${params.turtleId}`);
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

    console.log(`[SightingService] Sighting successfully saved. ID: ${sighting._id}`);
    await TurtleService.recordSighting(params.turtleId, sightingDate);
    console.log(`[SightingService] Turtle stats updated for ${params.turtleId}`);
    return sighting;
  }
}
