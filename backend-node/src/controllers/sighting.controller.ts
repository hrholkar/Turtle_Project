import { Request, Response, NextFunction } from 'express';
import { SightingService } from '../services/sighting.service';
import { identifySchema } from '../validators/sighting.validator';
import { createError } from '../middleware/errorHandler';
import type { ApiResponse } from '../types';

export class SightingController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const result = await SightingService.findAll(page, limit);
      res.json({ success: true, data: result } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const sighting = await SightingService.findById(req.params.id);
      res.json({ success: true, data: sighting } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }

  static async getRecent(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string || '10', 10);
      const sightings = await SightingService.findRecent(limit);
      res.json({ success: true, data: sightings } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }

  static async identify(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw createError('No image file uploaded', 400);

      const meta = identifySchema.parse(req.body);
      const result = await SightingService.identifyFromImage(req.file.path, meta);

      const statusCode = result.type === 'match' ? 200 : 202;
      res.status(statusCode).json({ success: true, data: result } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }
}
