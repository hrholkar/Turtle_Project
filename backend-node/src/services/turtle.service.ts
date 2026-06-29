import { Turtle } from '../models/Turtle';
import { Sighting } from '../models/Sighting';
import { createError } from '../middleware/errorHandler';
import { storage, LocalStorageAdapter } from '../utils/storage';
import { yearsBetween } from '../utils/dateHelper';
import { MLService } from './ml.service';
import type { CreateTurtleInput, UpdateTurtleInput, TurtleQuery } from '../validators/turtle.validator';
import path from 'path';
import fs from 'fs';

export class TurtleService {
  static async findAll(query: TurtleQuery) {
    const { page, limit, species, gender, search, sortBy, sortOrder } = query;

    const filter: Record<string, unknown> = {};
    if (species) filter.species = species;
    if (gender) filter.gender = gender;
    if (search) {
      filter.$or = [
        { turtleId: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { birthLocation: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Turtle.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Turtle.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  static async findById(turtleId: string) {
    const turtle = await Turtle.findOne({ turtleId }).lean();
    if (!turtle) throw createError(`Turtle not found: ${turtleId}`, 404);
    return turtle;
  }

  static async findSightings(turtleId: string, page = 1, limit = 20) {
    await this.findById(turtleId); // Validate exists

    const skip = (page - 1) * limit;
    const [sightings, total] = await Promise.all([
      Sighting.find({ turtleId }).sort({ sightingDate: -1 }).skip(skip).limit(limit).lean(),
      Sighting.countDocuments({ turtleId }),
    ]);

    return { items: sightings, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async create(input: CreateTurtleInput, profileImagePath?: string) {
    const firstSightingDate = new Date(input.firstSightingDate);

    let profileImage: string | undefined;
    if (profileImagePath) {
      const filename = path.basename(profileImagePath);
      profileImage = await storage.saveFile('temporary', 'turtles', filename);
    }

    const turtle = await Turtle.create({
      species: input.species,
      gender: input.gender,
      birthLocation: input.birthLocation,
      birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
      firstSightingDate,
      latestSightingDate: firstSightingDate,
      totalSightings: 1,
      profileImage,
      notes: input.notes,
    });

    return turtle;
  }

  static async update(turtleId: string, input: UpdateTurtleInput) {
    const turtle = await Turtle.findOneAndUpdate(
      { turtleId },
      { $set: input },
      { new: true, runValidators: true }
    ).lean();

    if (!turtle) throw createError(`Turtle not found: ${turtleId}`, 404);
    return turtle;
  }

  static async delete(turtleId: string) {
    const turtle = await Turtle.findOneAndDelete({ turtleId }).lean();
    if (!turtle) throw createError(`Turtle not found: ${turtleId}`, 404);

    // Clean up sightings
    await Sighting.deleteMany({ turtleId });

    // Remove from ML index
    try {
      await MLService.removeEmbedding(turtleId);
    } catch {
      console.warn(`[Turtle] Could not remove ML embedding for ${turtleId}`);
    }

    return turtle;
  }

  /**
   * Update profile image and optionally re-register with ML service.
   */
  static async updateProfileImage(turtleId: string, tempImagePath: string) {
    const filename = path.basename(tempImagePath);

    // Re-register with ML FIRST, because saveFile might delete the local temp file (in Cloudinary mode)
    try {
      await MLService.register({ turtleId, imagePath: tempImagePath });
    } catch (err) {
      console.warn(`[Turtle] ML re-registration failed for ${turtleId}:`, err);
    }

    const profileImage = await storage.saveFile('temporary', 'turtles', filename);

    const turtle = await Turtle.findOneAndUpdate(
      { turtleId },
      { $set: { profileImage } },
      { new: true }
    ).lean();

    if (!turtle) throw createError(`Turtle not found: ${turtleId}`, 404);

    return turtle;
  }

  /**
   * Update sighting statistics after a new sighting is recorded.
   */
  static async recordSighting(turtleId: string, sightingDate: Date) {
    const turtle = await Turtle.findOne({ turtleId });
    if (!turtle) throw createError(`Turtle not found: ${turtleId}`, 404);

    const yearsSince = yearsBetween(turtle.latestSightingDate, sightingDate);

    await Turtle.updateOne(
      { turtleId },
      {
        $set: { latestSightingDate: sightingDate },
        $inc: { totalSightings: 1 },
      }
    );

    return yearsSince;
  }

  /**
   * Phase 2 stub: Get turtle timeline for prediction
   */
  static async getTimeline(_turtleId: string) {
    return { events: [], status: 'not_implemented' };
  }
}
