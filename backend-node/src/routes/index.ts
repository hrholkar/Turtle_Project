import { Router } from 'express';
import turtleRoutes from './turtle.routes';
import sightingRoutes from './sighting.routes';
import pendingRoutes from './pending.routes';
import dashboardRoutes from './dashboard.routes';
import { MLService } from '../services/ml.service';
import type { ApiResponse } from '../types';

const router = Router();

// ── Health ────────────────────────────────────────────────────────────────────
router.get('/health', async (_req, res) => {
  const mlHealthy = await MLService.healthCheck();
  res.json({
    success: true,
    data: {
      status: 'operational',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        ml: mlHealthy ? 'connected' : 'unavailable',
      },
    },
  } as ApiResponse);
});

// ── Routes ────────────────────────────────────────────────────────────────────
router.use('/turtles', turtleRoutes);
router.use('/sightings', sightingRoutes);
router.use('/pending', pendingRoutes);
router.use('/dashboard', dashboardRoutes);

// ── Phase 2 Stubs ──────────────────────────────────────────────────────────────
router.post('/predict-return/:turtleId', async (req, res) => {
  const result = await MLService.predictReturn(req.params.turtleId);
  res.json({ success: true, data: result } as ApiResponse);
});

export default router;
