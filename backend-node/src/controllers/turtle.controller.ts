import { Request, Response, NextFunction } from 'express';
import { TurtleService } from '../services/turtle.service';
import { createTurtleSchema, updateTurtleSchema, turtleQuerySchema } from '../validators/turtle.validator';
import type { ApiResponse } from '../types';

export class TurtleController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = turtleQuerySchema.parse(req.query);
      const result = await TurtleService.findAll(query);
      res.json({ success: true, data: result } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const turtle = await TurtleService.findById(req.params.id);
      res.json({ success: true, data: turtle } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }

  static async getSightings(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const result = await TurtleService.findSightings(req.params.id, page, limit);
      res.json({ success: true, data: result } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createTurtleSchema.parse(req.body);
      const imagePath = req.file?.path;
      const turtle = await TurtleService.create(input, imagePath);
      res.status(201).json({ success: true, data: turtle, message: 'Turtle created' } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateTurtleSchema.parse(req.body);
      const turtle = await TurtleService.update(req.params.id, input);
      res.json({ success: true, data: turtle, message: 'Turtle updated' } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await TurtleService.delete(req.params.id);
      res.json({ success: true, message: `Turtle ${req.params.id} deleted` } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }

  static async getTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TurtleService.getTimeline(req.params.id);
      res.json({ success: true, data: result } as ApiResponse);
    } catch (err) {
      next(err);
    }
  }
}
