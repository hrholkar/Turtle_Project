import { Router } from 'express';
import { SightingController } from '../controllers/sighting.controller';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', SightingController.getAll);
router.get('/recent', SightingController.getRecent);
router.get('/:id', SightingController.getById);
router.post('/identify', upload.single('image'), SightingController.identify);

export default router;
