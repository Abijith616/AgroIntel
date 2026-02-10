import { Router } from 'express';
import { getAllSchemes, getMatchingSchemes } from '../controllers/scheme.controller';
import { authenticateToken } from '../middleware/auth.middleware'; // Assuming this exists, need to verify

const router = Router();

router.get('/', getAllSchemes);
router.get('/match', authenticateToken, getMatchingSchemes);

export default router;
