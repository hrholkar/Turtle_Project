import { Request, Response, NextFunction } from 'express';
import { PendingService } from '../services/pending.service';
import { approvePendingSchema } from '../validators/sighting.validator';
import type { ApiResponse } from '../types';

export class PendingController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const result = await PendingService.findAll(status, page, limit);
      res.json({ success: true, data: result } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const pending = await PendingService.findById(req.params.id);
      res.json({ success: true, data: pending } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const input = approvePendingSchema.parse(req.body);
      const result = await PendingService.approve(req.params.id, input);
      res.json({ success: true, data: result, message: 'Verification approved' } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PendingService.reject(req.params.id);
      res.json({ success: true, data: result, message: 'Verification rejected' } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }
}
