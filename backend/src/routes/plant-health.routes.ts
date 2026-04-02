import { Router } from 'express';
import { getPlantHealth } from '../controllers/plant-health.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// GET /api/plant-health/:cropId — lazy, only called when user clicks a crop
router.get('/:cropId', authenticateToken, getPlantHealth);

export default router;
