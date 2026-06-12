import { PendingVerification } from '../models/PendingVerification';
import { Turtle } from '../models/Turtle';
import { Sighting } from '../models/Sighting';
import { MLService } from './ml.service';
import { TurtleService } from './turtle.service';
import { storage, LocalStorageAdapter } from '../utils/storage';
import { createError } from '../middleware/errorHandler';
import { yearsBetween } from '../utils/dateHelper';
import type { ApprovePendingInput } from '../validators/sighting.validator';
import path from 'path';

export class PendingService {
  static async findAll(status?: 'pending' | 'approved' | 'rejected', page = 1, limit = 20) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      PendingVerification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PendingVerification.countDocuments(filter),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async findById(id: string) {
    const pending = await PendingVerification.findById(id).lean();
    if (!pending) throw createError('Pending verification not found', 404);
    return pending;
  }

  static async countPending() {
    return PendingVerification.countDocuments({ status: 'pending' });
  }

  /**
   * Approve a pending verification.
   * If turtleId is provided → link to existing turtle.
   * Otherwise → create a new turtle record.
   */
  static async approve(id: string, input: ApprovePendingInput) {
    const pending = await PendingVerification.findById(id);
    if (!pending) throw createError('Pending verification not found', 404);
    if (pending.status !== 'pending') throw createError('Verification already resolved', 400);

    const sightingDate = pending.submittedDate || new Date();
    let resolvedTurtleId: string;

    if (input.turtleId) {
      // Link to existing turtle
      const turtle = await Turtle.findOne({ turtleId: input.turtleId }).lean();
      if (!turtle) throw createError('Target turtle not found', 404);
      resolvedTurtleId = input.turtleId;

      // Record as a sighting
      const imageFilename = path.basename(pending.uploadedImage);
      const yearsSince = yearsBetween(turtle.latestSightingDate, sightingDate);

      // Move from temp to sightings
      if (storage instanceof LocalStorageAdapter) {
        try {
          storage.moveFile('temporary', 'sightings', imageFilename);
        } catch {
          // Already moved or not in temp
        }
      }

      await Sighting.create({
        turtleId: resolvedTurtleId,
        image: storage.getPublicUrl('sightings', imageFilename),
        location: pending.submittedLocation,
        latitude: pending.submittedLatitude,
        longitude: pending.submittedLongitude,
        sightingDate,
        confidenceScore: pending.topConfidence,
        yearsSinceLastSeen: yearsSince,
        notes: pending.submittedNotes,
      });

      await TurtleService.recordSighting(resolvedTurtleId, sightingDate);
    } else {
      // Create new turtle from this sighting
      const imageFilename = path.basename(pending.uploadedImage);

      if (storage instanceof LocalStorageAdapter) {
        try {
          storage.moveFile('temporary', 'turtles', imageFilename);
        } catch { /* ignored */ }
      }

      const profileImage = storage.getPublicUrl('turtles', imageFilename);

      const newTurtle = await Turtle.create({
        species: input.species,
        gender: input.gender,
        birthLocation: input.birthLocation,
        firstSightingDate: sightingDate,
        latestSightingDate: sightingDate,
        totalSightings: 1,
        profileImage,
        notes: input.notes,
      });

      resolvedTurtleId = newTurtle.turtleId;

      // Register turtle in ML index
      if (storage instanceof LocalStorageAdapter) {
        const imgPath = (storage as LocalStorageAdapter).getFilePath('turtles', imageFilename);
        const pendingWithFeatures = await PendingVerification.findById(id).select('+extractedFeatures').lean();
        await MLService.register({
          turtleId: resolvedTurtleId,
          imagePath: imgPath,
          embeddingVector: pendingWithFeatures?.extractedFeatures,
        }).catch(() => console.warn(`[Pending] ML registration failed for ${resolvedTurtleId}`));
      }

      // Create initial sighting
      await Sighting.create({
        turtleId: resolvedTurtleId,
        image: profileImage,
        location: pending.submittedLocation,
        latitude: pending.submittedLatitude,
        longitude: pending.submittedLongitude,
        sightingDate,
        notes: pending.submittedNotes,
      });
    }

    await PendingVerification.updateOne(
      { _id: id },
      { $set: { status: 'approved', resolvedAt: new Date(), resolvedTurtleId } }
    );

    return { resolvedTurtleId, status: 'approved' };
  }

  static async reject(id: string) {
    const pending = await PendingVerification.findById(id);
    if (!pending) throw createError('Pending verification not found', 404);
    if (pending.status !== 'pending') throw createError('Verification already resolved', 400);

    await PendingVerification.updateOne(
      { _id: id },
      { $set: { status: 'rejected', resolvedAt: new Date() } }
    );

    return { status: 'rejected' };
  }
}
