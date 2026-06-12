import { Router } from 'express';
import { TurtleController } from '../controllers/turtle.controller';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', TurtleController.getAll);
router.get('/:id', TurtleController.getById);
router.get('/:id/sightings', TurtleController.getSightings);
router.get('/:id/timeline', TurtleController.getTimeline); // Phase 2 stub
router.post('/', upload.single('profileImage'), TurtleController.create);
router.put('/:id', TurtleController.update);
router.delete('/:id', TurtleController.delete);

export default router;
