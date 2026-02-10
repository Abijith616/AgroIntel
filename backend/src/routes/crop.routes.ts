import { Router } from 'express';
import { createCrop, getCrops, updateCrop, deleteCrop } from '../controllers/crop.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateToken, createCrop);
router.get('/', authenticateToken, getCrops);
router.patch('/:id', authenticateToken, updateCrop);
router.delete('/:id', authenticateToken, deleteCrop);

export default router;
