import { Router } from 'express';
import { PendingController } from '../controllers/pending.controller';

const router = Router();

router.get('/', PendingController.getAll);
router.get('/:id', PendingController.getById);
router.post('/:id/approve', PendingController.approve);
router.post('/:id/reject', PendingController.reject);

export default router;
