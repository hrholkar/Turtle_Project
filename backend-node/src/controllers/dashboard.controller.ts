import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import type { ApiResponse } from '../types';

export class DashboardController {
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await DashboardService.getStats();
      res.json({ success: true, data: stats } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }

  static async getSpeciesBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const breakdown = await DashboardService.getSpeciesBreakdown();
      res.json({ success: true, data: breakdown } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }

  static async getSightingTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const trend = await DashboardService.getSightingTrend();
      res.json({ success: true, data: trend } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }

  static async getReturnRate(req: Request, res: Response, next: NextFunction) {
    try {
      const rate = await DashboardService.getReturnRate();
      res.json({ success: true, data: { returnRate: rate } } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }
}
