import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', DashboardController.getStats);
router.get('/species-breakdown', DashboardController.getSpeciesBreakdown);
router.get('/sighting-trend', DashboardController.getSightingTrend);
router.get('/return-rate', DashboardController.getReturnRate);

export default router;
